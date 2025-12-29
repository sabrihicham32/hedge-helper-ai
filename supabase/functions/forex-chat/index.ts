import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatSettings {
  responseStyle: "concise" | "detailed" | "technical";
  enableMarketData: boolean;
  enableFunctionCalls: boolean;
  customInstructions: string;
}

const RESPONSE_STYLE_INSTRUCTIONS = {
  concise: `## Style de Réponse: CONCIS
- Réponds de manière brève et directe (2-3 phrases max par point)
- Évite les détails superflus et les longues explications
- Va droit au but avec des recommandations claires
- Utilise des listes à puces courtes`,
  
  detailed: `## Style de Réponse: DÉTAILLÉ
- Fournis des explications complètes avec contexte
- Inclus des exemples concrets et des calculs
- Explique le raisonnement derrière chaque recommandation
- Compare les alternatives quand c'est pertinent`,
  
  technical: `## Style de Réponse: TECHNIQUE
- Utilise le jargon financier professionnel (Greeks, basis points, etc.)
- Inclus des formules et des calculs précis
- Référence les normes (ISDA, IFRS 9, etc.)
- Suppose que l'utilisateur a une expertise avancée`,
};

const MARKET_DATA_INSTRUCTIONS = `
## Accès aux Données de Marché
Tu as accès aux données de marché en temps réel:
- Taux spot des principales paires (EUR/USD, GBP/USD, USD/JPY, etc.)
- Points forward et taux outright pour différentes maturités
- Volatilités implicites
- Courbes de taux

Quand l'utilisateur demande des données, tu peux les consulter et les intégrer dans tes réponses.`;

const FUNCTION_CALL_INSTRUCTIONS = `
## Capacités de Calcul
Tu peux effectuer des calculs et analyses:
- Pricing de forwards et options (Black-Scholes, Garman-Kohlhagen)
- Calcul des Greeks (Delta, Gamma, Vega, Theta)
- Valorisation de positions de hedging
- Analyse de scénarios et stress tests
- Calcul de VaR et sensibilités`;

function buildSystemPrompt(settings: ChatSettings): string {
  let prompt = `Tu es ForexHedge AI, un assistant expert en finance de marché spécialisé dans le hedging FOREX. Tu aides les utilisateurs à comprendre et gérer leurs risques de change.

## Ton Expertise
- Stratégies de couverture (hedging) : forwards, options vanilles, options exotiques, swaps de devises
- Analyse des risques de change : exposition économique, transactionnelle et de translation
- Instruments dérivés : pricing, Greeks, valorisation
- Réglementation et comptabilité de couverture (IFRS 9, hedge accounting)
- Market data : taux spot, forwards, volatilités implicites, courbes de taux

${RESPONSE_STYLE_INSTRUCTIONS[settings.responseStyle]}
`;

  if (settings.enableMarketData) {
    prompt += MARKET_DATA_INSTRUCTIONS;
  }

  if (settings.enableFunctionCalls) {
    prompt += FUNCTION_CALL_INSTRUCTIONS;
  }

  if (settings.customInstructions?.trim()) {
    prompt += `

## Instructions Personnalisées de l'Utilisateur
${settings.customInstructions.trim()}`;
  }

  prompt += `

## Limites
- Tu ne peux pas exécuter de trades
- Tu ne garantis pas les performances futures
- Tu recommandes toujours de consulter un professionnel pour les décisions importantes`;

  return prompt;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, settings } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Default settings if not provided
    const chatSettings: ChatSettings = {
      responseStyle: settings?.responseStyle || "concise",
      enableMarketData: settings?.enableMarketData ?? true,
      enableFunctionCalls: settings?.enableFunctionCalls ?? true,
      customInstructions: settings?.customInstructions || "",
    };

    const systemPrompt = buildSystemPrompt(chatSettings);
    console.log("Received messages:", messages.length, "Settings:", chatSettings.responseStyle);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes. Veuillez réessayer dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits épuisés. Veuillez ajouter des crédits à votre espace de travail." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Erreur du service IA. Veuillez réessayer." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Streaming response started");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

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

interface MarketData {
  rates: Record<string, number>;
  timestamp: string;
  pairs: Array<{
    pair: string;
    spotRate: number;
    bid: number;
    ask: number;
  }>;
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

const FUNCTION_CALL_INSTRUCTIONS = `
## Capacités de Calcul
Tu peux effectuer des calculs et analyses:
- Pricing de forwards et options (Black-Scholes, Garman-Kohlhagen)
- Calcul des Greeks (Delta, Gamma, Vega, Theta)
- Valorisation de positions de hedging
- Analyse de scénarios et stress tests
- Calcul de VaR et sensibilités`;

async function fetchMarketData(): Promise<MarketData | null> {
  try {
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    if (!response.ok) {
      console.error("Failed to fetch market data:", response.status);
      return null;
    }
    
    const data = await response.json();
    const rates = data.rates;
    
    // Calculate common FX pairs
    const pairs = [
      { 
        pair: "EUR/USD", 
        spotRate: parseFloat((1 / rates.EUR).toFixed(4)),
        bid: parseFloat((1 / rates.EUR - 0.0001).toFixed(4)),
        ask: parseFloat((1 / rates.EUR + 0.0001).toFixed(4)),
      },
      { 
        pair: "GBP/USD", 
        spotRate: parseFloat((1 / rates.GBP).toFixed(4)),
        bid: parseFloat((1 / rates.GBP - 0.0001).toFixed(4)),
        ask: parseFloat((1 / rates.GBP + 0.0001).toFixed(4)),
      },
      { 
        pair: "USD/JPY", 
        spotRate: parseFloat(rates.JPY.toFixed(2)),
        bid: parseFloat((rates.JPY - 0.01).toFixed(2)),
        ask: parseFloat((rates.JPY + 0.01).toFixed(2)),
      },
      { 
        pair: "USD/CHF", 
        spotRate: parseFloat(rates.CHF.toFixed(4)),
        bid: parseFloat((rates.CHF - 0.0001).toFixed(4)),
        ask: parseFloat((rates.CHF + 0.0001).toFixed(4)),
      },
      { 
        pair: "EUR/GBP", 
        spotRate: parseFloat((rates.GBP / rates.EUR).toFixed(4)),
        bid: parseFloat((rates.GBP / rates.EUR - 0.0001).toFixed(4)),
        ask: parseFloat((rates.GBP / rates.EUR + 0.0001).toFixed(4)),
      },
      { 
        pair: "AUD/USD", 
        spotRate: parseFloat((1 / rates.AUD).toFixed(4)),
        bid: parseFloat((1 / rates.AUD - 0.0001).toFixed(4)),
        ask: parseFloat((1 / rates.AUD + 0.0001).toFixed(4)),
      },
      { 
        pair: "USD/CAD", 
        spotRate: parseFloat(rates.CAD.toFixed(4)),
        bid: parseFloat((rates.CAD - 0.0001).toFixed(4)),
        ask: parseFloat((rates.CAD + 0.0001).toFixed(4)),
      },
      { 
        pair: "NZD/USD", 
        spotRate: parseFloat((1 / rates.NZD).toFixed(4)),
        bid: parseFloat((1 / rates.NZD - 0.0001).toFixed(4)),
        ask: parseFloat((1 / rates.NZD + 0.0001).toFixed(4)),
      },
    ];
    
    return {
      rates,
      timestamp: new Date().toISOString(),
      pairs,
    };
  } catch (error) {
    console.error("Error fetching market data:", error);
    return null;
  }
}

function buildMarketDataContext(marketData: MarketData): string {
  const pairsInfo = marketData.pairs
    .map(p => `- ${p.pair}: Spot ${p.spotRate} (Bid: ${p.bid} / Ask: ${p.ask})`)
    .join("\n");
  
  return `
## DONNÉES DE MARCHÉ EN TEMPS RÉEL (Source: ExchangeRate API)
Dernière mise à jour: ${marketData.timestamp}

### Taux Spot Actuels:
${pairsInfo}

### Autres taux disponibles (base USD):
- EUR: ${marketData.rates.EUR}
- GBP: ${marketData.rates.GBP}
- JPY: ${marketData.rates.JPY}
- CHF: ${marketData.rates.CHF}
- CAD: ${marketData.rates.CAD}
- AUD: ${marketData.rates.AUD}
- NZD: ${marketData.rates.NZD}
- CNY: ${marketData.rates.CNY}
- HKD: ${marketData.rates.HKD}
- SGD: ${marketData.rates.SGD}
- SEK: ${marketData.rates.SEK}
- NOK: ${marketData.rates.NOK}
- MXN: ${marketData.rates.MXN}
- ZAR: ${marketData.rates.ZAR}
- TRY: ${marketData.rates.TRY}
- BRL: ${marketData.rates.BRL}
- INR: ${marketData.rates.INR}

IMPORTANT: Utilise UNIQUEMENT ces données réelles pour répondre aux questions sur les taux de change. Ne jamais inventer de taux.`;
}

function buildSystemPrompt(settings: ChatSettings, marketDataContext: string | null): string {
  let prompt = `Tu es ForexHedge AI, un assistant expert en finance de marché spécialisé dans le hedging FOREX. Tu aides les utilisateurs à comprendre et gérer leurs risques de change.

## Ton Expertise
- Stratégies de couverture (hedging) : forwards, options vanilles, options exotiques, swaps de devises
- Analyse des risques de change : exposition économique, transactionnelle et de translation
- Instruments dérivés : pricing, Greeks, valorisation
- Réglementation et comptabilité de couverture (IFRS 9, hedge accounting)
- Market data : taux spot, forwards, volatilités implicites, courbes de taux

${RESPONSE_STYLE_INSTRUCTIONS[settings.responseStyle]}
`;

  if (settings.enableMarketData && marketDataContext) {
    prompt += marketDataContext;
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
- Tu recommandes toujours de consulter un professionnel pour les décisions importantes
- IMPORTANT: Quand tu donnes des taux de change, utilise UNIQUEMENT les données réelles fournies ci-dessus. Ne jamais inventer de taux.`;

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

    // Fetch real market data if enabled
    let marketDataContext: string | null = null;
    if (chatSettings.enableMarketData) {
      const marketData = await fetchMarketData();
      if (marketData) {
        marketDataContext = buildMarketDataContext(marketData);
        console.log("Market data fetched successfully");
      } else {
        console.warn("Could not fetch market data");
      }
    }

    const systemPrompt = buildSystemPrompt(chatSettings, marketDataContext);
    console.log("Received messages:", messages.length, "Settings:", chatSettings.responseStyle, "MarketData:", !!marketDataContext);

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

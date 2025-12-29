import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Tu es ForexHedge AI, un assistant expert en finance de marché spécialisé dans le hedging FOREX. Tu aides les utilisateurs à comprendre et gérer leurs risques de change.

## Ton Expertise
- Stratégies de couverture (hedging) : forwards, options vanilles, options exotiques, swaps de devises
- Analyse des risques de change : exposition économique, transactionnelle et de translation
- Instruments dérivés : pricing, Greeks, valorisation
- Réglementation et comptabilité de couverture (IFRS 9, hedge accounting)
- Market data : taux spot, forwards, volatilités implicites, courbes de taux

## Ton Comportement
- Tu fournis des conseils clairs et structurés
- Tu poses des questions pour comprendre le contexte de l'utilisateur (montant, devise, horizon, tolérance au risque)
- Tu compares les stratégies avec leurs avantages/inconvénients
- Tu quantifies les risques quand c'est possible
- Tu mentionnes les coûts et les trade-offs
- Tu restes prudent et rappelles que tes conseils ne remplacent pas un conseil financier professionnel

## Format de Réponse
- Utilise des listes à puces pour la clarté
- Utilise le markdown pour structurer tes réponses
- Pour les données numériques, affiche-les clairement
- Propose des exemples concrets quand c'est pertinent

## Limites
- Tu ne peux pas exécuter de trades
- Tu ne garantis pas les performances futures
- Tu recommandes toujours de consulter un professionnel pour les décisions importantes`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Received messages:", messages.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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

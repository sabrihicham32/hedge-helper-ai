export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface MarketRate {
  pair: string;
  spotRate: number;
  change: number;
  changePercent: number;
  bid: number;
  ask: number;
  high24h: number;
  low24h: number;
}

export interface ForwardRate {
  tenor: string;
  points: number;
  outright: number;
}

export type ResponseStyle = "concise" | "detailed" | "technical";

export interface ChatSettings {
  responseStyle: ResponseStyle;
  enableMarketData: boolean;
  enableFunctionCalls: boolean;
  customInstructions: string;
}

export const DEFAULT_SETTINGS: ChatSettings = {
  responseStyle: "concise",
  enableMarketData: true,
  enableFunctionCalls: true,
  customInstructions: "",
};

// FX Strategy Extraction Data
export interface FXExtractionData {
  amount: number | null;
  currency: string | null;
  direction: "receive" | "pay" | null;
  maturity: string | null;
  baseCurrency: string | null;
  currentRate: number | null;
  Barriere: number | null;
  hedgeDirection: "upside" | "downside" | null;
}

// Helper to parse FX extraction JSON from assistant response
export function parseFXExtractionFromResponse(content: string): FXExtractionData | null {
  try {
    // Look for JSON block in the response
    const jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      // Validate it has the expected structure
      if (
        'amount' in parsed &&
        'currency' in parsed &&
        'direction' in parsed &&
        'maturity' in parsed &&
        'baseCurrency' in parsed
      ) {
        return parsed as FXExtractionData;
      }
    }
    
    // Also try to find inline JSON
    const inlineMatch = content.match(/\{"amount":\s*\d+[\s\S]*?"hedgeDirection":\s*(?:"[^"]*"|null)\}/);
    if (inlineMatch) {
      const parsed = JSON.parse(inlineMatch[0]);
      return parsed as FXExtractionData;
    }
    
    return null;
  } catch (error) {
    console.error("Failed to parse FX extraction:", error);
    return null;
  }
}

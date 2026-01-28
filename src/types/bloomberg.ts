export interface BloombergTradeData {
  counterparty: string | null;
  productType: "spot" | "forward" | "option" | "collar" | "risk_reversal" | "seagull" | "other";
  currencyPair: string | null;
  notional: string | null;
  notionalCurrency: string | null;
  direction: "buy" | "sell" | null;
  
  // Spot/Forward
  spotRate: string | null;
  forwardPoints: string | null;
  outrightRate: string | null;
  valueDate: string | null;
  tenor: string | null;
  
  // Options
  optionType: "call" | "put" | null;
  strike: string | null;
  premium: string | null;
  premiumCurrency: string | null;
  volatility: string | null;
  delta: string | null;
  
  // Structures (Collar, RR, Seagull)
  structureLegs: StructureLeg[];
  
  // Trade status
  status: "inquiry" | "quoted" | "done" | "passed";
  tradeTime: string | null;
  
  // Raw chat
  rawChat: string;
}

export interface StructureLeg {
  type: "call" | "put";
  direction: "buy" | "sell";
  strike: string;
}

export const PRODUCT_TYPE_LABELS: Record<BloombergTradeData["productType"], string> = {
  spot: "FX Spot",
  forward: "FX Forward",
  option: "FX Option Vanille",
  collar: "Zero-Cost Collar",
  risk_reversal: "Risk Reversal",
  seagull: "Seagull",
  other: "Autre",
};

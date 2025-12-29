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

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

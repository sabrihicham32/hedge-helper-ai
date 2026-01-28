import { BloombergTradeData, StructureLeg } from "@/types/bloomberg";

// Common FX pairs
const FX_PAIRS = [
  "EUR/USD", "USD/JPY", "GBP/USD", "USD/CHF", "AUD/USD", "USD/CAD",
  "EUR/GBP", "EUR/JPY", "GBP/JPY", "EUR/CHF", "USD/MXN", "USD/BRL",
  "EURUSD", "USDJPY", "GBPUSD", "USDCHF", "AUDUSD", "USDCAD"
];

// Normalize currency pair format
function normalizePair(pair: string): string {
  const clean = pair.toUpperCase().replace(/\s/g, "");
  if (clean.length === 6 && !clean.includes("/")) {
    return `${clean.slice(0, 3)}/${clean.slice(3)}`;
  }
  return clean;
}

// Extract notional amount
function extractNotional(text: string): { amount: string | null; currency: string | null } {
  // Match patterns like "10 mio", "5M", "10 million", "EUR 10 mio", "10 mio USD"
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(mio|million|m|mn)\s*(EUR|USD|GBP|CHF|JPY|AUD|CAD)?/gi,
    /(EUR|USD|GBP|CHF|JPY|AUD|CAD)\s*(\d+(?:\.\d+)?)\s*(mio|million|m|mn)?/gi,
    /notional\s*[:\s]*(\d+(?:\.\d+)?)\s*(mio|million|m|mn)?\s*(EUR|USD|GBP|CHF|JPY|AUD|CAD)?/gi,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      // Handle different match group orders
      const num = match[1]?.match(/\d/) ? match[1] : match[2];
      const ccy = match[3] || match[1]?.match(/[A-Z]{3}/) ? match[1] : null;
      return { 
        amount: num ? `${num} mio` : null, 
        currency: ccy?.toUpperCase() || null 
      };
    }
  }
  return { amount: null, currency: null };
}

// Extract currency pair
function extractCurrencyPair(text: string): string | null {
  for (const pair of FX_PAIRS) {
    if (text.toUpperCase().includes(pair.replace("/", "")) || 
        text.toUpperCase().includes(pair)) {
      return normalizePair(pair);
    }
  }
  // Generic pattern for XXX/YYY or XXXYYY
  const pairMatch = text.match(/([A-Z]{3})\s*\/?\s*([A-Z]{3})/i);
  if (pairMatch) {
    return `${pairMatch[1].toUpperCase()}/${pairMatch[2].toUpperCase()}`;
  }
  return null;
}

// Extract rate/price
function extractRate(text: string): string | null {
  // Match patterns like "1.0872", "1.0872 / 1.0874", "@ 1.0874"
  const rateMatch = text.match(/(?:@|at)?\s*(\d+\.\d{2,5})\s*(?:\/\s*(\d+\.\d{2,5}))?/);
  if (rateMatch) {
    return rateMatch[2] ? `${rateMatch[1]} / ${rateMatch[2]}` : rateMatch[1];
  }
  return null;
}

// Extract forward points
function extractForwardPoints(text: string): string | null {
  const fwdMatch = text.match(/(?:fwd|forward)?\s*(?:pts|points)?\s*[+\-]?\d+\s*\/\s*[+\-]?\d+/i);
  if (fwdMatch) {
    return fwdMatch[0].replace(/fwd|forward|pts|points/gi, "").trim();
  }
  const ptsMatch = text.match(/([+\-]?\d+)\s*\/\s*([+\-]?\d+)\s*(?:pts|points)/i);
  if (ptsMatch) {
    return `${ptsMatch[1]} / ${ptsMatch[2]}`;
  }
  return null;
}

// Extract tenor/maturity
function extractTenor(text: string): string | null {
  const tenorMatch = text.match(/(\d+)\s*(Y|M|W|D|year|month|week|day)s?/i);
  if (tenorMatch) {
    const num = tenorMatch[1];
    const unit = tenorMatch[2].toUpperCase()[0];
    return `${num}${unit}`;
  }
  // Common tenors
  const commonTenors = ["O/N", "T/N", "S/N", "1W", "2W", "1M", "2M", "3M", "6M", "9M", "1Y", "2Y", "3Y", "5Y"];
  for (const tenor of commonTenors) {
    if (text.toUpperCase().includes(tenor)) {
      return tenor;
    }
  }
  return null;
}

// Extract volatility
function extractVolatility(text: string): string | null {
  const volMatch = text.match(/vol(?:atility)?\s*[:\s]*(\d+(?:\.\d+)?)\s*%?/i);
  if (volMatch) {
    return `${volMatch[1]}%`;
  }
  return null;
}

// Extract premium
function extractPremium(text: string): { premium: string | null; currency: string | null } {
  const premiumMatch = text.match(/premium\s*[:\s~≈]*\s*(EUR|USD|GBP|CHF)?\s*(\d+(?:\.\d+)?)\s*(k|K|mio|%)?/i);
  if (premiumMatch) {
    const ccy = premiumMatch[1]?.toUpperCase() || null;
    const amount = premiumMatch[2];
    const unit = premiumMatch[3] || "";
    return { 
      premium: `${amount}${unit.toLowerCase()}`, 
      currency: ccy 
    };
  }
  // Match percentage premium
  const pctMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:premium)?/i);
  if (pctMatch) {
    return { premium: `${pctMatch[1]}%`, currency: null };
  }
  return { premium: null, currency: null };
}

// Extract strike
function extractStrike(text: string): string | null {
  const strikeMatch = text.match(/strike\s*[:\s@]*(\d+(?:\.\d+)?)/i);
  if (strikeMatch) {
    return strikeMatch[1];
  }
  // Match patterns like "call 1.10", "put @ 1.04"
  const optMatch = text.match(/(?:call|put)\s*[@\s]*(\d+\.\d+)/i);
  if (optMatch) {
    return optMatch[1];
  }
  return null;
}

// Detect product type
function detectProductType(text: string): BloombergTradeData["productType"] {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes("seagull")) return "seagull";
  if (lowerText.includes("risk reversal") || lowerText.includes("rr ")) return "risk_reversal";
  if (lowerText.includes("collar") || lowerText.includes("zero cost") || lowerText.includes("zc")) {
    if (lowerText.includes("call") && lowerText.includes("put")) return "collar";
  }
  if (lowerText.includes("call") || lowerText.includes("put") || lowerText.includes("option") || lowerText.includes("vol")) {
    return "option";
  }
  if (lowerText.includes("forward") || lowerText.includes("fwd") || lowerText.includes("outright") || lowerText.includes("pts")) {
    return "forward";
  }
  if (lowerText.includes("spot")) return "spot";
  
  return "other";
}

// Detect trade status
function detectStatus(text: string): BloombergTradeData["status"] {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes("done") || lowerText.includes("deal")) return "done";
  if (lowerText.includes("pass") || lowerText.includes("will come back") || lowerText.includes("wait")) return "passed";
  if (lowerText.match(/\d+\.\d+\s*\/\s*\d+\.\d+/) || lowerText.includes("premium")) return "quoted";
  
  return "inquiry";
}

// Detect direction
function detectDirection(text: string): "buy" | "sell" | null {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes("bought") || lowerText.includes("buy")) return "buy";
  if (lowerText.includes("sold") || lowerText.includes("sell")) return "sell";
  
  return null;
}

// Extract structure legs
function extractStructureLegs(text: string): StructureLeg[] {
  const legs: StructureLeg[] = [];
  const lowerText = text.toLowerCase();
  
  // Pattern: buy/sell call/put @ strike
  const legPatterns = [
    /(?:buy|sell)\s*(?:\d+[YM])?\s*(?:EUR|USD)?\s*(call|put)\s*[@\s]*(\d+\.\d+)/gi,
    /(call|put)\s*[@\s]*(\d+\.\d+)/gi,
  ];
  
  for (const pattern of legPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const type = match[1].toLowerCase() as "call" | "put";
      const strike = match[2];
      const direction = lowerText.includes(`sell ${type}`) || lowerText.includes(`sell ${match[1]}`) ? "sell" : "buy";
      
      // Avoid duplicates
      if (!legs.some(l => l.type === type && l.strike === strike)) {
        legs.push({ type, direction, strike });
      }
    }
  }
  
  return legs;
}

// Extract delta
function extractDelta(text: string): string | null {
  const deltaMatch = text.match(/(?:delta|Δ)\s*[:\s~≈]*\s*([+\-]?\d+)/i);
  if (deltaMatch) {
    return deltaMatch[1];
  }
  const approxMatch = text.match(/approx\s*([+\-]?\d+)\s*delta/i);
  if (approxMatch) {
    return approxMatch[1];
  }
  return null;
}

// Main parser function
export function parseBloombergChat(chat: string): BloombergTradeData {
  const productType = detectProductType(chat);
  const notionalData = extractNotional(chat);
  const premiumData = extractPremium(chat);
  
  return {
    counterparty: null, // Will be set by user or inferred
    productType,
    currencyPair: extractCurrencyPair(chat),
    notional: notionalData.amount,
    notionalCurrency: notionalData.currency,
    direction: detectDirection(chat),
    
    spotRate: extractRate(chat),
    forwardPoints: extractForwardPoints(chat),
    outrightRate: productType === "forward" ? extractRate(chat) : null,
    valueDate: null,
    tenor: extractTenor(chat),
    
    optionType: chat.toLowerCase().includes("call") ? "call" : 
                chat.toLowerCase().includes("put") ? "put" : null,
    strike: extractStrike(chat),
    premium: premiumData.premium,
    premiumCurrency: premiumData.currency,
    volatility: extractVolatility(chat),
    delta: extractDelta(chat),
    
    structureLegs: extractStructureLegs(chat),
    
    status: detectStatus(chat),
    tradeTime: new Date().toISOString(),
    rawChat: chat,
  };
}

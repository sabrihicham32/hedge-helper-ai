import { useState, useEffect } from "react";
import { MarketRate, ForwardRate } from "@/types/chat";

// Simulated FX rates - in production, connect to a real market data API
const BASE_RATES: MarketRate[] = [
  { pair: "EUR/USD", spotRate: 1.0856, change: 0.0023, changePercent: 0.21, bid: 1.0854, ask: 1.0858, high24h: 1.0892, low24h: 1.0821 },
  { pair: "GBP/USD", spotRate: 1.2634, change: -0.0041, changePercent: -0.32, bid: 1.2632, ask: 1.2636, high24h: 1.2698, low24h: 1.2589 },
  { pair: "USD/JPY", spotRate: 157.42, change: 0.68, changePercent: 0.43, bid: 157.40, ask: 157.44, high24h: 157.89, low24h: 156.54 },
  { pair: "USD/CHF", spotRate: 0.8892, change: -0.0012, changePercent: -0.13, bid: 0.8890, ask: 0.8894, high24h: 0.8923, low24h: 0.8867 },
  { pair: "EUR/GBP", spotRate: 0.8593, change: 0.0048, changePercent: 0.56, bid: 0.8591, ask: 0.8595, high24h: 0.8612, low24h: 0.8554 },
  { pair: "AUD/USD", spotRate: 0.6245, change: -0.0018, changePercent: -0.29, bid: 0.6243, ask: 0.6247, high24h: 0.6278, low24h: 0.6212 },
];

const BASE_FORWARDS: ForwardRate[] = [
  { tenor: "1M", points: -12.5, outright: 1.0844 },
  { tenor: "3M", points: -35.2, outright: 1.0821 },
  { tenor: "6M", points: -68.4, outright: 1.0788 },
  { tenor: "1Y", points: -125.8, outright: 1.0730 },
];

export function useMarketData() {
  const [rates, setRates] = useState<MarketRate[]>(BASE_RATES);
  const [forwards, setForwards] = useState<ForwardRate[]>(BASE_FORWARDS);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRates((prev) =>
        prev.map((rate) => {
          const variation = (Math.random() - 0.5) * 0.001;
          const newSpot = rate.spotRate + variation;
          const newChange = rate.change + variation;
          return {
            ...rate,
            spotRate: parseFloat(newSpot.toFixed(4)),
            change: parseFloat(newChange.toFixed(4)),
            changePercent: parseFloat(((newChange / rate.spotRate) * 100).toFixed(2)),
            bid: parseFloat((newSpot - 0.0002).toFixed(4)),
            ask: parseFloat((newSpot + 0.0002).toFixed(4)),
          };
        })
      );
      setLastUpdate(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return { rates, forwards, lastUpdate };
}

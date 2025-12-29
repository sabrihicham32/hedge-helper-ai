import { useMarketData } from "@/hooks/useMarketData";
import { MarketRateCard } from "@/components/MarketRateCard";
import { ForwardRatesTable } from "@/components/ForwardRatesTable";
import { Activity, Clock } from "lucide-react";

export function MarketDataPanel() {
  const { rates, forwards, lastUpdate } = useMarketData();

  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Market Data</h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 bg-success rounded-full pulse-live" />
            <span>Live</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Updated: {lastUpdate.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Spot Rates */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Spot Rates
          </h3>
          <div className="grid gap-3">
            {rates.map((rate) => (
              <MarketRateCard key={rate.pair} rate={rate} />
            ))}
          </div>
        </div>

        {/* Forward Rates */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Forward Rates
          </h3>
          <ForwardRatesTable forwards={forwards} />
        </div>
      </div>
    </div>
  );
}

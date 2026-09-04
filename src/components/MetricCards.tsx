import React from 'react';
import { 
  Gauge, 
  Zap, 
  AlertTriangle, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Target
} from 'lucide-react';
import { MetricSummary, WindLocation } from '../types';

interface MetricCardsProps {
  metrics: MetricSummary | null;
  location: WindLocation | null;
  forecastMethod: string;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics, location, forecastMethod }) => {
  if (!metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-[#151515] rounded-md border border-[#222]"></div>
        ))}
      </div>
    );
  }

  const methodLabel = 
    forecastMethod === 'persistence' ? 'Persistence (T-24h)' :
    forecastMethod === 'moving_average' ? '3-Day Rolling MA' : 'NWP Physics';

  return (
    <div id="metrics-overview-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Forecast Error (MAE & MAPE) */}
      <div id="metric-card-mae" className="bg-[#151515] p-5 rounded-md border border-[#222] border-l-2 border-l-orange-400/80 shadow-sm transition-all hover:border-[#333]">
        <div className="flex items-center justify-between text-[#777] mb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#777]">
            Forecast Error (MAE)
          </span>
          <Target className="w-4 h-4 text-orange-400/80" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-mono text-[#E0E0E0]">{metrics.mae}</span>
          <span className="text-xs font-mono text-[#666]">m/s</span>
          <span className="ml-auto text-[11px] font-mono text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded">
            MAPE {metrics.mape}%
          </span>
        </div>
        <p className="text-[11px] font-mono text-[#666] mt-2.5 truncate">
          Model: <span className="text-[#AAA]">{methodLabel}</span>
        </p>
      </div>

      {/* 2. Statistical Error Distribution (Sigma / Std Dev) */}
      <div id="metric-card-sigma" className="bg-[#151515] p-5 rounded-md border border-[#222] border-l-2 border-l-blue-400/80 shadow-sm transition-all hover:border-[#333]">
        <div className="flex items-center justify-between text-[#777] mb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#777]">
            Error Spread (&sigma; / RMSE)
          </span>
          <Activity className="w-4 h-4 text-blue-400/80" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-mono text-[#E0E0E0]">{metrics.errorStdDev}</span>
          <span className="text-xs font-mono text-[#666]">&sigma; (std dev)</span>
          <span className="ml-auto text-[11px] font-mono text-[#AAA] bg-[#222] border border-[#2A2A2A] px-2 py-0.5 rounded">
            RMSE {metrics.rmse} m/s
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#666] mt-2.5">
          <span>Mean bias (&mu;):</span>
          <span className={`font-semibold ${metrics.mbe >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
            {metrics.mbe >= 0 ? `+${metrics.mbe}` : metrics.mbe} m/s
          </span>
        </div>
      </div>

      {/* 3. Z-Score Anomaly Rate */}
      <div id="metric-card-anomalies" className="bg-[#151515] p-5 rounded-md border border-[#222] border-l-2 border-l-red-500/80 shadow-sm transition-all hover:border-[#333]">
        <div className="flex items-center justify-between text-[#777] mb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#777]">
            Z-Score Anomalies
          </span>
          <AlertTriangle className="w-4 h-4 text-red-400/80" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-mono text-[#E0E0E0]">{metrics.anomalyCount}</span>
          <span className="text-xs font-mono text-[#666]">days flagged</span>
          <span className={`ml-auto text-[11px] font-mono px-2 py-0.5 rounded border ${
            metrics.anomalyCount > 0 
              ? 'bg-red-500/10 text-red-400 border-red-500/20' 
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            {metrics.anomalyRatePct}% of series
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-[#666] mt-2.5">
          <span>Max Outlier:</span>
          <span className="text-red-400 font-semibold">
            Z = {metrics.maxZScore >= 0 ? `+${metrics.maxZScore}` : metrics.maxZScore}&sigma;
          </span>
        </div>
      </div>

      {/* 4. Wind Generation Complex Telemetry */}
      <div id="metric-card-generation" className="bg-[#151515] p-5 rounded-md border border-[#222] border-l-2 border-l-emerald-500 shadow-sm transition-all hover:border-[#333]">
        <div className="flex items-center justify-between text-[#777] mb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#777]">
            Installed Capacity
          </span>
          <Zap className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-mono text-[#E0E0E0]">{location?.capacityMW || 705}</span>
          <span className="text-xs font-mono text-[#666]">MW Nameplate</span>
          <span className="ml-auto text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
            Avg {metrics.meanActual} m/s
          </span>
        </div>
        <p className="text-[11px] font-mono text-[#666] mt-2.5 truncate">
          Region: <span className="text-[#AAA] font-medium">{location?.region || 'CAISO'}</span>
        </p>
      </div>
    </div>
  );
};

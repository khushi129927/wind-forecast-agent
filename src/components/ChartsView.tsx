import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  Area,
  Scatter,
} from 'recharts';
import { DailyWindData, MetricSummary } from '../types';
import { AlertTriangle, TrendingUp, Zap, BarChart2 } from 'lucide-react';

interface ChartsViewProps {
  dailyData: DailyWindData[];
  metrics: MetricSummary | null;
  zThreshold: number;
}

export const ChartsView: React.FC<ChartsViewProps> = ({ dailyData, metrics, zThreshold }) => {
  const [activeView, setActiveView] = useState<'speed' | 'error_z' | 'power'>('speed');

  const chartData = dailyData.map((d) => ({
    ...d,
    formattedDate: d.date.slice(5), // MM-DD
    anomalyColor: d.isAnomaly
      ? d.zScore > 0
        ? '#10b981' // Green positive ramp
        : '#f43f5e' // Red negative drop
      : '#94a3b8',
    zUpperThreshold: zThreshold,
    zLowerThreshold: -zThreshold,
  }));

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: DailyWindData = payload[0].payload;
      return (
        <div className="bg-[#111] text-[#E0E0E0] p-3.5 rounded-md shadow-2xl text-xs space-y-2 border border-[#333] max-w-xs font-mono">
          <div className="font-semibold text-[#FFF] border-b border-[#262626] pb-1.5 flex items-center justify-between">
            <span>{data.date}</span>
            {data.isAnomaly && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                data.zScore > 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {data.zScore > 0 ? '▲ POSITIVE RAMP' : '▼ NEGATIVE DROP'}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-0.5 text-[11px]">
            <div className="text-[#777]">Actual Speed:</div>
            <div className="font-semibold text-right text-emerald-400">{data.avgActualSpeed} m/s</div>
            <div className="text-[#777]">Predicted:</div>
            <div className="font-semibold text-right text-blue-400">{data.avgPredictedSpeed} m/s</div>
            <div className="text-[#777]">Forecast Error:</div>
            <div className={`font-semibold text-right ${data.error >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {data.error > 0 ? `+${data.error}` : data.error} m/s
            </div>
            <div className="text-[#777]">Z-Score:</div>
            <div className="font-bold text-right text-amber-400">{data.zScore}σ</div>
            <div className="text-[#777]">Actual Gen:</div>
            <div className="font-semibold text-right text-[#DDD]">{data.actualPowerMWh.toLocaleString()} MWh</div>
            <div className="text-[#777]">Gen Error:</div>
            <div className={`font-semibold text-right ${data.powerErrorMWh >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {data.powerErrorMWh > 0 ? `+${data.powerErrorMWh}` : data.powerErrorMWh} MWh
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="analytics-charts-card" className="bg-[#151515] rounded-md border border-[#222] p-5 shadow-sm">
      {/* Chart Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#222]">
        <div>
          <span className="text-[#777] uppercase tracking-[0.2em] text-[10px] font-bold block mb-1">
            Time-Series Diagnostics
          </span>
          <h2
            className="text-xl sm:text-2xl font-light tracking-tight text-[#F0F0F0] flex items-center gap-2 leading-none"
            style={{ fontFamily: "'Newsreader', Georgia, serif" }}
          >
            Forecast Residuals &amp; Outlier Envelope
          </h2>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-[#0C0C0C] p-1 rounded-md border border-[#222] self-start sm:self-auto text-xs font-mono">
          <button
            id="chart-tab-speed"
            onClick={() => setActiveView('speed')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeView === 'speed'
                ? 'bg-[#222] text-[#FFF] border border-[#333]'
                : 'text-[#777] hover:text-[#CCC]'
            }`}
          >
            Wind Speed (m/s)
          </button>
          <button
            id="chart-tab-error-z"
            onClick={() => setActiveView('error_z')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeView === 'error_z'
                ? 'bg-[#222] text-[#FFF] border border-[#333]'
                : 'text-[#777] hover:text-[#CCC]'
            }`}
          >
            Residuals &amp; Z-Scores
          </button>
          <button
            id="chart-tab-power"
            onClick={() => setActiveView('power')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeView === 'power'
                ? 'bg-[#222] text-[#FFF] border border-[#333]'
                : 'text-[#777] hover:text-[#CCC]'
            }`}
          >
            Generation (MWh)
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-80 w-full font-mono">
        {activeView === 'speed' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#222" vertical={false} />
              <XAxis dataKey="formattedDate" tickLine={false} tick={{ fontSize: 11, fill: '#777' }} dy={8} />
              <YAxis
                unit=" m/s"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#777' }}
                domain={['auto', 'auto']}
              />
              <Tooltip content={customTooltip} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px', color: '#888' }} />
              <Area
                type="monotone"
                dataKey="avgActualSpeed"
                name="Actual Wind Speed (m/s)"
                stroke="#10b981"
                strokeWidth={2}
                fill="#10b981"
                fillOpacity={0.12}
              />
              <Line
                type="monotone"
                dataKey="avgPredictedSpeed"
                name="Baseline Predicted (m/s)"
                stroke="#60a5fa"
                strokeWidth={1.75}
                strokeDasharray="4 4"
                dot={{ r: 2.5, fill: '#60a5fa' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {activeView === 'error_z' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#222" vertical={false} />
              <XAxis dataKey="formattedDate" tickLine={false} tick={{ fontSize: 11, fill: '#777' }} dy={8} />
              <YAxis
                yAxisId="left"
                unit=" m/s"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#777' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                unit="σ"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#f59e0b' }}
              />
              <Tooltip content={customTooltip} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px', color: '#888' }} />
              <ReferenceLine yAxisId="right" y={zThreshold} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: `+${zThreshold}σ Limit`, fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }} />
              <ReferenceLine yAxisId="right" y={-zThreshold} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: `-${zThreshold}σ Limit`, fill: '#f59e0b', fontSize: 10, position: 'insideBottomRight' }} />
              <ReferenceLine yAxisId="left" y={0} stroke="#333" />
              <Bar
                yAxisId="left"
                dataKey="error"
                name="Forecast Error (m/s)"
                radius={[2, 2, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.anomalyColor} />
                ))}
              </Bar>
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="zScore"
                name="Z-Score (Residual)"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3.5, strokeWidth: 1.5, fill: '#111', stroke: '#f59e0b' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {activeView === 'power' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#222" vertical={false} />
              <XAxis dataKey="formattedDate" tickLine={false} tick={{ fontSize: 11, fill: '#777' }} dy={8} />
              <YAxis
                unit=" MWh"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#777' }}
              />
              <Tooltip content={customTooltip} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px', color: '#888' }} />
              <Area
                type="monotone"
                dataKey="actualPowerMWh"
                name="Actual Energy (MWh)"
                stroke="#38bdf8"
                fill="#38bdf8"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="predictedPowerMWh"
                name="Forecasted Energy (MWh)"
                stroke="#c084fc"
                strokeWidth={1.75}
                strokeDasharray="4 4"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Anomaly Legend & Key Takeaway */}
      <div className="mt-4 pt-3 border-t border-[#222] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#777]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-[#AAA]">Positive Ramp (Z &gt; +{zThreshold}&sigma;)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-[#AAA]">Negative Drop (Z &lt; -{zThreshold}&sigma;)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#444]"></span>
            <span className="text-[#666]">Nominal (|Z| &lt; {zThreshold}&sigma;)</span>
          </div>
        </div>
        <div className="text-[#666] text-[11px]">
          Sample: <strong className="text-[#888]">{dailyData.length} days</strong> &bull; Model: <strong className="text-[#888]">Z = (e - &mu;) / &sigma;</strong>
        </div>
      </div>
    </div>
  );
};

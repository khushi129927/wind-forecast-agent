import React, { useState } from 'react';
import { DailyWindData } from '../types';
import { AlertTriangle, ArrowUpDown, Filter, Download } from 'lucide-react';

interface DailyTableProps {
  dailyData: DailyWindData[];
  locationName: string;
}

export const DailyTable: React.FC<DailyTableProps> = ({ dailyData, locationName }) => {
  const [filterAnomaliesOnly, setFilterAnomaliesOnly] = useState(false);
  const [sortField, setSortField] = useState<keyof DailyWindData>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = dailyData.filter((d) => (filterAnomaliesOnly ? d.isAnomaly : true));

  const sorted = [...filtered].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  const handleSort = (field: keyof DailyWindData) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div id="daily-evaluations-table-card" className="bg-[#151515] rounded-md border border-[#222] overflow-hidden shadow-sm">
      {/* Header and Filter Controls */}
      <div className="p-4 border-b border-[#222] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111]">
        <div>
          <span className="text-[#777] uppercase tracking-[0.2em] text-[10px] font-bold block mb-1">
            Telemetry Ledger
          </span>
          <h2
            className="text-xl font-light tracking-tight text-[#F0F0F0] leading-none"
            style={{ fontFamily: "'Newsreader', Georgia, serif" }}
          >
            Daily Observations, Predictions &amp; Residuals
          </h2>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <button
            id="filter-anomalies-toggle"
            onClick={() => setFilterAnomaliesOnly(!filterAnomaliesOnly)}
            className={`text-xs px-3 py-1.5 rounded border font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              filterAnomaliesOnly
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm'
                : 'bg-[#181818] text-[#888] border-[#2A2A2A] hover:text-[#DDD] hover:border-[#3A3A3A]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{filterAnomaliesOnly ? 'Showing Anomalies Only' : 'Filter Anomalies Only'}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono text-[#AAA]">
          <thead className="bg-[#0C0C0C] border-b border-[#222] text-[#777] font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4 cursor-pointer hover:text-[#CCC]" onClick={() => handleSort('date')}>
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3 text-[#555]" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-[#CCC]" onClick={() => handleSort('avgActualSpeed')}>
                <div className="flex items-center gap-1">
                  <span>Actual (m/s)</span>
                  <ArrowUpDown className="w-3 h-3 text-[#555]" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-[#CCC]" onClick={() => handleSort('avgPredictedSpeed')}>
                <div className="flex items-center gap-1">
                  <span>Predicted (m/s)</span>
                  <ArrowUpDown className="w-3 h-3 text-[#555]" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-[#CCC]" onClick={() => handleSort('error')}>
                <div className="flex items-center gap-1">
                  <span>Error (m/s)</span>
                  <ArrowUpDown className="w-3 h-3 text-[#555]" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-[#CCC]" onClick={() => handleSort('pctError')}>
                <div className="flex items-center gap-1">
                  <span>MAPE Step (%)</span>
                  <ArrowUpDown className="w-3 h-3 text-[#555]" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-[#CCC]" onClick={() => handleSort('actualPowerMWh')}>
                <div className="flex items-center gap-1">
                  <span>Actual (MWh)</span>
                  <ArrowUpDown className="w-3 h-3 text-[#555]" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-[#CCC]" onClick={() => handleSort('powerErrorMWh')}>
                <div className="flex items-center gap-1">
                  <span>MWh Gap</span>
                  <ArrowUpDown className="w-3 h-3 text-[#555]" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-[#CCC]" onClick={() => handleSort('zScore')}>
                <div className="flex items-center gap-1">
                  <span>Z-Score</span>
                  <ArrowUpDown className="w-3 h-3 text-[#555]" />
                </div>
              </th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1D1D1D]">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-[#666] text-xs">
                  No records match the current filter.
                </td>
              </tr>
            ) : (
              sorted.map((row) => {
                return (
                  <tr
                    key={row.date}
                    className={`hover:bg-[#1A1A1A] transition-colors ${
                      row.isAnomaly
                        ? row.zScore > 0
                          ? 'bg-emerald-950/20'
                          : 'bg-rose-950/20'
                        : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 font-semibold text-[#E0E0E0]">{row.date}</td>
                    <td className="py-2.5 px-4 font-medium text-emerald-400">{row.avgActualSpeed}</td>
                    <td className="py-2.5 px-4 text-[#888]">{row.avgPredictedSpeed}</td>
                    <td className="py-2.5 px-4 font-semibold">
                      <span className={row.error >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {row.error > 0 ? `+${row.error}` : row.error}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[#888]">{row.pctError}%</td>
                    <td className="py-2.5 px-4 text-[#CCC]">{row.actualPowerMWh.toLocaleString()}</td>
                    <td className="py-2.5 px-4 font-semibold">
                      <span className={row.powerErrorMWh >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {row.powerErrorMWh > 0 ? `+${row.powerErrorMWh}` : row.powerErrorMWh}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-bold">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] border ${
                          row.isAnomaly
                            ? row.zScore > 0
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-[#111] text-[#777] border-[#222]'
                        }`}
                      >
                        {row.zScore > 0 ? `+${row.zScore}` : row.zScore}&sigma;
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {row.isAnomaly ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            row.zScore > 0
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          }`}
                        >
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {row.zScore > 0 ? 'Ramp Up' : 'Wind Drop'}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#555]">Nominal</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

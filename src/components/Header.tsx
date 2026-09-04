import React from 'react';
import { 
  Wind, 
  Play, 
  Download, 
  Database, 
  RefreshCw, 
  Bot, 
  BarChart3, 
  FileText, 
  Code2, 
  BookOpen, 
  Sliders, 
  MapPin,
  Sparkles
} from 'lucide-react';
import { WindLocation } from '../types';

interface HeaderProps {
  locations: WindLocation[];
  selectedLocationId: string;
  onSelectLocation: (id: string) => void;
  forecastMethod: 'persistence' | 'moving_average' | 'nwp_openmeteo';
  onChangeMethod: (method: 'persistence' | 'moving_average' | 'nwp_openmeteo') => void;
  zThreshold: number;
  onChangeZThreshold: (val: number) => void;
  activeTab: 'dashboard' | 'agent' | 'reports' | 'sql' | 'docs';
  onSelectTab: (tab: 'dashboard' | 'agent' | 'reports' | 'sql' | 'docs') => void;
  onRunPipeline: () => void;
  isPipelineRunning: boolean;
  onRefreshData: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  locations,
  selectedLocationId,
  onSelectLocation,
  forecastMethod,
  onChangeMethod,
  zThreshold,
  onChangeZThreshold,
  activeTab,
  onSelectTab,
  onRunPipeline,
  isPipelineRunning,
  onRefreshData,
  isRefreshing,
}) => {
  const currentLocation = locations.find((l) => l.id === selectedLocationId) || locations[0];

  return (
    <header id="app-header" className="bg-[#0C0C0C] border-b border-[#222] sticky top-0 z-40">
      {/* Top Banner with Project Context & Live Connection */}
      <div className="border-b border-[#222] bg-[#0C0C0C] px-4 py-2 text-xs text-[#777] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono text-[11px] tracking-tight text-[#AAA]">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="uppercase font-semibold tracking-wider text-[10px] text-emerald-400">API CONNECTED: OPEN-METEO</span>
          </div>
          <span className="text-[#333] hidden sm:inline">&bull;</span>
          <span className="hidden sm:inline text-[11px] text-[#666] font-mono">
            Time-Series Error Tracking &bull; Z-Score (2.0&sigma;) &bull; Multi-Step Tool Agent
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <a
            id="download-powerbi-csv-btn"
            href={`/api/export/csv?locationId=${selectedLocationId}&forecastMethod=${forecastMethod}&zThreshold=${zThreshold}`}
            download
            className="inline-flex items-center gap-1.5 text-[#888] hover:text-[#E0E0E0] transition-colors border border-[#262626] bg-[#141414] px-2.5 py-1 rounded"
            title="Download CSV formatted for Power BI & Excel"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span>Power BI CSV</span>
          </a>
          <a
            id="download-sqlite-db-btn"
            href="/api/export/sqlite"
            download
            className="inline-flex items-center gap-1.5 text-[#888] hover:text-[#E0E0E0] transition-colors border border-[#262626] bg-[#141414] px-2.5 py-1 rounded"
            title="Download raw SQLite Database file"
          >
            <Database className="w-3 h-3 text-blue-400" />
            <span>SQLite .db</span>
          </a>
        </div>
      </div>

      {/* Main Controls Bar */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title and Editorial Brand */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-md bg-[#151515] border border-[#262626] text-emerald-400 flex items-center justify-center shrink-0">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[#777] uppercase tracking-[0.25em] text-[10px] font-bold block mb-1">
              Forecasting Agent v1.0
            </span>
            <div className="flex items-baseline gap-2.5">
              <h1
                className="text-2xl sm:text-3xl font-light tracking-tighter leading-none text-[#F0F0F0]"
                style={{ fontFamily: "'Newsreader', Georgia, serif" }}
              >
                Aeolus <span className="italic text-[#777]">Intelligence</span>
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-[#2A2A2A] bg-[#141414] text-[#888]">
                Grid &bull; {currentLocation.name.split(' ')[0]}
              </span>
            </div>
          </div>
        </div>

        {/* Global Selectors and 1-Click Pipeline Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Location Picker */}
          <div className="flex items-center bg-[#151515] rounded-md p-1 border border-[#2A2A2A]">
            <MapPin className="w-3.5 h-3.5 text-[#777] ml-1.5 mr-1 shrink-0" />
            <select
              id="location-selector"
              value={selectedLocationId}
              onChange={(e) => onSelectLocation(e.target.value)}
              aria-label="Select Wind Generation Site"
              className="bg-transparent text-xs font-mono text-[#DDD] focus:outline-none cursor-pointer pr-2 py-1"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id} className="bg-[#151515] text-[#DDD]">
                  {loc.name} ({loc.capacityMW} MW)
                </option>
              ))}
            </select>
          </div>

          {/* Forecasting Baseline Model */}
          <div className="flex items-center bg-[#151515] rounded-md p-1 border border-[#2A2A2A]">
            <Sliders className="w-3.5 h-3.5 text-[#777] ml-1.5 mr-1 shrink-0" />
            <select
              id="forecast-method-selector"
              value={forecastMethod}
              onChange={(e) => onChangeMethod(e.target.value as any)}
              aria-label="Select Forecast Baseline Model"
              className="bg-transparent text-xs font-mono text-[#DDD] focus:outline-none cursor-pointer pr-2 py-1"
            >
              <option value="persistence" className="bg-[#151515] text-[#DDD]">Baseline: Persistence (T-24h)</option>
              <option value="moving_average" className="bg-[#151515] text-[#DDD]">Baseline: 3-Day Moving Average</option>
              <option value="nwp_openmeteo" className="bg-[#151515] text-[#DDD]">Baseline: NWP Physics</option>
            </select>
          </div>

          {/* Z-Score Threshold */}
          <div className="flex items-center bg-[#151515] rounded-md px-2.5 py-1 border border-[#2A2A2A] text-xs gap-1.5 font-mono">
            <span className="text-[#666]">|Z| &ge;</span>
            <select
              id="z-score-threshold-selector"
              value={zThreshold}
              onChange={(e) => onChangeZThreshold(parseFloat(e.target.value))}
              aria-label="Select Z-score Anomaly Threshold"
              className="bg-transparent font-bold text-emerald-400 focus:outline-none cursor-pointer"
            >
              <option value={1.5} className="bg-[#151515] text-[#DDD]">1.5&sigma; (Moderate)</option>
              <option value={2.0} className="bg-[#151515] text-[#DDD]">2.0&sigma; (Standard 95%)</option>
              <option value={2.5} className="bg-[#151515] text-[#DDD]">2.5&sigma; (High Outlier)</option>
              <option value={3.0} className="bg-[#151515] text-[#DDD]">3.0&sigma; (Extreme 99.7%)</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            id="refresh-telemetry-btn"
            onClick={onRefreshData}
            disabled={isRefreshing || isPipelineRunning}
            className="p-2 rounded-md border border-[#2A2A2A] bg-[#151515] hover:bg-[#202020] text-[#AAA] hover:text-[#FFF] transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Open-Meteo telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* End-to-End Automated Pipeline Trigger */}
          <button
            id="run-automated-pipeline-btn"
            onClick={onRunPipeline}
            disabled={isPipelineRunning}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black text-xs font-semibold px-4 py-2 rounded-md shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer tracking-tight"
          >
            {isPipelineRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Run Automated Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 overflow-x-auto border-t border-[#222] pt-1">
        <button
          id="tab-dashboard"
          onClick={() => onSelectTab('dashboard')}
          className={`px-4 py-2.5 text-xs font-medium uppercase tracking-[0.12em] transition-all inline-flex items-center gap-2 border-b-2 ${
            activeTab === 'dashboard'
              ? 'border-emerald-500 text-[#FFF] bg-[#151515]/90'
              : 'border-transparent text-[#777] hover:text-[#DDD] hover:bg-[#151515]/40'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Dashboard &amp; Forecasts</span>
        </button>

        <button
          id="tab-agent"
          onClick={() => onSelectTab('agent')}
          className={`px-4 py-2.5 text-xs font-medium uppercase tracking-[0.12em] transition-all inline-flex items-center gap-2 border-b-2 relative ${
            activeTab === 'agent'
              ? 'border-emerald-500 text-[#FFF] bg-[#151515]/90'
              : 'border-transparent text-[#777] hover:text-[#DDD] hover:bg-[#151515]/40'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Autonomous Agent (Tool-Calling)</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        </button>

        <button
          id="tab-reports"
          onClick={() => onSelectTab('reports')}
          className={`px-4 py-2.5 text-xs font-medium uppercase tracking-[0.12em] transition-all inline-flex items-center gap-2 border-b-2 ${
            activeTab === 'reports'
              ? 'border-emerald-500 text-[#FFF] bg-[#151515]/90'
              : 'border-transparent text-[#777] hover:text-[#DDD] hover:bg-[#151515]/40'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Automated Reports</span>
        </button>

        <button
          id="tab-sql"
          onClick={() => onSelectTab('sql')}
          className={`px-4 py-2.5 text-xs font-medium uppercase tracking-[0.12em] transition-all inline-flex items-center gap-2 border-b-2 ${
            activeTab === 'sql'
              ? 'border-emerald-500 text-[#FFF] bg-[#151515]/90'
              : 'border-transparent text-[#777] hover:text-[#DDD] hover:bg-[#151515]/40'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>SQLite Database</span>
        </button>

        <button
          id="tab-docs"
          onClick={() => onSelectTab('docs')}
          className={`px-4 py-2.5 text-xs font-medium uppercase tracking-[0.12em] transition-all inline-flex items-center gap-2 border-b-2 ${
            activeTab === 'docs'
              ? 'border-emerald-500 text-[#FFF] bg-[#151515]/90'
              : 'border-transparent text-[#777] hover:text-[#DDD] hover:bg-[#151515]/40'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Architecture &amp; Docs</span>
        </button>
      </div>
    </header>
  );
};

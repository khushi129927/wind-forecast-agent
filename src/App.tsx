import React, { useState, useEffect } from 'react';
import { 
  WindLocation, 
  DailyWindData, 
  HourlyWindData, 
  MetricSummary, 
  AnomalyRecord, 
  AgentChatMessage, 
  AutomatedReport 
} from './types';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { ChartsView } from './components/ChartsView';
import { DailyTable } from './components/DailyTable';
import { AgentStudio } from './components/AgentStudio';
import { ReportsView } from './components/ReportsView';
import { SqlExplorer } from './components/SqlExplorer';
import { PortfolioDocs } from './components/PortfolioDocs';
import { PRESET_LOCATIONS } from './lib/windPhysics';
import { CheckCircle2, AlertCircle, Sparkles, ExternalLink } from 'lucide-react';

export default function App() {
  const [locations, setLocations] = useState<WindLocation[]>(PRESET_LOCATIONS);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('tehachapi');
  const [forecastMethod, setForecastMethod] = useState<'persistence' | 'moving_average' | 'nwp_openmeteo'>('persistence');
  const [zThreshold, setZThreshold] = useState<number>(2.0);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agent' | 'reports' | 'sql' | 'docs'>('dashboard');

  // Data states
  const [metrics, setMetrics] = useState<MetricSummary | null>(null);
  const [dailyData, setDailyData] = useState<DailyWindData[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>([]);
  const [reports, setReports] = useState<AutomatedReport[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isPipelineRunning, setIsPipelineRunning] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Agent Chat states
  const [agentMessages, setAgentMessages] = useState<AgentChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am the **Autonomous Wind Forecasting Agent**. 

I have direct programmatic tool-use capabilities to:
1. \`get_wind_data()\`: Ingest real ground-truth & hub-height wind speed telemetry from Open-Meteo.
2. \`compute_forecast_error()\`: Calculate baseline persistence & moving-average forecast error metrics (MAE, RMSE, MAPE).
3. \`flag_anomalies()\`: Model standardized error residuals with statistical Z-scores ($Z = \\frac{e - \\mu}{\\sigma}$) to detect sudden wind ramps or unpredicted drop-offs.
4. \`generate_wind_report()\`: Automatically persist operational briefings directly into SQLite.

Try asking: **"Which days this week had unusual wind forecast errors, and what is the pattern?"** or click any prompt pill above!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isAgentLoading, setIsAgentLoading] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch telemetry & calculations
  const loadWindData = async (
    locId = selectedLocationId,
    method = forecastMethod,
    threshold = zThreshold
  ) => {
    setIsLoadingData(true);
    try {
      const res = await fetch(
        `/api/wind/data?locationId=${locId}&forecastMethod=${method}&zThreshold=${threshold}&pastDays=14&forecastDays=7`
      );
      if (!res.ok) throw new Error('Failed to fetch wind data');
      const data = await res.json();
      setMetrics(data.metrics);
      setDailyData(data.daily || []);
      setAnomalies(data.anomalies || []);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error loading wind data', 'error');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Fetch saved reports from SQLite
  const loadReports = async () => {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data || []);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    }
  };

  useEffect(() => {
    loadWindData();
    loadReports();
  }, [selectedLocationId, forecastMethod, zThreshold]);

  // Run 1-Click End-to-End Automated Pipeline
  const handleRunPipeline = async () => {
    setIsPipelineRunning(true);
    showToast('Executing automated Sat-to-Sun pipeline (Open-Meteo -> SQLite -> Agent Tool Calling -> Report)...');
    try {
      const res = await fetch('/api/pipeline/run-automated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: selectedLocationId,
          forecastMethod,
          zThreshold,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Pipeline execution failed');
      }

      const result = await res.json();

      // Refresh data and reports
      await loadWindData();
      await loadReports();

      // Append agent result to chat thread
      if (result.agentResult) {
        setAgentMessages((prev) => [
          ...prev,
          {
            id: `pipeline-prompt-${Date.now()}`,
            role: 'user',
            content: `[Automated Batch Run] Run full end-to-end wind forecasting and anomaly audit for ${result.location.name}.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          {
            id: `pipeline-resp-${Date.now()}`,
            role: 'assistant',
            content: result.agentResult.text,
            toolCalls: result.agentResult.toolCalls,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            reportGenerated: true,
          },
        ]);
      }

      showToast('Automated pipeline completed! Report persisted in SQLite and Power BI feed updated.');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Pipeline execution failed', 'error');
    } finally {
      setIsPipelineRunning(false);
    }
  };

  // Agent Chat handler
  const handleSendAgentMessage = async (userPrompt: string) => {
    const userMsg: AgentChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAgentMessages((prev) => [...prev, userMsg]);
    setIsAgentLoading(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userPrompt,
          locationId: selectedLocationId,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Agent call failed');
      }

      const data = await res.json();

      const assistantMsg: AgentChatMessage = {
        id: `agent-${Date.now()}`,
        role: 'assistant',
        content: data.text,
        toolCalls: data.toolCalls || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reportGenerated: data.reportGenerated,
      };

      setAgentMessages((prev) => [...prev, assistantMsg]);

      // If report was generated, refresh reports list
      if (data.reportGenerated) {
        await loadReports();
        showToast('New operational report was saved to SQLite database!');
      }
    } catch (err: any) {
      console.error(err);
      setAgentMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Agent Error:** ${err.message || 'Failed to complete tool-use cycle.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAgentLoading(false);
    }
  };

  // SQL Query execution handler
  const handleExecuteSqlQuery = async (sql: string) => {
    const res = await fetch('/api/sql/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Query failed');
    }
    return res.json();
  };

  const currentLocation =
    locations.find((l) => l.id === selectedLocationId) || locations[0];

  return (
    <div className="min-h-screen bg-[#0C0C0C] flex flex-col text-[#E0E0E0] selection:bg-emerald-950 selection:text-emerald-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-2xl border text-xs font-medium font-mono ${
              toastMessage.type === 'success'
                ? 'bg-[#151515] text-emerald-400 border-emerald-500/40'
                : 'bg-[#151515] text-rose-400 border-rose-500/40'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main App Header */}
      <Header
        locations={locations}
        selectedLocationId={selectedLocationId}
        onSelectLocation={setSelectedLocationId}
        forecastMethod={forecastMethod}
        onChangeMethod={setForecastMethod}
        zThreshold={zThreshold}
        onChangeZThreshold={setZThreshold}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onRunPipeline={handleRunPipeline}
        isPipelineRunning={isPipelineRunning}
        onRefreshData={() => loadWindData()}
        isRefreshing={isLoadingData}
      />

      {/* Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* Tab 1: Dashboard & Forecasts */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <MetricCards
              metrics={metrics}
              location={currentLocation}
              forecastMethod={forecastMethod}
            />

            <ChartsView
              dailyData={dailyData}
              metrics={metrics}
              zThreshold={zThreshold}
            />

            <DailyTable
              dailyData={dailyData}
              locationName={currentLocation.name}
            />
          </div>
        )}

        {/* Tab 2: Autonomous Agent (Tool-Calling) */}
        {activeTab === 'agent' && (
          <AgentStudio
            messages={agentMessages}
            onSendMessage={handleSendAgentMessage}
            isLoading={isAgentLoading}
            selectedLocation={currentLocation}
          />
        )}

        {/* Tab 3: Automated Reports (Power BI) */}
        {activeTab === 'reports' && (
          <ReportsView
            reports={reports}
            currentLocationId={selectedLocationId}
            onGenerateNewReport={handleRunPipeline}
            isGenerating={isPipelineRunning}
          />
        )}

        {/* Tab 4: SQLite Database & Schema */}
        {activeTab === 'sql' && (
          <SqlExplorer onExecuteQuery={handleExecuteSqlQuery} />
        )}

        {/* Tab 5: GitHub & Resume Docs */}
        {activeTab === 'docs' && <PortfolioDocs />}
      </main>

      {/* Footer */}
      <footer className="bg-[#0C0C0C] border-t border-[#222] mt-auto py-5 text-xs text-[#777]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[#AAA] uppercase tracking-widest text-[10px]">Aeolus Wind Intelligence</span>
            <span className="text-[#444]">&bull;</span>
            <span className="font-mono text-[#777]">Forecasting Agent v1.0</span>
            <span className="text-[#444]">&bull;</span>
            <span className="text-emerald-500 font-mono">Open-Meteo &bull; SQLite &bull; Gemini Tool-Calling</span>
          </div>
          <div className="flex items-center gap-3 text-[#555] font-mono text-[10px]">
            <span>Turbine Curve: Cubic ISO 3.0–12.0 m/s</span>
            <span className="text-[#333]">&bull;</span>
            <a
              href="https://open-meteo.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 inline-flex items-center gap-1 transition-colors text-[#777]"
            >
              <span>API: Open-Meteo</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

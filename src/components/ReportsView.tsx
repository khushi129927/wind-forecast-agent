import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  BarChart, 
  ExternalLink, 
  Calendar, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AutomatedReport } from '../types';

interface ReportsViewProps {
  reports: AutomatedReport[];
  currentLocationId: string;
  onGenerateNewReport: () => void;
  isGenerating: boolean;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  reports,
  currentLocationId,
  onGenerateNewReport,
  isGenerating,
}) => {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    reports.length > 0 ? reports[0].id : null
  );
  const [copied, setCopied] = useState(false);

  const activeReport =
    reports.find((r) => r.id === selectedReportId) || (reports.length > 0 ? reports[0] : null);

  const handleCopy = () => {
    if (!activeReport) return;
    navigator.clipboard.writeText(activeReport.markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMd = () => {
    if (!activeReport) return;
    const blob = new Blob([activeReport.markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeReport.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="reports-view-container" className="space-y-6">
      {/* Top Banner: Automation & Power BI Feed Context */}
      <div className="bg-[#151515] rounded-md border border-[#222] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[#777] uppercase tracking-[0.2em] text-[10px] font-bold block mb-1">
            Dispatch Automation
          </span>
          <h2
            className="text-xl sm:text-2xl font-light text-[#F0F0F0] tracking-tight leading-none"
            style={{ fontFamily: "'Newsreader', Georgia, serif" }}
          >
            Automated Energy Reliability Reports &amp; Downstream Feeds
          </h2>
          <p className="text-xs text-[#777] mt-1.5 max-w-2xl font-mono">
            Generated autonomously by the agent and archived to SQLite. Direct REST endpoints allow Power BI and dispatch scripts to refresh automatically.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="generate-fresh-report-btn"
            onClick={onGenerateNewReport}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black text-xs font-semibold px-4 py-2 rounded shadow transition-all disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing Report...</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                <span>Trigger New Report</span>
              </>
            )}
          </button>

          <a
            id="download-powerbi-csv-feed-btn"
            href={`/api/export/csv?locationId=${currentLocationId}`}
            download
            className="inline-flex items-center gap-1.5 bg-[#202020] hover:bg-[#282828] text-[#E0E0E0] border border-[#333] text-xs font-mono font-medium px-3.5 py-2 rounded shadow transition-all"
          >
            <BarChart className="w-3.5 h-3.5 text-amber-400" />
            <span>Power BI CSV</span>
          </a>
        </div>
      </div>

      {/* Main Grid: Report History List & Markdown Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of Saved Reports */}
        <div className="bg-[#151515] rounded-md border border-[#222] p-4 shadow-sm h-[640px] flex flex-col">
          <div className="mb-3 flex items-center justify-between border-b border-[#222] pb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#777]">
              SQLite Report Archive
            </span>
            <span className="text-[10px] text-[#666] font-mono">({reports.length} saved)</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono">
            {reports.length === 0 ? (
              <div className="text-center py-12 text-[#666] text-xs">
                No reports generated yet. Click &ldquo;Trigger New Report&rdquo; or &ldquo;Run Automated Pipeline&rdquo;.
              </div>
            ) : (
              reports.map((rep) => (
                <button
                  key={rep.id}
                  onClick={() => setSelectedReportId(rep.id)}
                  className={`w-full text-left p-3 rounded border transition-all text-xs cursor-pointer ${
                    (selectedReportId || reports[0]?.id) === rep.id
                      ? 'bg-[#1C1C1C] border-emerald-500/50 text-[#FFF] shadow-sm'
                      : 'bg-[#101010] border-[#222] hover:bg-[#161616] text-[#888]'
                  }`}
                >
                  <div className="font-medium text-[#EEE] line-clamp-1">{rep.title}</div>
                  <div className="text-[11px] text-[#666] mt-1 flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#555]" />
                      {new Date(rep.generatedAt).toLocaleDateString()}
                    </span>
                    <span>&bull;</span>
                    <span className="text-amber-400 font-medium">{rep.anomaliesCount} anomalies</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right 2 Columns: Markdown Document Preview */}
        <div className="lg:col-span-2 bg-[#151515] rounded-md border border-[#222] shadow-sm h-[640px] flex flex-col overflow-hidden">
          {activeReport ? (
            <>
              {/* Document Actions Bar */}
              <div className="p-3 border-b border-[#222] bg-[#111] flex items-center justify-between font-mono">
                <div className="text-xs text-[#777]">
                  Document ID: <code className="text-emerald-400 font-semibold">{activeReport.id}</code>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="copy-markdown-btn"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-xs text-[#AAA] hover:text-[#FFF] bg-[#1C1C1C] border border-[#2E2E2E] px-3 py-1.5 rounded transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Markdown</span>
                      </>
                    )}
                  </button>
                  <button
                    id="download-markdown-btn"
                    onClick={handleDownloadMd}
                    className="inline-flex items-center gap-1 text-xs text-black bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 rounded font-semibold transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .md</span>
                  </button>
                </div>
              </div>

              {/* Rendered Document Body */}
              <div className="flex-1 overflow-y-auto p-6 text-[#CCC] text-xs leading-relaxed space-y-4">
                <div className="markdown-body prose prose-invert prose-xs max-w-none">
                  <ReactMarkdown>{activeReport.markdownContent}</ReactMarkdown>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#666] text-xs font-mono">
              Select a report from the archive to view its contents.
            </div>
          )}
        </div>
      </div>

      {/* Power BI & Automated Ingestion Architecture Guide */}
      <div className="bg-[#151515] text-[#DDD] rounded-md border border-[#222] p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <BarChart className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 uppercase tracking-[0.2em] text-[10px] font-bold">
            Downstream Integration
          </span>
        </div>
        <h3
          className="text-xl font-light text-[#F0F0F0] mb-2 leading-none"
          style={{ fontFamily: "'Newsreader', Georgia, serif" }}
        >
          Power BI &amp; Automated Pipeline Integration
        </h3>
        <p className="text-xs text-[#888] mb-4 max-w-3xl font-mono">
          Fulfills the JD requirement: <span className="text-[#EEE]">&ldquo;Not just chat interfaces &mdash; automated outputs feeding downstream dashboards.&rdquo;</span> Connect Power BI via the Web CSV endpoint or execute the embedded Python script.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-[#0C0C0C] p-3.5 rounded border border-[#242424]">
            <div className="text-[#777] text-[11px] mb-1 font-semibold">
              Power BI Python Connector:
            </div>
            <pre className="text-emerald-400 overflow-x-auto text-[11px]">
{`import pandas as pd

# Direct REST endpoint from this applet
URL = "http://localhost:3000/api/export/csv?locationId=${currentLocationId}"
df = pd.read_csv(URL)

# Power BI automatically detects columns & types
# Daily_Evaluations loaded with Z-Scores & Errors`}
            </pre>
          </div>

          <div className="bg-[#0C0C0C] p-3.5 rounded border border-[#242424]">
            <div className="text-[#777] text-[11px] mb-1 font-semibold">
              Power BI DAX Key Metric Measures:
            </div>
            <pre className="text-amber-300 overflow-x-auto text-[11px]">
{`Forecast_MAE = AVERAGE(Daily_Evaluations[Abs_Error_ms])
Total_MWh_Gap = SUM(Daily_Evaluations[Power_Error_MWh])
Anomaly_Count = CALCULATE(
    COUNTROWS(Daily_Evaluations),
    Daily_Evaluations[Is_Anomaly] = 1
)`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

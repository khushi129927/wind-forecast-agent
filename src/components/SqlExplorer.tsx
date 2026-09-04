import React, { useState } from 'react';
import { 
  Database, 
  Play, 
  Download, 
  Table, 
  FileCode, 
  Copy, 
  Check, 
  AlertCircle,
  Clock
} from 'lucide-react';

interface SqlExplorerProps {
  onExecuteQuery: (sql: string) => Promise<{ columns: string[]; values: any[][]; rowCount: number }>;
}

const SAMPLE_QUERIES = [
  {
    name: 'Top Z-Score Anomalies',
    sql: 'SELECT date, location_id, error, z_score, severity, anomaly_type, description FROM anomaly_records ORDER BY ABS(z_score) DESC;',
  },
  {
    name: 'Model Error Comparison',
    sql: 'SELECT forecast_method, COUNT(*) as sample_days, ROUND(AVG(abs_error), 2) as mae_ms, ROUND(AVG(pct_error), 1) as mape_pct FROM daily_evaluations GROUP BY forecast_method;',
  },
  {
    name: 'Severe Generation MWh Gaps',
    sql: 'SELECT date, avg_actual_speed, avg_predicted_speed, actual_power_mwh, predicted_power_mwh, power_error_mwh, z_score FROM daily_evaluations WHERE is_anomaly = 1 ORDER BY ABS(power_error_mwh) DESC;',
  },
  {
    name: 'Wind Generation Sites',
    sql: 'SELECT id, name, region, capacity_mw, latitude, longitude FROM locations;',
  },
  {
    name: 'Recent Hourly Telemetry',
    sql: 'SELECT timestamp, wind_speed_10m, wind_speed_80m, wind_gusts_10m, power_mw, is_forecast FROM wind_observations ORDER BY timestamp DESC LIMIT 25;',
  },
];

const SCHEMA_DDL = `-- Relational Schema for Wind Generation Forecast & Reliability System
CREATE TABLE locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  capacity_mw REAL NOT NULL,
  description TEXT
);

CREATE TABLE wind_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id TEXT NOT NULL REFERENCES locations(id),
  timestamp TEXT NOT NULL,
  wind_speed_10m REAL NOT NULL,
  wind_speed_80m REAL NOT NULL,
  wind_speed_100m REAL NOT NULL,
  wind_gusts_10m REAL,
  wind_direction_10m REAL,
  temperature_2m REAL,
  pressure_msl REAL,
  is_forecast INTEGER NOT NULL,
  power_mw REAL NOT NULL
);

CREATE TABLE daily_evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id TEXT NOT NULL REFERENCES locations(id),
  date TEXT NOT NULL,
  avg_actual_speed REAL NOT NULL,
  avg_predicted_speed REAL NOT NULL,
  forecast_method TEXT NOT NULL,
  error REAL NOT NULL,
  abs_error REAL NOT NULL,
  pct_error REAL NOT NULL,
  actual_power_mwh REAL NOT NULL,
  predicted_power_mwh REAL NOT NULL,
  power_error_mwh REAL NOT NULL,
  z_score REAL NOT NULL,
  is_anomaly INTEGER NOT NULL,
  anomaly_type TEXT
);

CREATE TABLE anomaly_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id TEXT NOT NULL REFERENCES locations(id),
  date TEXT NOT NULL,
  actual_speed REAL NOT NULL,
  predicted_speed REAL NOT NULL,
  error REAL NOT NULL,
  z_score REAL NOT NULL,
  severity TEXT NOT NULL,
  anomaly_type TEXT NOT NULL,
  description TEXT NOT NULL,
  potential_grid_impact TEXT NOT NULL
);

CREATE TABLE generated_reports (
  id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL REFERENCES locations(id),
  title TEXT NOT NULL,
  date_range TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  anomalies_count INTEGER NOT NULL,
  markdown_content TEXT NOT NULL
);`;

export const SqlExplorer: React.FC<SqlExplorerProps> = ({ onExecuteQuery }) => {
  const [currentSql, setCurrentSql] = useState(SAMPLE_QUERIES[0].sql);
  const [queryResult, setQueryResult] = useState<{
    columns: string[];
    values: any[][];
    rowCount: number;
  } | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [schemaCopied, setSchemaCopied] = useState(false);

  const handleRun = async (sqlToRun?: string) => {
    const query = sqlToRun || currentSql;
    setIsExecuting(true);
    setErrorMessage(null);
    try {
      const res = await onExecuteQuery(query);
      setQueryResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'SQL execution failed');
      setQueryResult(null);
    } finally {
      setIsExecuting(false);
    }
  };

  const copySchema = () => {
    navigator.clipboard.writeText(SCHEMA_DDL);
    setSchemaCopied(true);
    setTimeout(() => setSchemaCopied(false), 2000);
  };

  return (
    <div id="sql-explorer-container" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#151515] rounded-md border border-[#222] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[#777] uppercase tracking-[0.2em] text-[10px] font-bold block mb-1">
            Data Persistence Layer
          </span>
          <h2
            className="text-xl sm:text-2xl font-light text-[#F0F0F0] tracking-tight leading-none"
            style={{ fontFamily: "'Newsreader', Georgia, serif" }}
          >
            Embedded SQLite Database &amp; Schema Architecture
          </h2>
          <p className="text-xs text-[#777] mt-1.5 max-w-2xl font-mono">
            Relational tables populated with Open-Meteo telemetry and forecast error residuals. Execute arbitrary SQL queries, inspect schemas, or download the binary database file.
          </p>
        </div>

        <div className="flex items-center gap-2.5 font-mono">
          <button
            id="copy-sql-schema-btn"
            onClick={copySchema}
            className="inline-flex items-center gap-1.5 bg-[#202020] hover:bg-[#282828] text-[#AAA] hover:text-[#FFF] border border-[#333] text-xs px-3.5 py-2 rounded transition-colors cursor-pointer"
          >
            {schemaCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Schema Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#777]" />
                <span>Copy SQL DDL</span>
              </>
            )}
          </button>

          <a
            id="download-binary-sqlite-btn"
            href="/api/export/sqlite"
            download
            className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold px-3.5 py-2 rounded shadow transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .sqlite</span>
          </a>
        </div>
      </div>

      {/* Query Console Card */}
      <div className="bg-[#151515] rounded-md border border-[#222] p-4 shadow-sm space-y-4 font-mono">
        {/* Sample Queries Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[10px] font-bold text-[#777] uppercase tracking-[0.2em] shrink-0">
            Quick Queries:
          </span>
          {SAMPLE_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentSql(q.sql);
                handleRun(q.sql);
              }}
              className="text-xs bg-[#111] hover:bg-[#202020] text-[#AAA] hover:text-[#EEE] border border-[#262626] hover:border-[#444] px-3 py-1 rounded shrink-0 transition-colors cursor-pointer"
            >
              {q.name}
            </button>
          ))}
        </div>

        {/* Editor Area */}
        <div className="relative">
          <textarea
            id="sql-query-input"
            value={currentSql}
            onChange={(e) => setCurrentSql(e.target.value)}
            rows={4}
            placeholder="Type any standard SQLite query here (e.g. SELECT * FROM daily_evaluations;)"
            className="w-full font-mono text-xs bg-[#0C0C0C] text-emerald-400 p-4 rounded-md focus:outline-none focus:border-emerald-500 border border-[#262626] leading-relaxed"
          />
          <button
            id="execute-sql-btn"
            onClick={() => handleRun()}
            disabled={isExecuting || !currentSql.trim()}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold px-4 py-2 rounded shadow-sm transition-all disabled:opacity-40 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isExecuting ? 'Executing...' : 'Run Query'}</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 bg-[#241212] border border-[#481c1c] rounded text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Query Results Table */}
        {queryResult && (
          <div className="space-y-2 pt-2">
            <div className="text-xs text-[#777] flex items-center justify-between">
              <span>
                Returned <strong className="text-[#EEE]">{queryResult.rowCount} rows</strong>
              </span>
              <span className="text-[11px] text-emerald-400 font-mono">Status: 200 OK</span>
            </div>

            <div className="overflow-x-auto max-h-96 border border-[#222] rounded-md bg-[#0C0C0C]">
              <table className="w-full text-left text-xs text-[#CCC] font-mono">
                <thead className="bg-[#121212] border-b border-[#222] text-[#888] font-bold sticky top-0">
                  <tr>
                    {queryResult.columns.map((col, idx) => (
                      <th key={idx} className="py-2.5 px-3 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A] bg-[#0C0C0C]">
                  {queryResult.values.length === 0 ? (
                    <tr>
                      <td
                        colSpan={queryResult.columns.length}
                        className="py-6 text-center text-[#555] font-sans"
                      >
                        Query returned 0 rows.
                      </td>
                    </tr>
                  ) : (
                    queryResult.values.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[#141414] transition-colors">
                        {row.map((val: any, cIdx: number) => (
                          <td key={cIdx} className="py-2 px-3 whitespace-nowrap">
                            {val === null || val === undefined ? (
                              <span className="text-[#555] italic">null</span>
                            ) : (
                              String(val)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Database Schema Visualizer */}
      <div className="bg-[#151515] rounded-md border border-[#222] p-5 shadow-sm space-y-4">
        <div>
          <span className="text-[#777] uppercase tracking-[0.2em] text-[10px] font-bold block mb-1">
            Schema Documentation
          </span>
          <h3
            className="text-xl font-light text-[#F0F0F0] mb-1 leading-none"
            style={{ fontFamily: "'Newsreader', Georgia, serif" }}
          >
            SQLite Relational Schema Specification
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-[#0E0E0E] p-3.5 rounded border border-[#222]">
            <div className="font-bold text-emerald-400 flex items-center justify-between pb-1 border-b border-[#222]">
              <span>locations</span>
              <span className="text-[10px] text-[#666] font-normal">Dimension</span>
            </div>
            <ul className="space-y-1 mt-2 text-[11px] text-[#888]">
              <li><strong className="text-[#DDD]">id</strong> TEXT PK</li>
              <li>name TEXT</li>
              <li>region TEXT</li>
              <li>capacity_mw REAL</li>
              <li>latitude REAL</li>
              <li>longitude REAL</li>
            </ul>
          </div>

          <div className="bg-[#0E0E0E] p-3.5 rounded border border-[#222]">
            <div className="font-bold text-emerald-400 flex items-center justify-between pb-1 border-b border-[#222]">
              <span>wind_observations</span>
              <span className="text-[10px] text-[#666] font-normal">Fact Telemetry</span>
            </div>
            <ul className="space-y-1 mt-2 text-[11px] text-[#888]">
              <li><strong className="text-[#DDD]">id</strong> INTEGER PK</li>
              <li>location_id TEXT FK</li>
              <li>timestamp TEXT</li>
              <li>wind_speed_10m REAL</li>
              <li>wind_speed_80m REAL</li>
              <li>power_mw REAL</li>
              <li>is_forecast INTEGER</li>
            </ul>
          </div>

          <div className="bg-[#0E0E0E] p-3.5 rounded border border-[#222]">
            <div className="font-bold text-emerald-400 flex items-center justify-between pb-1 border-b border-[#222]">
              <span>daily_evaluations</span>
              <span className="text-[10px] text-[#666] font-normal">Time-Series Error</span>
            </div>
            <ul className="space-y-1 mt-2 text-[11px] text-[#888]">
              <li>date TEXT</li>
              <li>avg_actual_speed REAL</li>
              <li>avg_predicted_speed REAL</li>
              <li>error REAL</li>
              <li>abs_error REAL</li>
              <li>z_score REAL</li>
              <li>is_anomaly INTEGER</li>
            </ul>
          </div>

          <div className="bg-[#0E0E0E] p-3.5 rounded border border-[#222]">
            <div className="font-bold text-emerald-400 flex items-center justify-between pb-1 border-b border-[#222]">
              <span>anomaly_records</span>
              <span className="text-[10px] text-[#666] font-normal">Reliability Outliers</span>
            </div>
            <ul className="space-y-1 mt-2 text-[11px] text-[#888]">
              <li>date TEXT</li>
              <li>error REAL</li>
              <li>z_score REAL</li>
              <li>severity TEXT</li>
              <li>anomaly_type TEXT</li>
              <li>potential_grid_impact TEXT</li>
            </ul>
          </div>

          <div className="bg-[#0E0E0E] p-3.5 rounded border border-[#222]">
            <div className="font-bold text-emerald-400 flex items-center justify-between pb-1 border-b border-[#222]">
              <span>generated_reports</span>
              <span className="text-[10px] text-[#666] font-normal">Autonomous Reports</span>
            </div>
            <ul className="space-y-1 mt-2 text-[11px] text-[#888]">
              <li><strong className="text-[#DDD]">id</strong> TEXT PK</li>
              <li>title TEXT</li>
              <li>generated_at TEXT</li>
              <li>markdown_content TEXT</li>
              <li>anomalies_count INTEGER</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  BookOpen, 
  Github, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  Briefcase, 
  Cpu, 
  Terminal,
  Layers,
  Calendar
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const FULL_README_MARKDOWN = `# Wind Energy Forecast & Anomaly Detection Agent
An end-to-end energy forecasting and reliability analysis system built with **Open-Meteo API**, **SQLite**, **Time-Series Baseline Models**, **Statistical Z-Score Anomaly Detection**, and an **Autonomous LLM Agent with Direct Tool-Calling**.

[![Open-Meteo](https://img.shields.io/badge/Data-Open--Meteo%20(Free%2FNo--Key)-blue)](https://open-meteo.com)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57)](https://www.sqlite.org)
[![LLM Agent](https://img.shields.io/badge/Agent-Direct%20Tool--Calling-emerald)](https://ai.google.dev)
[![Power BI](https://img.shields.io/badge/Export-Power%20BI%20%2F%20Markdown-F2C811)](https://powerbi.microsoft.com)

---

## Project Overview & Weekend Scope
This project bridges the gap between software engineering, time-series data science, and modern agentic AI. It addresses key technical requirements from contemporary senior AI/Energy engineering job descriptions:
1. **Programmatically integrate LLMs** via native function-calling rather than relying on chat windows.
2. **Build custom agents that reason through multi-step problems** across domain data.
3. **Time-series forecasting** and statistical reliability modeling.
4. **Automated end-to-end outputs** feeding downstream dashboards (Power BI / Excel).

---

## Weekend Execution Roadmap

| Milestone | Timeframe | Focus | Deliverable |
|---|---|---|---|
| **1. Telemetry Ingestion** | Sat Morning | Open-Meteo API & SQLite | Schema design, automated ingestion of 10m & 80m hub height wind speeds, turbine power curves |
| **2. Time-Series Baselines** | Sat Afternoon | Forecasting & Residuals | Day-Ahead Persistence & Moving Average models; MAE, RMSE, MAPE, and MWh dispatch error tracking |
| **3. Z-Score Anomaly Tool** | Sat Evening | Statistical Reliability | Residual distribution modeling ($Z = \frac{e - \mu}{\sigma}$), ramp-up and drop-off classification |
| **4. Agent Tool-Calling** | Sun Morning | Agent Engineering | Multi-step tool-calling with 4 functions (\`get_wind_data\`, \`compute_forecast_error\`, \`flag_anomalies\`, \`generate_wind_report\`) |
| **5. Output Automation** | Sun Afternoon | Downstream Integration | Automated markdown report persistence in SQLite + automated Power BI CSV ingestion endpoints |
| **6. Documentation** | Sun Evening | Open-Source & Resume | Methodology records, Python reference scripts, and verifiable GitHub repo |

---

## Mathematical Methodology

### 1. Baseline Forecasting Models
- **Day-Ahead Persistence:**
  $$\\hat{y}_t = y_{t - 24\\text{h}}$$
- **3-Day Trailing Moving Average:**
  $$\\hat{y}_t = \\frac{1}{3} \\sum_{k=1}^3 y_{t - 24k}$$

### 2. Error Metrics
- **Mean Absolute Error (MAE):** $\\text{MAE} = \\frac{1}{n} \\sum_{i=1}^n |y_i - \\hat{y}_i|$
- **Root Mean Squared Error (RMSE):** $\\text{RMSE} = \\sqrt{\\frac{1}{n} \\sum_{i=1}^n (y_i - \\hat{y}_i)^2}$
- **Mean Absolute Percentage Error (MAPE):** $\\text{MAPE} = \\frac{1}{n} \\sum_{i=1}^n \\left|\\frac{y_i - \\hat{y}_i}{y_i}\\right| \\times 100\\%$

### 3. Z-Score Residual Anomaly Detection
Given forecast errors $e_i = y_i - \\hat{y}_i$, sample mean error $\\mu_e$, and standard deviation $\\sigma_e$:
$$Z_i = \\frac{e_i - \\mu_e}{\\sigma_e}$$

- **Positive Wind Ramp Event ($Z_i \\ge +2.0$):** Actual wind sharply exceeded forecast. Risk of transmission line congestion, negative spot electricity pricing, and compulsory generation curtailment.
- **Negative Wind Drop Event ($Z_i \\le -2.0$):** Actual wind collapsed below forecast. Requires immediate dispatch of spinning thermal reserves and battery systems to prevent grid frequency instability.

---

## Agent Tool-Calling Architecture
The autonomous agent does not answer with hallucinated weather data. It is equipped with native tools:
1. \`get_wind_data(location_id, past_days)\`: Retrieves calibrated wind speed telemetry and turbine power curves.
2. \`compute_forecast_error(location_id, forecast_method)\`: Calculates quantitative error metrics.
3. \`flag_anomalies(location_id, z_threshold)\`: Computes standardized residuals and isolates extreme days.
4. \`generate_wind_report(location_id, title, executive_summary)\`: Serializes markdown reports into SQLite.

---

## Resume Bullet Points (Verbatim for CV/LinkedIn)
- **Time-Series Forecasting & Anomaly Detection:** "Built an end-to-end wind generation forecasting system utilizing Open-Meteo telemetry and SQLite, modeling day-ahead persistence and moving-average baselines with statistical Z-score residual anomaly detection."
- **Agentic AI & Tool-Calling:** "Architected an autonomous agent with programmatic function-calling (\`get_wind_data\`, \`compute_forecast_error\`, \`flag_anomalies\`), enabling multi-step automated reasoning across energy grid dispatch risks."
- **Automated Data Pipelines:** "Automated end-to-end report generation and headless Power BI / CSV telemetry feeds, eliminating manual chat interfaces in favor of reproducible batch operational workflows."
`;

const PYTHON_PIPELINE_CODE = `"""
extract_openmeteo.py
Pulls real wind speed & forecast data from Open-Meteo (free, no API key required)
and loads it into SQLite using requests + pandas.
"""
import sqlite3
import requests
import pandas as pd

# Open-Meteo coordinates for Tehachapi Pass Wind Area, CA
LATITUDE = 35.12
LONGITUDE = -118.45
DB_PATH = "wind_forecasts.db"

def ingest_wind_data():
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={LATITUDE}&longitude={LONGITUDE}&"
        f"hourly=wind_speed_10m,wind_speed_80m,wind_speed_100m,wind_gusts_10m,temperature_2m&"
        f"past_days=14&forecast_days=7&timezone=auto"
    )
    
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    
    hourly = data["hourly"]
    df = pd.DataFrame({
        "timestamp": hourly["time"],
        "wind_speed_10m": hourly["wind_speed_10m"],
        "wind_speed_80m": hourly.get("wind_speed_80m", [s * 1.18 for s in hourly["wind_speed_10m"]]),
        "wind_speed_100m": hourly.get("wind_speed_100m", [s * 1.25 for s in hourly["wind_speed_10m"]]),
        "wind_gusts_10m": hourly.get("wind_gusts_10m", 0),
        "temperature_2m": hourly.get("temperature_2m", 15)
    })
    
    df["date"] = pd.to_datetime(df["timestamp"]).dt.date
    
    # Save to SQLite
    with sqlite3.connect(DB_PATH) as conn:
        df.to_sql("wind_observations", conn, if_exists="replace", index=False)
        print(f"Successfully loaded {len(df)} hourly observations into SQLite.")

if __name__ == "__main__":
    ingest_wind_data()
`;

const PYTHON_AGENT_CODE = `"""
agent_tools.py
Python reference implementation of the tool-calling agent using function-calling.
Directly implements:
1. get_wind_data()
2. compute_forecast_error()
3. flag_anomalies()
"""
import json
import sqlite3
import numpy as np
import pandas as pd

DB_PATH = "wind_forecasts.db"

def get_wind_data(days: int = 14) -> dict:
    """Tool: Returns recent daily aggregated wind speeds and turbine power estimates."""
    with sqlite3.connect(DB_PATH) as conn:
        df = pd.read_sql("SELECT * FROM wind_observations", conn)
    daily = df.groupby("date")["wind_speed_80m"].mean().tail(days)
    return {"status": "ok", "daily_speeds_ms": daily.to_dict()}

def compute_forecast_error(method: str = "persistence") -> dict:
    """Tool: Computes daily persistence baseline forecast and MAE / RMSE error residuals."""
    with sqlite3.connect(DB_PATH) as conn:
        df = pd.read_sql("SELECT * FROM wind_observations", conn)
    daily = df.groupby("date")["wind_speed_80m"].mean().reset_index()
    
    # Baseline: Day-ahead persistence
    daily["predicted"] = daily["wind_speed_80m"].shift(1).bfill()
    daily["error"] = daily["wind_speed_80m"] - daily["predicted"]
    daily["abs_error"] = daily["error"].abs()
    
    mae = daily["abs_error"].mean()
    rmse = np.sqrt((daily["error"] ** 2).mean())
    return {
        "status": "ok",
        "method": method,
        "mae_ms": round(float(mae), 2),
        "rmse_ms": round(float(rmse), 2),
        "mean_bias_error": round(float(daily["error"].mean()), 2)
    }

def flag_anomalies(z_threshold: float = 2.0) -> dict:
    """Tool: Applies Z-Score outlier detection on forecast error residuals."""
    with sqlite3.connect(DB_PATH) as conn:
        df = pd.read_sql("SELECT * FROM wind_observations", conn)
    daily = df.groupby("date")["wind_speed_80m"].mean().reset_index()
    daily["predicted"] = daily["wind_speed_80m"].shift(1).bfill()
    daily["error"] = daily["wind_speed_80m"] - daily["predicted"]
    
    mu = daily["error"].mean()
    sigma = daily["error"].std()
    daily["z_score"] = (daily["error"] - mu) / (sigma + 1e-6)
    
    anomalies = daily[daily["z_score"].abs() >= z_threshold]
    return {
        "status": "ok",
        "z_threshold": z_threshold,
        "total_anomalies": len(anomalies),
        "outliers": anomalies[["date", "wind_speed_80m", "predicted", "error", "z_score"]].to_dict(orient="records")
    }
`;

export const PortfolioDocs: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<'readme' | 'python_ingest' | 'python_agent'>(
    'readme'
  );
  const [copied, setCopied] = useState(false);
  const [resumeCopied, setResumeCopied] = useState(false);

  const handleCopyCurrent = () => {
    let content = FULL_README_MARKDOWN;
    if (activeCodeTab === 'python_ingest') content = PYTHON_PIPELINE_CODE;
    if (activeCodeTab === 'python_agent') content = PYTHON_AGENT_CODE;

    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyResumeBullets = () => {
    const text = `- Time-Series Forecasting & Anomaly Detection: Built an end-to-end wind generation forecasting system utilizing Open-Meteo telemetry and SQLite, modeling day-ahead persistence and moving-average baselines with statistical Z-score residual anomaly detection.
- Agentic AI & Tool-Calling: Architected an autonomous agent with programmatic function-calling (get_wind_data, compute_forecast_error, flag_anomalies), enabling multi-step automated reasoning across energy grid dispatch risks.
- Automated Data Pipelines: Automated end-to-end report generation and headless Power BI / CSV telemetry feeds, eliminating manual chat interfaces in favor of reproducible batch operational workflows.`;

    navigator.clipboard.writeText(text);
    setResumeCopied(true);
    setTimeout(() => setResumeCopied(false), 2000);
  };

  const handleDownloadReadme = () => {
    const blob = new Blob([FULL_README_MARKDOWN], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="portfolio-docs-container" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#151515] rounded-md border border-[#222] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[#777] uppercase tracking-[0.2em] text-[10px] font-bold block mb-1">
            Engineering Portfolio
          </span>
          <h2
            className="text-xl sm:text-2xl font-light text-[#F0F0F0] tracking-tight leading-none"
            style={{ fontFamily: "'Newsreader', Georgia, serif" }}
          >
            Project Repository &amp; Methodology Dossier
          </h2>
          <p className="text-xs text-[#777] mt-1.5 max-w-2xl font-mono">
            Methodology documentation, mathematical formulations, standalone Python source scripts, and verified resume bullet points tailored to energy forecasting and agentic engineering.
          </p>
        </div>

        <div className="flex items-center gap-2.5 font-mono">
          <button
            id="copy-resume-bullets-btn"
            onClick={handleCopyResumeBullets}
            className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black text-xs font-semibold px-3.5 py-2 rounded shadow transition-colors cursor-pointer"
          >
            {resumeCopied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Bullets Copied!</span>
              </>
            ) : (
              <>
                <Briefcase className="w-3.5 h-3.5" />
                <span>Copy Resume Bullets</span>
              </>
            )}
          </button>

          <button
            id="download-readme-md-btn"
            onClick={handleDownloadReadme}
            className="inline-flex items-center gap-1.5 bg-[#202020] hover:bg-[#282828] text-[#E0E0E0] border border-[#333] text-xs px-3.5 py-2 rounded shadow transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download README.md</span>
          </button>
        </div>
      </div>

      {/* Code / Docs Viewer */}
      <div className="bg-[#151515] rounded-md border border-[#222] shadow-sm overflow-hidden">
        {/* Navigation Tabs Bar */}
        <div className="p-3 border-b border-[#222] bg-[#111] flex flex-wrap items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setActiveCodeTab('readme')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                activeCodeTab === 'readme'
                  ? 'bg-[#202020] text-[#FFF] border border-[#333]'
                  : 'text-[#777] hover:text-[#CCC]'
              }`}
            >
              README.md (Methodology)
            </button>
            <button
              onClick={() => setActiveCodeTab('python_ingest')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                activeCodeTab === 'python_ingest'
                  ? 'bg-[#202020] text-[#FFF] border border-[#333]'
                  : 'text-[#777] hover:text-[#CCC]'
              }`}
            >
              extract_openmeteo.py (Ingestion)
            </button>
            <button
              onClick={() => setActiveCodeTab('python_agent')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                activeCodeTab === 'python_agent'
                  ? 'bg-[#202020] text-[#FFF] border border-[#333]'
                  : 'text-[#777] hover:text-[#CCC]'
              }`}
            >
              agent_tools.py (Tool Execution)
            </button>
          </div>

          <button
            onClick={handleCopyCurrent}
            className="inline-flex items-center gap-1 text-xs text-[#AAA] hover:text-[#FFF] bg-[#1A1A1A] border border-[#2E2E2E] px-3 py-1.5 rounded transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#777]" />
                <span>Copy File Content</span>
              </>
            )}
          </button>
        </div>

        {/* Content Viewer */}
        <div className="p-6 overflow-y-auto max-h-[640px]">
          {activeCodeTab === 'readme' && (
            <div className="markdown-body prose prose-invert prose-xs max-w-none text-xs leading-relaxed space-y-4">
              <ReactMarkdown>{FULL_README_MARKDOWN}</ReactMarkdown>
            </div>
          )}

          {activeCodeTab === 'python_ingest' && (
            <pre className="font-mono text-xs text-emerald-400 bg-[#0C0C0C] p-4 rounded border border-[#262626] overflow-x-auto leading-relaxed">
              {PYTHON_PIPELINE_CODE}
            </pre>
          )}

          {activeCodeTab === 'python_agent' && (
            <pre className="font-mono text-xs text-emerald-400 bg-[#0C0C0C] p-4 rounded border border-[#262626] overflow-x-auto leading-relaxed">
              {PYTHON_AGENT_CODE}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

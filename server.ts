import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { PRESET_LOCATIONS } from './src/lib/windPhysics';
import { fetchAndProcessWindData } from './server/windService';
import { runAgentConversation, runAutomatedBatchPipeline } from './server/agent';
import { executeSqlQuery, exportDatabaseBinary, getDatabase } from './server/sqliteStore';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Locations list
  app.get('/api/locations', (req, res) => {
    res.json(PRESET_LOCATIONS);
  });

  // Wind data, forecasts & anomaly metrics
  app.get('/api/wind/data', async (req, res) => {
    try {
      const locationId = (req.query.locationId as string) || 'tehachapi';
      const forecastMethod = (req.query.forecastMethod as any) || 'persistence';
      const zThreshold = parseFloat(req.query.zThreshold as string) || 2.0;
      const pastDays = parseInt(req.query.pastDays as string, 10) || 14;
      const forecastDays = parseInt(req.query.forecastDays as string, 10) || 7;

      const result = await fetchAndProcessWindData(
        locationId,
        forecastMethod,
        zThreshold,
        pastDays,
        forecastDays
      );
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching wind data:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch wind data' });
    }
  });

  // Agent Chat / Tool Calling
  app.post('/api/agent/chat', async (req, res) => {
    try {
      const { prompt, locationId } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const result = await runAgentConversation(prompt, locationId || 'tehachapi');
      res.json(result);
    } catch (error: any) {
      console.error('Error running agent:', error);
      res.status(500).json({ error: error.message || 'Agent failed to respond' });
    }
  });

  // End-to-end Automated Batch Pipeline (No chat copy-paste required)
  app.post('/api/pipeline/run-automated', async (req, res) => {
    try {
      const { locationId, forecastMethod, zThreshold } = req.body;
      const result = await runAutomatedBatchPipeline(
        locationId || 'tehachapi',
        forecastMethod || 'persistence',
        zThreshold ? parseFloat(zThreshold) : 2.0
      );
      res.json(result);
    } catch (error: any) {
      console.error('Error running automated pipeline:', error);
      res.status(500).json({ error: error.message || 'Pipeline execution failed' });
    }
  });

  // List saved reports from SQLite
  app.get('/api/reports', async (req, res) => {
    try {
      const db = await getDatabase();
      const results = db.exec(`
        SELECT id, location_id, title, date_range, generated_at, anomalies_count, markdown_content
        FROM generated_reports
        ORDER BY generated_at DESC
        LIMIT 50
      `);

      if (!results || results.length === 0) {
        return res.json([]);
      }

      const reports = results[0].values.map((row) => ({
        id: String(row[0]),
        locationId: String(row[1]),
        title: String(row[2]),
        dateRange: String(row[3]),
        generatedAt: String(row[4]),
        anomaliesCount: Number(row[5]),
        markdownContent: String(row[6]),
      }));

      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Execute arbitrary SQL query (for SQLite schema and query explorer)
  app.post('/api/sql/query', async (req, res) => {
    try {
      const { sql } = req.body;
      if (!sql || typeof sql !== 'string') {
        return res.status(400).json({ error: 'SQL query string is required' });
      }
      const result = await executeSqlQuery(sql);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Export CSV formatted for Power BI / Excel
  app.get('/api/export/csv', async (req, res) => {
    try {
      const locationId = (req.query.locationId as string) || 'tehachapi';
      const forecastMethod = (req.query.forecastMethod as any) || 'persistence';
      const zThreshold = parseFloat(req.query.zThreshold as string) || 2.0;

      const data = await fetchAndProcessWindData(locationId, forecastMethod, zThreshold, 14, 7);

      const headers = [
        'Date',
        'Location_Name',
        'Region',
        'Capacity_MW',
        'Avg_Actual_Wind_Speed_ms',
        'Avg_Predicted_Wind_Speed_ms',
        'Forecast_Method',
        'Forecast_Error_ms',
        'Abs_Error_ms',
        'Pct_Error_MAPE_Step',
        'Actual_Generation_MWh',
        'Predicted_Generation_MWh',
        'Generation_Error_MWh',
        'Z_Score',
        'Is_Anomaly',
        'Anomaly_Type',
      ];

      const rows = data.daily.map((d) => [
        d.date,
        `"${data.location.name}"`,
        `"${data.location.region}"`,
        data.location.capacityMW,
        d.avgActualSpeed,
        d.avgPredictedSpeed,
        d.forecastMethod,
        d.error,
        d.absError,
        d.pctError,
        d.actualPowerMWh,
        d.predictedPowerMWh,
        d.powerErrorMWh,
        d.zScore,
        d.isAnomaly ? 1 : 0,
        d.anomalyType || 'normal',
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="wind_forecast_anomalies_${locationId}.csv"`
      );
      res.send(csvContent);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Download raw SQLite binary database file
  app.get('/api/export/sqlite', async (req, res) => {
    try {
      const buffer = await exportDatabaseBinary();
      res.setHeader('Content-Type', 'application/x-sqlite3');
      res.setHeader('Content-Disposition', 'attachment; filename="wind_energy_forecasts.sqlite"');
      res.send(Buffer.from(buffer));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import initSqlJs, { Database } from 'sql.js';
import { PRESET_LOCATIONS, estimateTurbinePowerMW } from '../src/lib/windPhysics';
import { DailyWindData, HourlyWindData, MetricSummary, AnomalyRecord, AutomatedReport } from '../src/types';

let dbInstance: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();
  const db = new SQL.Database();
  
  // Initialize Schema
  db.run(`
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      region TEXT NOT NULL,
      country TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      capacity_mw REAL NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS wind_observations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_id TEXT NOT NULL,
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

    CREATE TABLE IF NOT EXISTS daily_evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_id TEXT NOT NULL,
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

    CREATE TABLE IF NOT EXISTS anomaly_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_id TEXT NOT NULL,
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

    CREATE TABLE IF NOT EXISTS generated_reports (
      id TEXT PRIMARY KEY,
      location_id TEXT NOT NULL,
      title TEXT NOT NULL,
      date_range TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      anomalies_count INTEGER NOT NULL,
      markdown_content TEXT NOT NULL
    );
  `);

  // Seed preset locations
  const insertLoc = db.prepare(`
    INSERT OR REPLACE INTO locations (id, name, region, country, latitude, longitude, capacity_mw, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const loc of PRESET_LOCATIONS) {
    insertLoc.run([
      loc.id,
      loc.name,
      loc.region,
      loc.country,
      loc.latitude,
      loc.longitude,
      loc.capacityMW,
      loc.description
    ]);
  }
  insertLoc.free();

  dbInstance = db;
  return dbInstance;
}

/**
 * Executes a custom SQL query against the SQLite database and returns formatted rows.
 */
export async function executeSqlQuery(sql: string, params: unknown[] = []) {
  const db = await getDatabase();
  try {
    const results = db.exec(sql);
    if (!results || results.length === 0) {
      return { columns: [], values: [], rowCount: 0 };
    }
    return {
      columns: results[0].columns,
      values: results[0].values,
      rowCount: results[0].values.length,
    };
  } catch (error: any) {
    throw new Error(`SQL Execution Error: ${error.message}`);
  }
}

/**
 * Returns binary SQLite database file buffer for client export
 */
export async function exportDatabaseBinary(): Promise<Uint8Array> {
  const db = await getDatabase();
  return db.export();
}

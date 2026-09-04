export interface WindLocation {
  id: string;
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  capacityMW: number;
  description: string;
}

export interface HourlyWindData {
  time: string; // ISO string
  windSpeed10m: number; // m/s
  windSpeed80m: number; // m/s (hub height)
  windSpeed100m: number; // m/s
  windGusts10m: number; // m/s
  windDirection10m: number; // degrees
  temperature2m: number; // °C
  pressureMsl: number; // hPa
  isForecast: boolean;
  actualSpeed: number; // m/s benchmark
  estimatedPowerMW: number; // calculated turbine output
}

export interface DailyWindData {
  date: string; // YYYY-MM-DD
  avgActualSpeed: number;
  maxActualSpeed: number;
  avgPredictedSpeed: number;
  forecastMethod: 'persistence' | 'moving_average' | 'nwp_openmeteo';
  error: number; // Actual - Predicted
  absError: number;
  pctError: number; // MAPE step
  actualPowerMWh: number;
  predictedPowerMWh: number;
  powerErrorMWh: number;
  zScore: number;
  isAnomaly: boolean;
  anomalyType?: 'positive_ramp' | 'negative_drop' | 'normal';
}

export interface MetricSummary {
  locationName: string;
  sampleCount: number;
  meanActual: number;
  meanPredicted: number;
  mae: number;
  rmse: number;
  mape: number;
  mbe: number; // mean bias error
  errorMean: number;
  errorStdDev: number;
  anomalyCount: number;
  anomalyRatePct: number;
  maxZScore: number;
  minZScore: number;
}

export interface AnomalyRecord {
  id: string;
  date: string;
  locationName: string;
  actualSpeed: number;
  predictedSpeed: number;
  error: number;
  zScore: number;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  anomalyType: 'positive_ramp' | 'negative_drop';
  description: string;
  potentialGridImpact: string;
}

export interface AgentToolCallLog {
  id: string;
  toolName: string;
  inputArgs: Record<string, unknown>;
  outputSummary: string;
  rawOutput: unknown;
  timestamp: string;
}

export interface AgentChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolCalls?: AgentToolCallLog[];
  reportGenerated?: boolean;
}

export interface AutomatedReport {
  id: string;
  title: string;
  generatedAt: string;
  locationId: string;
  locationName?: string;
  timeRange?: string;
  metrics?: MetricSummary;
  markdownContent: string;
  anomaliesDetected?: number;
  anomaliesCount?: number;
}

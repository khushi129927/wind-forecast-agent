import { WindLocation } from '../types';

export const PRESET_LOCATIONS: WindLocation[] = [
  {
    id: 'tehachapi',
    name: 'Tehachapi Pass Wind Resource Area',
    region: 'California, US (CAISO)',
    country: 'USA',
    latitude: 35.12,
    longitude: -118.45,
    elevation: 1220,
    capacityMW: 705,
    description: 'One of the oldest and largest wind generation hubs in North America, feeding the CAISO grid through the Tehachapi Renewable Transmission Project.'
  },
  {
    id: 'sweetwater',
    name: 'Sweetwater Wind Farm',
    region: 'Nolan County, Texas (ERCOT)',
    country: 'USA',
    latitude: 32.47,
    longitude: -100.41,
    elevation: 660,
    capacityMW: 585,
    description: 'Central ERCOT wind corridor subject to dramatic cold front wind ramps and high-frequency dispatch volatility.'
  },
  {
    id: 'columbia_gorge',
    name: 'Columbia River Gorge Wind Hub',
    region: 'Washington / Oregon (BPA)',
    country: 'USA',
    latitude: 45.71,
    longitude: -120.82,
    elevation: 320,
    capacityMW: 850,
    description: 'Major Pacific Northwest wind corridor interacting heavily with hydro balancing reserves managed by BPA.'
  },
  {
    id: 'hornsea',
    name: 'Hornsea Offshore Wind Farm',
    region: 'North Sea (National Grid ESO)',
    country: 'UK',
    latitude: 53.90,
    longitude: 1.90,
    elevation: 10,
    capacityMW: 1218,
    description: 'Gigawatt-scale offshore wind complex in the North Sea delivering heavy coastal baseload with marine weather front dynamics.'
  }
];

/**
 * Calculates estimated wind power in Megawatts (MW) based on a standardized 
 * industrial wind turbine power curve (e.g. 3.0-4.0 MW class utility turbines).
 * 
 * - Cut-in speed: 3.0 m/s
 * - Rated speed: 12.0 m/s
 * - Cut-out speed: 25.0 m/s
 */
export function estimateTurbinePowerMW(windSpeedMs: number, siteCapacityMW: number): number {
  const CUT_IN = 3.0;
  const RATED = 12.0;
  const CUT_OUT = 25.0;

  if (windSpeedMs < CUT_IN || windSpeedMs >= CUT_OUT) {
    return 0;
  }

  if (windSpeedMs >= RATED) {
    return siteCapacityMW;
  }

  // Cubic curve between cut-in and rated: P = P_rated * ((v - v_in) / (v_rated - v_in))^3
  const normalizedFactor = Math.pow((windSpeedMs - CUT_IN) / (RATED - CUT_IN), 2.7);
  return Math.min(siteCapacityMW, Math.max(0, siteCapacityMW * normalizedFactor));
}

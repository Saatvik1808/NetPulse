const API_BASE = "http://localhost:8080/api/v1";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface MeasurementData {
  id: number;
  agentId: string;
  sourceRegion: string;
  targetHost: string;
  targetRegion: string | null;
  latencyMs: number;
  packetLoss: number;
  status: string;
  measuredAt: string;
  createdAt: string;
}

export interface Target {
  id: number;
  host: string;
  url: string;
  region: string;
  active: boolean;
  createdAt: string;
}

export async function fetchLatestMeasurements(): Promise<MeasurementData[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/measurements/latest`, {
    cache: "no-store", // don't cache live data
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

// Map known regions/hosts to lat/lng for map plotting
// In production, this would come from the agents table
// Map known regions/hosts to lat/lng for map plotting
export const COORDINATES: Record<string, [number, number]> = {
  // Agent regions
  "local": [20.5937, 78.9629],            // India (your dev machine)
  "us-east-1": [39.0438, -77.4874],       // Virginia
  "us-west-2": [46.15, -123.88],          // Oregon
  "eu-west-1": [53.3498, -6.2603],        // Ireland
  "eu-central-1": [50.1109, 8.6821],      // Frankfurt
  "eu-north-1": [59.3293, 18.0686],       // Stockholm
  "ap-south-1": [19.076, 72.8777],        // Mumbai
  "ap-northeast-1": [35.6762, 139.6503],  // Tokyo
  "ap-northeast-2": [37.5665, 126.978],   // Seoul
  "ap-southeast-2": [-33.8688, 151.2093], // Sydney
  "ca-central-1": [45.5017, -73.5673],    // Montreal
  "cn-east": [31.2304, 121.4737],         // Shanghai

  // Target hosts
  "google": [37.386, -122.0838],           // Mountain View
  "google-dns": [37.386, -122.0838],
  "dns.google": [37.386, -122.0838],
  "cloudflare-dns": [37.7749, -122.4194],  // San Francisco
  "cloudflare": [37.7749, -122.4194],
  "github": [37.7749, -122.4194],          // San Francisco
  "netflix": [37.2431, -121.8863],         // Los Gatos
  "aws.amazon": [47.6062, -122.3321],      // Seattle
};

export function getCoordinates(key: string): [number, number] {
  if (!key) return [0, 0];
  if (COORDINATES[key]) return COORDINATES[key];

  // Basic substring matching for known tech companies/hosts
  const lowerKey = key.toLowerCase();
  for (const known of Object.keys(COORDINATES)) {
    if (lowerKey.includes(known)) {
      return COORDINATES[known];
    }
  }

  // Generate deterministic pseudo-random coordinates for unknown regions
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const lat = -50 + Math.abs(hash % 100); // -50 to +50 to avoid extreme poles
  const lng = -160 + Math.abs((hash >> 8) % 320); // spread across longitudes

  const coords: [number, number] = [lat, lng];
  COORDINATES[key] = coords; // Cache it for consistency
  return coords;
}

export type ZipCentroid = { lat: number; lon: number };

export const ZIP_CENTROIDS: Record<string, ZipCentroid> = {
  "10001": { lat: 40.7506, lon: -73.9972 }, // New York, NY
  "90001": { lat: 33.9739, lon: -118.2487 }, // Los Angeles, CA
  "94105": { lat: 37.7898, lon: -122.3942 }, // San Francisco, CA
  "60601": { lat: 41.8853, lon: -87.6229 }, // Chicago, IL
  "73301": { lat: 30.3072, lon: -97.756 },  // Austin, TX
  "33101": { lat: 25.7752, lon: -80.2086 }, // Miami, FL
  "98101": { lat: 47.6101, lon: -122.3344 }, // Seattle, WA
  "30301": { lat: 33.755, lon: -84.39 }, // Atlanta, GA
};

export const getZipCentroid = (zip?: string | null): ZipCentroid | null => {
  if (!zip) return null;
  return ZIP_CENTROIDS[zip] ?? null;
};

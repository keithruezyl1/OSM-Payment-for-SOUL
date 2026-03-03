import { getZipCentroid } from "../data/zip-centroids";

const toRadians = (deg: number) => (deg * Math.PI) / 180;

const haversineMiles = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const r = 3958.8; // Earth radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
};

export const estimateEtaDays = (sellerZip?: string | null, customerZip?: string | null): number | null => {
  const seller = getZipCentroid(sellerZip);
  const customer = getZipCentroid(customerZip);
  if (!seller || !customer) return null;

  const distanceMiles = haversineMiles(seller.lat, seller.lon, customer.lat, customer.lon);
  const days = Math.ceil(2 + distanceMiles / 300);
  return Math.min(14, Math.max(3, days));
};

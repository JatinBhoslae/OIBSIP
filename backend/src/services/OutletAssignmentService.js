import Outlet from '../models/Outlet.js';
import { haversineKm } from '../utils/geo.js';

/**
 * Finds the nearest active outlet within its service radius for a given customer location.
 * @param {number} customerLat
 * @param {number} customerLng
 * @returns {Promise<{outlet: Object, distanceKm: number} | null>} The nearest outlet or null if none in range.
 */
export const findNearestOutlet = async (customerLat, customerLng) => {
  const outlets = await Outlet.find({ isActive: true });
  let best = null;

  for (const o of outlets) {
    const distanceKm = haversineKm(customerLat, customerLng, o.location.lat, o.location.lng);
    if (distanceKm <= o.serviceRadiusKm) {
      if (!best || distanceKm < best.distanceKm) {
        best = { outlet: o, distanceKm };
      }
    }
  }

  return best; // null if no outlet is within range
};

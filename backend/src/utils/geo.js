/**
 * Shared Geospatial Utilities
 * Haversine distance and ETA calculations used across the platform.
 */

/**
 * Calculates the distance in kilometers between two lat/lng coordinates
 * using the Haversine formula.
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} Distance in km
 */
export const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // 1 decimal place
};

/**
 * Calculates the estimated time of arrival in minutes,
 * assuming a delivery speed of 500 meters per minute (0.5 km/min).
 * @param {number} distanceKm
 * @returns {number} ETA in minutes (rounded up)
 */
export const etaMinutes = (distanceKm) => Math.ceil(distanceKm / 0.5);

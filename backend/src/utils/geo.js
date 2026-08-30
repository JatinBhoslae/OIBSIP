/**
 * Shared geospatial utilities for PizzaHub.
 * All distance and ETA calculations should use these functions.
 */

/**
 * Calculate the distance between two points in kilometers using the Haversine formula.
 * @param {number} lat1 - Latitude of first point in degrees
 * @param {number} lng1 - Longitude of first point in degrees
 * @param {number} lat2 - Latitude of second point in degrees
 * @param {number} lng2 - Longitude of second point in degrees
 * @returns {number} Distance in kilometers
 */
export const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const toRad = (deg) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Estimate delivery ETA in minutes based on distance, assuming 500 m/min average speed.
 * @param {number} distanceKm - Distance in kilometers
 * @returns {number} Estimated minutes, rounded up to the nearest integer
 */
export const etaMinutes = (distanceKm) => {
  const SPEED_KM_PER_MIN = 0.5; // 500 m/min
  return Math.ceil(distanceKm / SPEED_KM_PER_MIN);
};

/**
 * Check if a point is within a given radius (km) of another point.
 * @param {number} lat1 - Latitude of center
 * @param {number} lng1 - Longitude of center
 * @param {number} lat2 - Latitude of target
 * @param {number} lng2 - Longitude of target
 * @param {number} radiusKm - Maximum distance in km
 * @returns {boolean} True if within radius
 */
export const isWithinRadius = (lat1, lng1, lat2, lng2, radiusKm) => {
  return haversineKm(lat1, lng1, lat2, lng2) <= radiusKm;
};

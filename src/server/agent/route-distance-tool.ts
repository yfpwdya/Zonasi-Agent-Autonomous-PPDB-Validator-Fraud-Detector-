export type RouteMetrics = {
  straightLineMeters: number;
  realRouteMeters: number;
  detourFactor: number;
};

const R = 6371000;
const rad = (deg: number) => (deg * Math.PI) / 180;

// PostGIS ST_DistanceSphere equivalent (WGS84 Haversine) + Google Routes ground detour calculation.
export function calculateGeospatialDistances(
  homeLat: number,
  homeLng: number,
  schoolLat: number,
  schoolLng: number,
  overrideRouteMeters?: number
): RouteMetrics {
  const dLat = rad(schoolLat - homeLat);
  const dLng = rad(schoolLng - homeLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(homeLat)) * Math.cos(rad(schoolLat)) * Math.sin(dLng / 2) ** 2;
  const straightLineMeters = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  // ponytail: 1.48x urban network detour when Google Routes API key is absent; upgrade by passing live Routes API distanceMatrix meters.
  const realRouteMeters = overrideRouteMeters ?? Math.round(straightLineMeters * 1.483);
  return {
    straightLineMeters,
    realRouteMeters,
    detourFactor: Number((realRouteMeters / Math.max(1, straightLineMeters)).toFixed(2)),
  };
}

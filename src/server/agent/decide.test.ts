import assert from "node:assert/strict";
import { decideVerificationStatus, runZonasiAgentPipeline } from "./orchestrator.ts";
import { calculateGeospatialDistances } from "./route-distance-tool.ts";

// 1. Low OCR confidence -> NEEDS_REVISION
assert.equal(
  decideVerificationStatus({
    ocrConfidence: 72,
    kkAgeValid: true,
    familyRelationValid: true,
    detectedBuilding: "RESIDENTIAL",
    realRouteMeters: 800,
  }).status,
  "NEEDS_REVISION"
);

// 2. Narrow alley without Street View -> NEEDS_LIVE_PHOTO
assert.equal(
  decideVerificationStatus({
    ocrConfidence: 98,
    kkAgeValid: true,
    familyRelationValid: true,
    detectedBuilding: "NO_STREET_VIEW",
    realRouteMeters: 950,
  }).status,
  "NEEDS_LIVE_PHOTO"
);

// 3. Fraud: KK < 1 yr or Commercial Ruko -> REJECTED
const fraud = decideVerificationStatus({
  ocrConfidence: 99,
  kkAgeValid: false,
  familyRelationValid: false,
  detectedBuilding: "COMMERCIAL",
  realRouteMeters: 310,
});
assert.equal(fraud.status, "REJECTED");
assert.ok(fraud.rejectionReason?.includes("KOMERSIAL/RUKO"));

// 4. Clean residential application -> APPROVED
assert.equal(
  decideVerificationStatus({
    ocrConfidence: 99.4,
    kkAgeValid: true,
    familyRelationValid: true,
    detectedBuilding: "RESIDENTIAL",
    realRouteMeters: 642,
  }).status,
  "APPROVED"
);

// 5. Geospatial distance sanity check (~400-1500m in Tebet)
const dist = calculateGeospatialDistances(-6.23827, 106.85194, -6.23485, 106.85412);
assert.ok(dist.straightLineMeters > 350 && dist.straightLineMeters < 600);
assert.ok(dist.realRouteMeters > dist.straightLineMeters);

const full = await runZonasiAgentPipeline({
  kkNumber: "3171042502120005",
  homeLat: -6.23827,
  homeLng: 106.85194,
  schoolLat: -6.23485,
  schoolLng: 106.85412,
  addressHint: "Jl. Kenanga No. 14, Tebet Barat",
  overrideRouteMeters: 642,
});
assert.equal(full.decision.status, "APPROVED");
console.log("Zonasi-Agent self-check passed:", { dist, status: full.decision.status });

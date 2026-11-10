import { analyzeKKDocument, type OcrResult } from "./ocr-kk-tool.ts";
import { calculateGeospatialDistances, type RouteMetrics } from "./route-distance-tool.ts";
import {
  auditStreetViewLocation,
  type BuildingType,
  type VisionAuditResult,
} from "./streetview-audit-tool.ts";

export type VerificationStatus =
  | "PENDING_QUEUE"
  | "PROCESSING_OCR"
  | "PROCESSING_GEO"
  | "PROCESSING_VISION"
  | "NEEDS_REVISION"
  | "NEEDS_LIVE_PHOTO"
  | "APPROVED"
  | "REJECTED";

export type DecisionOutcome = {
  status: VerificationStatus;
  aiReasoningSummary: string;
  rejectionReason: string | null;
};

export function decideVerificationStatus(input: {
  ocrConfidence: number;
  kkAgeValid: boolean;
  familyRelationValid: boolean;
  detectedBuilding: BuildingType;
  realRouteMeters: number;
  maxRadiusMeters?: number;
  isMaskedOrDummy?: boolean;
}): DecisionOutcome {
  const maxRadius = input.maxRadiusMeters ?? 1200;

  if (input.isMaskedOrDummy) {
    return {
      status: "REJECTED",
      aiReasoningSummary:
        "DITOLAK / ANOMALI DOKUMEN: Kartu Keluarga terdeteksi sebagai dokumen contoh/dummy yang disensor (XXXXX). Identitas NIK, Nomor KK, dan alamat tidak sah.",
      rejectionReason:
        "Dokumen KK disensor (XXXXX / Specimen Dummy); Nomor KK dan NIK tidak dapat dipertanggungjawabkan.",
    };
  }

  if (input.ocrConfidence < 80) {
    return {
      status: "NEEDS_REVISION",
      aiReasoningSummary: `Tingkat keyakinan OCR (${input.ocrConfidence}%) di bawah ambang batas 80%. Dokumen KK buram atau terpotong, perlu scan ulang.`,
      rejectionReason: null,
    };
  }

  if (input.detectedBuilding === "NO_STREET_VIEW") {
    return {
      status: "NEEDS_LIVE_PHOTO",
      aiReasoningSummary:
        "Citra Street View tidak menjangkau gang rumah pada KK. Diperlukan verifikasi foto lapangan ber-geotag GPS.",
      rejectionReason: null,
    };
  }

  if (
    !input.kkAgeValid ||
    !input.familyRelationValid ||
    input.detectedBuilding === "COMMERCIAL" ||
    input.detectedBuilding === "EMPTY_LAND" ||
    input.realRouteMeters > maxRadius
  ) {
    const reasons: string[] = [];
    if (!input.kkAgeValid)
      reasons.push("Usia terbit Kartu Keluarga kurang dari 1 tahun (indikasi pindah domisili mendadak)");
    if (!input.familyRelationValid)
      reasons.push("Status hubungan keluarga pada KK adalah Famili Lain (indikasi modus titip KK)");
    if (input.realRouteMeters > maxRadius)
      reasons.push(`Jarak rute darat (${input.realRouteMeters}m) melebihi radius zonasi sekolah (${maxRadius}m)`);
    if (input.detectedBuilding === "COMMERCIAL")
      reasons.push("Titik alamat KK mengarah ke bangunan KOMERSIAL/RUKO bukan hunian tempat tinggal");
    if (input.detectedBuilding === "EMPTY_LAND")
      reasons.push("Titik alamat KK berada di LAHAN KOSONG tanpa bangunan hunian");
    return {
      status: "REJECTED",
      aiReasoningSummary: `TERINDIKASI FRAUD / ANOMALI ZONASI: ${reasons.join("; ")}.`,
      rejectionReason: reasons.join("; "),
    };
  }

  return {
    status: "APPROVED",
    aiReasoningSummary: `LOLOS AUDIT ZONASI: Dokumen KK valid (>= 1 tahun, Anak Kandung), jarak rute darat ${input.realRouteMeters}m dalam radius zonasi, dan bangunan terkonfirmasi HUNIAN RESIDENSIAL.`,
    rejectionReason: null,
  };
}

export async function runZonasiAgentPipeline(params: {
  kkNumber: string;
  kkImageName?: string;
  kkImageBase64?: string;
  kkIssueDateHint?: string;
  studentNikHint?: string;
  studentNameHint?: string;
  homeLat?: number;
  homeLng?: number;
  schoolLat: number;
  schoolLng: number;
  addressHint?: string;
  overrideRouteMeters?: number;
}): Promise<{
  ocr: OcrResult;
  geo: RouteMetrics;
  vision: VisionAuditResult;
  decision: DecisionOutcome;
  resolvedLat: number;
  resolvedLng: number;
  resolvedAddress: string;
}> {
  const ocr = await analyzeKKDocument(params);

  // Gunakan alamat & koordinat dari hasil bacaan KK secara otomatis
  const resolvedAddress =
    ocr.addressDetected || params.addressHint || "Alamat hasil ekstraksi Kartu Keluarga";
  const resolvedLat =
    ocr.estimatedLat ??
    (typeof params.homeLat === "number" && params.homeLat !== 0 ? params.homeLat : -6.2297);
  const resolvedLng =
    ocr.estimatedLng ??
    (typeof params.homeLng === "number" && params.homeLng !== 0 ? params.homeLng : 106.8532);

  const geo = calculateGeospatialDistances(
    resolvedLat,
    resolvedLng,
    params.schoolLat,
    params.schoolLng,
    params.overrideRouteMeters,
  );

  const vision = await auditStreetViewLocation({
    lat: resolvedLat,
    lng: resolvedLng,
    addressHint:
      ocr.detectedBuildingHint === "COMMERCIAL"
        ? `${resolvedAddress} ruko komersial`
        : ocr.detectedBuildingHint === "NO_STREET_VIEW"
        ? `${resolvedAddress} gang sempit`
        : resolvedAddress,
  });

  const decision = decideVerificationStatus({
    ocrConfidence: ocr.ocrConfidence,
    kkAgeValid: ocr.kkAgeValid,
    familyRelationValid: ocr.familyRelationValid,
    detectedBuilding: vision.detectedBuilding,
    realRouteMeters: geo.realRouteMeters,
    isMaskedOrDummy: ocr.isMaskedOrDummy,
  });

  if (ocr.ocrNotes) {
    decision.aiReasoningSummary = `[${ocr.modelUsed || "Gemini-Vision"}] ${ocr.ocrNotes} — ${decision.aiReasoningSummary}`;
  }

  return {
    ocr,
    geo,
    vision,
    decision,
    resolvedLat,
    resolvedLng,
    resolvedAddress,
  };
}

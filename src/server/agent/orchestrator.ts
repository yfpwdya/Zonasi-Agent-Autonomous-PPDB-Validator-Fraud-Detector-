import axios from "axios";
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
  studentAgeValid?: boolean;
  studentAgeYears?: number;
  studentBirthDate?: string;
  detectedBuilding: BuildingType;
  realRouteMeters: number;
  maxRadiusMeters?: number;
  isMaskedOrDummy?: boolean;
}): DecisionOutcome {
  const maxRadius = input.maxRadiusMeters ?? 1200;
  const ageValid = input.studentAgeValid ?? true;
  const wholeAge = typeof input.studentAgeYears === "number" ? Math.floor(input.studentAgeYears) : 16;

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
    !ageValid ||
    input.detectedBuilding === "COMMERCIAL" ||
    input.detectedBuilding === "EMPTY_LAND" ||
    input.realRouteMeters > maxRadius
  ) {
    const reasons: string[] = [];
    if (!ageValid) {
      reasons.push(
        wholeAge < 15
          ? `Usia calon siswa (${wholeAge} tahun, Tgl Lahir: ${input.studentBirthDate || "-"}) di bawah batas minimal masuk SMA (15 tahun)`
          : `Usia calon siswa (${wholeAge} tahun, Tgl Lahir: ${input.studentBirthDate || "-"}) melebihi batas maksimal masuk SMA (17 tahun)`
      );
    }
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
    aiReasoningSummary: `LOLOS AUDIT ZONASI: Dokumen KK valid (>= 1 tahun, Anak Kandung, Usia Siswa ${wholeAge} Thn sesuai syarat SMA 15-17 Thn), jarak rute darat ${input.realRouteMeters}m dalam radius zonasi, dan bangunan terkonfirmasi HUNIAN RESIDENSIAL.`,
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
  studentBirthDateHint?: string;
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
  // ponytail: 1x single-pass AI execution (OCR + BirthDate/Age + Coordinates + Building + Anomaly)
  const ocr = await analyzeKKDocument(params);

  const resolvedAddress =
    ocr.addressDetected || params.addressHint || "Alamat hasil ekstraksi Kartu Keluarga";
  const resolvedLat =
    ocr.estimatedLat ??
    (typeof params.homeLat === "number" && params.homeLat !== 0 ? params.homeLat : -7.2489);
  const resolvedLng =
    ocr.estimatedLng ??
    (typeof params.homeLng === "number" && params.homeLng !== 0 ? params.homeLng : 112.6358);

  let osrmMeters = params.overrideRouteMeters;
  if (!osrmMeters) {
    try {
      const { data: j } = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${resolvedLng},${resolvedLat};${params.schoolLng},${params.schoolLat}?overview=false`,
        { timeout: 2500 },
      );
      if (typeof j?.routes?.[0]?.distance === "number") osrmMeters = Math.round(j.routes[0].distance);
    } catch {
      /* fallback ke kalkulasi lokal */
    }
  }

  const geo = calculateGeospatialDistances(
    resolvedLat,
    resolvedLng,
    params.schoolLat,
    params.schoolLng,
    osrmMeters,
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
    studentAgeValid: ocr.studentAgeValid,
    studentAgeYears: ocr.studentAgeYears,
    studentBirthDate: ocr.studentBirthDate,
    detectedBuilding: vision.detectedBuilding,
    realRouteMeters: geo.realRouteMeters,
    isMaskedOrDummy: ocr.isMaskedOrDummy,
  });

  if (ocr.ocrNotes) {
    decision.aiReasoningSummary = `${ocr.ocrNotes} — ${decision.aiReasoningSummary}`;
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

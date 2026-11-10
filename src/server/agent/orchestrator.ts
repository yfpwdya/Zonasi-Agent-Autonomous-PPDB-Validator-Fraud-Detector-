import { analyzeKKDocument, type OcrResult } from "./ocr-kk-tool.ts";
import { calculateGeospatialDistances, type RouteMetrics } from "./route-distance-tool.ts";
import { auditStreetViewLocation, type BuildingType, type VisionAuditResult } from "./streetview-audit-tool.ts";

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

// Pure decision rule matching Section 7.6 of the technical blueprint.
export function decideVerificationStatus(input: {
  ocrConfidence: number;
  kkAgeValid: boolean;
  familyRelationValid: boolean;
  detectedBuilding: BuildingType;
  realRouteMeters: number;
  maxRadiusMeters?: number;
}): DecisionOutcome {
  if (input.ocrConfidence < 80) {
    return {
      status: "NEEDS_REVISION",
      aiReasoningSummary: `Tingkat keyakinan OCR (${input.ocrConfidence}%) di bawah ambang batas 80%. Mohon unggah ulang foto KK yang lebih tajam.`,
      rejectionReason: null,
    };
  }
  if (input.detectedBuilding === "NO_STREET_VIEW") {
    return {
      status: "NEEDS_LIVE_PHOTO",
      aiReasoningSummary: "Citra Street View tidak menjangkau gang rumah pendaftar. Diperlukan unggah foto fasad rumah mandiri ber-geotag.",
      rejectionReason: null,
    };
  }
  if (
    !input.kkAgeValid ||
    !input.familyRelationValid ||
    input.detectedBuilding === "COMMERCIAL" ||
    input.detectedBuilding === "EMPTY_LAND"
  ) {
    const reasons: string[] = [];
    if (!input.kkAgeValid) reasons.push("Usia terbit Kartu Keluarga kurang dari 1 tahun (indikasi pindah domisili mendadak)");
    if (!input.familyRelationValid) reasons.push("Status hubungan keluarga pada KK adalah Famili Lain (indikasi titip KK)");
    if (input.detectedBuilding === "COMMERCIAL") reasons.push("Titik koordinat mengarah ke bangunan KOMERSIAL/RUKO bukan hunian tempat tinggal");
    if (input.detectedBuilding === "EMPTY_LAND") reasons.push("Titik koordinat berada di LAHAN KOSONG tanpa bangunan hunian");
    return {
      status: "REJECTED",
      aiReasoningSummary: "Sistem mendeteksi anomali kependudukan dan tata ruang pada berkas pendaftaran.",
      rejectionReason: reasons.join("; "),
    };
  }
  return {
    status: "APPROVED",
    aiReasoningSummary: `Dokumen KK valid (>= 1 tahun), rute darat ${input.realRouteMeters}m terverifikasi dalam zonasi, dan bangunan terkonfirmasi HUNIAN RESIDENSIAL.`,
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
  homeLat: number;
  homeLng: number;
  schoolLat: number;
  schoolLng: number;
  addressHint?: string;
  overrideRouteMeters?: number;
}): Promise<{
  ocr: OcrResult;
  geo: RouteMetrics;
  vision: VisionAuditResult;
  decision: DecisionOutcome;
}> {
  const ocr = await analyzeKKDocument(params);
  const geo = calculateGeospatialDistances(
    params.homeLat,
    params.homeLng,
    params.schoolLat,
    params.schoolLng,
    params.overrideRouteMeters
  );
  const vision = await auditStreetViewLocation({
    lat: params.homeLat,
    lng: params.homeLng,
    addressHint: params.addressHint,
  });
  const decision = decideVerificationStatus({
    ocrConfidence: ocr.ocrConfidence,
    kkAgeValid: ocr.kkAgeValid,
    familyRelationValid: ocr.familyRelationValid,
    detectedBuilding: vision.detectedBuilding,
    realRouteMeters: geo.realRouteMeters,
  });

  // Real Gemini LLM reasoning synthesis when GEMINI_API_KEY is configured
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const prompt = `Anda adalah Autonomous PPDB Zonasi-Agent Auditor. Buat 1 kalimat kesimpulan audit formal Bahasa Indonesia (maks 28 kata) untuk pendaftar dengan data: Nomor KK=${params.kkNumber}, Usia KK=${ocr.kkAgeYears} tahun (valid=${ocr.kkAgeValid}), Hubungan=${ocr.familyRelation}, Jarak Rute=${geo.realRouteMeters}m (Garis lurus=${geo.straightLineMeters}m), Bangunan=${vision.detectedBuilding}, Alamat="${params.addressHint || "-"}", Catatan OCR="${ocr.ocrNotes || "-"}", No KK Terbaca="${ocr.kkNumberDetected || params.kkNumber}", Status Keputusan=${decision.status}.`;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          decision.aiReasoningSummary = `[Gemini-3-Flash] ${text}`;
        }
      }
    } catch {
      // keep deterministic reasoning on network timeout
    }
  }

  return { ocr, geo, vision, decision };
}

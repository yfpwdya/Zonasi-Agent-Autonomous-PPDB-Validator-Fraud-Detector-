import fs from "node:fs";
import path from "node:path";
import type { BuildingType } from "./agent/streetview-audit-tool.ts";
import type { VerificationStatus } from "./agent/orchestrator.ts";

export type ApplicationRecord = {
  id: string;
  tracking_id: string;
  student_nik: string;
  student_name: string;
  kk_number: string;
  school_name: string;
  address: string;
  home_lat: number;
  home_lng: number;
  real_route_distance_meters: number;
  straight_line_distance_meters: number;
  kk_image_url: string;
  live_house_photo_url?: string | null;
  kk_issue_date: string;
  kk_age_label: string;
  kk_age_valid: boolean;
  family_relation_valid: boolean;
  ocr_confidence: number;
  detected_building: BuildingType;
  status: VerificationStatus;
  ai_reasoning_summary: string;
  rejection_reason: string | null;
  created_at: string;
};

const STORE_FILE = path.join(process.cwd(), ".zonasi-store.json");

const SEED: ApplicationRecord[] = [
  {
    id: "seed-1",
    tracking_id: "PPDB-2026-X89K",
    student_nik: "3171041908070002",
    student_name: "Ahmad Fadhil Pratama",
    kk_number: "3171042502120005",
    school_name: "SMAN 8 Jakarta Selatan",
    address: "Jl. Tebet Timur Dalam VI No. 14, Tebet, Jakarta Selatan",
    home_lat: -6.23827,
    home_lng: 106.85194,
    real_route_distance_meters: 642,
    straight_line_distance_meters: 410,
    kk_image_url: "kartu_keluarga_ahmad.jpg",
    kk_issue_date: "2018-02-12",
    kk_age_label: "6.4 Tahun",
    kk_age_valid: true,
    family_relation_valid: true,
    ocr_confidence: 99.4,
    detected_building: "RESIDENTIAL",
    status: "APPROVED",
    ai_reasoning_summary: "Dokumen KK valid (>= 1 tahun), rute darat 642m terverifikasi dalam zonasi, dan bangunan terkonfirmasi HUNIAN RESIDENSIAL.",
    rejection_reason: null,
    created_at: "2026-06-14T14:22:01Z",
  },
  {
    id: "seed-2",
    tracking_id: "PPDB-2024-0891",
    student_nik: "3171021406080001",
    student_name: "Rafi Alamsyah",
    kk_number: "3171021406150001",
    school_name: "SMAN 1 Teladan Jakarta",
    address: "Jl. Budi Utomo IV No. 9, Sawah Besar, Jakarta Pusat",
    home_lat: -6.1652,
    home_lng: 106.8351,
    real_route_distance_meters: 820,
    straight_line_distance_meters: 580,
    kk_image_url: "kk_rafi_alamsyah.jpg",
    kk_issue_date: "2021-08-10",
    kk_age_label: "2.8 Tahun",
    kk_age_valid: true,
    family_relation_valid: true,
    ocr_confidence: 98.9,
    detected_building: "RESIDENTIAL",
    status: "APPROVED",
    ai_reasoning_summary: "Dokumen KK valid (2.8 tahun), rute darat 820m, hunian residensial terverifikasi.",
    rejection_reason: null,
    created_at: "2026-06-14T13:10:00Z",
  },
  {
    id: "seed-3",
    tracking_id: "PPDB-2024-1142",
    student_nik: "3171032801080004",
    student_name: "Budi Santoso",
    kk_number: "3171032802240004",
    school_name: "SMAN 1 Teladan Jakarta",
    address: "Jl. Pintu Air Raya No. 18B (Kompleks Ruko Pasar Baru), Jakarta Pusat",
    home_lat: -6.1671,
    home_lng: 106.8348,
    real_route_distance_meters: 310,
    straight_line_distance_meters: 215,
    kk_image_url: "kk_budi_fraud.jpg",
    kk_issue_date: "2024-02-14",
    kk_age_label: "4 Bln (ANOMALI)",
    kk_age_valid: false,
    family_relation_valid: false,
    ocr_confidence: 99.4,
    detected_building: "COMMERCIAL",
    status: "REJECTED",
    ai_reasoning_summary: "Indikasi kuat manipulasi domisili ('Titip KK') & pemalsuan titik koordinat hunian pada bangunan non-tempat tinggal.",
    rejection_reason: "Usia KK < 1 tahun (4 bulan, Famili Lain) & titik koordinat berada pada Ruko Komersial 3 lantai.",
    created_at: "2026-06-14T13:45:10Z",
  },
  {
    id: "seed-4",
    tracking_id: "PPDB-2024-0419",
    student_nik: "3171015509080002",
    student_name: "Siti Rahma",
    kk_number: "3171015503210002",
    school_name: "SMAN 1 Teladan Jakarta",
    address: "Gg. Kelinci III Dalam No. 7, Pasar Baru, Jakarta Pusat",
    home_lat: -6.1639,
    home_lng: 106.8399,
    real_route_distance_meters: 950,
    straight_line_distance_meters: 690,
    kk_image_url: "kk_siti_rahma.jpg",
    kk_issue_date: "2021-04-19",
    kk_age_label: "3.1 Tahun",
    kk_age_valid: true,
    family_relation_valid: true,
    ocr_confidence: 97.2,
    detected_building: "NO_STREET_VIEW",
    status: "NEEDS_LIVE_PHOTO",
    ai_reasoning_summary: "Lokasi berada di gang sempit (blind spot Street View). Menunggu unggah foto rumah mandiri ber-geotag.",
    rejection_reason: null,
    created_at: "2026-06-14T14:05:00Z",
  },
];

// ponytail: local JSON store backing API routes when Supabase credentials are not configured; swap to Supabase table queries once .env.local is populated.
export function readApplications(): ApplicationRecord[] {
  try {
    if (fs.existsSync(STORE_FILE)) {
      return JSON.parse(fs.readFileSync(STORE_FILE, "utf-8"));
    }
  } catch {
    // fallback to seed
  }
  return SEED;
}

export function writeApplications(rows: ApplicationRecord[]): void {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(rows, null, 2), "utf-8");
  } catch {
    // ignore read-only fs errors in serverless environments
  }
}

export function upsertApplication(record: ApplicationRecord): ApplicationRecord {
  const rows = readApplications();
  const idx = rows.findIndex(
    (r) => r.tracking_id.toUpperCase() === record.tracking_id.toUpperCase() || r.student_nik === record.student_nik
  );
  if (idx >= 0) {
    rows[idx] = record;
  } else {
    rows.unshift(record);
  }
  writeApplications(rows);
  return record;
}

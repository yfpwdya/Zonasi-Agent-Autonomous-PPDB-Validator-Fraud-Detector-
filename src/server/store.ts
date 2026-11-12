import fs from "node:fs";
import path from "node:path";
import type { ApplicationRecord } from "../types/index.ts";

export type { ApplicationRecord };


const STORE_FILE = path.join(process.cwd(), ".zonasi-store.json");

const SEED: ApplicationRecord[] = [
  {
    id: "seed-1",
    tracking_id: "PPDB-2026-X89K",
    student_nik: "3578191908070002",
    student_name: "Ahmad Fadhil Pratama",
    kk_number: "3578192502120005",
    school_name: "SMA Negeri 12 Surabaya",
    address: "Jl. Sememi Jaya IV No. 14, Kel. Sememi, Kec. Benowo, Surabaya",
    home_lat: -7.2489,
    home_lng: 112.6382,
    real_route_distance_meters: 480,
    straight_line_distance_meters: 345,
    kk_image_url: "kartu_keluarga_ahmad.jpg",
    kk_issue_date: "2018-02-12",
    kk_age_label: "6.4 Tahun",
    kk_age_valid: true,
    family_relation_valid: true,
    ocr_confidence: 99.4,
    detected_building: "RESIDENTIAL",
    status: "APPROVED",
    ai_reasoning_summary: "Dokumen KK valid (>= 1 tahun, Anak Kandung), rute darat 480m dalam zonasi SMAN 12 Surabaya (Sememi, Benowo), dan bangunan HUNIAN RESIDENSIAL.",
    rejection_reason: null,
    created_at: "2026-06-14T14:22:01Z",
  },
  {
    id: "seed-2",
    tracking_id: "PPDB-2024-0891",
    student_nik: "3578191406080001",
    student_name: "Rafi Alamsyah",
    kk_number: "3578191406150001",
    school_name: "SMA Negeri 12 Surabaya",
    address: "Jl. Kendung Indah II No. 9, Kel. Sememi, Kec. Benowo, Surabaya",
    home_lat: -7.2512,
    home_lng: 112.6395,
    real_route_distance_meters: 720,
    straight_line_distance_meters: 540,
    kk_image_url: "kk_rafi_alamsyah.jpg",
    kk_issue_date: "2021-08-10",
    kk_age_label: "2.8 Tahun",
    kk_age_valid: true,
    family_relation_valid: true,
    ocr_confidence: 98.9,
    detected_building: "RESIDENTIAL",
    status: "APPROVED",
    ai_reasoning_summary: "Dokumen KK valid (2.8 tahun), rute darat 720m ke SMAN 12 Surabaya, hunian residensial terverifikasi.",
    rejection_reason: null,
    created_at: "2026-06-14T13:10:00Z",
  },
  {
    id: "seed-3",
    tracking_id: "PPDB-2024-1142",
    student_nik: "3578192801080004",
    student_name: "Budi Santoso",
    kk_number: "3578192802240004",
    school_name: "SMA Negeri 12 Surabaya",
    address: "Ruko Grand Sememi Niaga Blok B-08, Kec. Benowo, Surabaya",
    home_lat: -7.2538,
    home_lng: 112.6485,
    real_route_distance_meters: 1740,
    straight_line_distance_meters: 1590,
    kk_image_url: "kk_budi_fraud.jpg",
    kk_issue_date: "2026-02-14",
    kk_age_label: "4 Bln (ANOMALI)",
    kk_age_valid: false,
    family_relation_valid: false,
    ocr_confidence: 99.4,
    detected_building: "COMMERCIAL",
    status: "REJECTED",
    ai_reasoning_summary: "Indikasi kuat manipulasi domisili ('Titip KK') & pemalsuan titik koordinat hunian pada Ruko Grand Sememi di luar radius zonasi SMAN 12 Surabaya.",
    rejection_reason: "Usia KK < 1 tahun (4 bulan, Famili Lain), Ruko Komersial, & jarak 1.740m > batas 1.200m SMAN 12 Surabaya.",
    created_at: "2026-06-14T13:45:10Z",
  },
  {
    id: "seed-4",
    tracking_id: "PPDB-2024-0419",
    student_nik: "3578195509080002",
    student_name: "Siti Rahma",
    kk_number: "3578195503210002",
    school_name: "SMA Negeri 12 Surabaya",
    address: "Gg. Sememi Kidul III Dalam No. 7, Kel. Sememi, Kec. Benowo, Surabaya",
    home_lat: -7.2476,
    home_lng: 112.6369,
    real_route_distance_meters: 290,
    straight_line_distance_meters: 190,
    kk_image_url: "kk_siti_rahma.jpg",
    kk_issue_date: "2021-04-19",
    kk_age_label: "3.1 Tahun",
    kk_age_valid: true,
    family_relation_valid: true,
    ocr_confidence: 97.2,
    detected_building: "NO_STREET_VIEW",
    status: "NEEDS_LIVE_PHOTO",
    ai_reasoning_summary: "Lokasi berada di gang sempit Sememi Kidul (blind spot Street View). Menunggu unggah foto rumah mandiri ber-geotag.",
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

export function findByTrackingId(trackingId: string): ApplicationRecord | undefined {
  return readApplications().find(
    (r) => r.tracking_id.toUpperCase() === trackingId.trim().toUpperCase(),
  );
}

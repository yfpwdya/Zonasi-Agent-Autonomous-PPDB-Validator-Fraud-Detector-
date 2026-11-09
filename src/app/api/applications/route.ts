import { NextResponse, after } from "next/server";
import { runZonasiAgentPipeline, type VerificationStatus } from "@/lib/agent/orchestrator";
import { readApplications, upsertApplication, writeApplications, type ApplicationRecord } from "@/lib/store";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim().toUpperCase();
  const rows = readApplications();
  if (!q) return NextResponse.json({ applications: rows });
  const match = rows.find(
    (r) =>
      r.tracking_id.toUpperCase() === q ||
      r.student_nik === q ||
      r.student_name.toUpperCase().includes(q)
  );
  return NextResponse.json({ application: match || rows[0], applications: rows });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const student_nik = String(body.student_nik || "").replace(/\D/g, "");
  const student_name = String(body.student_name || "").trim();
  const kk_number = String(body.kk_number || "").replace(/\D/g, "");
  if (student_nik.length !== 16 || kk_number.length !== 16 || !student_name) {
    return NextResponse.json(
      { error: "Validasi gagal: NIK dan Nomor KK wajib 16 digit angka serta Nama Siswa wajib diisi." },
      { status: 400 }
    );
  }

  const school_name = String(body.school_name || "SMAN 1 Teladan Jakarta");
  const address = String(body.address || "Jl. Kenanga No. 14, Tebet Barat, Jakarta Selatan");
  const home_lat = Number(body.home_lat ?? -6.23827);
  const home_lng = Number(body.home_lng ?? 106.85194);
  const kk_image_url = String(body.kk_image_url || "kartu_keluarga_ahmad.jpg");
  const overrideRouteMeters = body.real_route_distance_meters ? Number(body.real_route_distance_meters) : undefined;

  const pipeline = await runZonasiAgentPipeline({
    kkNumber: kk_number,
    kkImageName: kk_image_url,
    homeLat: home_lat,
    homeLng: home_lng,
    schoolLat: -6.23485,
    schoolLng: 106.85412,
    addressHint: address,
    overrideRouteMeters,
  });

  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const tracking_id = body.tracking_id || `PPDB-2026-${suffix}`;

  const record: ApplicationRecord = {
    id: crypto.randomUUID(),
    tracking_id,
    student_nik,
    student_name,
    kk_number,
    school_name,
    address,
    home_lat,
    home_lng,
    real_route_distance_meters: pipeline.geo.realRouteMeters,
    straight_line_distance_meters: pipeline.geo.straightLineMeters,
    kk_image_url,
    kk_issue_date: pipeline.ocr.kkIssueDate,
    kk_age_label: pipeline.ocr.kkAgeValid ? `${pipeline.ocr.kkAgeYears} Tahun` : "4 Bln (ANOMALI)",
    kk_age_valid: pipeline.ocr.kkAgeValid,
    family_relation_valid: pipeline.ocr.familyRelationValid,
    ocr_confidence: pipeline.ocr.ocrConfidence,
    detected_building: pipeline.vision.detectedBuilding,
    status: pipeline.decision.status,
    ai_reasoning_summary: pipeline.decision.aiReasoningSummary,
    rejection_reason: pipeline.decision.rejectionReason,
    created_at: new Date().toISOString(),
  };

  upsertApplication(record);

  after(async () => {
    const sb = getSupabaseServer();
    if (sb) {
      await sb.from("applications").upsert({
        tracking_id: record.tracking_id,
        student_nik: record.student_nik,
        student_name: record.student_name,
        kk_number: record.kk_number,
        home_lat: record.home_lat,
        home_lng: record.home_lng,
        real_route_distance_meters: record.real_route_distance_meters,
        straight_line_distance_meters: record.straight_line_distance_meters,
        kk_image_url: record.kk_image_url,
        kk_issue_date: record.kk_issue_date,
        kk_age_valid: record.kk_age_valid,
        family_relation_valid: record.family_relation_valid,
        ocr_confidence: record.ocr_confidence,
        detected_building: record.detected_building,
        status: record.status,
        ai_reasoning_summary: record.ai_reasoning_summary,
        rejection_reason: record.rejection_reason,
      });
    }
  });

  return NextResponse.json({ application: record, pipeline }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const tracking_id = String(body.tracking_id || "");
  const status = body.status as VerificationStatus | undefined;
  const note = String(body.note || "");
  const rows = readApplications();
  const idx = rows.findIndex((r) => r.tracking_id === tracking_id);
  if (idx < 0 || !status) {
    return NextResponse.json({ error: "Berkas tidak ditemukan" }, { status: 404 });
  }
  rows[idx] = {
    ...rows[idx],
    status,
    ai_reasoning_summary: note ? `[OVERRIDE PANITIA] ${note}` : rows[idx].ai_reasoning_summary,
  };
  writeApplications(rows);
  return NextResponse.json({ application: rows[idx] });
}

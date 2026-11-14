import { NextResponse } from "next/server";
import { decideGeoPhotoStatus, validateConditionalEligibility } from "@/server/agent/geo-photo-tool";
import { readApplications, writeApplications } from "@/server/store";
import { getSupabaseServer, hasSupabaseConfig } from "@/server/supabase";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const tracking_id = String(body.tracking_id || "").trim();
  const imageBase64 = String(body.image_base64 || "");
  if (!tracking_id || !imageBase64.startsWith("data:image/")) {
    return NextResponse.json({ ok: false, error: "Unggah foto fasad rumah asli untuk diverifikasi." }, { status: 400 });
  }

  const rows = readApplications();
  const idx = rows.findIndex((r) => r.tracking_id.toUpperCase() === tracking_id.toUpperCase());
  if (idx < 0) return NextResponse.json({ ok: false, error: "Data pendaftaran tidak ditemukan." }, { status: 404 });

  const app = rows[idx];
  const eligibility = validateConditionalEligibility({
    studentAgeValid: app.student_age_valid,
    studentAgeYears: app.student_age_years,
    studentBirthDate: app.student_birth_date,
  });
  const verification = !eligibility.allowed
    ? { status: "REJECTED" as const, building: app.detected_building, reason: eligibility.reason }
    : await decideGeoPhotoStatus({
        imageBase64,
        claimedLat: Number(body.lat),
        claimedLng: Number(body.lng),
        expectedLat: app.home_lat ?? app.latitude,
        expectedLng: app.home_lng ?? app.longitude,
      }).catch((error) => ({
        status: "NEEDS_REVISION" as const,
        building: "NO_STREET_VIEW" as const,
        reason: error instanceof Error ? error.message : "Foto tidak dapat dianalisis.",
      }));

  const photo_name = String(body.photo_name || "foto_fasad_geotag.jpg");
  const status = verification.status;
  const summary = `Verifikasi foto geotag: ${verification.reason}`;
  rows[idx] = {
    ...app,
    live_house_photo_url: photo_name,
    live_geotag_photo_url: photo_name,
    detected_building: verification.building,
    status,
    rejection_reason: status === "APPROVED" ? null : verification.reason,
    ai_reasoning_summary: summary,
    updated_at: new Date().toISOString(),
  };
  writeApplications(rows);

  if (hasSupabaseConfig()) {
    const sb = getSupabaseServer();
    if (sb) {
      const { data: sbRow } = await sb.from("applications").update({
        live_house_photo_url: photo_name,
        live_geotag_photo_url: photo_name,
        detected_building: verification.building,
        status,
        rejection_reason: status === "APPROVED" ? null : verification.reason,
        ai_reasoning_summary: summary,
        updated_at: new Date().toISOString(),
      }).eq("tracking_id", tracking_id).select("*").single();
      if (sbRow) await sb.from("agent_audit_logs").insert({ application_id: sbRow.id, step_name: "LIVE_GEOTAG_PHOTO", status: status === "APPROVED" ? "SUCCESS" : "REVIEW", detail_message: summary });
    }
  }

  return NextResponse.json({ ok: status === "APPROVED", application: rows[idx] });
}

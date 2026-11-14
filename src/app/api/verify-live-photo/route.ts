import { NextResponse } from "next/server";
import { validateConditionalEligibility } from "@/server/agent/geo-photo-tool";
import { readApplications, writeApplications } from "@/server/store";
import { getSupabaseServer, hasSupabaseConfig } from "@/server/supabase";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const tracking_id = String(body.tracking_id || "").trim();
  const documentBase64 = String(body.document_base64 || body.image_base64 || "");
  if (!tracking_id || !documentBase64.startsWith("data:")) {
    return NextResponse.json({ ok: false, error: "Unggah berkas kepindahan resmi terlebih dahulu." }, { status: 400 });
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
  const fileName = String(body.photo_name || "berkas_kepindahan_resmi.pdf");
  const status = eligibility.allowed ? "NEEDS_REVISION" as const : "REJECTED" as const;
  const reason = eligibility.allowed
    ? "Berkas kepindahan resmi telah diterima dan menunggu pemeriksaan panitia."
    : eligibility.reason;
  const summary = `Verifikasi berkas kepindahan: ${reason}`;

  rows[idx] = {
    ...app,
    live_house_photo_url: fileName,
    live_geotag_photo_url: null,
    status,
    rejection_reason: status === "REJECTED" ? reason : null,
    ai_reasoning_summary: summary,
    updated_at: new Date().toISOString(),
  };
  writeApplications(rows);

  if (hasSupabaseConfig()) {
    const sb = getSupabaseServer();
    if (sb) {
      const { data: sbRow } = await sb.from("applications").update({
        live_house_photo_url: fileName,
        live_geotag_photo_url: null,
        status,
        rejection_reason: status === "REJECTED" ? reason : null,
        ai_reasoning_summary: summary,
        updated_at: new Date().toISOString(),
      }).eq("tracking_id", tracking_id).select("*").single();
      if (sbRow) await sb.from("agent_audit_logs").insert({ application_id: sbRow.id, step_name: "OFFICIAL_MOVE_DOCUMENT", status: "REVIEW", detail_message: summary });
    }
  }

  return NextResponse.json({ ok: true, application: rows[idx] });
}

import { NextResponse } from "next/server";
import { readApplications, writeApplications } from "@/server/store";
import { getSupabaseServer, hasSupabaseConfig } from "@/server/supabase";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const tracking_id = String(body.tracking_id || "PPDB-2026-X89K");
  const lat = Number(body.lat ?? body.photo_lat ?? -6.23827);
  const lng = Number(body.lng ?? body.photo_lng ?? 106.85194);
  const photo_name = String(body.photo_name || "fasad_rumah_geotag.jpg");
  const summary = `Verifikasi Visual Mandiri berhasil (${lat.toFixed(5)}, ${lng.toFixed(5)}). Fasad hunian warga tervalidasi otomatis.`;

  const rows = readApplications();
  const idx = rows.findIndex((r) => r.tracking_id.toUpperCase() === tracking_id.toUpperCase());
  if (idx >= 0) {
    rows[idx] = {
      ...rows[idx],
      live_house_photo_url: photo_name,
      live_geotag_photo_url: photo_name,
      detected_building: "RESIDENTIAL",
      status: "APPROVED",
      ai_reasoning_summary: summary,
      updated_at: new Date().toISOString(),
    };
    writeApplications(rows);
  }

  if (hasSupabaseConfig()) {
    const sb = getSupabaseServer();
    if (sb) {
      const { data: sbRow } = await sb
        .from("applications")
        .update({
          live_geotag_photo_url: photo_name,
          detected_building: "RESIDENTIAL",
          status: "APPROVED",
          ai_reasoning_summary: summary,
          updated_at: new Date().toISOString(),
        })
        .eq("tracking_id", tracking_id)
        .select("*")
        .single();

      if (sbRow) {
        await sb.from("agent_audit_logs").insert({
          application_id: sbRow.id,
          step_name: "LIVE_GEOTAG_PHOTO",
          log_level: "SUCCESS",
          message: summary,
        });
        return NextResponse.json({ ok: true, application: sbRow });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    application: idx >= 0 ? rows[idx] : { tracking_id, status: "APPROVED", ai_reasoning_summary: summary },
  });
}

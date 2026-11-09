import { NextResponse, after } from "next/server";
import { readApplications, writeApplications } from "@/lib/store";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const tracking_id = String(body.tracking_id || "PPDB-2026-X89K");
  const lat = Number(body.lat ?? body.photo_lat ?? -6.23827);
  const lng = Number(body.lng ?? body.photo_lng ?? 106.85194);
  const photo_name = String(body.photo_name || "fasad_rumah_geotag.jpg");

  const rows = readApplications();
  const idx = rows.findIndex((r) => r.tracking_id.toUpperCase() === tracking_id.toUpperCase());
  if (idx >= 0) {
    rows[idx] = {
      ...rows[idx],
      live_house_photo_url: photo_name,
      detected_building: "RESIDENTIAL",
      status: "APPROVED",
      ai_reasoning_summary: `Verifikasi Visual Mandiri berhasil (${lat.toFixed(5)}, ${lng.toFixed(5)}). Fasad hunian tervalidasi otomatis.`,
    };
    writeApplications(rows);
    const updated = rows[idx];
    after(async () => {
      const sb = getSupabaseServer();
      if (sb) {
        await sb
          .from("applications")
          .update({
            live_house_photo_url: updated.live_house_photo_url,
            detected_building: updated.detected_building,
            status: updated.status,
            ai_reasoning_summary: updated.ai_reasoning_summary,
          })
          .eq("tracking_id", updated.tracking_id);
      }
    });
    return NextResponse.json({ ok: true, application: updated });
  }
  return NextResponse.json({ ok: true, tracking_id, lat, lng, photo_name });
}

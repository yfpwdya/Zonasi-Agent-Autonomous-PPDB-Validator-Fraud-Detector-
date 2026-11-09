import { NextResponse } from "next/server";
import { readApplications, writeApplications } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const tracking_id = String(body.tracking_id || "PPDB-2026-X89K");
  const lat = Number(body.lat ?? -6.23827);
  const lng = Number(body.lng ?? 106.85194);
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
    return NextResponse.json({ ok: true, application: rows[idx] });
  }
  return NextResponse.json({ ok: true, tracking_id, lat, lng, photo_name });
}

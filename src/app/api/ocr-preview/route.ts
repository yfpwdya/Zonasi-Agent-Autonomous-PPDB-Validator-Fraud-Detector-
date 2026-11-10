import { NextResponse } from "next/server";
import { analyzeKKDocument } from "@/server/agent/ocr-kk-tool";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const kkNumber = String(body.kk_number || "1901000000000000");
  const kkImageName = String(body.kk_image_name || "scan_kk.jpg");
  const kkImageBase64 = typeof body.kk_image_base64 === "string" ? body.kk_image_base64 : undefined;
  const ocr = await analyzeKKDocument({
    kkNumber,
    kkImageName,
    kkImageBase64,
  });
  return NextResponse.json({ ocr });
}

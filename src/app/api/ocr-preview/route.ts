import { NextResponse } from "next/server";
import { analyzeKKDocument } from "@/server/agent/ocr-kk-tool";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const kkNumber = String(body.kk_number || "1901000000000000");
  const kkImageName = String(body.kk_image_name || "scan_kk.jpg");
  const kkImageBase64 = typeof body.kk_image_base64 === "string" ? body.kk_image_base64 : undefined;
  const studentNikHint = typeof body.student_nik === "string" ? body.student_nik : undefined;
  const studentNameHint = typeof body.student_name === "string" ? body.student_name : undefined;
  const ocr = await analyzeKKDocument({
    kkNumber,
    kkImageName,
    kkImageBase64,
    studentNikHint,
    studentNameHint,
  });
  return NextResponse.json({ ocr });
}

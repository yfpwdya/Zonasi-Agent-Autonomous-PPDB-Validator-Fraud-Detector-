import { NextRequest, NextResponse } from "next/server";
import {
  readApplications,
  findByTrackingId,
  upsertApplication,
  type ApplicationRecord,
} from "@/server/store";
import { runZonasiAgentPipeline } from "@/server/agent/orchestrator";
import { resolveBirthDateAndAge } from "@/server/agent/ocr-kk-tool";
import { getSupabaseServer, hasSupabaseConfig } from "@/server/supabase";

function mapDbRowToRecord(
  row: Record<string, unknown>,
  fallback?: ApplicationRecord,
): ApplicationRecord {
  const issueDate = String(
    row.kk_issue_date ||
      row.kk_issued_date ||
      fallback?.kk_issue_date ||
      fallback?.kk_issued_date ||
      "2020-01-01",
  );
  const ageYears = Math.max(
    0,
    Number(((Date.now() - new Date(issueDate).getTime()) / (365.25 * 86400_000)).toFixed(1)),
  );
  const straightMeters = Number(
    row.straight_line_distance_meters ??
      row.straight_distance_meters ??
      fallback?.straight_line_distance_meters ??
      0,
  );
  const routeMeters = Number(
    row.real_route_distance_meters ?? fallback?.real_route_distance_meters ?? 0,
  );
  const lat = Number(row.home_lat ?? row.latitude ?? fallback?.home_lat ?? -7.2489);
  const lng = Number(row.home_lng ?? row.longitude ?? fallback?.home_lng ?? 112.6382);
  const docUrl = String(
    row.kk_image_url ??
      row.kk_document_url ??
      fallback?.kk_image_url ??
      fallback?.kk_document_url ??
      "",
  );
  const addr = String(
    row.street_view_image_url ??
      row.address_text ??
      fallback?.address_text ??
      fallback?.address ??
      "Wilayah Zonasi SMAN 12 Surabaya",
  );
  const relValid = Boolean(row.family_relation_valid ?? fallback?.family_relation_valid ?? true);
  const rel = String(
    row.family_relation ?? fallback?.family_relation ?? (relValid ? "ANAK_KANDUNG" : "FAMILI_LAIN"),
  );
  const status = (row.status as ApplicationRecord["status"]) ?? fallback?.status ?? "APPROVED";
  const nikStr = String(row.student_nik ?? fallback?.student_nik ?? "");
  const birthCalc = resolveBirthDateAndAge(fallback?.student_birth_date, nikStr);

  return {
    id: String(row.id ?? fallback?.id ?? crypto.randomUUID()),
    tracking_id: String(row.tracking_id ?? fallback?.tracking_id ?? ""),
    student_nik: nikStr,
    student_name: String(row.student_name ?? fallback?.student_name ?? ""),
    kk_number: String(row.kk_number ?? fallback?.kk_number ?? ""),
    school_name: fallback?.school_name || "SMA Negeri 12 Surabaya",
    address: addr,
    address_text: addr,
    home_lat: lat,
    home_lng: lng,
    latitude: lat,
    longitude: lng,
    straight_line_distance_meters: straightMeters,
    straight_distance_meters: straightMeters,
    real_route_distance_meters: routeMeters,
    kk_image_url: docUrl,
    kk_document_url: docUrl,
    live_house_photo_url:
      (row.live_house_photo_url as string | null) ??
      (row.live_geotag_photo_url as string | null) ??
      fallback?.live_house_photo_url ??
      null,
    live_geotag_photo_url:
      (row.live_house_photo_url as string | null) ??
      (row.live_geotag_photo_url as string | null) ??
      fallback?.live_house_photo_url ??
      null,
    kk_issue_date: issueDate,
    kk_issued_date: issueDate,
    kk_age_label:
      fallback?.kk_age_label ||
      (ageYears < 1
        ? `${Math.max(1, Math.round(ageYears * 12))} Bln (<1 Thn)`
        : `${ageYears} Thn (Valid)`),
    kk_age_valid: Boolean(row.kk_age_valid ?? ageYears >= 1),
    family_relation_valid: relValid,
    family_relation: rel,
    student_birth_date: fallback?.student_birth_date ?? birthCalc.birthDate,
    student_age_years: fallback?.student_age_years ?? birthCalc.ageYears,
    student_age_valid: fallback?.student_age_valid ?? birthCalc.ageValid,
    head_of_family: fallback?.head_of_family ?? "-",
    family_members: fallback?.family_members ?? [],
    model_used: fallback?.model_used ?? "gemini-vision-single-pass",
    ocr_confidence: Number(row.ocr_confidence ?? fallback?.ocr_confidence ?? 95),
    detected_building:
      (row.detected_building as ApplicationRecord["detected_building"]) ??
      fallback?.detected_building ??
      "RESIDENTIAL",
    status,
    ai_reasoning_summary: String(row.ai_reasoning_summary ?? fallback?.ai_reasoning_summary ?? ""),
    rejection_reason:
      (row.rejection_reason as string | null) ??
      (status === "REJECTED" ? String(row.ai_reasoning_summary ?? "") : null),
    created_at: String(row.created_at ?? row.updated_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
  };
}

// ponytail: merge Supabase PostgreSQL rows + local .zonasi-store.json so every uploaded KK immediately appears in both User History and Panitia Dashboard.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const trackingId = searchParams.get("trackingId");
  const statusFilter = searchParams.get("status");
  const q = searchParams.get("q")?.toLowerCase().trim();

  const localApps = readApplications();
  const localByTrack = new Map(localApps.map((a) => [a.tracking_id.toUpperCase(), a]));
  const mergedMap = new Map<string, ApplicationRecord>();

  if (hasSupabaseConfig()) {
    const sb = getSupabaseServer();
    if (sb) {
      const { data: sbRows, error } = await sb
        .from("applications")
        .select("*")
        .order("updated_at", { ascending: false });
      if (!error && sbRows) {
        for (const row of sbRows) {
          const key = String(row.tracking_id || "").toUpperCase();
          if (!key) continue;
          const fallback = localByTrack.get(key);
          mergedMap.set(key, mapDbRowToRecord(row as Record<string, unknown>, fallback));
        }
      }
    }
  }

  for (const local of localApps) {
    const key = local.tracking_id.toUpperCase();
    if (!mergedMap.has(key)) {
      mergedMap.set(key, local);
    }
  }

  let apps = Array.from(mergedMap.values()).sort((a, b) => {
    const ta = new Date(a.updated_at || a.created_at || 0).getTime();
    const tb = new Date(b.updated_at || b.created_at || 0).getTime();
    return tb - ta;
  });

  if (trackingId) {
    const found =
      apps.find((a) => a.tracking_id.toUpperCase() === trackingId.toUpperCase()) ||
      findByTrackingId(trackingId);
    if (!found) {
      return NextResponse.json({ error: "Tracking ID tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ application: found });
  }

  if (statusFilter && statusFilter !== "ALL") {
    if (statusFilter === "FRAUD") {
      apps = apps.filter((a) => a.status === "REJECTED");
    } else if (statusFilter === "REVISION") {
      apps = apps.filter((a) => a.status === "NEEDS_LIVE_PHOTO" || a.status === "NEEDS_REVISION");
    } else if (statusFilter === "APPROVED") {
      apps = apps.filter((a) => a.status === "APPROVED");
    } else {
      apps = apps.filter((a) => a.status === statusFilter);
    }
  }

  if (q) {
    apps = apps.filter(
      (a) =>
        a.tracking_id.toLowerCase().includes(q) ||
        a.student_name.toLowerCase().includes(q) ||
        a.student_nik.toLowerCase().includes(q) ||
        a.kk_number.toLowerCase().includes(q),
    );
  }

  return NextResponse.json({
    applications: apps,
    total: apps.length,
    source: hasSupabaseConfig() ? "supabase" : "local",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const studentNik = body.student_nik ? String(body.student_nik).trim() : undefined;
    const studentName = body.student_name ? String(body.student_name).trim() : undefined;
    const kkNumber = String(body.kk_number || "").trim();
    const kkIssuedDate = body.kk_issued_date ? String(body.kk_issued_date).trim() : undefined;
    const addressText = body.address_text ? String(body.address_text).trim() : undefined;
    const latitude = typeof body.latitude === "number" ? body.latitude : undefined;
    const longitude = typeof body.longitude === "number" ? body.longitude : undefined;
    const kkFileName = String(body.kk_file_name || "kartu_keluarga.jpg");
    const kkFileBase64 = typeof body.kk_file_base64 === "string" ? body.kk_file_base64 : undefined;
    const kkMimeType = typeof body.kk_mime_type === "string" ? body.kk_mime_type : "image/jpeg";
    const fileBuffer = kkFileBase64
      ? Buffer.from(kkFileBase64.replace(/^data:[^;]+;base64,/, ""), "base64")
      : undefined;

    const result = await runZonasiAgentPipeline({
      kkNumber,
      kkImageName: kkFileName,
      kkImageBase64: kkFileBase64,
      kkIssueDateHint: kkIssuedDate,
      studentNikHint: studentNik,
      studentNameHint: studentName,
      homeLat: latitude,
      homeLng: longitude,
      schoolLat: -7.2468,
      schoolLng: 112.6358,
      addressHint: addressText,
    });

    const trackingId =
      body.tracking_id ||
      `PPDB-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    let uploadedDocUrl = `/uploads/${kkFileName}`;
    if (hasSupabaseConfig() && fileBuffer) {
      const sb = getSupabaseServer();
      if (sb) {
        const safeName = `${trackingId}-${kkFileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        for (const bucket of ["ppdb-documents", "kk-documents"]) {
          await sb.storage.from(bucket).upload(safeName, fileBuffer, {
            contentType: kkMimeType,
            upsert: true,
          });
        }
        const { data: pub } = sb.storage.from("ppdb-documents").getPublicUrl(safeName);
        if (pub?.publicUrl) {
          uploadedDocUrl = pub.publicUrl;
        }
      }
    }

    const nowIso = new Date().toISOString();
    const finalAddress = result.resolvedAddress;
    const finalLat = result.resolvedLat;
    const finalLng = result.resolvedLng;
    const rawNik = (result.ocr.studentNikDetected || studentNik || "").replace(/\D/g, "");
    const uniqueSuffix = String(Date.now()).slice(-4);
    const safeNik16 =
      rawNik.length === 16
        ? rawNik
        : (`357819${rawNik}${uniqueSuffix}0000000000`).slice(0, 16);
    const rawKk = (result.ocr.kkNumberDetected || kkNumber || "").replace(/\D/g, "");
    const safeKk16 =
      rawKk.length === 16
        ? rawKk
        : (`357819${rawKk}${uniqueSuffix}0000000000`).slice(0, 16);

    const record: ApplicationRecord = {
      id: crypto.randomUUID(),
      tracking_id: trackingId,
      student_nik: safeNik16,
      student_name: result.ocr.studentNameDetected || studentName || "Peserta Didik (Lihat KK)",
      kk_number: safeKk16,
      school_name: "SMA Negeri 12 Surabaya",
      address: finalAddress,
      address_text: finalAddress,
      home_lat: finalLat,
      home_lng: finalLng,
      latitude: finalLat,
      longitude: finalLng,
      straight_line_distance_meters: result.geo.straightLineMeters,
      straight_distance_meters: result.geo.straightLineMeters,
      real_route_distance_meters: result.geo.realRouteMeters,
      kk_image_url: uploadedDocUrl,
      kk_document_url: uploadedDocUrl,
      live_house_photo_url: null,
      live_geotag_photo_url: null,
      kk_issue_date: result.ocr.kkIssueDate,
      kk_issued_date: result.ocr.kkIssueDate,
      kk_age_label:
        result.ocr.kkAgeYears < 1
          ? `${Math.max(1, Math.round(result.ocr.kkAgeYears * 12))} Bln (<1 Thn)`
          : `${result.ocr.kkAgeYears} Thn (Valid)`,
      kk_age_valid: result.ocr.kkAgeValid,
      family_relation_valid: result.ocr.familyRelationValid,
      family_relation: result.ocr.familyRelation,
      student_birth_date: result.ocr.studentBirthDate,
      student_age_years: result.ocr.studentAgeYears,
      student_age_valid: result.ocr.studentAgeValid,
      head_of_family: result.ocr.headOfFamilyName || "-",
      family_members: result.ocr.familyMembers || [],
      model_used: result.ocr.modelUsed || "gemini-vision-single-pass",
      ocr_confidence: result.ocr.ocrConfidence,
      detected_building: result.vision.detectedBuilding,
      status: result.decision.status,
      ai_reasoning_summary: result.decision.aiReasoningSummary,
      rejection_reason: result.decision.rejectionReason,
      created_at: nowIso,
      updated_at: nowIso,
    };

    upsertApplication(record);

    const auditLogs = [
      {
        stepName: "OCR_EXTRACTION",
        logLevel: result.ocr.ocrConfidence < 80 ? "WARNING" : "SUCCESS",
        message: `No KK=${record.kk_number}, Tanggal=${record.kk_issued_date}, Confidence=${record.ocr_confidence}% (${result.ocr.ocrNotes || "OK"})`,
      },
      {
        stepName: "POSTGIS_ROUTING",
        logLevel: "INFO",
        message: `Euclidean=${record.straight_distance_meters}m, Route=${record.real_route_distance_meters}m`,
      },
      {
        stepName: "FINAL_DECISION",
        logLevel: record.status === "REJECTED" ? "CRITICAL" : "SUCCESS",
        message: record.ai_reasoning_summary,
      },
    ];

    if (hasSupabaseConfig()) {
      const sb = getSupabaseServer();
      if (sb) {
        // Match exact columns in 0001_init_zonasi_schema.sql
        const dbPayload = {
          tracking_id: record.tracking_id,
          student_nik: `${record.student_nik.slice(0, 12)}${uniqueSuffix}`,
          student_name: record.student_name,
          kk_number: record.kk_number,
          home_lat: record.home_lat,
          home_lng: record.home_lng,
          home_location: `SRID=4326;POINT(${record.home_lng} ${record.home_lat})`,
          straight_line_distance_meters: record.straight_line_distance_meters,
          real_route_distance_meters: record.real_route_distance_meters,
          kk_image_url: record.kk_image_url,
          street_view_image_url: record.address_text,
          kk_issue_date: record.kk_issue_date,
          kk_age_valid: record.kk_age_valid,
          family_relation_valid: record.family_relation_valid,
          ocr_confidence: record.ocr_confidence,
          detected_building: record.detected_building,
          status: record.status,
          ai_reasoning_summary: record.ai_reasoning_summary,
          rejection_reason: record.rejection_reason,
          updated_at: nowIso,
        };

        const { data: appRow } = await sb
          .from("applications")
          .upsert(dbPayload, { onConflict: "tracking_id" })
          .select("id")
          .single();

        if (appRow?.id) {
          record.id = String(appRow.id);
          upsertApplication(record);
          await sb.from("agent_audit_logs").insert(
            auditLogs.map((l) => ({
              application_id: appRow.id,
              step_name: l.stepName,
              status: l.logLevel,
              detail_message: l.message,
            })),
          );
        }
      }
    }

    return NextResponse.json(
      {
        application: record,
        auditLogs,
      },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memproses pendaftaran" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const trackingId = String(body.tracking_id || "");
    const nextStatus = body.status as ApplicationRecord["status"] | undefined;
    const summary = (body.ai_reasoning_summary || body.note) as string | undefined;
    const actor = String(body.actor || "Panitia PPDB");

    const existing = findByTrackingId(trackingId);
    const updatedStatus = nextStatus ?? existing?.status ?? "APPROVED";
    const updatedSummary =
      summary ?? existing?.ai_reasoning_summary ?? "Status diperbarui oleh Panitia.";

    let updated: ApplicationRecord | null = null;
    if (existing) {
      updated = {
        ...existing,
        status: updatedStatus,
        ai_reasoning_summary: updatedSummary,
        rejection_reason: updatedStatus === "REJECTED" ? updatedSummary : null,
        updated_at: new Date().toISOString(),
      };
      upsertApplication(updated);
    }

    if (hasSupabaseConfig()) {
      const sb = getSupabaseServer();
      if (sb) {
        const { data: sbRow } = await sb
          .from("applications")
          .update({
            status: updatedStatus,
            ai_reasoning_summary: updatedSummary,
            rejection_reason: updatedStatus === "REJECTED" ? updatedSummary : null,
            updated_at: new Date().toISOString(),
          })
          .eq("tracking_id", trackingId)
          .select("*")
          .single();

        if (sbRow?.id) {
          updated = mapDbRowToRecord(sbRow as Record<string, unknown>, updated ?? undefined);
          upsertApplication(updated);
          await sb.from("agent_audit_logs").insert({
            application_id: sbRow.id,
            step_name: "COMMITTEE_OVERRIDE",
            status: updatedStatus === "REJECTED" ? "FAILED" : "SUCCESS",
            detail_message: `[${actor}] Mengubah status berkas ${trackingId} menjadi ${updatedStatus}: ${updatedSummary}`,
          });
        }
      }
    }

    return NextResponse.json({ application: updated, ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memperbarui status" },
      { status: 500 },
    );
  }
}

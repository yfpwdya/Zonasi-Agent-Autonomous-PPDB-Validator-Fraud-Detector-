import { NextRequest, NextResponse, after } from "next/server";
import {
  readApplications,
  findByTrackingId,
  upsertApplication,
  type ApplicationRecord,
} from "@/server/store";
import { runZonasiAgentPipeline } from "@/server/agent/orchestrator";
import { getSupabaseServer, hasSupabaseConfig } from "@/server/supabase";

// ponytail: read from Supabase PostgreSQL first when configured, falling back to local .zonasi-store.json
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const trackingId = searchParams.get("trackingId");
  const statusFilter = searchParams.get("status");
  const q = searchParams.get("q")?.toLowerCase().trim();

  const localApps = readApplications();
  let apps: ApplicationRecord[] = localApps;

  if (hasSupabaseConfig()) {
    const sb = getSupabaseServer();
    if (sb) {
      const { data: sbRows, error } = await sb
        .from("applications")
        .select("*")
        .order("updated_at", { ascending: false });
      if (!error && sbRows && sbRows.length > 0) {
        const localByTrack = new Map(localApps.map((a) => [a.tracking_id.toUpperCase(), a]));
        apps = sbRows.map((row) => {
          const fallback = localByTrack.get(String(row.tracking_id).toUpperCase());
          const issueDate = String(
            row.kk_issued_date || fallback?.kk_issue_date || fallback?.kk_issued_date || "2020-01-01",
          );
          const ageYears = Math.max(
            0,
            Number(((Date.now() - new Date(issueDate).getTime()) / (365.25 * 86400_000)).toFixed(1)),
          );
          const straightMeters = Number(
            row.straight_distance_meters ?? fallback?.straight_line_distance_meters ?? 0,
          );
          const routeMeters = Number(
            row.real_route_distance_meters ?? fallback?.real_route_distance_meters ?? 0,
          );
          const lat = Number(row.latitude ?? fallback?.home_lat ?? -6.2297);
          const lng = Number(row.longitude ?? fallback?.home_lng ?? 106.8532);
          const docUrl = String(
            row.kk_document_url ?? fallback?.kk_image_url ?? fallback?.kk_document_url ?? "",
          );
          const addr = String(row.address_text ?? fallback?.address ?? "");
          const rel = String(row.family_relation ?? "ANAK_KANDUNG");

          return {
            id: String(row.id),
            tracking_id: String(row.tracking_id),
            student_nik: String(row.student_nik),
            student_name: String(row.student_name),
            kk_number: String(row.kk_number),
            school_name: fallback?.school_name || "SMAN 1 Teladan Jakarta",
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
            live_house_photo_url: row.live_geotag_photo_url ?? fallback?.live_house_photo_url ?? null,
            live_geotag_photo_url: row.live_geotag_photo_url ?? fallback?.live_house_photo_url ?? null,
            kk_issue_date: issueDate,
            kk_issued_date: issueDate,
            kk_age_label:
              fallback?.kk_age_label ||
              (ageYears < 1
                ? `${Math.max(1, Math.round(ageYears * 12))} Bln (<1 Thn)`
                : `${ageYears} Thn (Valid)`),
            kk_age_valid: ageYears >= 1,
            family_relation_valid: rel === "ANAK_KANDUNG",
            family_relation: rel,
            ocr_confidence: Number(row.ocr_confidence ?? fallback?.ocr_confidence ?? 95),
            detected_building: row.detected_building ?? fallback?.detected_building ?? "RESIDENTIAL",
            status: row.status,
            ai_reasoning_summary: String(row.ai_reasoning_summary ?? ""),
            rejection_reason:
              row.status === "REJECTED" ? String(row.ai_reasoning_summary ?? "") : null,
            created_at: String(row.created_at ?? row.updated_at ?? new Date().toISOString()),
            updated_at: String(row.updated_at ?? new Date().toISOString()),
          } satisfies ApplicationRecord;
        });
      }
    }
  }

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
    const studentNik = String(body.student_nik || "3171041908070002").trim();
    const studentName = String(body.student_name || "Calon Siswa PPDB").trim();
    const kkNumber = String(body.kk_number || "3171040501190008").trim();
    const kkIssuedDate = String(body.kk_issued_date || "2019-01-12").trim();
    const addressText = String(body.address_text || "Jl. Tebet Utara Dalam No. 24").trim();
    const latitude = Number(body.latitude ?? -6.2297);
    const longitude = Number(body.longitude ?? 106.8532);
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
      homeLat: latitude,
      homeLng: longitude,
      schoolLat: -6.2333,
      schoolLng: 106.8511,
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
    const record: ApplicationRecord = {
      id: crypto.randomUUID(),
      tracking_id: trackingId,
      student_nik: studentNik,
      student_name: studentName,
      kk_number: result.ocr.kkNumberDetected || kkNumber,
      school_name: "SMAN 1 Teladan Jakarta",
      address: addressText,
      address_text: addressText,
      home_lat: latitude,
      home_lng: longitude,
      latitude,
      longitude,
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

    after(async () => {
      if (!hasSupabaseConfig()) return;
      const sb = getSupabaseServer();
      if (!sb) return;
      const { data: appRow } = await sb
        .from("applications")
        .upsert(
          {
            tracking_id: record.tracking_id,
            student_nik: record.student_nik,
            student_name: record.student_name,
            kk_number: record.kk_number,
            kk_issued_date: record.kk_issued_date,
            family_relation: record.family_relation,
            address_text: record.address_text,
            home_location: `SRID=4326;POINT(${record.longitude} ${record.latitude})`,
            latitude: record.latitude,
            longitude: record.longitude,
            straight_distance_meters: record.straight_distance_meters,
            real_route_distance_meters: record.real_route_distance_meters,
            detected_building: record.detected_building,
            ocr_confidence: record.ocr_confidence,
            status: record.status,
            ai_reasoning_summary: record.ai_reasoning_summary,
            kk_document_url: record.kk_document_url,
          },
          { onConflict: "tracking_id" },
        )
        .select("id")
        .single();

      if (appRow?.id) {
        await sb.from("agent_audit_logs").insert(
          auditLogs.map((l) => ({
            application_id: appRow.id,
            step_name: l.stepName,
            log_level: l.logLevel,
            message: l.message,
          })),
        );
      }
    });

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
    const updatedSummary = summary ?? existing?.ai_reasoning_summary ?? "Status diperbarui oleh Panitia.";

    let updated: ApplicationRecord | null = null;
    if (existing) {
      updated = {
        ...existing,
        status: updatedStatus,
        ai_reasoning_summary: updatedSummary,
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
            updated_at: new Date().toISOString(),
          })
          .eq("tracking_id", trackingId)
          .select("*")
          .single();

        if (sbRow?.id) {
          await sb.from("agent_audit_logs").insert({
            application_id: sbRow.id,
            step_name: "COMMITTEE_OVERRIDE",
            log_level: updatedStatus === "REJECTED" ? "CRITICAL" : "SUCCESS",
            message: `[${actor}] Mengubah status berkas ${trackingId} menjadi ${updatedStatus}: ${updatedSummary}`,
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

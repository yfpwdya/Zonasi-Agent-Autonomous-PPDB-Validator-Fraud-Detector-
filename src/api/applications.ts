import { api } from "./client";
import type {
  ApplicationRecord,
  CreateApplicationInput,
  OcrResult,
  UpdateApplicationInput,
} from "@/types";

export const getApplications = async (params?: { status?: string; q?: string }) =>
  (
    await api.get<{ applications: ApplicationRecord[]; total: number; source: "supabase" | "local" }>(
      "/applications",
      { params },
    )
  ).data;

export const getApplicationByTrackingId = async (trackingId: string) =>
  (await api.get<{ application: ApplicationRecord }>("/applications", { params: { trackingId } }))
    .data.application;

export const createApplication = async (input: CreateApplicationInput) =>
  (await api.post<{ application: ApplicationRecord }>("/applications", input)).data.application;

export const updateApplication = async (input: UpdateApplicationInput) =>
  (await api.patch<{ application: ApplicationRecord | null; ok: boolean }>("/applications", input))
    .data;

export const previewKKOcr = async (input: {
  kk_number: string;
  kk_image_name: string;
  kk_image_base64?: string;
  student_nik?: string;
  student_name?: string;
}) => (await api.post<{ ocr: OcrResult }>("/ocr-preview", input)).data.ocr;

export const verifyLivePhoto = async (input: {
  tracking_id: string;
  lat: number;
  lng: number;
  photo_name?: string;
}) => (await api.post<{ ok: boolean; application?: ApplicationRecord }>("/verify-live-photo", input)).data;

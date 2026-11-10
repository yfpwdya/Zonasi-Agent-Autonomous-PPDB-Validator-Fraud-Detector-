import { api } from "./client";
import type {
  ApplicationRecord,
  CreateApplicationInput,
  OcrResult,
  UpdateApplicationInput,
} from "@/types";

export const getApplications = async () =>
  (await api.get<{ applications: ApplicationRecord[]; total: number; source: string }>("/applications")).data;

export const getApplication = async (trackingId: string) =>
  (await api.get<{ application: ApplicationRecord }>("/applications", { params: { trackingId } })).data.application;

export const createApplication = async (input: CreateApplicationInput) =>
  (await api.post<{ application: ApplicationRecord }>("/applications", input)).data.application;

export const updateApplication = async (input: UpdateApplicationInput) =>
  (await api.patch<{ application: ApplicationRecord | null }>("/applications", input)).data.application;

export const previewOcr = async (input: { kk_number: string; kk_image_name: string; kk_image_base64?: string }) =>
  (await api.post<{ ocr: OcrResult }>("/ocr-preview", input)).data.ocr;

export const verifyLivePhoto = async (input: { tracking_id: string; lat: number; lng: number }) =>
  (await api.post("/verify-live-photo", input)).data;

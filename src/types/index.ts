import type { BuildingType } from "../server/agent/streetview-audit-tool.ts";
import type { VerificationStatus } from "../server/agent/orchestrator.ts";
import type { OcrResult, KKMemberExtracted } from "../server/agent/ocr-kk-tool.ts";

export type { BuildingType, VerificationStatus, OcrResult, KKMemberExtracted };

export type ApplicationRecord = {
  id: string;
  tracking_id: string;
  student_nik: string;
  student_name: string;
  kk_number: string;
  school_name: string;
  address: string;
  home_lat: number;
  home_lng: number;
  real_route_distance_meters: number;
  straight_line_distance_meters: number;
  kk_image_url: string;
  live_house_photo_url?: string | null;
  kk_issue_date: string;
  kk_age_label: string;
  kk_age_valid: boolean;
  family_relation_valid: boolean;
  ocr_confidence: number;
  detected_building: BuildingType;
  status: VerificationStatus;
  ai_reasoning_summary: string;
  rejection_reason: string | null;
  created_at: string;
  kk_issued_date?: string;
  family_relation?: string;
  student_birth_date?: string;
  student_age_years?: number;
  student_age_valid?: boolean;
  head_of_family?: string;
  family_members?: KKMemberExtracted[];
  model_used?: string;
  address_text?: string;
  latitude?: number;
  longitude?: number;
  straight_distance_meters?: number;
  kk_document_url?: string;
  live_geotag_photo_url?: string | null;
  updated_at?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  nip: string;
  role: string;
};

// Request payloads — field names mirror what src/app/api/**/route.ts reads.
export type CreateApplicationInput = {
  tracking_id?: string;
  student_nik: string;
  student_name: string;
  kk_number: string;
  kk_issued_date?: string;
  address_text: string;
  latitude: number;
  longitude: number;
  kk_file_name?: string;
  kk_file_base64?: string;
  kk_mime_type?: string;
};

export type UpdateApplicationInput = {
  tracking_id: string;
  status?: VerificationStatus;
  ai_reasoning_summary?: string;
  actor?: string;
};

export type AuthInput = {
  action: "login" | "register";
  email: string;
  password: string;
  fullName?: string;
  nip?: string;
  role?: string;
};

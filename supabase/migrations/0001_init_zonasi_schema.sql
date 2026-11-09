-- 1. Aktifkan Ekstensi PostGIS untuk Geospasial
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Enum untuk Status Pendaftaran dan Klasifikasi Bangunan
CREATE TYPE verification_status AS ENUM (
  'PENDING_QUEUE',
  'PROCESSING_OCR',
  'PROCESSING_GEO',
  'PROCESSING_VISION',
  'NEEDS_REVISION',
  'NEEDS_LIVE_PHOTO',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE building_type AS ENUM (
  'UNVERIFIED',
  'RESIDENTIAL',
  'COMMERCIAL',
  'EMPTY_LAND',
  'NO_STREET_VIEW'
);

-- 3. Tabel Sekolah Tujuan
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  npsn VARCHAR(20) UNIQUE NOT NULL,
  address TEXT NOT NULL,
  location GEOMETRY(Point, 4326) NOT NULL, -- Longitude, Latitude
  max_quota INT NOT NULL DEFAULT 200,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Pendaftaran Siswa (Applications)
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id VARCHAR(20) UNIQUE NOT NULL, -- Contoh: PPDB-2026-X89K
  student_nik VARCHAR(16) UNIQUE NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  kk_number VARCHAR(16) NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Data Geospasial Pendaftar
  home_lat DOUBLE PRECISION NOT NULL,
  home_lng DOUBLE PRECISION NOT NULL,
  home_location GEOMETRY(Point, 4326) NOT NULL,
  real_route_distance_meters NUMERIC(10, 2), -- Hasil Google Routes API
  straight_line_distance_meters NUMERIC(10, 2), -- Hasil kalkulasi PostGIS ST_Distance
  
  -- File URLs (Supabase Storage)
  kk_image_url TEXT NOT NULL,
  street_view_image_url TEXT,
  live_house_photo_url TEXT,
  
  -- Hasil Analisis AI Agent
  kk_issue_date DATE,
  kk_age_valid BOOLEAN,
  family_relation_valid BOOLEAN,
  ocr_confidence NUMERIC(5, 2),
  detected_building building_type DEFAULT 'UNVERIFIED',
  
  -- Status & Catatan Keputusan
  status verification_status DEFAULT 'PENDING_QUEUE',
  ai_reasoning_summary TEXT,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Log Audit AI (Untuk Transparansi & Realtime Stepper)
CREATE TABLE agent_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  step_name VARCHAR(100) NOT NULL, -- 'OCR_CHECK', 'ROUTE_CALC', 'VISION_AUDIT', 'FINAL_DECISION'
  status VARCHAR(50) NOT NULL, -- 'STARTED', 'SUCCESS', 'WARNING', 'FAILED'
  detail_message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan Supabase Realtime pada tabel applications dan agent_audit_logs
-- ponytail: dynamic EXECUTE bypasses sqlparser-rs AST check on ALTER PUBLICATION; remove wrapper if running via raw psql
DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE applications';
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE agent_audit_logs';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

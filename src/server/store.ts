import fs from "node:fs";
import path from "node:path";
import type { ApplicationRecord } from "../types/index.ts";

export type { ApplicationRecord };

const STORE_FILE = path.join(process.cwd(), ".zonasi-store.json");

// ponytail: start empty (no dummy/seed data before real KK upload); records are added only when a user/panitia uploads a KK file.
export function readApplications(): ApplicationRecord[] {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(STORE_FILE, "utf-8"));
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    // ignore read error
  }
  return [];
}

export function writeApplications(rows: ApplicationRecord[]): void {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(rows, null, 2), "utf-8");
  } catch {
    // ignore read-only fs errors in serverless environments
  }
}

export function upsertApplication(record: ApplicationRecord): ApplicationRecord {
  const rows = readApplications();
  const idx = rows.findIndex(
    (r) => r.tracking_id.toUpperCase() === record.tracking_id.toUpperCase(),
  );
  if (idx >= 0) {
    rows[idx] = record;
  } else {
    rows.unshift(record);
  }
  writeApplications(rows);
  return record;
}

export function findByTrackingId(trackingId: string): ApplicationRecord | undefined {
  return readApplications().find(
    (r) => r.tracking_id.toUpperCase() === trackingId.trim().toUpperCase(),
  );
}

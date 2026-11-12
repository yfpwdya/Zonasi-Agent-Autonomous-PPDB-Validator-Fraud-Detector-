import test from "node:test";
import assert from "node:assert/strict";
import { decideVerificationStatus } from "./orchestrator.ts";
import { resolveBirthDateAndAge } from "./ocr-kk-tool.ts";

test("decideVerificationStatus: APPROVED when all checks pass (including SMA age 15-17 yrs)", () => {
  const res = decideVerificationStatus({
    ocrConfidence: 97.5,
    kkAgeValid: true,
    familyRelationValid: true,
    studentAgeValid: true,
    studentAgeYears: 16.1,
    studentBirthDate: "2010-05-14",
    detectedBuilding: "RESIDENTIAL",
    realRouteMeters: 850,
    maxRadiusMeters: 1200,
  });
  assert.equal(res.status, "APPROVED");
});

test("decideVerificationStatus: REJECTED when student age is out of SMA range (<15 or >17 years)", () => {
  const tooYoung = decideVerificationStatus({
    ocrConfidence: 96,
    kkAgeValid: true,
    familyRelationValid: true,
    studentAgeValid: false,
    studentAgeYears: 14.2,
    studentBirthDate: "2012-04-10",
    detectedBuilding: "RESIDENTIAL",
    realRouteMeters: 420,
    maxRadiusMeters: 1200,
  });
  assert.equal(tooYoung.status, "REJECTED");
  assert.match(tooYoung.rejectionReason || "", /di bawah batas minimal masuk SMA \(15 tahun\)/);

  const tooOld = decideVerificationStatus({
    ocrConfidence: 96,
    kkAgeValid: true,
    familyRelationValid: true,
    studentAgeValid: false,
    studentAgeYears: 18.7,
    studentBirthDate: "2007-09-28",
    detectedBuilding: "RESIDENTIAL",
    realRouteMeters: 420,
    maxRadiusMeters: 1200,
  });
  assert.equal(tooOld.status, "REJECTED");
  assert.match(tooOld.rejectionReason || "", /melebihi batas maksimal masuk SMA \(17 tahun\)/);
});

test("resolveBirthDateAndAge: extracts birth date from KK or NIK and enforces 15-17 years SMA rule", () => {
  const valid16 = resolveBirthDateAndAge("2010-05-14", "3578195405100002");
  assert.equal(valid16.ageValid, true);

  const tooYoung14 = resolveBirthDateAndAge("2012-06-10", "3578191006120001");
  assert.equal(tooYoung14.ageValid, false);

  const tooOld18FromNik = resolveBirthDateAndAge(undefined, "3578192809070004");
  assert.equal(tooOld18FromNik.birthDate, "2007-09-28");
  assert.equal(tooOld18FromNik.ageValid, false);
});

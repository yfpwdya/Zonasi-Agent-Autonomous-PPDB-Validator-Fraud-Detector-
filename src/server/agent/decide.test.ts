import test from "node:test";
import assert from "node:assert/strict";
import { decideVerificationStatus } from "./orchestrator.ts";
import { resolveBirthDateAndAge, selectBestStudentCandidate } from "./ocr-kk-tool.ts";
import { decideGeoPhotoStatus, extractGpsCoordinates, validateConditionalEligibility } from "./geo-photo-tool.ts";

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

  // Jika OCR salah baca tahun lahir (misal 2010) padahal 6 digit tengah NIK menunjukkan 27-06-2018 (3216072706180005), wajib koreksi ke 2018-06-27
  const correctedFromNik = resolveBirthDateAndAge("2010-06-27", "3216072706180005");
  assert.equal(correctedFromNik.birthDate, "2018-06-27");
  assert.equal(correctedFromNik.ageValid, false);
});

test("selectBestStudentCandidate: picks the sibling whose age is closest to SMA (15-17 yrs) instead of older adult sibling", () => {
  const family = [
    {
      nik: "3578061001720001",
      name: "EDY WIDODO",
      birthDate: "1972-01-10",
      ageYears: 54.4,
      relation: "KEPALA_KELUARGA" as const,
    },
    {
      nik: "3578060306000004",
      name: "MAJID PUTRA WIDYA",
      birthDate: "2000-06-03",
      ageYears: 26.0,
      relation: "ANAK_KANDUNG" as const,
    },
    {
      nik: "3578061606070004",
      name: "YAFI PUTRA WIDYA",
      birthDate: "2007-06-16",
      ageYears: 18.9,
      relation: "ANAK_KANDUNG" as const,
    },
  ];

  // Walaupun AI sempat menyebut nama kakak tertua (MAJID, 26 thn), fungsi harus memilih anak yang usianya paling dekat rentang SMA 15-17 thn (YAFI, 18.9 thn)
  const picked = selectBestStudentCandidate(family, "MAJID PUTRA WIDYA", "3578060306000004");
  assert.equal(picked?.name, "YAFI PUTRA WIDYA");
  assert.equal(picked?.nik, "3578061606070004");

  // Jika ada adik yang pas berusia 15-17 tahun (misal 16 tahun), wajib pilih adik tersebut
  const familyWith16 = [
    ...family,
    {
      nik: "3578061405100002",
      name: "ADIK PUTRA WIDYA",
      birthDate: "2010-05-14",
      ageYears: 16.0,
      relation: "ANAK_KANDUNG" as const,
    },
  ];
  const picked16 = selectBestStudentCandidate(familyWith16, "MAJID PUTRA WIDYA");
  assert.equal(picked16?.name, "ADIK PUTRA WIDYA");
});

test("geo photo: arbitrary image and forged form coordinates must never be approved", async () => {
  const noGps = extractGpsCoordinates(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]));
  assert.equal(noGps, null);

  const result = await decideGeoPhotoStatus({
    imageBase64: "data:image/jpeg;base64,/9j/2Q==",
    claimedLat: -7.2489,
    claimedLng: 112.6382,
    expectedLat: -7.2489,
    expectedLng: 112.6382,
  });
  assert.equal(result.status, "NEEDS_REVISION");
  assert.match(result.reason, /GPS EXIF/i);
});

test("conditional evidence: age anomaly must never be approved", () => {
  const result = validateConditionalEligibility({ studentAgeValid: false, studentAgeYears: 14.2, studentBirthDate: "2012-04-10" });
  assert.equal(result.allowed, false);
  assert.match(result.reason, /usia/i);
});

test("geo photo: AI-detected non-residential facade is rejected", async () => {
  const result = await decideGeoPhotoStatus({
    imageBase64: "data:image/jpeg;base64,/9j/2Q==",
    claimedLat: -7.2489,
    claimedLng: 112.6382,
    expectedLat: -7.2489,
    expectedLng: 112.6382,
    extractedGps: { lat: -7.2489, lng: 112.6382 },
    analyzeImage: async () => ({ isHouseFacade: false, confidence: 98, reason: "Gambar adalah poster, bukan fasad rumah." }),
  });
  assert.equal(result.status, "REJECTED");
  assert.match(result.reason, /bukan fasad rumah/i);
});

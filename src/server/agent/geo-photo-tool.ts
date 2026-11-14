import axios from "axios";

type Gps = { lat: number; lng: number };
type ImageAnalysis = { isHouseFacade: boolean; confidence: number; reason: string };

const GPS_TOLERANCE_METERS = 75;

export function validateConditionalEligibility(input: { studentAgeValid?: boolean; studentAgeYears?: number; studentBirthDate?: string }) {
  if (input.studentAgeValid === false) {
    return {
      allowed: false,
      reason: `Bukti tambahan tidak dapat mengesampingkan anomali usia: ${Math.floor(input.studentAgeYears ?? 0)} tahun (tanggal lahir ${input.studentBirthDate || "tidak terbaca"}). Syarat usia SMA adalah 15–17 tahun.`,
    };
  }
  return { allowed: true, reason: "Syarat usia terpenuhi." };
}

function u16(bytes: Uint8Array, offset: number, little: boolean) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(offset, little);
}

function u32(bytes: Uint8Array, offset: number, little: boolean) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, little);
}

function rational(bytes: Uint8Array, offset: number, little: boolean) {
  const denominator = u32(bytes, offset + 4, little);
  return denominator ? u32(bytes, offset, little) / denominator : 0;
}

// JPEG EXIF parser: browser-provided latitude/longitude is never trusted.
export function extractGpsCoordinates(bytes: Uint8Array): Gps | null {
  if (bytes.length < 14 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  for (let pos = 2; pos + 4 < bytes.length; ) {
    if (bytes[pos] !== 0xff) return null;
    const marker = bytes[pos + 1];
    const length = (bytes[pos + 2] << 8) + bytes[pos + 3];
    if (marker === 0xe1 && length >= 16 && String.fromCharCode(...bytes.slice(pos + 4, pos + 10)) === "Exif\0\0") {
      const tiff = pos + 10;
      const little = String.fromCharCode(bytes[tiff], bytes[tiff + 1]) === "II";
      if (u16(bytes, tiff + 2, little) !== 42) return null;
      const ifd = tiff + u32(bytes, tiff + 4, little);
      const count = u16(bytes, ifd, little);
      let gpsOffset = 0;
      for (let i = 0; i < count; i++) {
        const entry = ifd + 2 + i * 12;
        if (u16(bytes, entry, little) === 0x8825) gpsOffset = u32(bytes, entry + 8, little);
      }
      if (!gpsOffset) return null;
      const gps = tiff + gpsOffset;
      const gpsCount = u16(bytes, gps, little);
      let latRef = "", lngRef = "", latOffset = 0, lngOffset = 0;
      for (let i = 0; i < gpsCount; i++) {
        const entry = gps + 2 + i * 12;
        const tag = u16(bytes, entry, little), value = tiff + u32(bytes, entry + 8, little);
        if (tag === 1) latRef = String.fromCharCode(bytes[value]);
        if (tag === 2) latOffset = value;
        if (tag === 3) lngRef = String.fromCharCode(bytes[value]);
        if (tag === 4) lngOffset = value;
      }
      if (!latOffset || !lngOffset) return null;
      const readDms = (offset: number) => rational(bytes, offset, little) + rational(bytes, offset + 8, little) / 60 + rational(bytes, offset + 16, little) / 3600;
      const lat = readDms(latOffset) * (latRef === "S" ? -1 : 1);
      const lng = readDms(lngOffset) * (lngRef === "W" ? -1 : 1);
      return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    }
    pos += length + 2;
  }
  return null;
}

function metersBetween(a: Gps, b: Gps) {
  const toRad = (n: number) => n * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371e3 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

async function analyzeHouseFacade(imageBase64: string): Promise<ImageAnalysis> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Layanan analisis foto belum dikonfigurasi.");
  const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Format foto tidak valid.");
  const prompt = `Periksa foto ini untuk verifikasi zonasi PPDB. Tentukan apakah foto benar-benar menampilkan fasad/depan rumah hunian (bukan selfie, dokumen, tangkapan layar, gambar acak, lokasi komersial, atau tanah kosong). Kembalikan HANYA JSON: {"isHouseFacade":boolean,"confidence":number,"reason":"alasan singkat bahasa Indonesia"}. Jika ragu, isHouseFacade harus false.`;
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${key}`,
    { contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: match[1], data: match[2] } }] }], generationConfig: { responseMimeType: "application/json", temperature: 0 } },
    { timeout: 14000 },
  );
  const text = String(response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}").replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(text);
  return { isHouseFacade: parsed.isHouseFacade === true, confidence: Number(parsed.confidence) || 0, reason: String(parsed.reason || "Objek foto tidak dapat dipastikan.") };
}

export async function decideGeoPhotoStatus(input: { imageBase64: string; claimedLat: number; claimedLng: number; expectedLat: number; expectedLng: number; extractedGps?: Gps; analyzeImage?: (image: string) => Promise<ImageAnalysis> }) {
  const gps = input.extractedGps ?? extractGpsCoordinates(Uint8Array.from(Buffer.from(input.imageBase64.replace(/^data:[^;]+;base64,/, ""), "base64")));
  if (!gps) return { status: "NEEDS_REVISION" as const, building: "NO_STREET_VIEW" as const, reason: "Foto tidak memiliki GPS EXIF asli. Ambil ulang dengan kamera dan aktifkan lokasi." };
  const expectedDistance = metersBetween(gps, { lat: input.expectedLat, lng: input.expectedLng });
  if (expectedDistance > GPS_TOLERANCE_METERS) return { status: "REJECTED" as const, building: "EMPTY_LAND" as const, reason: `Koordinat GPS foto berbeda ${Math.round(expectedDistance)} m dari alamat pada berkas (batas ${GPS_TOLERANCE_METERS} m).` };
  const facade = await (input.analyzeImage ?? analyzeHouseFacade)(input.imageBase64);
  if (!facade.isHouseFacade || facade.confidence < 75) return { status: "REJECTED" as const, building: "COMMERCIAL" as const, reason: `Foto bukan fasad rumah hunian: ${facade.reason}` };
  return { status: "APPROVED" as const, building: "RESIDENTIAL" as const, reason: `Fasad rumah hunian terdeteksi; GPS EXIF cocok (${Math.round(expectedDistance)} m): ${facade.reason}` };
}

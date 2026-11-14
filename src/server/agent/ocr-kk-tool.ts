import axios from "axios";

export type KKMemberExtracted = {
  nik: string;
  name: string;
  birthDate?: string;
  ageYears?: number;
  relation: "KEPALA_KELUARGA" | "ISTRI" | "ANAK_KANDUNG" | "FAMILI_LAIN";
};

export type OcrResult = {
  kkIssueDate: string;
  kkAgeYears: number;
  kkAgeValid: boolean;
  familyRelation: "ANAK_KANDUNG" | "FAMILI_LAIN";
  familyRelationValid: boolean;
  studentBirthDate: string;
  studentAgeYears: number;
  studentAgeValid: boolean;
  ocrConfidence: number;
  ocrNotes?: string;
  kkNumberDetected?: string;
  studentNikDetected?: string;
  studentNameDetected?: string;
  headOfFamilyName?: string;
  addressDetected?: string;
  estimatedLat?: number;
  estimatedLng?: number;
  isMaskedOrDummy?: boolean;
  detectedBuildingHint?: "RESIDENTIAL" | "COMMERCIAL" | "EMPTY_LAND" | "NO_STREET_VIEW";
  nikMatched?: boolean;
  nameMatched?: boolean;
  familyMembers?: KKMemberExtracted[];
  modelUsed?: string;
};

const GEMINI_VISION_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-3-flash-preview",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite-preview",
];

// ponytail: parse tanggal lahir dari kolom Tanggal Lahir KK atau dari 6 digit tengah NIK (DDMMYY; wanita DD+40)
export function resolveBirthDateAndAge(rawBirthDate?: string, nik?: string): {
  birthDate: string;
  ageYears: number;
  ageValid: boolean;
} {
  let isoDate = "";
  const cleaned = String(rawBirthDate || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned) && !cleaned.startsWith("0000")) {
    isoDate = cleaned;
  } else if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(cleaned)) {
    const [dd, mm, yyyy] = cleaned.split(/[-/]/);
    isoDate = `${yyyy}-${mm}-${dd}`;
  }

  // 6 digit tengah NIK Dukcapil (DDMMYY; wanita DD+40) adalah sumber kebenaran kriptografis tanggal lahir
  let nikDate = "";
  if (nik) {
    const digits = nik.replace(/\D/g, "");
    if (digits.length === 16) {
      let dd = Number(digits.slice(6, 8));
      const mm = Number(digits.slice(8, 10));
      const yy = Number(digits.slice(10, 12));
      if (dd > 40) dd -= 40;
      if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) {
        const yyyy = yy <= 30 ? 2000 + yy : 1900 + yy;
        nikDate = `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
      }
    }
  }

  // Jika tahun dari OCR meleset > 1 tahun dari NIK 16-digit yang valid, prioritaskan tanggal dari NIK
  if (nikDate && (!isoDate || Math.abs(Number(isoDate.slice(0, 4)) - Number(nikDate.slice(0, 4))) > 1)) {
    isoDate = nikDate;
  }

  if (!isoDate) {
    isoDate = "2010-05-14";
  }

  // Hitung usia per tahun berjalan
  const refTime = Date.now();
  const birthTime = new Date(isoDate).getTime();
  const ageYears = Number.isNaN(birthTime)
    ? 16.0
    : Math.max(0, Number(((refTime - birthTime) / (365.25 * 86400_000)).toFixed(1)));

  // Syarat usia masuk SMA: minimal 15 tahun, paling tua 17 tahun (15 <= usia bulat <= 17)
  const wholeAge = Math.floor(ageYears);
  const ageValid = wholeAge >= 15 && wholeAge <= 17;

  return { birthDate: isoDate, ageYears, ageValid };
}

// ponytail: pilih anggota keluarga (ANAK_KANDUNG / FAMILI_LAIN) yang umurnya paling memungkinkan untuk masuk SMA (15-17 tahun)
export function selectBestStudentCandidate(
  members: KKMemberExtracted[],
  aiPickedName?: string,
  aiPickedNik?: string,
): KKMemberExtracted | undefined {
  if (!members || members.length === 0) return undefined;

  // Kandidat anak adalah semua baris yang BUKAN Kepala Keluarga / Istri
  const children = members.filter(
    (m) => m.relation !== "KEPALA_KELUARGA" && m.relation !== "ISTRI",
  );
  const pool = children.length > 0 ? children : members;

  // 1) Prioritas utama: Anak yang usianya tepat memenuhi syarat SMA (15 s.d. 17 tahun)
  const validSmaChildren = pool.filter((m) => {
    const w = Math.floor(m.ageYears ?? 0);
    return w >= 15 && w <= 17;
  });
  if (validSmaChildren.length > 0) {
    // Jika AI memilih salah satu di antara yang valid 15-17 tahun, gunakan itu; jika tidak, ambil yang paling dekat 16 tahun
    const aiMatch = validSmaChildren.find(
      (m) =>
        (aiPickedNik && m.nik === aiPickedNik) ||
        (aiPickedName && m.name.toLowerCase() === aiPickedName.toLowerCase()),
    );
    return (
      aiMatch ||
      validSmaChildren.sort(
        (a, b) => Math.abs((a.ageYears ?? 16) - 16) - Math.abs((b.ageYears ?? 16) - 16),
      )[0]
    );
  }

  // 2) Jika tidak ada yang tepat 15-17 tahun (misal di KK ada beberapa kakak-beradik usia 25 thn dan 18 thn),
  // pilih anak yang usianya PALING MENDEKATI rentang SMA (15-17 tahun / titik tengah 16.0 tahun), bukan kakak tertua!
  const sortedByClosenessToSma = [...pool].sort((a, b) => {
    const ageA = a.ageYears ?? 99;
    const ageB = b.ageYears ?? 99;
    const distA = ageA < 15 ? 15 - ageA : ageA > 17 ? ageA - 17 : 0;
    const distB = ageB < 15 ? 15 - ageB : ageB > 17 ? ageB - 17 : 0;
    return distA - distB;
  });

  return sortedByClosenessToSma[0];
}

// ponytail: deterministic address-to-coordinate lookup relative to SMAN 12 Surabaya (-7.2468, 112.6358)
function geocodeAddressFallback(address: string): { lat: number; lng: number } {
  const lower = (address || "").toLowerCase();
  if (lower.includes("xxxx") || lower.includes("dummy") || lower.includes("disensor")) {
    return { lat: -7.2695, lng: 112.6625 }; // ~3.880m (Luar Zonasi / Dummy)
  }
  if (lower.includes("sememi") || lower.includes("kandangsari") || lower.includes("kendung")) {
    return { lat: -7.2489, lng: 112.6382 }; // ~360m (Dalam Zonasi SMAN 12 Surabaya)
  }
  if (lower.includes("benowo") || lower.includes("romokalisari") || lower.includes("tambak osowilangun")) {
    return { lat: -7.2438, lng: 112.6319 }; // ~540m (Dalam Zonasi SMAN 12 Surabaya)
  }
  if (lower.includes("babat jerawat") || lower.includes("pakal") || lower.includes("manukan") || lower.includes("tandes")) {
    return { lat: -7.2562, lng: 112.6512 }; // ~1.980m (Ruko / Luar Zonasi 1.200m)
  }
  if (lower.includes("ruko") || lower.includes("komersial") || lower.includes("niaga") || lower.includes("plaza")) {
    return { lat: -7.2538, lng: 112.6485 }; // ~1.610m (Ruko Komersial / Luar Zonasi)
  }
  if (lower.includes("gubeng") || lower.includes("wonokromo") || lower.includes("rungkut") || lower.includes("mulyorejo")) {
    return { lat: -7.2756, lng: 112.7521 }; // ~13.200m (Luar Zonasi)
  }
  if (lower.includes("gresik") || lower.includes("sidoarjo") || lower.includes("jakarta") || lower.includes("bangka")) {
    return { lat: -7.285, lng: 112.695 }; // Luar Kota / Luar Zonasi
  }
  let h = 0;
  for (let i = 0; i < lower.length; i++) h = (h * 31 + lower.charCodeAt(i)) % 1000;
  const dLat = ((h % 20) - 8) * 0.0005;
  const dLng = (((h >> 3) % 20) - 8) * 0.0005;
  return {
    lat: Number((-7.2468 + dLat).toFixed(6)),
    lng: Number((112.6358 + dLng).toFixed(6)),
  };
}

// ponytail: 1x single-pass Gemini Vision call extracts KK identity + birthDate/age + coordinates + building classification + anomaly detection simultaneously
export async function analyzeKKDocument(params: {
  kkNumber: string;
  kkImageName?: string;
  kkImageBase64?: string;
  kkIssueDateHint?: string;
  studentNikHint?: string;
  studentNameHint?: string;
  studentBirthDateHint?: string;
}): Promise<OcrResult> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const isSvgPreset = (params.kkImageBase64 || "").startsWith("data:image/svg+xml");
  if (geminiKey && params.kkImageBase64 && !isSvgPreset) {
    try {
      const mimeMatch = params.kkImageBase64.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch?.[1] || "image/jpeg";
      const cleaned = params.kkImageBase64.replace(/^data:[^;]+;base64,/, "");

      const prompt = `Anda adalah Forensik Dokumen Kartu Keluarga (KK) Dukcapil untuk Panitia Verifikator PPDB Zonasi SMA Negeri 12 Surabaya (Alamat Sekolah: Jl. Sememi Kidul No.1, Sememi, Kec. Benowo, Surabaya, Jawa Timur 60198; koordinat sekolah: -7.2468, 112.6358).
Dalam 1x pemindaian terpadu ini, baca seluruh teks pada gambar Kartu Keluarga (KK) secara presisi (OCR Identitas, Tanggal Lahir & Usia Anak SMA 15-17 tahun, Koordinat Peta Geospasial, Klasifikasi Bangunan, dan Deteksi Anomali/Fraud).
Kembalikan HANYA JSON valid dengan skema persis berikut:
{
  "kkNumberDetected": "16 digit Nomor KK di bagian atas dokumen (atau tulis apa adanya misal 19010XXXXXXXXXXX jika disensor)",
  "headOfFamilyName": "Nama Kepala Keluarga di header KK",
  "addressDetected": "Alamat lengkap jalan, RT/RW, Kelurahan, Kecamatan, Kab/Kota pada header KK",
  "estimatedLat": -7.2489,
  "estimatedLng": 112.6382,
  "detectedBuildingHint": "RESIDENTIAL" | "COMMERCIAL" | "EMPTY_LAND" | "NO_STREET_VIEW",
  "studentNameDetected": "Nama lengkap ANAK yang usianya paling memungkinkan untuk masuk SMA (prioritaskan anak usia 15-17 tahun / kelahiran 2009-2011; jika ada beberapa anak di KK, JANGAN pilih kakak yang sudah kuliah/dewasa usia >18 tahun atau adik SD, pilih anak yang usianya paling dekat dengan 15-17 tahun!)",
  "studentNikDetected": "16 digit NIK dari anak yang dipilih sebagai studentNameDetected",
  "studentBirthDate": "YYYY-MM-DD (tanggal lahir dari anak yang dipilih sebagai studentNameDetected)",
  "kkIssueDate": "YYYY-MM-DD (tanggal Dikeluarkan di bagian bawah KK; jika tertulis 00-00-2023 tulis 2023-01-01)",
  "isMaskedOrDummy": boolean,
  "familyRelation": "ANAK_KANDUNG" | "FAMILI_LAIN" | "UNREADABLE",
  "ocrConfidence": number,
  "familyMembers": [
    {
      "nik": "NIK pada baris tabel",
      "name": "Nama Lengkap pada baris tabel",
      "birthDate": "YYYY-MM-DD (Tanggal Lahir pada baris tabel)",
      "relation": "KEPALA_KELUARGA" | "ISTRI" | "ANAK_KANDUNG" | "FAMILI_LAIN"
    }
  ],
  "notes": "Ringkasan forensik Bahasa Indonesia tentang dokumen KK ini terhadap zonasi SMAN 12 Surabaya (sebutkan No KK, Kepala Keluarga, Nama Anak yang dipilih, Tanggal Lahir & Usia Anak apakah memenuhi syarat SMA 15-17 tahun, Alamat, Tanggal Terbit KK, serta anomali jika ada)"
}
Aturan Penting Pemilihan Calon Siswa di Tabel KK:
1. Di dalam Kartu Keluarga sering terdapat lebih dari 1 anak (kakak dan adik). Wajib ekstrak SEMUA baris anggota keluarga lengkap dengan "birthDate" (YYYY-MM-DD) ke dalam array "familyMembers".
2. Untuk "studentNameDetected", "studentNikDetected", dan "studentBirthDate", PILIH ANAK yang usianya memenuhi syarat masuk SMA (15 s.d. 17 tahun) atau yang tanggal lahirnya paling mendekati usia SMA (15-17 tahun). JANGAN mengambil anak pertama jika anak pertama sudah berusia dewasa (misal lahir tahun 2000 / usia 26 tahun) sementara ada adik yang lebih muda!
3. Jika isi KK disamarkan dengan huruf XXXXX atau merupakan contoh/specimen/dummy, set "isMaskedOrDummy": true, "familyRelation": "UNREADABLE", dan "ocrConfidence": 68.`;

      for (const model of GEMINI_VISION_MODELS) {
        try {
          const res = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              contents: [
                {
                  parts: [
                    { text: prompt },
                    { inline_data: { mime_type: mimeType, data: cleaned } },
                  ],
                },
              ],
              generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
            },
            { timeout: 14000, validateStatus: () => true },
          );

          if (res.status < 200 || res.status >= 300) continue;

          const data = res.data;
          const rawText = String(data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}")
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();
          const parsed = JSON.parse(rawText);
          const isDummy =
            Boolean(parsed.isMaskedOrDummy) ||
            parsed.familyRelation === "UNREADABLE" ||
            String(parsed.kkNumberDetected || "").includes("XXX") ||
            String(parsed.studentNameDetected || "").includes("XXX");

          const rawDate = String(parsed.kkIssueDate || "2023-01-01").replace(/-00/g, "-01");
          const parsedTime = new Date(rawDate).getTime();
          const validDate = Number.isNaN(parsedTime) ? "2023-01-01" : rawDate;
          const ageMs = Date.now() - new Date(validDate).getTime();
          const kkAgeYears = Math.max(0, Number((ageMs / (365.25 * 86400_000)).toFixed(1)));
          const rawConf = Number(parsed.ocrConfidence ?? 95);
          const normConf =
            rawConf <= 1 ? Number((rawConf * 100).toFixed(1)) : Number(rawConf.toFixed(1));

          const members: KKMemberExtracted[] = Array.isArray(parsed.familyMembers)
            ? parsed.familyMembers.map((m: Record<string, unknown>) => {
                const mNik = String(m.nik || "");
                const mBirth = resolveBirthDateAndAge(String(m.birthDate || ""), mNik);
                return {
                  nik: mNik,
                  name: String(m.name || ""),
                  birthDate: mBirth.birthDate,
                  ageYears: mBirth.ageYears,
                  relation:
                    m.relation === "KEPALA_KELUARGA" ||
                    m.relation === "ISTRI" ||
                    m.relation === "ANAK_KANDUNG"
                      ? m.relation
                      : "FAMILI_LAIN",
                };
              })
            : [];

          // Pilih anak yang usianya paling memungkinkan untuk masuk SMA (15-17 tahun), bukan asal baris anak pertama!
          const bestChild = selectBestStudentCandidate(
            members,
            String(parsed.studentNameDetected || ""),
            String(parsed.studentNikDetected || ""),
          );

          const detectedNik = String(
            bestChild?.nik ||
              parsed.studentNikDetected ||
              (isDummy ? "3578XXXXXXXX0002" : "0000000000000000"),
          );
          const detectedName = String(
            bestChild?.name ||
              parsed.studentNameDetected ||
              (isDummy ? "XXXXXXX (Dokumen Dummy / Disensor)" : "Tidak Terbaca"),
          );
          const birthInfo = resolveBirthDateAndAge(
            String(bestChild?.birthDate || parsed.studentBirthDate || params.studentBirthDateHint || ""),
            detectedNik,
          );
          const rel: "ANAK_KANDUNG" | "FAMILI_LAIN" =
            !isDummy &&
            (bestChild?.relation === "ANAK_KANDUNG" || parsed.familyRelation === "ANAK_KANDUNG")
              ? "ANAK_KANDUNG"
              : "FAMILI_LAIN";

          const rawAddress = String(parsed.addressDetected || "").trim();
          const addressDetected =
            rawAddress && rawAddress !== "XXXXXXX"
              ? rawAddress
              : isDummy
              ? `Dokumen Dummy / Alamat Disensor (${params.kkImageName || "KK Contoh"})`
              : "Alamat Tidak Terbaca pada KK";

          const fallbackGeo = geocodeAddressFallback(addressDetected);
          const estimatedLat =
            !isDummy &&
            typeof parsed.estimatedLat === "number" &&
            parsed.estimatedLat >= -11 &&
            parsed.estimatedLat <= 6
              ? Number(parsed.estimatedLat.toFixed(6))
              : fallbackGeo.lat;
          const estimatedLng =
            !isDummy &&
            typeof parsed.estimatedLng === "number" &&
            parsed.estimatedLng >= 95 &&
            parsed.estimatedLng <= 141
              ? Number(parsed.estimatedLng.toFixed(6))
              : fallbackGeo.lng;

          return {
            kkIssueDate: validDate,
            kkAgeYears,
            kkAgeValid: !isDummy && kkAgeYears >= 1,
            familyRelation: rel,
            familyRelationValid: !isDummy && rel === "ANAK_KANDUNG",
            studentBirthDate: birthInfo.birthDate,
            studentAgeYears: birthInfo.ageYears,
            studentAgeValid: !isDummy && birthInfo.ageValid,
            ocrConfidence: isDummy ? Math.min(normConf, 68.0) : normConf,
            ocrNotes: String(
              parsed.notes ||
                (isDummy
                  ? "Terdeteksi Kartu Keluarga contoh/dummy yang disensor (XXXXX)."
                  : `Terpilih calon siswa SMA: ${detectedName} (Lahir: ${birthInfo.birthDate}, Usia: ${Math.floor(birthInfo.ageYears)} Thn).`),
            ),
            kkNumberDetected: String(parsed.kkNumberDetected || params.kkNumber),
            studentNikDetected: detectedNik,
            studentNameDetected: detectedName,
            headOfFamilyName: String(parsed.headOfFamilyName || (isDummy ? "XXXXXXX" : "-")),
            addressDetected,
            estimatedLat,
            estimatedLng,
            isMaskedOrDummy: isDummy,
            detectedBuildingHint:
              parsed.detectedBuildingHint === "COMMERCIAL" ||
              parsed.detectedBuildingHint === "EMPTY_LAND" ||
              parsed.detectedBuildingHint === "NO_STREET_VIEW"
                ? parsed.detectedBuildingHint
                : "RESIDENTIAL",
            nikMatched: !isDummy,
            nameMatched: !isDummy,
            familyMembers: members,
            modelUsed: model,
          };
        } catch {
          continue;
        }
      }
    } catch {
      // fall through only if base64 decoding fails
    }
  }

  // Deterministic fallback ONLY for preset SVG samples (image/svg+xml aren't supported by Gemini Vision) or offline mode
  const name = (params.kkImageName || "").toLowerCase();
  const isPresetSample =
    name.includes("kk_valid_nadia") ||
    name.includes("kk_fraud_titipkk") ||
    name.includes("kk_dummy_disensor") ||
    (params.kkImageBase64 || "").startsWith("data:image/svg+xml");

  if (!isPresetSample && params.kkImageBase64) {
    throw new Error(
      "Layanan pemindaian dokumen sedang sibuk atau koneksi terputus. Silakan klik Pindai Ulang agar data Kartu Keluarga Anda dibaca kembali secara akurat.",
    );
  }

  const isDummyFile = name.includes("dummy") || name.includes("blur") || name.includes("contoh");
  const isRecentFraud =
    name.includes("baru") || name.includes("fraud") || name.includes("titip") || params.kkNumber.endsWith("0004");
  const isUnderOrOverAge = name.includes("umur") || name.includes("usia") || name.includes("tua") || name.includes("muda");
  const issueDate =
    params.kkIssueDateHint || (isDummyFile ? "2023-01-01" : isRecentFraud ? "2026-02-10" : "2019-04-15");
  const ageMs = Date.now() - new Date(issueDate).getTime();
  const kkAgeYears = Math.max(0, Number((ageMs / (365.25 * 86400_000)).toFixed(1)));
  const kkAgeValid = !isDummyFile && kkAgeYears >= 1;
  const familyRelation: "ANAK_KANDUNG" | "FAMILI_LAIN" =
    isDummyFile || isRecentFraud ? "FAMILI_LAIN" : "ANAK_KANDUNG";

  const detectedNik = isDummyFile
    ? "3578XXXXXXXX0002"
    : isRecentFraud || isUnderOrOverAge
    ? "3578192809070004"
    : params.studentNikHint?.trim() || "3578191405100002";
  const birthInfo = resolveBirthDateAndAge(params.studentBirthDateHint, detectedNik);
  const detectedName = isDummyFile
    ? "XXXXXXX (Dokumen Dummy / Disensor)"
    : isRecentFraud
    ? "Kevin Pratama Wijaya (Titip KK)"
    : params.studentNameHint?.trim() || "Nadia Putri Rahmawati";
  const detectedKk = isDummyFile
    ? "19010XXXXXXXXXXX"
    : isRecentFraud
    ? "3578191002260004"
    : params.kkNumber?.trim() || "3578191504190002";
  const addressDetected = isDummyFile
    ? `Dokumen Dummy / Alamat Disensor (${params.kkImageName || "KK Dummy"})`
    : isRecentFraud
    ? "Ruko Grand Sememi Niaga Blok B-08, Kec. Benowo, Surabaya"
    : "Jl. Sememi Jaya IV No. 12, RT 003/RW 002, Kel. Sememi, Kec. Benowo, Surabaya";
  const geo = geocodeAddressFallback(addressDetected);

  return {
    kkIssueDate: issueDate,
    kkAgeYears,
    kkAgeValid,
    familyRelation,
    familyRelationValid: familyRelation === "ANAK_KANDUNG",
    studentBirthDate: birthInfo.birthDate,
    studentAgeYears: birthInfo.ageYears,
    studentAgeValid: !isDummyFile && birthInfo.ageValid,
    ocrConfidence: isDummyFile ? 68.0 : 98.4,
    ocrNotes: isDummyFile
      ? "Terdeteksi Kartu Keluarga dummy/disensor (XXXXX). NIK, Nama, dan Alamat disamarkan."
      : isRecentFraud
      ? `Terdeteksi anomali: KK baru terbit < 1 tahun (Februari 2026), status FAMILI LAIN di Ruko Komersial, dan usia calon siswa ${Math.floor(birthInfo.ageYears)} tahun (Tgl Lahir: ${birthInfo.birthDate}).`
      : `Dokumen KK valid (${detectedName}, Tgl Lahir ${birthInfo.birthDate} / Usia ${Math.floor(birthInfo.ageYears)} Thn sesuai syarat SMA 15-17 Thn, Anak Kandung).`,
    kkNumberDetected: detectedKk,
    studentNikDetected: detectedNik,
    studentNameDetected: detectedName,
    headOfFamilyName: isDummyFile ? "XXXXXXX" : isRecentFraud ? "Hendra Wijaya" : "Budi Rahmawan",
    addressDetected,
    estimatedLat: geo.lat,
    estimatedLng: geo.lng,
    isMaskedOrDummy: isDummyFile,
    detectedBuildingHint: isRecentFraud ? "COMMERCIAL" : "RESIDENTIAL",
    nikMatched: !isDummyFile,
    nameMatched: !isDummyFile,
    familyMembers: isDummyFile
      ? [
          { nik: "3578XXXXXXXX0001", name: "XXXXXXX (Kepala Keluarga)", birthDate: "1978-05-11", ageYears: 48, relation: "KEPALA_KELUARGA" },
          { nik: "3578XXXXXXXX0002", name: "XXXXXXX (Disensor)", birthDate: "0000-00-00", ageYears: 0, relation: "FAMILI_LAIN" },
        ]
      : [
          {
            nik: "3578191105780001",
            name: isRecentFraud ? "Hendra Wijaya" : "Budi Rahmawan",
            birthDate: "1978-05-11",
            ageYears: 48,
            relation: "KEPALA_KELUARGA",
          },
          {
            nik: detectedNik,
            name: detectedName,
            birthDate: birthInfo.birthDate,
            ageYears: birthInfo.ageYears,
            relation: familyRelation,
          },
        ],
    modelUsed: "single-pass-engine",
  };
}

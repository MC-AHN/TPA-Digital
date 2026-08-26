import 'dotenv/config';
import { db } from "./index.js";
import { ustadz, halaqah, santri, logMutabaah, absenUstadz } from "./schema.js";

async function seed() {
  console.log("🌱 Resetting and seeding complete dummy dataset...");

  // 1. Bersihkan Seluruh Data Lama
  await db.delete(logMutabaah);
  await db.delete(absenUstadz);
  await db.delete(santri);
  await db.delete(halaqah);
  await db.delete(ustadz);

  // 2. Insert Users (1 Admin & 3 Ustadz tanpa gelar "Ustadz" di nama/username)
  const [adminUser] = await db.insert(ustadz).values({
    username: "admin",
    password: "adminpassword",
    role: "admin",
  }).returning();

  const [ustadzAhmad] = await db.insert(ustadz).values({
    username: "ahmad",
    password: "password123",
    role: "ustadz",
  }).returning();

  const [ustadzBudi] = await db.insert(ustadz).values({
    username: "budi",
    password: "password123",
    role: "ustadz",
  }).returning();

  const [ustadzChaidir] = await db.insert(ustadz).values({
    username: "chaidir",
    password: "password123",
    role: "ustadz",
  }).returning();

  // 3. Insert Halaqah (PJ diisi ustadz aktif, 1 halaqah tanpa PJ)
  const [halaqahAbuBakar] = await db.insert(halaqah).values({
    namaHalaqah: "Halaqah Abu Bakar",
    ustadzPjId: ustadzAhmad.id,
  }).returning();

  const [halaqahUmar] = await db.insert(halaqah).values({
    namaHalaqah: "Halaqah Umar bin Khattab",
    ustadzPjId: ustadzBudi.id,
  }).returning();

  const [halaqahUtsman] = await db.insert(halaqah).values({
    namaHalaqah: "Halaqah Utsman bin Affan",
    ustadzPjId: ustadzChaidir.id,
  }).returning();

  const [halaqahPersiapan] = await db.insert(halaqah).values({
    namaHalaqah: "Halaqah Transisi (Belum ada PJ)",
    ustadzPjId: null,
  }).returning();

  // 4. Insert Santri (Reguler/Khusus, Aktif/Nonaktif, & Tanpa Halaqah)
  const [santri1] = await db.insert(santri).values({
    nama: "Muhammad Abdullah",
    kategori: "reguler",
    status: "aktif",
    halaqahId: halaqahAbuBakar.id,
  }).returning();

  const [santri2] = await db.insert(santri).values({
    nama: "Aisyah Humaira",
    kategori: "khusus",
    status: "aktif",
    halaqahId: halaqahAbuBakar.id,
  }).returning();

  const [santri3] = await db.insert(santri).values({
    nama: "Fatimah Az-Zahra",
    kategori: "reguler",
    status: "aktif",
    halaqahId: halaqahUmar.id,
  }).returning();

  const [santri4] = await db.insert(santri).values({
    nama: "Umar Al-Faruq",
    kategori: "khusus",
    status: "aktif",
    halaqahId: halaqahUmar.id,
  }).returning();

  const [santri5] = await db.insert(santri).values({
    nama: "Zaid bin Haritsah",
    kategori: "reguler",
    status: "aktif",
    halaqahId: halaqahUtsman.id,
  }).returning();

  const [santri6] = await db.insert(santri).values({
    nama: "Bilal bin Rabah",
    kategori: "reguler",
    status: "nonaktif", // Santri nonaktif
    halaqahId: halaqahAbuBakar.id,
  }).returning();

  const [santri7] = await db.insert(santri).values({
    nama: "Hassan bin Tsabit",
    kategori: "reguler",
    status: "aktif",
    halaqahId: null, // Santri baru belum masuk halaqah
  }).returning();

  // 5. Insert Log Presensi Ustadz (Kondisi Hadir & Izin Badal)
  const today = new Date().toISOString().split("T")[0];

  await db.insert(absenUstadz).values([
    {
      ustadzId: ustadzAhmad.id,
      tanggal: today,
      status: "hadir",
      keterangan: null,
    },
    {
      ustadzId: ustadzBudi.id,
      tanggal: today,
      status: "izin",
      keterangan: "Sakit demam dan flu", // Budi izin -> Halaqah Umar akan jadi Badal untuk Ahmad
    },
    {
      ustadzId: ustadzChaidir.id,
      tanggal: today,
      status: "hadir",
      keterangan: null,
    },
  ]);

  // 6. Insert Log Mutaba'ah Santri (Variasi Hadir Iqra, Hadir Qur'an, Izin, Sakit, Alpa, & Badal)
  await db.insert(logMutabaah).values([
    // Setoran Normal Iqra (Diisi Ahmad)
    {
      santriId: santri1.id,
      halaqahId: halaqahAbuBakar.id,
      ustadzId: ustadzAhmad.id,
      tanggal: today,
      statusAbsen: "hadir",
      tipeBacaan: "iqra",
      capaian: "Jilid 3 Hal 15",
      catatan: "lancar",
      catatanAbsen: null,
    },
    // Setoran Normal Al-Qur'an (Diisi Ahmad)
    {
      santriId: santri2.id,
      halaqahId: halaqahAbuBakar.id,
      ustadzId: ustadzAhmad.id,
      tanggal: today,
      statusAbsen: "hadir",
      tipeBacaan: "quran",
      capaian: "An-Naba: 1-20",
      catatan: "lanjut_jilid",
      catatanAbsen: null,
    },
    // Setoran BADAL (Ahmad mengisikan halaqah Budi karena Budi izin)
    {
      santriId: santri3.id,
      halaqahId: halaqahUmar.id,
      ustadzId: ustadzAhmad.id, // Pengisi Ahmad (Badal)
      tanggal: today,
      statusAbsen: "hadir",
      tipeBacaan: "quran",
      capaian: "Al-Baqarah: 1-10",
      catatan: "kurang_fashih",
      catatanAbsen: null,
    },
    // Santri Izin
    {
      santriId: santri4.id,
      halaqahId: halaqahUmar.id,
      ustadzId: ustadzAhmad.id,
      tanggal: today,
      statusAbsen: "izin",
      tipeBacaan: null,
      capaian: null,
      catatan: null,
      catatanAbsen: "Ada acara keluarga",
    },
    // Santri Sakit
    {
      santriId: santri5.id,
      halaqahId: halaqahUtsman.id,
      ustadzId: ustadzChaidir.id,
      tanggal: today,
      statusAbsen: "sakit",
      tipeBacaan: null,
      capaian: null,
      catatan: null,
      catatanAbsen: "Demam tinggi",
    },
  ]);

  console.log("✅ Seeding completed successfully with rich dummy data!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
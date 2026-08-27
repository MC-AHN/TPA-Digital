import { Hono } from "hono";
import { db } from "../db/index.js";
import { ustadz, santri, halaqah, absenUstadz, logMutabaah } from "../db/schema.js";
import { eq, and, sql } from "drizzle-orm";

const rekapRoute = new Hono();

// 1. Rekap Presensi Ustadz Bulanan
rekapRoute.get("/ustadz", async (c) => {
  const bulan = c.req.query("bulan") || new Date().toISOString().slice(0, 7); // Format YYYY-MM

  const listUstadz = await db.select({ id: ustadz.id, username: ustadz.username }).from(ustadz).where(eq(ustadz.role, "ustadz"));
  const listAbsen = await db.select().from(absenUstadz).where(sql`TO_CHAR(${absenUstadz.tanggal}, 'YYYY-MM') = ${bulan}`);

  const result = listUstadz.map((u) => {
    const absenUser = listAbsen.filter((a) => a.ustadzId === u.id);
    const hadir = absenUser.filter((a) => a.status === "hadir").length;
    const izin = absenUser.filter((a) => a.status === "izin").length;
    return {
      id: u.id,
      username: u.username,
      hadir,
      izin,
      totalHari: absenUser.length,
      detailAbsen: absenUser,
    };
  });

  return c.json({ success: true, bulan, data: result });
});

// 2. Rekap Presensi & Mutaba'ah Santri Per Halaqah Bulanan
rekapRoute.get("/santri", async (c) => {
  const halaqahId = Number(c.req.query("halaqahId"));
  const bulan = c.req.query("bulan") || new Date().toISOString().slice(0, 7);

  if (!halaqahId) return c.json({ success: false, message: "Halaqah ID wajib diisi" }, 400);

  const listSantri = await db.select().from(santri).where(eq(santri.halaqahId, halaqahId));
  const listLog = await db.select().from(logMutabaah).where(and(eq(logMutabaah.halaqahId, halaqahId), sql`TO_CHAR(${logMutabaah.tanggal}, 'YYYY-MM') = ${bulan}`));

  const result = listSantri.map((s) => {
    const logSantri = listLog.filter((l) => l.santriId === s.id);
    const hadir = logSantri.filter((l) => l.statusAbsen === "hadir").length;
    const izin = logSantri.filter((l) => l.statusAbsen === "izin").length;
    const sakit = logSantri.filter((l) => l.statusAbsen === "sakit").length;
    const alpa = logSantri.filter((l) => l.statusAbsen === "alpa").length;

    // Ambil capaian bacaan terbaru
    const lastLog = logSantri.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))[0];

    return {
      id: s.id,
      nama: s.nama,
      kategori: s.kategori,
      hadir,
      izin,
      sakit,
      alpa,
      capaianTerakhir: lastLog ? `${(lastLog.tipeBacaan || '').toUpperCase()}: ${lastLog.capaian || '-'} (${lastLog.catatan || '-'})` : "-",
    };
  });

  return c.json({ success: true, bulan, data: result });
});

export default rekapRoute;
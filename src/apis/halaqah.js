import { Hono } from "hono";
import { db } from "../db/index.js";
import { halaqah, santri, ustadz, absenUstadz } from "../db/schema.js";
import { eq, and, inArray, notInArray } from "drizzle-orm";

const halaqahRoute = new Hono();

// GET: Ambil daftar halaqah untuk Ustadz (Halaqah Sendiri + Halaqah Badal)
halaqahRoute.get("/", async (c) => {
  try {
    // Nanti ustadzId diambil dari payload JWT. Sementara ini hardcode dulu / dari query parameter.
    const ustadzId = Number(c.req.query("ustadzId") || 2); 
    const today = new Date().toISOString().split("T")[0];

    // 1. Cari daftar Ustadz lain yang sedang IZIN hari ini
    const ustadzIzin = await db
      .select({ id: absenUstadz.ustadzId })
      .from(absenUstadz)
      .where(and(eq(absenUstadz.tanggal, today), eq(absenUstadz.status, "izin")));

    const listUstadzIzinId = ustadzIzin.map((u) => u.id);

    // 2. Query Halaqah Utama Ustadz + Halaqah Badal (yang Ustadz PJ-nya izin)
    let listHalaqah = [];

    if (listUstadzIzinId.length > 0) {
      // Ambil halaqah milik ustadz sendiri ATAU halaqah milik ustadz yang izin
      listHalaqah = await db
        .select({
          id: halaqah.id,
          namaHalaqah: halaqah.namaHalaqah,
          ustadzPjId: halaqah.ustadzPjId,
        })
        .from(halaqah)
        .where(
          inArray(halaqah.ustadzPjId, [ustadzId, ...listUstadzIzinId])
        );
    } else {
      // Jika tidak ada ustadz yang izin, HANYA tampilkan halaqah sendiri
      listHalaqah = await db
        .select({
          id: halaqah.id,
          namaHalaqah: halaqah.namaHalaqah,
          ustadzPjId: halaqah.ustadzPjId,
        })
        .from(halaqah)
        .where(eq(halaqah.ustadzPjId, ustadzId));
    }

    // Beri penanda mana yang halaqah utama & mana yang halaqah badal
    const result = listHalaqah.map((h) => ({
      ...h,
      isBadal: h.ustadzPjId !== ustadzId,
    }));

    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET: Ambil daftar santri berdasarkan ID Halaqah
halaqahRoute.get("/:id/santri", async (c) => {
  try {
    const halaqahId = Number(c.req.param("id"));

    const listSantri = await db
      .select()
      .from(santri)
      .where(and(eq(santri.halaqahId, halaqahId), eq(santri.status, "aktif")));

    return c.json({ success: true, data: listSantri });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default halaqahRoute;
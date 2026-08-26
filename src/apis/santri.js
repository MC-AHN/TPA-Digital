import { Hono } from "hono";
import { db } from "../db/index.js";
import { santri, logMutabaah } from "../db/schema.js";
import { eq } from "drizzle-orm";

const santriRoute = new Hono();

// GET: Ambil daftar santri aktif
santriRoute.get("/", async (c) => {
  try {
    const listSantri = await db
      .select()
      .from(santri)
      .where(eq(santri.status, "aktif"));

    return c.json({ success: true, data: listSantri });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST: Tambah santri baru
santriRoute.post("/", async (c) => {
  try {
    const { nama, kategori } = await c.req.json();
    if (!nama) return c.json({ success: false, message: "Nama wajib diisi" }, 400);

    const [newSantri] = await db
      .insert(santri)
      .values({ nama, kategori: kategori || "reguler" })
      .returning();

    return c.json({ success: true, data: newSantri }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET: Histori mutaba'ah per santri
santriRoute.get("/:id/history", async (c) => {
  try {
    const santriId = Number(c.req.param("id"));
    const history = await db
      .select()
      .from(logMutabaah)
      .where(eq(logMutabaah.santriId, santriId));

    return c.json({ success: true, data: history });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default santriRoute;
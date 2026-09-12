import { Hono } from "hono";
import { db } from "../db/index.js";
import { santri, logMutabaah } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";

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

// GET: Direct /:id atau /:id/history agar dua-duanya aman dipanggil frontend
santriRoute.get("/:id", async (c) => {
  try {
    const santriId = Number(c.req.param("id"));
    const history = await db
      .select()
      .from(logMutabaah)
      .where(eq(logMutabaah.santriId, santriId))
      .orderBy(desc(logMutabaah.id));

    return c.json({ success: true, data: history, history });
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
      .where(eq(logMutabaah.santriId, santriId))
      .orderBy(desc(logMutabaah.id));

    return c.json({ success: true, data: history, history });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default santriRoute;
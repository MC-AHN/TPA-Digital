import { Hono } from "hono";
import { db } from "../db/index.js";
import { logMutabaah } from "../db/schema.js";

const mutabaahRoute = new Hono();

// POST: Input mutaba'ah harian
mutabaahRoute.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { santriId, ustadzId, statusAbsen, catatanAbsen, tipeBacaan, capaian, catatan } = body;

    if (!santriId || !statusAbsen) {
      return c.json({ success: false, message: "Data tidak lengkap" }, 400);
    }

    const isHadir = statusAbsen === "hadir";

    const [newLog] = await db
      .insert(logMutabaah)
      .values({
        santriId,
        ustadzId,
        statusAbsen,
        catatanAbsen: !isHadir ? (catatanAbsen || null) : null,
        tipeBacaan: isHadir ? tipeBacaan : null,
        capaian: isHadir ? capaian : null,
        catatan: isHadir ? catatan : null,
      })
      .returning();

    return c.json({ success: true, data: newLog }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default mutabaahRoute;
import { Hono } from "hono";
import { db } from "../db/index.js";
import { logMutabaah, santri } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { realtimeEvents } from "../index.js"; // Import event emitter

const mutabaahRoute = new Hono();

// POST: Input mutaba'ah harian
mutabaahRoute.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { santriId, ustadzId, statusAbsen, catatanAbsen, tipeBacaan, capaian, catatan, evaluasi } = body;

    if (!santriId || !statusAbsen) {
      return c.json({ success: false, message: "Data tidak lengkap" }, 400);
    }

    const [dataSantri] = await db.select().from(santri).where(eq(santri.id, Number(santriId)));
    const isHadir = statusAbsen === "hadir";
    const today = new Date().toISOString().split("T")[0];

    const [newLog] = await db
      .insert(logMutabaah)
      .values({
        santriId: Number(santriId),
        ustadzId: Number(ustadzId),
        halaqahId: dataSantri ? dataSantri.halaqahId : null,
        tanggal: today,
        statusAbsen,
        catatanAbsen: !isHadir ? (catatanAbsen || null) : null,
        tipeBacaan: isHadir ? tipeBacaan : null,
        capaian: isHadir ? capaian : null,
        catatan: isHadir ? (catatan || evaluasi || null) : null,
      })
      .returning();

    // TRIGGER REALTIME BROADCAST
    realtimeEvents.emit("update", {
      action: "INSERT",
      santriId: Number(santriId),
      data: newLog,
    });

    return c.json({ success: true, data: newLog }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT: Edit mutaba'ah
mutabaahRoute.put("/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const body = await c.req.json();
    const { statusAbsen, tipeBacaan, capaian, evaluasi, catatan } = body;

    const [updated] = await db
      .update(logMutabaah)
      .set({
        statusAbsen,
        tipeBacaan,
        capaian,
        catatan: catatan || evaluasi || null,
      })
      .where(eq(logMutabaah.id, id))
      .returning();

    // TRIGGER REALTIME BROADCAST
    if (updated) {
      realtimeEvents.emit("update", {
        action: "UPDATE",
        santriId: updated.santriId,
        data: updated,
      });
    }

    return c.json({ success: true, data: updated });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE: Hapus mutaba'ah
mutabaahRoute.delete("/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const [deleted] = await db.delete(logMutabaah).where(eq(logMutabaah.id, id)).returning();

    // TRIGGER REALTIME BROADCAST
    if (deleted) {
      realtimeEvents.emit("update", {
        action: "DELETE",
        santriId: deleted.santriId,
      });
    }

    return c.json({ success: true, message: "Data mutaba'ah berhasil dihapus" });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default mutabaahRoute;
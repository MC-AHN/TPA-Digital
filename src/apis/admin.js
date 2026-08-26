import { Hono } from "hono";
import { db } from "../db/index.js";
import { ustadz, halaqah, santri } from "../db/schema.js";
import { eq } from "drizzle-orm";

const adminRoute = new Hono();

// --- KELOLA USTADZ ---
adminRoute.get("/ustadz", async (c) => {
  const onlyUstadz = c.req.query("role");
  
  let query = db.select({ id: ustadz.id, username: ustadz.username, role: ustadz.role }).from(ustadz);
  
  if (onlyUstadz) {
    query = query.where(eq(ustadz.role, onlyUstadz));
  }

  const data = await query;
  return c.json({ success: true, data });
});

adminRoute.post("/ustadz", async (c) => {
  const { username, password, role } = await c.req.json();
  if (!username || !password) return c.json({ success: false, message: "Username & password wajib" }, 400);

  const [newUser] = await db.insert(ustadz).values({ username, password, role: role || "ustadz" }).returning();
  return c.json({ success: true, data: newUser }, 201);
});

adminRoute.put("/ustadz/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const { username, password, role } = await c.req.json();
  const updateData = { username, role };
  if (password) updateData.password = password;

  await db.update(ustadz).set(updateData).where(eq(ustadz.id, id));
  return c.json({ success: true, message: "Ustadz diperbarui" });
});

adminRoute.delete("/ustadz/:id", async (c) => {
  const id = Number(c.req.param("id"));
  await db.delete(ustadz).where(eq(ustadz.id, id));
  return c.json({ success: true, message: "Ustadz dihapus" });
});

// --- KELOLA HALAQAH ---
adminRoute.get("/halaqah", async (c) => {
  const data = await db
    .select({
      id: halaqah.id,
      namaHalaqah: halaqah.namaHalaqah,
      ustadzPjId: halaqah.ustadzPjId,
      namaUstadz: ustadz.username,
    })
    .from(halaqah)
    .leftJoin(ustadz, eq(halaqah.ustadzPjId, ustadz.id));
  return c.json({ success: true, data });
});

adminRoute.post("/halaqah", async (c) => {
  const { namaHalaqah, ustadzPjId } = await c.req.json();
  if (!namaHalaqah) return c.json({ success: false, message: "Nama halaqah wajib" }, 400);

  const [newHalaqah] = await db.insert(halaqah).values({ namaHalaqah, ustadzPjId: Number(ustadzPjId) || null }).returning();
  return c.json({ success: true, data: newHalaqah }, 201);
});

adminRoute.put("/halaqah/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const { namaHalaqah, ustadzPjId } = await c.req.json();
  await db.update(halaqah).set({ namaHalaqah, ustadzPjId: Number(ustadzPjId) || null }).where(eq(halaqah.id, id));
  return c.json({ success: true, message: "Halaqah diperbarui" });
});

adminRoute.delete("/halaqah/:id", async (c) => {
  const id = Number(c.req.param("id"));
  await db.delete(halaqah).where(eq(halaqah.id, id));
  return c.json({ success: true, message: "Halaqah dihapus" });
});

// --- KELOLA SANTRI ---
adminRoute.get("/santri", async (c) => {
  const data = await db
    .select({
      id: santri.id,
      nama: santri.nama,
      kategori: santri.kategori,
      status: santri.status,
      halaqahId: santri.halaqahId,
      namaHalaqah: halaqah.namaHalaqah,
    })
    .from(santri)
    .leftJoin(halaqah, eq(santri.halaqahId, halaqah.id));
  return c.json({ success: true, data });
});

adminRoute.post("/santri", async (c) => {
  const { nama, kategori, halaqahId } = await c.req.json();
  if (!nama) return c.json({ success: false, message: "Nama santri wajib" }, 400);

  const [newSantri] = await db.insert(santri).values({
    nama,
    kategori: kategori || "reguler",
    halaqahId: halaqahId ? Number(halaqahId) : null,
  }).returning();
  return c.json({ success: true, data: newSantri }, 201);
});

adminRoute.put("/santri/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const { nama, kategori, halaqahId } = await c.req.json();
  await db.update(santri).set({
    nama,
    kategori,
    halaqahId: halaqahId ? Number(halaqahId) : null,
  }).where(eq(santri.id, id));
  return c.json({ success: true, message: "Santri diperbarui" });
});

adminRoute.delete("/santri/:id", async (c) => {
  const id = Number(c.req.param("id"));
  await db.delete(santri).where(eq(santri.id, id));
  return c.json({ success: true, message: "Santri dihapus" });
});

export default adminRoute;
import { Hono } from "hono";
import { db } from "../db/index.js";
import { ustadz, halaqah, santri } from "../db/schema.js";
import { eq } from "drizzle-orm";

const adminRoute = new Hono();

// ==========================================
// KELOLA USTADZ (Murni Data Akun & Role)
// ==========================================

// GET: Ambil daftar ustadz (Bisa difilter berdasarkan role)
adminRoute.get("/ustadz", async (c) => {
  try {
    const roleFilter = c.req.query("role");
    
    let query = db
      .select({ 
        id: ustadz.id, 
        username: ustadz.username, 
        role: ustadz.role 
      })
      .from(ustadz);
    
    if (roleFilter) {
      query = query.where(eq(ustadz.role, roleFilter));
    }

    const data = await query;
    return c.json({ success: true, data });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// POST: Tambah Akun Ustadz / Admin Baru
adminRoute.post("/ustadz", async (c) => {
  try {
    const { username, password, role } = await c.req.json();
    if (!username || !password) {
      return c.json({ success: false, message: "Username & password wajib diisi" }, 400);
    }

    const [newUser] = await db
      .insert(ustadz)
      .values({ 
        username, 
        password, 
        role: role || "ustadz"
      })
      .returning();

    return c.json({ success: true, data: newUser }, 201);
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// PUT: Edit Username / Role / Reset Password Ustadz
adminRoute.put("/ustadz/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const { username, password, role } = await c.req.json();

    if (!username) {
      return c.json({ success: false, message: "Username tidak boleh kosong" }, 400);
    }

    const updateData = {
      username,
      role: role || "ustadz"
    };
    
    // Hanya update password jika admin mengisikan password baru
    if (password && typeof password === "string" && password.trim() !== "") {
      updateData.password = password.trim();
    }

    await db.update(ustadz).set(updateData).where(eq(ustadz.id, id));
    return c.json({ success: true, message: "Data ustadz / password berhasil diperbarui" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// DELETE: Hapus Akun Ustadz
adminRoute.delete("/ustadz/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    await db.delete(ustadz).where(eq(ustadz.id, id));
    return c.json({ success: true, message: "Ustadz berhasil dihapus" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ==========================================
// KELOLA HALAQAH
// ==========================================
adminRoute.get("/halaqah", async (c) => {
  try {
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
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

adminRoute.post("/halaqah", async (c) => {
  try {
    const { namaHalaqah, ustadzPjId } = await c.req.json();
    if (!namaHalaqah) return c.json({ success: false, message: "Nama halaqah wajib" }, 400);

    const [newHalaqah] = await db.insert(halaqah).values({ 
      namaHalaqah, 
      ustadzPjId: ustadzPjId ? Number(ustadzPjId) : null 
    }).returning();
    return c.json({ success: true, data: newHalaqah }, 201);
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

adminRoute.put("/halaqah/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const { namaHalaqah, ustadzPjId } = await c.req.json();
    await db.update(halaqah).set({ 
      namaHalaqah, 
      ustadzPjId: ustadzPjId ? Number(ustadzPjId) : null 
    }).where(eq(halaqah.id, id));
    return c.json({ success: true, message: "Halaqah diperbarui" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

adminRoute.delete("/halaqah/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    await db.delete(halaqah).where(eq(halaqah.id, id));
    return c.json({ success: true, message: "Halaqah dihapus" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ==========================================
// KELOLA SANTRI
// ==========================================
adminRoute.get("/santri", async (c) => {
  try {
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
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

adminRoute.post("/santri", async (c) => {
  try {
    const { nama, kategori, halaqahId } = await c.req.json();
    if (!nama) return c.json({ success: false, message: "Nama santri wajib" }, 400);

    const [newSantri] = await db.insert(santri).values({
      nama,
      kategori: kategori || "reguler",
      halaqahId: halaqahId ? Number(halaqahId) : null,
    }).returning();
    return c.json({ success: true, data: newSantri }, 201);
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

adminRoute.put("/santri/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const { nama, kategori, halaqahId } = await c.req.json();
    await db.update(santri).set({
      nama,
      kategori,
      halaqahId: halaqahId ? Number(halaqahId) : null,
    }).where(eq(santri.id, id));
    return c.json({ success: true, message: "Santri diperbarui" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

adminRoute.delete("/santri/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    await db.delete(santri).where(eq(santri.id, id));
    return c.json({ success: true, message: "Santri dihapus" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

export default adminRoute;
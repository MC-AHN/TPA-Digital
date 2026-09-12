import { Hono } from "hono";
import { sign } from "hono/jwt";
import { db } from "../db/index.js";
import { ustadz, absenUstadz } from "../db/schema.js";
import { eq, and, sql } from "drizzle-orm";

const login = new Hono();
const JWT_SECRET = process.env.JWT_SECRET || "tpa_secret_key_123";

login.post("/", async (c) => {
  try {
    // 1. Terima parameter isAbsen dari frontend
    const { username, password, keteranganIzin, isAbsen } = await c.req.json();

    if (!username || !password) {
      return c.json({ success: false, message: "Username dan password wajib diisi" }, 400);
    }

    // 2. Case-insensitive username lookup
    const cleanUsername = username.trim().toLowerCase();
    const [user] = await db
      .select()
      .from(ustadz)
      .where(eq(sql`LOWER(${ustadz.username})`, cleanUsername));

    if (!user || user.password !== password) {
      return c.json({ success: false, message: "Username atau password salah" }, 401);
    }

    if (user.status === "nonaktif") {
      return c.json({ success: false, message: "Akun Anda telah dinonaktifkan oleh Admin" }, 403);
    }

    const today = new Date().toISOString().split("T")[0];

    // Function helper generator JWT Token
    const generateToken = async () => {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const expSeconds = Math.floor(endOfDay.getTime() / 1000);

      const payload = {
        id: user.id,
        username: user.username,
        role: user.role,
        exp: expSeconds,
      };

      return await sign(payload, JWT_SECRET);
    };

    // 3. JIKA USER ADALAH ADMIN: Tanpa catat absen, langsung beri token
    if (user.role === "admin") {
      const token = await generateToken();
      return c.json({
        success: true,
        isIzin: false,
        message: "Login Admin berhasil",
        data: {
          token,
          user: { id: user.id, username: user.username, role: user.role },
        },
      });
    }

    // 4. JIKA USER ADALAH USTADZ:
    // A. Jika Mengisi Keterangan Izin
    if (keteranganIzin && keteranganIzin.trim() !== "") {
      const [existingAbsen] = await db
        .select()
        .from(absenUstadz)
        .where(and(eq(absenUstadz.ustadzId, user.id), eq(absenUstadz.tanggal, today)));

      if (existingAbsen) {
        await db
          .update(absenUstadz)
          .set({ status: "izin", keterangan: keteranganIzin })
          .where(eq(absenUstadz.id, existingAbsen.id));
      } else {
        await db.insert(absenUstadz).values({
          ustadzId: user.id,
          tanggal: today,
          status: "izin",
          keterangan: keteranganIzin,
        });
      }

      return c.json({
        success: true,
        isIzin: true,
        message: "Laporan izin berhasil dicatat. Semoga urusan lancar/lekas sembuh!",
      });
    }

    // B. Jika Checkbox Absen Dicentang (isAbsen === true)
    if (isAbsen) {
      const [existingAbsen] = await db
        .select()
        .from(absenUstadz)
        .where(and(eq(absenUstadz.ustadzId, user.id), eq(absenUstadz.tanggal, today)));

      if (existingAbsen) {
        await db
          .update(absenUstadz)
          .set({ status: "hadir", keterangan: null })
          .where(eq(absenUstadz.id, existingAbsen.id));
      } else {
        await db.insert(absenUstadz).values({
          ustadzId: user.id,
          tanggal: today,
          status: "hadir",
          keterangan: null,
        });
      }
    }

    // C. Kembalikan Token & Login (Baik centang absen maupun hanya sekadar login)
    const token = await generateToken();

    return c.json({
      success: true,
      isIzin: false,
      message: isAbsen ? "Login dan presensi berhasil" : "Login berhasil (Tanpa presensi)",
      data: {
        token,
        user: { id: user.id, username: user.username, role: user.role },
      },
    });

  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET: Histori presensi pribadi Ustadz
login.get("/history/:ustadzId", async (c) => {
  try {
    const ustadzId = Number(c.req.param("ustadzId"));
    const history = await db
      .select()
      .from(absenUstadz)
      .where(eq(absenUstadz.ustadzId, ustadzId))
      .orderBy(sql`${absenUstadz.tanggal} DESC`);

    return c.json({ success: true, data: history });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET: Ambil daftar presensi seluruh ustadz berdasarkan tanggal (untuk Admin)
login.get("/absen-ustadz", async (c) => {
  try {
    const tanggal = c.req.query("tanggal") || new Date().toISOString().split("T")[0];

    // Ambil semua ustadz
    const listUstadz = await db
      .select({ id: ustadz.id, username: ustadz.username })
      .from(ustadz)
      .where(eq(ustadz.role, "ustadz"));

    // Ambil absen pada tanggal tersebut
    const listAbsen = await db
      .select()
      .from(absenUstadz)
      .where(eq(absenUstadz.tanggal, tanggal));

    const result = listUstadz.map((u) => {
      const absen = listAbsen.find((a) => a.ustadzId === u.id);
      return {
        id: u.id,
        absenId: absen ? absen.id : null,
        username: u.username,
        status: absen ? absen.status : "Belum Absen",
        keterangan: absen ? absen.keterangan : null,
      };
    });

    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT: Admin Edit Presensi Ustadz
login.put("/history/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const { status, keterangan } = await c.req.json();

    const [updated] = await db
      .update(absenUstadz)
      .set({ status, keterangan: keterangan || null })
      .where(eq(absenUstadz.id, id))
      .returning();

    return c.json({ success: true, data: updated });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE: Admin Hapus Presensi Ustadz
login.delete("/history/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    await db.delete(absenUstadz).where(eq(absenUstadz.id, id));
    return c.json({ success: true, message: "Presensi ustadz berhasil dihapus" });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default login;
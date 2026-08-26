import { Hono } from "hono";
import { sign } from "hono/jwt";
import { db } from "../db/index.js";
import { ustadz, absenUstadz } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

const login = new Hono();
const JWT_SECRET = process.env.JWT_SECRET || "tpa_secret_key_123";

login.post("/", async (c) => {
  try {
    const { username, password, keteranganIzin } = await c.req.json();

    if (!username || !password) {
      return c.json({ success: false, message: "Username dan password wajib diisi" }, 400);
    }

    const [user] = await db
      .select()
      .from(ustadz)
      .where(eq(ustadz.username, username));

    if (!user || user.password !== password) {
      return c.json({ success: false, message: "Username atau password salah" }, 401);
    }
    
    if (user.status === "nonaktif") {
      return c.json({ success: false, message: "Akun Anda telah dinonaktifkan oleh Admin" }, 403);
    }

    const today = new Date().toISOString().split("T")[0];

    // JIKA USER ADALAH ADMIN: Tanpa absen ustadz, langsung beri token
    if (user.role === "admin") {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const expSeconds = Math.floor(endOfDay.getTime() / 1000);

      const payload = {
        id: user.id,
        username: user.username,
        role: user.role,
        exp: expSeconds,
      };

      const token = await sign(payload, JWT_SECRET);

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

    // JIKA USER ADALAH USTADZ: Jalankan logika Presensi Harian Ustadz
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

    // Ustadz Login Hadir
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

    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const expSeconds = Math.floor(endOfDay.getTime() / 1000);

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      exp: expSeconds,
    };

    const token = await sign(payload, JWT_SECRET);

    return c.json({
      success: true,
      isIzin: false,
      message: "Login dan presensi berhasil",
      data: {
        token,
        user: { id: user.id, username: user.username, role: user.role },
      },
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default login;
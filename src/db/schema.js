// src/db/schema.js
import { pgTable, serial, varchar, text, integer, timestamp, date } from "drizzle-orm/pg-core";

// 1. Table Ustadz (Pengurus/Ustadz)
export const ustadz = pgTable("ustadz", {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 100 }).notNull().unique(),
    password: varchar("password", { length: 256 }).notNull(),
    role: varchar("role", { length: 20 }).default("ustadz").notNull(), // 'admin' | 'ustadz'
    status: varchar("status", { length: 20 }).default("aktif").notNull(), // 'aktif' | 'nonaktif'
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabel Log Presensi Ustadz Harian
export const absenUstadz = pgTable("absen_ustadz", {
    id: serial("id").primaryKey(),
    ustadzId: integer("ustadz_id").references(() => ustadz.id).notNull(),
    tanggal: date("tanggal").defaultNow().notNull(), // Tanggal hari ini
    status: varchar("status", { length: 20 }).default("hadir").notNull(), // 'hadir' | 'izin'
    keterangan: text("keterangan"), // Misal: "Sakit demam", "Ada acara keluarga"
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const halaqah = pgTable("halaqah_tpa", {
    id: serial("id").primaryKey(),
    namaHalaqah: varchar("nama_halaqah", { length: 100 }).notNull(),
    ustadzPjId: integer("ustadz_pj_id").references(() => ustadz.id), // Ustadz Penanggung Jawab Utama
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Table Santri
export const santri = pgTable("santri_tpa", {
    id: serial("id").primaryKey(),
    nama: varchar("nama", { length: 256 }).notNull(),
    kategori: varchar("kategori", { length: 20 }).default("reguler").notNull(), // 'reguler' (3x/minggu), 'khusus' (5x/minggu)
    status: varchar("status", { length: 20 }).default("aktif").notNull(), // 'aktif', 'nonaktif'
    halaqahId: integer("halaqah_id").references(() => halaqah.id), // Santri terikat ke Halaqah mana
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Table Log Mutabaah (Catatan Absen & Mengaji Harian)
export const logMutabaah = pgTable("log_mutabaah_tpa", {
    id: serial("id").primaryKey(),
    santriId: integer("santri_id")
        .references(() => santri.id)
        .notNull(),
    halaqahId: integer("halaqah_id").references(() => halaqah.id), // Terdaftar di halaqah mana saat diisi
    ustadzId: integer("ustadz_id")
        .references(() => ustadz.id), // Siapa ustadz yang menginput
    tanggal: date("tanggal").defaultNow().notNull(),

    // Status Kehadiran
    statusAbsen: varchar("status_absen", { length: 20 }).default("hadir").notNull(), // 'hadir', 'izin', 'sakit', 'alpa'
    catatanAbsen: text("catatan_absen"), // Opsional: Keterangan izin/sakit/alpa

    // Progress Mengaji
    tipeBacaan: varchar("tipe_bacaan", { length: 20 }), // 'iqra', 'quran'
    capaian: varchar("capaian", { length: 100 }), // e.g., "Jilid 3 Hal 12" atau "An-Naba: 1-15"
    catatan: varchar("catatan", { length: 50 }), // e.g., 'lancar', 'ulangi', 'lanjut_jilid', 'kurang_fashih'

    createdAt: timestamp("created_at").defaultNow().notNull(),
});
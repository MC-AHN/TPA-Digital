CREATE TABLE "log_mutabaah_tpa" (
	"id" serial PRIMARY KEY NOT NULL,
	"santri_id" integer NOT NULL,
	"ustadz_id" integer,
	"tanggal" date DEFAULT now() NOT NULL,
	"status_absen" varchar(20) DEFAULT 'hadir' NOT NULL,
	"tipe_bacaan" varchar(20),
	"capaian" varchar(100),
	"catatan" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "santri_tpa" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" varchar(256) NOT NULL,
	"kategori" varchar(20) DEFAULT 'reguler' NOT NULL,
	"status" varchar(20) DEFAULT 'aktif' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ustadz" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(100) NOT NULL,
	"password" varchar(256) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ustadz_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "log_mutabaah_tpa" ADD CONSTRAINT "log_mutabaah_tpa_santri_id_santri_tpa_id_fk" FOREIGN KEY ("santri_id") REFERENCES "public"."santri_tpa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log_mutabaah_tpa" ADD CONSTRAINT "log_mutabaah_tpa_ustadz_id_ustadz_id_fk" FOREIGN KEY ("ustadz_id") REFERENCES "public"."ustadz"("id") ON DELETE no action ON UPDATE no action;
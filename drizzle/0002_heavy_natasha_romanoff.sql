CREATE TABLE "absen_ustadz_tpa" (
	"id" serial PRIMARY KEY NOT NULL,
	"ustadz_id" integer NOT NULL,
	"tanggal" date DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'hadir' NOT NULL,
	"keterangan" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "halaqah_tpa" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_halaqah" varchar(100) NOT NULL,
	"ustadz_pj_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "log_mutabaah_tpa" ADD COLUMN "halaqah_id" integer;--> statement-breakpoint
ALTER TABLE "santri_tpa" ADD COLUMN "halaqah_id" integer;--> statement-breakpoint
ALTER TABLE "ustadz" ADD COLUMN "role" varchar(20) DEFAULT 'ustadz' NOT NULL;--> statement-breakpoint
ALTER TABLE "ustadz" ADD COLUMN "status_harian" varchar(20) DEFAULT 'hadir' NOT NULL;--> statement-breakpoint
ALTER TABLE "absen_ustadz_tpa" ADD CONSTRAINT "absen_ustadz_tpa_ustadz_id_ustadz_id_fk" FOREIGN KEY ("ustadz_id") REFERENCES "public"."ustadz"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "halaqah_tpa" ADD CONSTRAINT "halaqah_tpa_ustadz_pj_id_ustadz_id_fk" FOREIGN KEY ("ustadz_pj_id") REFERENCES "public"."ustadz"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log_mutabaah_tpa" ADD CONSTRAINT "log_mutabaah_tpa_halaqah_id_halaqah_tpa_id_fk" FOREIGN KEY ("halaqah_id") REFERENCES "public"."halaqah_tpa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "santri_tpa" ADD CONSTRAINT "santri_tpa_halaqah_id_halaqah_tpa_id_fk" FOREIGN KEY ("halaqah_id") REFERENCES "public"."halaqah_tpa"("id") ON DELETE no action ON UPDATE no action;
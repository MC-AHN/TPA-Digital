ALTER TABLE "absen_ustadz_tpa" RENAME TO "absen_ustadz";--> statement-breakpoint
ALTER TABLE "absen_ustadz" DROP CONSTRAINT "absen_ustadz_tpa_ustadz_id_ustadz_id_fk";
--> statement-breakpoint
ALTER TABLE "absen_ustadz" ADD CONSTRAINT "absen_ustadz_ustadz_id_ustadz_id_fk" FOREIGN KEY ("ustadz_id") REFERENCES "public"."ustadz"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ustadz" DROP COLUMN "status_harian";
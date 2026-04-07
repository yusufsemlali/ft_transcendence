ALTER TABLE "auth"."sessions" ADD COLUMN "browser_name" text;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD COLUMN "browser_version" text;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD COLUMN "os_name" text;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD COLUMN "os_version" text;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD COLUMN "device_type" text;

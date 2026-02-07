CREATE TABLE "user_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"theme" varchar(50) DEFAULT 'default' NOT NULL,
	"custom_theme" boolean DEFAULT false NOT NULL,
	"custom_theme_colors" jsonb,
	"font_family" varchar(50) DEFAULT 'roboto_mono' NOT NULL,
	"font_size" real DEFAULT 1 NOT NULL,
	"custom_background" varchar(2048),
	"custom_background_size" varchar(20) DEFAULT 'cover',
	"custom_background_filter" jsonb DEFAULT '[0.5,0.2,2,1]'::jsonb NOT NULL,
	"smooth_animations" boolean DEFAULT true NOT NULL,
	"show_keyboard_shortcuts" boolean DEFAULT true NOT NULL,
	"compact_mode" boolean DEFAULT false NOT NULL,
	"auto_switch_theme" boolean DEFAULT false NOT NULL,
	"sound_enabled" boolean DEFAULT true NOT NULL,
	"sound_volume" real DEFAULT 0.5 NOT NULL,
	"desktop_notifications" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
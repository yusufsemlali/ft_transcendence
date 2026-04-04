CREATE SCHEMA IF NOT EXISTS "auth";
--> statement-breakpoint
CREATE TYPE "public"."bracket_type" AS ENUM('single_elimination', 'double_elimination', 'round_robin', 'swiss', 'free_for_all');--> statement-breakpoint
CREATE TYPE "public"."friendship_status" AS ENUM('pending', 'accepted', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('pending', 'ongoing', 'completed', 'disputed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('friend_request', 'tournament_invite', 'match_starting', 'achievement_unlocked', 'system_alert');--> statement-breakpoint
CREATE TYPE "public"."org_role" AS ENUM('owner', 'admin', 'referee', 'member');--> statement-breakpoint
CREATE TYPE "public"."scoring_type" AS ENUM('points_high', 'time_low', 'sets', 'binary');--> statement-breakpoint
CREATE TYPE "public"."tournament_status" AS ENUM('draft', 'registration', 'upcoming', 'ongoing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin', 'moderator', 'organizer');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'banned', 'muted');--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(24) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"display_name" varchar(50),
	"bio" text,
	"tagline" varchar(100),
	"avatar" text DEFAULT 'https://cdn-icons-png.flaticon.com/512/149/149071.png' NOT NULL,
	"banner" text,
	"xp" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"elo_rating" integer DEFAULT 1000 NOT NULL,
	"rank_tier" varchar(20) DEFAULT 'Unranked',
	"fortytwo_id" integer,
	"discord_id" varchar(50),
	"is_online" boolean DEFAULT false NOT NULL,
	"last_active_at" timestamp DEFAULT now() NOT NULL,
	"status_message" varchar(140),
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_secret" text,
	"preferred_language" varchar(5) DEFAULT 'en',
	"theme" varchar(10) DEFAULT 'dark',
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"email_confirmed_at" timestamp,
	"last_sign_in_at" timestamp,
	"banned_until" timestamp,
	"ban_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_fortytwo_id_unique" UNIQUE("fortytwo_id"),
	CONSTRAINT "users_discord_id_unique" UNIQUE("discord_id")
);
--> statement-breakpoint
CREATE TABLE "auth"."sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_agent" text,
	"ip_address" "inet",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "auth"."identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_id" text NOT NULL,
	"identity_data" text,
	"last_sign_in_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"token" text NOT NULL,
	"parent" text,
	"revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" uuid NOT NULL,
	"receiver_id" uuid NOT NULL,
	"status" "friendship_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "friendships_sender_id_receiver_id_unique" UNIQUE("sender_id","receiver_id")
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"sport_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"description" text,
	"status" "tournament_status" DEFAULT 'draft' NOT NULL,
	"bracket_type" "bracket_type" DEFAULT 'single_elimination' NOT NULL,
	"max_participants" integer NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"join_code" varchar(20),
	"prize_pool" text,
	"entry_fee" integer DEFAULT 0,
	"banner_url" text,
	"registration_opens_at" timestamp,
	"registration_closes_at" timestamp,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tournaments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"participant1_id" uuid,
	"participant2_id" uuid,
	"score1" integer DEFAULT 0,
	"score2" integer DEFAULT 0,
	"winner_id" uuid,
	"status" "match_status" DEFAULT 'pending' NOT NULL,
	"round" integer NOT NULL,
	"position" integer NOT NULL,
	"next_match_id" uuid,
	"match_stats" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"scheduled_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
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
	"theme_mode" varchar(20) DEFAULT 'system' NOT NULL,
	"sound_enabled" boolean DEFAULT true NOT NULL,
	"sound_volume" real DEFAULT 0.5 NOT NULL,
	"desktop_notifications" boolean DEFAULT false NOT NULL,
	"theme_hue" real DEFAULT 344 NOT NULL,
	"border_radius" real DEFAULT 10 NOT NULL,
	"glass_blur" real DEFAULT 12 NOT NULL,
	"glass_opacity" real DEFAULT 0.1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "org_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_members_organization_id_user_id_pk" PRIMARY KEY("organization_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"description" text,
	"logo_url" text,
	"visibility" varchar DEFAULT 'public' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" varchar(50) NOT NULL,
	"scoring_type" "scoring_type" DEFAULT 'points_high' NOT NULL,
	"is_team_based" boolean DEFAULT true NOT NULL,
	CONSTRAINT "sports_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "game_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"sport_id" uuid NOT NULL,
	"game_identifier" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "game_profiles_user_id_sport_id_unique" UNIQUE("user_id","sport_id")
);
--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."identities" ADD CONSTRAINT "identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_profiles" ADD CONSTRAINT "game_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_profiles" ADD CONSTRAINT "game_profiles_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_org_members_user" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_org_members_org" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_owner_per_org" ON "organization_members" USING btree ("organization_id") WHERE role = 'owner';
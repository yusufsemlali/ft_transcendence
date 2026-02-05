CREATE TYPE "public"."bracket_type" AS ENUM('single_elimination', 'double_elimination', 'round_robin', 'swiss');--> statement-breakpoint
CREATE TYPE "public"."friendship_status" AS ENUM('pending', 'accepted', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('pending', 'ongoing', 'completed', 'disputed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('friend_request', 'tournament_invite', 'match_starting', 'achievement_unlocked', 'system_alert');--> statement-breakpoint
CREATE TYPE "public"."tournament_status" AS ENUM('draft', 'registration', 'upcoming', 'ongoing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin', 'moderator', 'organizer');--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"receiver_id" integer NOT NULL,
	"status" "friendship_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "friendships_sender_id_receiver_id_unique" UNIQUE("sender_id","receiver_id")
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"description" text,
	"organizer_id" integer NOT NULL,
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
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"participant1_id" integer,
	"participant2_id" integer,
	"score1" integer DEFAULT 0,
	"score2" integer DEFAULT 0,
	"winner_id" integer,
	"status" "match_status" DEFAULT 'pending' NOT NULL,
	"round" integer NOT NULL,
	"position" integer NOT NULL,
	"next_match_id" integer,
	"match_stats" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"scheduled_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "username" SET DATA TYPE varchar(24);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "display_name" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tagline" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar" text DEFAULT 'https://cdn-icons-png.flaticon.com/512/149/149071.png' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "banner" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "xp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "elo_rating" integer DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "rank_tier" varchar(20) DEFAULT 'Unranked';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "fortytwo_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "discord_id" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_online" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_active_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status_message" varchar(140);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_secret" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_language" varchar(5) DEFAULT 'en';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "theme" varchar(10) DEFAULT 'dark';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_fortytwo_id_unique" UNIQUE("fortytwo_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_discord_id_unique" UNIQUE("discord_id");
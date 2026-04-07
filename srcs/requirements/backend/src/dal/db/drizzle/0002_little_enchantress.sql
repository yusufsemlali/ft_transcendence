CREATE TYPE "public"."sport_category" AS ENUM('esports', 'physical', 'tabletop', 'custom');--> statement-breakpoint
CREATE TYPE "public"."sport_mode" AS ENUM('1v1', 'team', 'ffa');--> statement-breakpoint
CREATE TYPE "public"."entrant_status" AS ENUM('incomplete', 'ready', 'disqualified');--> statement-breakpoint
CREATE TYPE "public"."lobby_status" AS ENUM('solo', 'invited', 'rostered');--> statement-breakpoint
CREATE TYPE "public"."roster_role" AS ENUM('captain', 'player', 'substitute');--> statement-breakpoint
ALTER TYPE "public"."scoring_type" ADD VALUE 'stocks';--> statement-breakpoint
CREATE TABLE "entrant_rosters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entrant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "roster_role" DEFAULT 'player' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "entrant_rosters_entrant_id_user_id_unique" UNIQUE("entrant_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "tournament_entrants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" "entrant_status" DEFAULT 'incomplete' NOT NULL,
	"seed" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"inviter_id" uuid NOT NULL,
	"target_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tournament_invites_team_id_target_user_id_unique" UNIQUE("team_id","target_user_id")
);
--> statement-breakpoint
CREATE TABLE "tournament_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "lobby_status" DEFAULT 'solo' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tournament_players_tournament_id_user_id_unique" UNIQUE("tournament_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "friendships" DROP CONSTRAINT "friendships_sender_id_receiver_id_unique";--> statement-breakpoint
ALTER TABLE "auth"."users" ALTER COLUMN "preferred_language" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."users" ALTER COLUMN "theme" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sports" ALTER COLUMN "category" SET DATA TYPE "public"."sport_category" USING "category"::"public"."sport_category";--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD COLUMN "browser_name" text;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD COLUMN "browser_version" text;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD COLUMN "os_name" text;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD COLUMN "os_version" text;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD COLUMN "device_type" text;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "scoring_type" "scoring_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "match_config_schema" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "mode" "sport_mode" NOT NULL;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "min_team_size" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "max_team_size" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "allow_draws" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "required_handle_type" varchar(50);--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "min_participants" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "custom_settings" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "match_config_schema" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "theme_color" varchar(7) DEFAULT '#e8366d' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "color_harmony" varchar(20) DEFAULT 'complementary' NOT NULL;--> statement-breakpoint
ALTER TABLE "sports" ADD COLUMN "mode" "sport_mode" DEFAULT 'team' NOT NULL;--> statement-breakpoint
ALTER TABLE "sports" ADD COLUMN "required_handle_type" varchar(50);--> statement-breakpoint
ALTER TABLE "sports" ADD COLUMN "default_min_team_size" integer;--> statement-breakpoint
ALTER TABLE "sports" ADD COLUMN "default_max_team_size" integer;--> statement-breakpoint
ALTER TABLE "sports" ADD COLUMN "default_has_draws" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sports" ADD COLUMN "tournament_config_schema" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "sports" ADD COLUMN "match_config_schema" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "sports" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sports" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "entrant_rosters" ADD CONSTRAINT "entrant_rosters_entrant_id_tournament_entrants_id_fk" FOREIGN KEY ("entrant_id") REFERENCES "public"."tournament_entrants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entrant_rosters" ADD CONSTRAINT "entrant_rosters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_entrants" ADD CONSTRAINT "tournament_entrants_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_invites" ADD CONSTRAINT "tournament_invites_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_invites" ADD CONSTRAINT "tournament_invites_team_id_tournament_entrants_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."tournament_entrants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_invites" ADD CONSTRAINT "tournament_invites_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_invites" ADD CONSTRAINT "tournament_invites_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_players" ADD CONSTRAINT "tournament_players_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_players" ADD CONSTRAINT "tournament_players_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unq_friendship" ON "friendships" USING btree (LEAST("sender_id", "receiver_id"),GREATEST("sender_id", "receiver_id"));--> statement-breakpoint
ALTER TABLE "tournaments" DROP COLUMN "metadata";--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "theme_hue";--> statement-breakpoint
ALTER TABLE "sports" DROP COLUMN "is_team_based";
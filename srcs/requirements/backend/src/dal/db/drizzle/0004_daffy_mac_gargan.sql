CREATE TABLE "game_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"game" "supported_game" NOT NULL,
	"game_identifier" varchar(255) NOT NULL,
	"rank" varchar(50) DEFAULT 'Unranked',
	"level" integer DEFAULT 0,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_proof" text,
	"is_visible" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "game_profiles_user_id_game_unique" UNIQUE("user_id","game"),
	CONSTRAINT "game_profiles_game_game_identifier_unique" UNIQUE("game","game_identifier")
);
--> statement-breakpoint
ALTER TABLE "game_profiles" ADD CONSTRAINT "game_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
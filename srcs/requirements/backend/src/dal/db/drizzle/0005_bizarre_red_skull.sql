ALTER TABLE "game_profiles" ALTER COLUMN "game" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."supported_game";--> statement-breakpoint
CREATE TYPE "public"."supported_game" AS ENUM('league_of_legends', 'cs2', 'valorant', 'dota2', 'overwatch2');--> statement-breakpoint
ALTER TABLE "game_profiles" ALTER COLUMN "game" SET DATA TYPE "public"."supported_game" USING "game"::"public"."supported_game";
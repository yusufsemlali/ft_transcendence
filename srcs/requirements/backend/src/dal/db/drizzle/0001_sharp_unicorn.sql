ALTER TABLE "auth"."identities" RENAME TO "linked_accounts";--> statement-breakpoint
ALTER TABLE "game_profiles" RENAME TO "handles";--> statement-breakpoint
ALTER TABLE "auth"."linked_accounts" RENAME COLUMN "identity_data" TO "account_metadata";--> statement-breakpoint
ALTER TABLE "auth"."linked_accounts" RENAME COLUMN "last_sign_in_at" TO "last_loaded_at";--> statement-breakpoint
ALTER TABLE "handles" RENAME COLUMN "game_identifier" TO "handle";--> statement-breakpoint
ALTER TABLE "handles" DROP CONSTRAINT "game_profiles_user_id_sport_id_unique";--> statement-breakpoint
ALTER TABLE "auth"."linked_accounts" DROP CONSTRAINT "identities_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "handles" DROP CONSTRAINT "game_profiles_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "handles" DROP CONSTRAINT "game_profiles_sport_id_sports_id_fk";
--> statement-breakpoint
ALTER TABLE "auth"."linked_accounts" ADD CONSTRAINT "linked_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handles" ADD CONSTRAINT "handles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handles" ADD CONSTRAINT "handles_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handles" ADD CONSTRAINT "handles_user_id_sport_id_unique" UNIQUE("user_id","sport_id");
CREATE TABLE "ai_usage_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"model" text NOT NULL,
	"input_type" text NOT NULL,
	"input_tokens" integer DEFAULT 0,
	"output_tokens" integer DEFAULT 0,
	"cost_brl" numeric(10, 6) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_redemption" (
	"id" text PRIMARY KEY NOT NULL,
	"coupon_id" text NOT NULL,
	"user_id" text NOT NULL,
	"courtesy_expires_at" timestamp,
	"invoice_limit" integer,
	"stripe_session_id" text,
	"redeemed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"discount_percent" integer,
	"courtesy_days" integer,
	"invoice_limit" integer,
	"restricted_email" text,
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	CONSTRAINT "coupon_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "expense_suggestion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"month" text NOT NULL,
	"suggestions" jsonb NOT NULL,
	"total_potential_savings" numeric(12, 2) NOT NULL,
	"summary" text NOT NULL,
	"expenses_hash" text NOT NULL,
	"monthly_balance" numeric(12, 2) NOT NULL,
	"total_incomes" numeric(12, 2) NOT NULL,
	"total_expenses" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "plan" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "stripe_price_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "stripe_current_period_end" timestamp;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "archived" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "coupon_redemption" ADD CONSTRAINT "coupon_redemption_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemption" ADD CONSTRAINT "coupon_redemption_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon" ADD CONSTRAINT "coupon_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_suggestion" ADD CONSTRAINT "expense_suggestion_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
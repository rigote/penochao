CREATE TABLE "stripe_webhook_event" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"error" text,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

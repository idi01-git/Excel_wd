-- Add paymentVerifiedAt to EventRegistration
-- Tracks when a Treasurer/Coordinator verified payment, enabling 7-day proof auto-cleanup
ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "paymentVerifiedAt" TIMESTAMP(3);

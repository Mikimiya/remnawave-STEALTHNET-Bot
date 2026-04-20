-- Add imageUrl column to ticket_messages for image attachments
ALTER TABLE "ticket_messages" ADD COLUMN "image_url" TEXT;

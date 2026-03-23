-- AlterTable: add traffic_reset_strategy to tariffs (default NO_RESET for existing rows)
ALTER TABLE "tariffs" ADD COLUMN "traffic_reset_strategy" TEXT NOT NULL DEFAULT 'NO_RESET';

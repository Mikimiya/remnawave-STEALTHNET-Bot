-- AlterTable: add visible column to tariff_categories (default true)
ALTER TABLE "tariff_categories" ADD COLUMN "visible" BOOLEAN NOT NULL DEFAULT true;

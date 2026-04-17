-- PromoCode: добавляем ограничения по категории / подгруппе / тарифу
ALTER TABLE "promo_codes" ADD COLUMN "allowed_category_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "promo_codes" ADD COLUMN "allowed_sub_group_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "promo_codes" ADD COLUMN "allowed_tariff_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Объявления (Markdown)
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "content" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "announcements_published_pinned_idx" ON "announcements"("published", "pinned");

-- Активности / промо-акции
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "summary" VARCHAR(1000),
    "content" TEXT NOT NULL,
    "cover_image" TEXT,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3),
    "show_on_dashboard" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "activities_published_start_at_idx" ON "activities"("published", "start_at");

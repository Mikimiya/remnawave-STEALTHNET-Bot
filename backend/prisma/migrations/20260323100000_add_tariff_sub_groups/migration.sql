-- CreateTable: tariff_sub_groups
CREATE TABLE "tariff_sub_groups" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tariff_sub_groups_pkey" PRIMARY KEY ("id")
);

-- Add sub_group_id column to tariffs
ALTER TABLE "tariffs" ADD COLUMN "sub_group_id" TEXT;

-- CreateIndex
CREATE INDEX "tariff_sub_groups_category_id_idx" ON "tariff_sub_groups"("category_id");
CREATE INDEX "tariffs_sub_group_id_idx" ON "tariffs"("sub_group_id");

-- AddForeignKey
ALTER TABLE "tariff_sub_groups" ADD CONSTRAINT "tariff_sub_groups_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "tariff_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tariffs" ADD CONSTRAINT "tariffs_sub_group_id_fkey" FOREIGN KEY ("sub_group_id") REFERENCES "tariff_sub_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

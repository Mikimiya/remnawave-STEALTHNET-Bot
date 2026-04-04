-- CreateTable: client_notifications (in-app notification center)
CREATE TABLE "client_notifications" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "body" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable: traffic_logs (daily traffic snapshots for charts)
CREATE TABLE "traffic_logs" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "used_bytes" BIGINT NOT NULL DEFAULT 0,
    "upload_bytes" BIGINT NOT NULL DEFAULT 0,
    "download_bytes" BIGINT NOT NULL DEFAULT 0,
    "source" VARCHAR(20) NOT NULL DEFAULT 'vpn',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "traffic_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_notifications_client_id_is_read_idx" ON "client_notifications"("client_id", "is_read");
CREATE INDEX "client_notifications_client_id_created_at_idx" ON "client_notifications"("client_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "traffic_logs_client_id_date_source_key" ON "traffic_logs"("client_id", "date", "source");
CREATE INDEX "traffic_logs_client_id_date_idx" ON "traffic_logs"("client_id", "date");

-- AddForeignKey
ALTER TABLE "client_notifications" ADD CONSTRAINT "client_notifications_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traffic_logs" ADD CONSTRAINT "traffic_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

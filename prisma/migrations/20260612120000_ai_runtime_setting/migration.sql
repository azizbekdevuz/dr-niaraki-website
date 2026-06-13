-- CreateTable
CREATE TABLE "AiRuntimeSetting" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiRuntimeSetting_pkey" PRIMARY KEY ("id")
);

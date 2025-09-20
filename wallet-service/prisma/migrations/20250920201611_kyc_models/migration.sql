-- CreateTable
CREATE TABLE "KycAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "partner" TEXT NOT NULL,
    "partnerRef" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "KycAttempt_partnerRef_key" ON "KycAttempt"("partnerRef");

-- CreateIndex
CREATE INDEX "KycAttempt_userId_idx" ON "KycAttempt"("userId");

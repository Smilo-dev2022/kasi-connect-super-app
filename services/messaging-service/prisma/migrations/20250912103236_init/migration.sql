-- CreateTable
CREATE TABLE "DeviceKey" (
    "deviceId" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "identityKeyPublic" TEXT NOT NULL,
    "signedPreKeyPublic" TEXT NOT NULL,
    "signedPreKeySignature" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OneTimePreKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OneTimePreKey_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "DeviceKey" ("deviceId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "toUserId" TEXT NOT NULL,
    "toDeviceId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "fromDeviceId" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "DeviceKey_userId_idx" ON "DeviceKey"("userId");

-- CreateIndex
CREATE INDEX "OneTimePreKey_deviceId_consumedAt_idx" ON "OneTimePreKey"("deviceId", "consumedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OneTimePreKey_deviceId_key_key" ON "OneTimePreKey"("deviceId", "key");

-- CreateIndex
CREATE INDEX "Message_toUserId_toDeviceId_createdAt_idx" ON "Message"("toUserId", "toDeviceId", "createdAt");

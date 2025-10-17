-- CreateTable
CREATE TABLE "OnrampOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "side" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_FIAT',
    "fiatCurrency" TEXT NOT NULL,
    "cryptoAsset" TEXT NOT NULL,
    "fiatAmountCents" INTEGER NOT NULL,
    "cryptoAmountBaseUnits" INTEGER NOT NULL,
    "partnerRef" TEXT,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "balanceAfter" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "onrampOrderId" TEXT,
    "partnerRef" TEXT,
    "txHash" TEXT,
    CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_onrampOrderId_fkey" FOREIGN KEY ("onrampOrderId") REFERENCES "OnrampOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("accountId", "amount", "balanceAfter", "createdAt", "description", "id", "type") SELECT "accountId", "amount", "balanceAfter", "createdAt", "description", "id", "type" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE INDEX "Transaction_onrampOrderId_idx" ON "Transaction"("onrampOrderId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "OnrampOrder_status_idx" ON "OnrampOrder"("status");

-- CreateIndex
CREATE INDEX "OnrampOrder_partnerRef_idx" ON "OnrampOrder"("partnerRef");

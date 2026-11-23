-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "SyncAccount" (
    "id" TEXT NOT NULL,
    "slot" TEXT NOT NULL DEFAULT 'owner',
    "dekWrapped" TEXT,
    "dekSalt" TEXT,
    "pinVerifier" TEXT,
    "ownerUsername" TEXT,
    "ownerPasswordHash" TEXT,
    "ownerDekWrapped" TEXT,
    "ownerDekIv" TEXT,
    "ownerDekSalt" TEXT,
    "ownerPasswordIsDefault" BOOLEAN NOT NULL DEFAULT false,
    "ciphertext" TEXT,
    "dataIv" TEXT,
    "dataVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL,
    "slot" TEXT NOT NULL DEFAULT 'owner',
    "upiId" TEXT NOT NULL DEFAULT '',
    "gstPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nextBillNo" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BizState" (
    "id" TEXT NOT NULL DEFAULT 'owner',
    "rev" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BizState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BizSettings" (
    "id" TEXT NOT NULL DEFAULT 'owner',
    "settingsJson" TEXT NOT NULL,
    "appearanceJson" TEXT NOT NULL DEFAULT '{}',
    "dataUpdatedAt" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BizSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BizProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameTe" TEXT,
    "category" TEXT NOT NULL DEFAULT '',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sizesJson" TEXT NOT NULL DEFAULT '[]',
    "sizePricesJson" TEXT NOT NULL DEFAULT '{}',
    "image" TEXT,
    "stock" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BizProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BizInvoice" (
    "id" TEXT NOT NULL,
    "no" TEXT NOT NULL,
    "dateISO" TIMESTAMP(3) NOT NULL,
    "customerName" TEXT NOT NULL DEFAULT '',
    "customerPhone" TEXT NOT NULL DEFAULT '',
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Due',
    "paymentMode" TEXT NOT NULL DEFAULT 'Cash',
    "verifyCode" TEXT,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL DEFAULT 'Owner',
    "payloadJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BizInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BizExpense" (
    "id" TEXT NOT NULL,
    "dateISO" TIMESTAMP(3) NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BizExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BizIncome" (
    "id" TEXT NOT NULL,
    "dateISO" TIMESTAMP(3) NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BizIncome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BizLabourWork" (
    "id" TEXT NOT NULL,
    "dateISO" TIMESTAMP(3) NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BizLabourWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BizLabourWorker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BizLabourWorker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "billRef" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'UPI',
    "provider" TEXT NOT NULL DEFAULT 'webhook',
    "waStatus" TEXT NOT NULL DEFAULT 'pending',
    "smsStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifiedBill" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "billNo" TEXT NOT NULL,
    "slot" TEXT NOT NULL DEFAULT 'owner',
    "companyName" TEXT NOT NULL,
    "billDateISO" TIMESTAMP(3) NOT NULL,
    "customerName" TEXT NOT NULL,
    "gstPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "labourCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "autoCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentMode" TEXT NOT NULL DEFAULT 'Cash',
    "paymentStatus" TEXT NOT NULL DEFAULT 'Due',
    "createdBy" TEXT NOT NULL DEFAULT 'Owner',
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "itemsJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerifiedBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationLog" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "ip" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mpinHash" TEXT NOT NULL DEFAULT '',
    "photoData" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "photoData" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeletedBill" (
    "id" TEXT NOT NULL,
    "no" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeletedBill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SyncAccount_slot_key" ON "SyncAccount"("slot");

-- CreateIndex
CREATE UNIQUE INDEX "SyncAccount_ownerUsername_key" ON "SyncAccount"("ownerUsername");

-- CreateIndex
CREATE UNIQUE INDEX "AppConfig_slot_key" ON "AppConfig"("slot");

-- CreateIndex
CREATE UNIQUE INDEX "BizInvoice_no_key" ON "BizInvoice"("no");

-- CreateIndex
CREATE INDEX "BizInvoice_dateISO_idx" ON "BizInvoice"("dateISO");

-- CreateIndex
CREATE INDEX "BizInvoice_status_idx" ON "BizInvoice"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_billRef_key" ON "PaymentEvent"("billRef");

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedBill_code_key" ON "VerifiedBill"("code");

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedBill_billNo_key" ON "VerifiedBill"("billNo");

-- CreateIndex
CREATE INDEX "VerificationLog_code_idx" ON "VerificationLog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "StaffAccount_userId_key" ON "StaffAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffSession_tokenHash_key" ON "StaffSession"("tokenHash");

-- CreateIndex
CREATE INDEX "DeletedBill_no_idx" ON "DeletedBill"("no");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_slot_fkey" FOREIGN KEY ("slot") REFERENCES "SyncAccount"("slot") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSession" ADD CONSTRAINT "StaffSession_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;


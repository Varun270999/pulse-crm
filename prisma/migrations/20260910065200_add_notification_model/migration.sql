-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LEAD_ASSIGNED', 'DEAL_STAGE_CHANGED', 'DEAL_WON', 'FOLLOW_UP_DUE', 'INVOICE_OVERDUE', 'TICKET_ASSIGNED', 'TICKET_REPLY', 'PAYMENT_RECEIVED', 'GENERAL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifyOnDealUpdates" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnFollowUps" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnLeadAssigned" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnPayments" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnTickets" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "linkUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

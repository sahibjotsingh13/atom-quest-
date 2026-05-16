-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('employee', 'manager', 'admin');

-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('draft', 'active', 'closed', 'archived');

-- CreateEnum
CREATE TYPE "SheetStatus" AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'locked');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('not_started', 'on_track', 'completed', 'at_risk', 'delayed');

-- CreateEnum
CREATE TYPE "Quarter" AS ENUM ('Q1', 'Q2', 'Q3', 'Q4');

-- CreateEnum
CREATE TYPE "CheckInStatus" AS ENUM ('not_started', 'on_track', 'completed', 'at_risk');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "departmentId" TEXT,
    "managerId" TEXT,
    "azureAdId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cycle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fiscalYear" TEXT NOT NULL,
    "goalSettingStart" TIMESTAMP(3) NOT NULL,
    "goalSettingEnd" TIMESTAMP(3) NOT NULL,
    "q1Start" TIMESTAMP(3) NOT NULL,
    "q1End" TIMESTAMP(3) NOT NULL,
    "q2Start" TIMESTAMP(3) NOT NULL,
    "q2End" TIMESTAMP(3) NOT NULL,
    "q3Start" TIMESTAMP(3) NOT NULL,
    "q3End" TIMESTAMP(3) NOT NULL,
    "q4Start" TIMESTAMP(3) NOT NULL,
    "q4End" TIMESTAMP(3) NOT NULL,
    "status" "CycleStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThrustArea" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "departmentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThrustArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UomType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "formulaType" TEXT NOT NULL,
    "displayFormat" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UomType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalSheet" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "status" "SheetStatus" NOT NULL DEFAULT 'draft',
    "totalWeightage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "rejectionReason" TEXT,
    "lockedAt" TIMESTAMP(3),
    "lockedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "goalSheetId" TEXT NOT NULL,
    "thrustAreaId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "uomTypeId" TEXT NOT NULL,
    "targetValue" DECIMAL(15,4),
    "targetDate" TIMESTAMP(3),
    "weightage" DECIMAL(5,2) NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'not_started',
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "parentGoalId" TEXT,
    "sharedById" TEXT,
    "actualValue" DECIMAL(15,4),
    "actualDate" TIMESTAMP(3),
    "achievementPercentage" DECIMAL(5,2),
    "progressScore" DECIMAL(5,2),
    "q1Actual" DECIMAL(15,4),
    "q1Status" TEXT,
    "q1Comment" TEXT,
    "q2Actual" DECIMAL(15,4),
    "q2Status" TEXT,
    "q2Comment" TEXT,
    "q3Actual" DECIMAL(15,4),
    "q3Status" TEXT,
    "q3Comment" TEXT,
    "q4Actual" DECIMAL(15,4),
    "q4Status" TEXT,
    "q4Comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "quarter" "Quarter" NOT NULL,
    "checkInDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plannedTarget" DECIMAL(15,4),
    "actualAchievement" DECIMAL(15,4),
    "status" "CheckInStatus" NOT NULL,
    "employeeComment" TEXT,
    "managerComment" TEXT,
    "managerId" TEXT,
    "isAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "oldValues" JSONB,
    "newValues" JSONB,
    "changeReason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "deepLink" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscalationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerCondition" TEXT NOT NULL,
    "daysThreshold" INTEGER NOT NULL,
    "escalationLevel" INTEGER NOT NULL DEFAULT 1,
    "notifyRole" TEXT NOT NULL,
    "templateSubject" TEXT,
    "templateBody" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscalationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Escalation" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "triggeredForId" TEXT NOT NULL,
    "triggeredById" TEXT,
    "escalationLevel" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "resolutionNotes" TEXT,

    CONSTRAINT "Escalation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "User_azureAdId_key" ON "User"("azureAdId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UomType_code_key" ON "UomType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "GoalSheet_employeeId_cycleId_key" ON "GoalSheet"("employeeId", "cycleId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThrustArea" ADD CONSTRAINT "ThrustArea_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalSheet" ADD CONSTRAINT "GoalSheet_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalSheet" ADD CONSTRAINT "GoalSheet_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalSheet" ADD CONSTRAINT "GoalSheet_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalSheet" ADD CONSTRAINT "GoalSheet_lockedById_fkey" FOREIGN KEY ("lockedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_goalSheetId_fkey" FOREIGN KEY ("goalSheetId") REFERENCES "GoalSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_thrustAreaId_fkey" FOREIGN KEY ("thrustAreaId") REFERENCES "ThrustArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_uomTypeId_fkey" FOREIGN KEY ("uomTypeId") REFERENCES "UomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_parentGoalId_fkey" FOREIGN KEY ("parentGoalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_sharedById_fkey" FOREIGN KEY ("sharedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

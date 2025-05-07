-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER';

-- AlterTable
ALTER TABLE "LessonPlan" ADD COLUMN     "genericLessonPlanId" TEXT;

-- CreateTable
CREATE TABLE "GenericLessonPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "GenericLessonPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GenericLessonPlanFiles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GenericLessonPlanFiles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_GenericLessonPlanAssignments" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GenericLessonPlanAssignments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "GenericLessonPlan_name_key" ON "GenericLessonPlan"("name");

-- CreateIndex
CREATE INDEX "_GenericLessonPlanFiles_B_index" ON "_GenericLessonPlanFiles"("B");

-- CreateIndex
CREATE INDEX "_GenericLessonPlanAssignments_B_index" ON "_GenericLessonPlanAssignments"("B");

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_genericLessonPlanId_fkey" FOREIGN KEY ("genericLessonPlanId") REFERENCES "GenericLessonPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenericLessonPlanFiles" ADD CONSTRAINT "_GenericLessonPlanFiles_A_fkey" FOREIGN KEY ("A") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenericLessonPlanFiles" ADD CONSTRAINT "_GenericLessonPlanFiles_B_fkey" FOREIGN KEY ("B") REFERENCES "GenericLessonPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenericLessonPlanAssignments" ADD CONSTRAINT "_GenericLessonPlanAssignments_A_fkey" FOREIGN KEY ("A") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenericLessonPlanAssignments" ADD CONSTRAINT "_GenericLessonPlanAssignments_B_fkey" FOREIGN KEY ("B") REFERENCES "GenericLessonPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

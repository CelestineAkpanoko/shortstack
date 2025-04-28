-- CreateTable
CREATE TABLE "StudentAssignmentSubmission" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fileUrl" TEXT,
    "textContent" TEXT,
    "comments" TEXT,
    "fileName" TEXT,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "grade" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAssignmentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentAssignmentSubmission_assignmentId_idx" ON "StudentAssignmentSubmission"("assignmentId");

-- CreateIndex
CREATE INDEX "StudentAssignmentSubmission_studentId_idx" ON "StudentAssignmentSubmission"("studentId");

-- AddForeignKey
ALTER TABLE "StudentAssignmentSubmission" ADD CONSTRAINT "StudentAssignmentSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAssignmentSubmission" ADD CONSTRAINT "StudentAssignmentSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

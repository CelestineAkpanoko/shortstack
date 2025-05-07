-- DropForeignKey
ALTER TABLE "StoreItem" DROP CONSTRAINT "StoreItem_classId_fkey";

-- CreateTable
CREATE TABLE "_StoreItemToClass" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StoreItemToClass_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_StoreItemToClass_B_index" ON "_StoreItemToClass"("B");

-- AddForeignKey
ALTER TABLE "_StoreItemToClass" ADD CONSTRAINT "_StoreItemToClass_A_fkey" FOREIGN KEY ("A") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StoreItemToClass" ADD CONSTRAINT "_StoreItemToClass_B_fkey" FOREIGN KEY ("B") REFERENCES "StoreItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

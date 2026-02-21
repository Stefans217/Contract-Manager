-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

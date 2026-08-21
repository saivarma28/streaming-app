/*
  Warnings:

  - You are about to drop the column `videoStreamId` on the `Movie` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Movie" DROP COLUMN "videoStreamId",
ADD COLUMN     "hlsUrl" TEXT,
ADD COLUMN     "sourceVideoPath" TEXT,
ADD COLUMN     "transcoderJobName" TEXT,
ADD COLUMN     "transcodingStatus" TEXT DEFAULT 'READY',
ADD COLUMN     "videoUrl" TEXT;

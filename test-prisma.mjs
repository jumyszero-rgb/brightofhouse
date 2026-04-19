import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const pages = await prisma.servicePage.findMany({
    where: { status: 'PUBLISHED' },
    select: { serviceItemId: true, slug: true, status: true }
  });
  console.log("PUBLISHED pages:", pages);
  const draftPages = await prisma.servicePage.findMany({
    where: { status: 'DRAFT' },
    select: { serviceItemId: true, slug: true, status: true }
  });
  console.log("DRAFT pages:", draftPages);
}
run();

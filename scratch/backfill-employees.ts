import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${users.length} users`);
  let counter = 1;

  for (const user of users) {
    if (!user.employeeId) {
      const empId = `EMP-${String(counter).padStart(4, '0')}`;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          employeeId: empId,
          department: user.department || (user.role === 'SALES_EXECUTIVE' ? 'Sales' : user.role === 'SUPPORT_AGENT' ? 'Support' : 'Management'),
          joiningDate: user.joiningDate || user.createdAt,
        },
      });
      console.log(`Assigned ${empId} to ${user.name} (${user.email})`);
    } else {
      console.log(`User ${user.name} already has employeeId: ${user.employeeId}`);
    }
    counter++;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

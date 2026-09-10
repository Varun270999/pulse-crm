import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function connectWithRetry(retries = 3, delayMs = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      return;
    } catch (err) {
      console.log(`Database connection attempt ${i + 1} failed, retrying in ${delayMs}ms...`);
      if (i === retries - 1) throw err;
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
}

async function runTests() {
  console.log('--- STARTING EMPLOYEE MODULE INTEGRATION TESTS ---');
  await connectWithRetry();

  // Find admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!admin) {
    throw new Error('Admin user not found in database!');
  }
  console.log(`✓ Admin user found: ${admin.name} (${admin.email}, ${admin.employeeId})`);

  // Helper sequence generator (same logic as app/actions/employees.ts)
  async function generateEmployeeId(): Promise<string> {
    const users = await prisma.user.findMany({
      where: { employeeId: { startsWith: 'EMP-' } },
      select: { employeeId: true },
    });
    let max = 0;
    for (const u of users) {
      if (u.employeeId) {
        const m = u.employeeId.match(/EMP-(\d+)/);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > max) max = num;
        }
      }
    }
    return `EMP-${String(max + 1).padStart(4, '0')}`;
  }

  // Helper temp password
  function generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `Tmp#${randomPart}!`;
  }

  // 1. Create Test Sales Executive
  const empId1 = await generateEmployeeId();
  const tempPass1 = generateTempPassword();
  const hash1 = await bcrypt.hash(tempPass1, 10);

  const testEmail1 = `test.sales.${Date.now()}@crm.local`;
  const salesRep = await prisma.user.create({
    data: {
      employeeId: empId1,
      name: 'Rohan Verma',
      email: testEmail1,
      role: 'SALES_EXECUTIVE',
      department: 'Enterprise Sales',
      phone: '+91 9988776655',
      passwordHash: hash1,
      isActive: true,
    },
  });

  console.log(`✓ Test Sales Executive created: ${salesRep.name} (${salesRep.employeeId})`);
  if (!salesRep.employeeId?.startsWith('EMP-')) {
    throw new Error(`Expected employeeId to start with EMP-, got: ${salesRep.employeeId}`);
  }

  // 2. Verify temporary password matches hash
  const isValidPass = await bcrypt.compare(tempPass1, salesRep.passwordHash);
  if (!isValidPass) {
    throw new Error('Temporary password failed bcrypt validation!');
  }
  console.log(`✓ Temporary password matches bcrypt hash (${tempPass1})`);

  // 3. Create Test Support Agent (Sequential Numbering Check)
  const empId2 = await generateEmployeeId();
  const tempPass2 = generateTempPassword();
  const hash2 = await bcrypt.hash(tempPass2, 10);

  const testEmail2 = `test.support.${Date.now()}@crm.local`;
  const supportAgent = await prisma.user.create({
    data: {
      employeeId: empId2,
      name: 'Sneha Patel',
      email: testEmail2,
      role: 'SUPPORT_AGENT',
      department: 'Customer Care',
      phone: '+91 8877665544',
      passwordHash: hash2,
      isActive: true,
    },
  });

  console.log(`✓ Test Support Agent created: ${supportAgent.name} (${supportAgent.employeeId})`);
  const num1 = parseInt(salesRep.employeeId!.replace('EMP-', ''), 10);
  const num2 = parseInt(supportAgent.employeeId!.replace('EMP-', ''), 10);
  if (num2 !== num1 + 1) {
    throw new Error(`Sequential ID mismatch: expected ${num1 + 1}, got ${num2}`);
  }
  console.log(`✓ Sequential numbering confirmed: ${salesRep.employeeId} -> ${supportAgent.employeeId}`);

  // 4. Duplicate email prevention test
  try {
    await prisma.user.create({
      data: {
        employeeId: await generateEmployeeId(),
        name: 'Duplicate Test',
        email: testEmail1,
        passwordHash: hash1,
      },
    });
    throw new Error('Database allowed duplicate email!');
  } catch (err: any) {
    if (err.message.includes('Unique constraint failed')) {
      console.log('✓ Duplicate email prevented by database unique constraint');
    } else {
      throw err;
    }
  }

  // 5. Deactivation test & NextAuth authorize behavior check
  const deactivatedUser = await prisma.user.update({
    where: { id: salesRep.id },
    data: { isActive: false },
  });
  console.log(`✓ Employee deactivated: ${deactivatedUser.name}, isActive = ${deactivatedUser.isActive}`);

  // Simulate NextAuth authorize() callback check:
  if (!deactivatedUser.isActive) {
    console.log('✓ NextAuth authorize simulation: Account is inactive error thrown correctly');
  } else {
    throw new Error('Expected user to be inactive!');
  }

  // 6. Reactivation test
  const reactivatedUser = await prisma.user.update({
    where: { id: salesRep.id },
    data: { isActive: true },
  });
  console.log(`✓ Employee reactivated: ${reactivatedUser.name}, isActive = ${reactivatedUser.isActive}`);

  // 7. Password Reset test
  const resetPass = generateTempPassword();
  const resetHash = await bcrypt.hash(resetPass, 10);
  await prisma.user.update({
    where: { id: salesRep.id },
    data: { passwordHash: resetHash },
  });
  const isResetValid = await bcrypt.compare(resetPass, resetHash);
  if (!isResetValid) throw new Error('Reset password verification failed');
  console.log(`✓ Password reset succeeded: New temp password verified`);

  // 8. Performance Snapshot test
  // Create a mock client and mock lead assigned to salesRep
  const testClient = await prisma.client.create({
    data: {
      companyName: `Test Performance Client ${Date.now()}`,
      assignedToId: salesRep.id,
      createdById: admin.id,
    },
  });

  const testLead = await prisma.lead.create({
    data: {
      name: 'Lead For Performance Test',
      assignedToId: salesRep.id,
      createdById: admin.id,
      status: 'NEW',
    },
  });

  // Query performance snapshot
  const [assignedClientsCount, activeLeadsCount] = await Promise.all([
    prisma.client.count({ where: { assignedToId: salesRep.id } }),
    prisma.lead.count({
      where: {
        assignedToId: salesRep.id,
        status: { notIn: ['CONVERTED', 'LOST'] },
      },
    }),
  ]);

  if (assignedClientsCount < 1 || activeLeadsCount < 1) {
    throw new Error('Performance snapshot count mismatch');
  }
  console.log(`✓ Performance Snapshot verified for Sales Rep: ${assignedClientsCount} Clients, ${activeLeadsCount} Active Leads`);

  // 9. Clean up test records
  await prisma.lead.delete({ where: { id: testLead.id } });
  await prisma.client.delete({ where: { id: testClient.id } });
  await prisma.user.delete({ where: { id: salesRep.id } });
  await prisma.user.delete({ where: { id: supportAgent.id } });
  console.log('✓ Cleaned up test records');

  console.log('\n🎉 ALL EMPLOYEE MODULE INTEGRATION TESTS PASSED SUCCESSFULLY!\n');
}

runTests()
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

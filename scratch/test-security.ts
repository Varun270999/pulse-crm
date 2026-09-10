import { prisma } from '../lib/prisma';
import { logActivity, getSecurityLogsAction } from '../lib/activityLog';

async function main() {
  console.log('--- Testing Security & Activity Logs Module ---');

  // 1. Get an existing admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!admin) {
    throw new Error('No admin user found in database!');
  }
  console.log(`Using admin user: ${admin.name} (${admin.id})`);

  // 2. Test logging an unauthenticated failed login event
  console.log('Testing unauthenticated event logging...');
  await logActivity({
    userId: null,
    action: 'USER_LOGIN_FAILED',
    description: 'Login failed: unknown email unknown@test.com',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  });

  // 3. Test logging an authenticated action
  console.log('Testing authenticated event logging...');
  await logActivity({
    userId: admin.id,
    action: 'CLIENT_CREATED',
    entityType: 'Client',
    entityId: 'test-client-id-123',
    description: 'Created client "Acme Corporation Ltd"',
    ipAddress: '192.168.1.50',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0',
  });

  // 4. Verify log records exist in database
  const count = await prisma.activityLog.count();
  console.log(`Total ActivityLog entries in DB: ${count}`);

  const recent = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { user: { select: { name: true, email: true } } },
  });

  console.log('Recent logs:');
  for (const r of recent) {
    console.log(` - [${r.createdAt.toISOString()}] ${r.action}: "${r.description}" by ${r.user?.name || 'System'} (IP: ${r.ipAddress})`);
  }

  // 5. Test KPI statistics calculation
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const failedLogins = await prisma.activityLog.count({
    where: {
      action: { in: ['USER_LOGIN_FAILED', 'RATE_LIMIT_EXCEEDED'] },
      createdAt: { gte: twentyFourHoursAgo },
    },
  });
  console.log(`KPI Failed Logins (24h): ${failedLogins}`);

  console.log('--- Test Finished Successfully ---');
}

main()
  .catch((e) => {
    console.error('Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

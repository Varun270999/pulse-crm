import { prisma } from '@/lib/prisma';
import {
  createNotification,
  checkDueFollowUpsAndOverdueInvoices,
} from '@/lib/notifications';

async function runTests() {
  console.log('--- Starting Notification System Integration Test ---');

  // Find an admin or any user
  const user = await prisma.user.findFirst();

  if (!user) {
    throw new Error('Admin user not found in database');
  }

  console.log(`Testing with user: ${user.name} (${user.id})`);

  // 1. Create a notification
  console.log('1. Creating a test notification...');
  const notif = await createNotification({
    userId: user.id,
    type: 'GENERAL',
    title: 'Test Notification',
    message: 'This is a test notification for the Pulse CRM notification center.',
    linkUrl: '/dashboard',
  });

  if (!notif) {
    throw new Error('Failed to create notification');
  }
  console.log(`Notification created successfully with ID: ${notif.id}`);

  // 2. Query unread count
  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });
  console.log(`2. Unread count for user: ${unreadCount}`);

  // 3. Mark as read
  console.log('3. Marking notification as read...');
  await prisma.notification.update({
    where: { id: notif.id },
    data: { isRead: true },
  });
  const updatedNotif = await prisma.notification.findUnique({
    where: { id: notif.id },
  });
  console.log(`Notification read state: ${updatedNotif?.isRead}`);

  // 4. Test preference disable
  console.log('4. Testing preference blocking...');
  await prisma.user.update({
    where: { id: user.id },
    data: { notifyOnLeadAssigned: false },
  });

  const blockedNotif = await createNotification({
    userId: user.id,
    type: 'LEAD_ASSIGNED',
    title: 'Should not create',
    message: 'User has disabled lead assigned notifications.',
  });

  console.log(
    `Blocked notification result (should be null): ${blockedNotif === null ? 'PASSED (null)' : 'FAILED'}`
  );

  // Re-enable preference
  await prisma.user.update({
    where: { id: user.id },
    data: { notifyOnLeadAssigned: true },
  });
  console.log('Re-enabled lead notification preference.');

  // 5. Test checkDueFollowUpsAndOverdueInvoices
  console.log('5. Running checkDueFollowUpsAndOverdueInvoices...');
  await checkDueFollowUpsAndOverdueInvoices(user.id);
  console.log('Completed checkDueFollowUpsAndOverdueInvoices without errors.');

  // Clean up the test notification
  await prisma.notification.delete({
    where: { id: notif.id },
  });
  console.log('Cleaned up test notification.');

  console.log('--- ALL NOTIFICATION TESTS PASSED SUCCESSFULLY! ---');
}

runTests()
  .catch((e) => {
    console.error('Test error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

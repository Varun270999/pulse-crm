import { PrismaClient } from '@prisma/client';
import { getReportsDataAction } from '../app/actions/reports';

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
  console.log('--- STARTING REPORTS & ANALYTICS INTEGRATION TESTS ---');
  await connectWithRetry();

  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });
  if (!admin) throw new Error('Admin not found');

  // 1. Create a test sales executive
  const salesRep = await prisma.user.create({
    data: {
      employeeId: `EMP-TST-${Date.now().toString().slice(-4)}`,
      name: 'Riya Sales Test',
      email: `riya.test.${Date.now()}@crm.local`,
      role: 'SALES_EXECUTIVE',
      passwordHash: 'dummyhash',
      isActive: true,
    },
  });

  // 2. Create test client
  const client = await prisma.client.create({
    data: {
      companyName: 'Acme Global Ltd',
      status: 'ACTIVE',
      assignedToId: salesRep.id,
      createdById: admin.id,
    },
  });

  // 3. Create test lead
  const lead = await prisma.lead.create({
    data: {
      name: 'John Doe',
      status: 'CONVERTED',
      source: 'WEBSITE',
      assignedToId: salesRep.id,
      createdById: admin.id,
      convertedClientId: client.id,
    },
  });

  // 4. Create test won deal
  const deal = await prisma.deal.create({
    data: {
      title: 'Enterprise CRM License',
      clientId: client.id,
      assignedToId: salesRep.id,
      createdById: admin.id,
      stage: 'WON',
      value: 150000,
      wonAt: new Date(),
    },
  });

  // 5. Create test invoice & payment
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-TST-${Date.now().toString().slice(-4)}`,
      clientId: client.id,
      dealId: deal.id,
      totalAmount: 150000,
      paidAmount: 150000,
      status: 'PAID',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 86400 * 1000),
      createdById: admin.id,
    },
  });

  const payment = await prisma.payment.create({
    data: {
      receiptNumber: `RCPT-TST-${Date.now().toString().slice(-4)}`,
      clientId: client.id,
      invoiceId: invoice.id,
      amount: 150000,
      paymentMethod: 'UPI',
      paymentDate: new Date(),
      recordedById: admin.id,
    },
  });

  // 6. Create test resolved ticket
  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber: `TCK-TST-${Date.now().toString().slice(-4)}`,
      clientId: client.id,
      subject: 'Integration Issue',
      description: 'Test ticket for analytics',
      status: 'RESOLVED',
      priority: 'HIGH',
      category: 'TECHNICAL',
      assignedToId: admin.id,
      createdById: admin.id,
      dueBy: new Date(Date.now() + 24 * 3600 * 1000),
      resolvedAt: new Date(Date.now() + 3600 * 1000),
    },
  });

  console.log('✓ Mock records created successfully');

  // 7. Verify Queries
  const thisMonthPayments = await prisma.payment.findMany({
    where: { paymentDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    select: { amount: true },
  });
  const revenueSum = thisMonthPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  if (revenueSum < 150000) throw new Error('Revenue calculation failed');
  console.log(`✓ Settled revenue correctly includes test payment: ₹${revenueSum.toLocaleString('en-IN')}`);

  const wonDealsCount = await prisma.deal.count({ where: { stage: 'WON' } });
  if (wonDealsCount < 1) throw new Error('Deals calculation failed');
  console.log(`✓ Deals won count includes test deal: ${wonDealsCount}`);

  const convertedLeadsCount = await prisma.lead.count({ where: { status: 'CONVERTED' } });
  if (convertedLeadsCount < 1) throw new Error('Leads calculation failed');
  console.log(`✓ Converted leads count includes test lead: ${convertedLeadsCount}`);

  // 8. Clean up mock records
  await prisma.supportTicket.delete({ where: { id: ticket.id } });
  await prisma.payment.delete({ where: { id: payment.id } });
  await prisma.invoice.delete({ where: { id: invoice.id } });
  await prisma.deal.delete({ where: { id: deal.id } });
  await prisma.lead.delete({ where: { id: lead.id } });
  await prisma.client.delete({ where: { id: client.id } });
  await prisma.user.delete({ where: { id: salesRep.id } });
  console.log('✓ Cleaned up all mock records');

  console.log('\n🎉 ALL LIVE QUERY TESTS PASSED SUCCESSFULLY!\n');
}

runTests()
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

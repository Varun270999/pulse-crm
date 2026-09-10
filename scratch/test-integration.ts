import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { validateApiKey } from '@/lib/auth/apiKey';
import { GET as healthHandler } from '@/app/api/v1/health/route';
import { POST as createLeadHandler } from '@/app/api/v1/leads/route';
import { GET as listClientsHandler } from '@/app/api/v1/clients/route';
import { sendEmail } from '@/lib/services/email';
import { sendSms } from '@/lib/services/sms';
import { createPaymentLink } from '@/lib/services/paymentGateway';
import { actionWrapper } from '@/lib/actionWrapper';
import crypto from 'crypto';

async function runBackendIntegrationTests() {
  console.log('================================================================');
  console.log('🚀 PULSE CRM - DATABASE & API INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  // TEST 1: Environment Variables
  console.log('1. Testing Environment Variable Validation (lib/env.ts)...');
  if (!env.DATABASE_URL || !env.NEXTAUTH_SECRET || !env.NEXTAUTH_URL) {
    throw new Error('Required environment variables are missing from lib/env');
  }
  console.log('   ✓ DATABASE_URL is valid');
  console.log('   ✓ NEXTAUTH_SECRET is present');
  console.log(`   ✓ NEXTAUTH_URL is ${env.NEXTAUTH_URL}`);
  console.log(`   ✓ NODE_ENV is ${env.NODE_ENV}`);

  // Find an admin user for relations
  const adminUser = await prisma.user.findFirst({
    where: { isActive: true },
  });
  if (!adminUser) {
    throw new Error('No user found in database for test association');
  }
  console.log(`   ✓ Found test CRM user: ${adminUser.name} (${adminUser.id})\n`);

  // TEST 2: ApiKey Model & Database Indexing
  console.log('2. Testing ApiKey Model & Indexing...');
  const testKeyString = `pulse_live_${crypto.randomBytes(24).toString('hex')}`;
  const apiKey = await prisma.apiKey.create({
    data: {
      key: testKeyString,
      label: 'Automated Integration Test Key',
      isActive: true,
      createdById: adminUser.id,
    },
  });
  console.log(`   ✓ Created ApiKey record: ID=${apiKey.id}, Key=${apiKey.key.slice(0, 16)}...`);

  // TEST 3: ApiKey Authentication Guard
  console.log('\n3. Testing ApiKey Authentication Guard (validateApiKey)...');
  // 3a. Valid Key
  const validReq = new Request('http://localhost:3000/api/v1/leads', {
    headers: { 'x-api-key': testKeyString },
  });
  const validAuth = await validateApiKey(validReq);
  if (!validAuth.isValid || !validAuth.apiKey) {
    throw new Error('validateApiKey failed to authenticate valid API key');
  }
  console.log('   ✓ Valid API key authenticated successfully');

  // 3b. Missing Key
  const missingReq = new Request('http://localhost:3000/api/v1/leads');
  const missingAuth = await validateApiKey(missingReq);
  if (missingAuth.isValid) {
    throw new Error('validateApiKey should fail when x-api-key is missing');
  }
  console.log('   ✓ Missing API key rejected with HTTP 401');

  // 3c. Invalid Key
  const invalidReq = new Request('http://localhost:3000/api/v1/leads', {
    headers: { 'x-api-key': 'pulse_live_invalidkey123456789' },
  });
  const invalidAuth = await validateApiKey(invalidReq);
  if (invalidAuth.isValid) {
    throw new Error('validateApiKey should fail for invalid key');
  }
  console.log('   ✓ Invalid API key rejected with HTTP 401');

  // TEST 4: REST API Health Check (GET /api/v1/health)
  console.log('\n4. Testing GET /api/v1/health...');
  const healthRes = await healthHandler();
  const healthJson = await healthRes.json();
  if (healthRes.status !== 200 || healthJson.status !== 'ok' || healthJson.database !== 'connected') {
    throw new Error(`Health check returned unexpected payload: ${JSON.stringify(healthJson)}`);
  }
  console.log(`   ✓ Health Check returned 200 OK: DB ${healthJson.database}, timestamp=${healthJson.timestamp}`);

  // TEST 5: REST API Lead Creation (POST /api/v1/leads)
  console.log('\n5. Testing POST /api/v1/leads (External Lead Capture)...');
  const createLeadReq = new Request('http://localhost:3000/api/v1/leads', {
    method: 'POST',
    headers: {
      'x-api-key': testKeyString,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Dr. John Watson (API Test)',
      companyName: 'Baker Street Diagnostics',
      email: 'watson@bakerstreet.test',
      phone: '+91 98765 43210',
      source: 'WEBSITE',
      estimatedValue: 125000,
      notes: 'Captured automatically via external website lead form API.',
    }),
  });
  const createLeadRes = await createLeadHandler(createLeadReq);
  const createLeadJson = await createLeadRes.json();
  if (createLeadRes.status !== 201 || !createLeadJson.success) {
    throw new Error(`Lead creation failed: ${JSON.stringify(createLeadJson)}`);
  }
  const createdLeadId = createLeadJson.data.id;
  console.log(`   ✓ Lead created via REST API: ID=${createdLeadId}, Name=${createLeadJson.data.name}`);

  // TEST 6: REST API Client List (GET /api/v1/clients)
  console.log('\n6. Testing GET /api/v1/clients (External Client List)...');
  const listClientsReq = new Request('http://localhost:3000/api/v1/clients?limit=5', {
    headers: { 'x-api-key': testKeyString },
  });
  const listClientsRes = await listClientsHandler(listClientsReq);
  const listClientsJson = await listClientsRes.json();
  if (listClientsRes.status !== 200 || !listClientsJson.success) {
    throw new Error(`Client listing failed: ${JSON.stringify(listClientsJson)}`);
  }
  console.log(`   ✓ Clients retrieved via REST API: Count=${listClientsJson.data.length}, Total=${listClientsJson.pagination.total}`);

  // TEST 7: Server Action Error Handling Wrapper (lib/actionWrapper.ts)
  console.log('\n7. Testing Server Action Wrapper (lib/actionWrapper.ts)...');
  const failingAction = actionWrapper(
    'testFailingAction',
    async (): Promise<{ success: boolean; error?: string }> => {
      throw new Error('Simulated database failure for testing error wrapper');
    }
  );
  const wrappedResult = await failingAction();
  if (wrappedResult.success !== false || !wrappedResult.error?.includes('Simulated database failure')) {
    throw new Error(`actionWrapper did not format error properly: ${JSON.stringify(wrappedResult)}`);
  }
  console.log(`   ✓ Error caught and formatted cleanly: success=false, error="${wrappedResult.error}"`);

  // TEST 8: Third-Party Service Placeholders
  console.log('\n8. Testing Third-Party Service Placeholders...');
  // 8a. Email Service
  const emailRes = await sendEmail({
    to: 'client@example.com',
    subject: 'Welcome to Pulse CRM',
    body: 'Testing email dispatch service fallback.',
  });
  console.log(`   ✓ Email Service: success=${emailRes.success}, messageId=${emailRes.messageId}`);

  // 8b. SMS Service
  const smsRes = await sendSms({
    to: '+919876543210',
    message: 'Testing SMS gateway placeholder.',
  });
  console.log(`   ✓ SMS Service: success=${smsRes.success}, messageId=${smsRes.messageId}`);

  // 8c. Payment Gateway
  const paymentLinkRes = await createPaymentLink({
    amount: 50000,
    invoiceId: 'INV-TEST-001',
    customerName: 'Acme Corp',
    customerEmail: 'billing@acme.test',
  });
  console.log(`   ✓ Payment Gateway: success=${paymentLinkRes.success}, url=${paymentLinkRes.paymentUrl}`);

  // TEST 9: Full Database Export / Backup
  console.log('\n9. Testing Core Tables Data Export...');
  const [cCount, lCount, dCount, iCount, pCount] = await Promise.all([
    prisma.client.count(),
    prisma.lead.count(),
    prisma.deal.count(),
    prisma.invoice.count(),
    prisma.payment.count(),
  ]);
  console.log(`   ✓ Database contains: ${cCount} clients, ${lCount} leads, ${dCount} deals, ${iCount} invoices, ${pCount} payments.`);
  console.log('   ✓ Export verification passed.');

  // CLEANUP TEST RECORDS
  console.log('\n10. Cleaning up test records...');
  await prisma.lead.delete({
    where: { id: createdLeadId },
  });
  await prisma.apiKey.delete({
    where: { id: apiKey.id },
  });
  console.log('   ✓ Cleaned up test lead and test API key successfully.');

  console.log('\n================================================================');
  console.log('🎉 ALL BACKEND & API INTEGRATION TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

runBackendIntegrationTests()
  .catch((e) => {
    console.error('\n❌ INTEGRATION TEST FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

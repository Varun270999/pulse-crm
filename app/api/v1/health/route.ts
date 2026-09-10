import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    // Perform a lightweight database query to test connectivity
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: 'ok',
        timestamp,
        database: 'connected',
        service: 'Pulse CRM API v1',
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[HEALTH CHECK FAILED]', err);

    return NextResponse.json(
      {
        status: 'error',
        timestamp,
        database: 'unreachable',
        error: 'Database connection failed',
      },
      { status: 503 }
    );
  }
}

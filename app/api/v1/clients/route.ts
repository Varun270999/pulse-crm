import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey } from '@/lib/auth/apiKey';
import type { ClientStatus, Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. Authenticate via API Key
  const authResult = await validateApiKey(request);
  if (!authResult.isValid) {
    return authResult.errorResponse;
  }

  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const status = searchParams.get('status') as ClientStatus | null;
    const search = searchParams.get('search')?.trim();

    const where: Prisma.ClientWhereInput = {};

    if (status && ['PROSPECT', 'ACTIVE', 'INACTIVE'].includes(status)) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, clients] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          contacts: {
            where: { isPrimary: true },
            select: { name: true, email: true, phone: true, designation: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json(
      {
        success: true,
        data: clients.map((c) => ({
          id: c.id,
          companyName: c.companyName,
          industry: c.industry,
          website: c.website,
          email: c.email,
          phone: c.phone,
          status: c.status,
          source: c.source,
          city: c.city,
          country: c.country,
          primaryContact: c.contacts[0] || null,
          assignedTo: c.assignedTo,
          createdAt: c.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[GET /api/v1/clients ERROR]', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve clients due to an internal server error.',
      },
      { status: 500 }
    );
  }
}

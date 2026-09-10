import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { validateApiKey } from '@/lib/auth/apiKey';
import { createNotification } from '@/lib/notifications';
import { ClientSource } from '@prisma/client';

export const dynamic = 'force-dynamic';

const externalLeadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  companyName: z.string().optional().or(z.literal('')),
  source: z.nativeEnum(ClientSource).optional().default('WEBSITE'),
  estimatedValue: z.number().positive().optional(),
  notes: z.string().optional(),
  assignedToId: z.string().optional(),
});

export async function POST(request: Request) {
  // 1. Authenticate via API Key
  const authResult = await validateApiKey(request);
  if (!authResult.isValid) {
    return authResult.errorResponse;
  }

  try {
    const rawBody = await request.json();
    const parsed = externalLeadSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 2. Determine assigned representative
    let finalAssignedToId = data.assignedToId;

    if (finalAssignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: finalAssignedToId },
        select: { id: true, isActive: true },
      });
      if (!assignedUser || !assignedUser.isActive) {
        finalAssignedToId = undefined;
      }
    }

    // Default to the user who generated the API key, or first active sales rep/admin
    if (!finalAssignedToId) {
      if (authResult.user && authResult.user.isActive) {
        finalAssignedToId = authResult.user.id;
      } else {
        const fallbackUser = await prisma.user.findFirst({
          where: { isActive: true, role: { in: ['SALES_EXECUTIVE', 'ADMIN', 'MANAGER'] } },
          select: { id: true },
        });
        finalAssignedToId = fallbackUser?.id;
      }
    }

    if (!finalAssignedToId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active CRM user available to assign the lead.',
        },
        { status: 500 }
      );
    }

    // 3. Create Lead in Database
    const lead = await prisma.lead.create({
      data: {
        name: data.name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        companyName: data.companyName?.trim() || null,
        source: data.source || 'WEBSITE',
        status: 'NEW',
        estimatedValue: data.estimatedValue ? Number(data.estimatedValue) : null,
        notes: data.notes?.trim() || null,
        assignedToId: finalAssignedToId,
        createdById: authResult.user.id,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // 4. Trigger In-App Notification
    await createNotification({
      userId: finalAssignedToId,
      type: 'LEAD_ASSIGNED',
      title: 'New External Lead Created',
      message: `New external lead received: "${lead.name}"${lead.companyName ? ` from ${lead.companyName}` : ''}.`,
      linkUrl: `/dashboard/leads`,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Lead created successfully.',
        data: {
          id: lead.id,
          name: lead.name,
          companyName: lead.companyName,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          status: lead.status,
          estimatedValue: lead.estimatedValue ? Number(lead.estimatedValue) : null,
          assignedTo: lead.assignedTo,
          createdAt: lead.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/v1/leads ERROR]', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create lead due to an internal server error.',
      },
      { status: 500 }
    );
  }
}

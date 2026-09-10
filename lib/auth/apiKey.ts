import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { ApiKey, User } from '@prisma/client';

export interface ApiKeyAuthSuccess {
  isValid: true;
  apiKey: ApiKey;
  user: User;
  errorResponse?: never;
}

export interface ApiKeyAuthFailure {
  isValid: false;
  apiKey?: never;
  user?: never;
  errorResponse: NextResponse;
}

export type ApiKeyAuthResult = ApiKeyAuthSuccess | ApiKeyAuthFailure;

/**
 * Validates the x-api-key header from an incoming API request.
 * Updates lastUsedAt on successful validation.
 */
export async function validateApiKey(request: Request): Promise<ApiKeyAuthResult> {
  const apiKeyHeader =
    request.headers.get('x-api-key') ||
    request.headers.get('X-API-Key') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!apiKeyHeader || !apiKeyHeader.trim()) {
    return {
      isValid: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Authentication failed: Missing x-api-key header.',
        },
        { status: 401 }
      ),
    };
  }

  const keyString = apiKeyHeader.trim();

  try {
    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: keyString },
      include: { createdBy: true },
    });

    if (!keyRecord || !keyRecord.isActive) {
      return {
        isValid: false,
        errorResponse: NextResponse.json(
          {
            success: false,
            error: 'Authentication failed: Invalid or revoked API key.',
          },
          { status: 401 }
        ),
      };
    }

    // Record last used timestamp (non-blocking)
    prisma.apiKey
      .update({
        where: { id: keyRecord.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((err) => {
        console.error('[API KEY] Failed to update lastUsedAt:', err);
      });

    return {
      isValid: true,
      apiKey: keyRecord,
      user: keyRecord.createdBy,
    };
  } catch (err) {
    console.error('[API KEY] Validation error:', err);
    return {
      isValid: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Authentication service temporarily unavailable.',
        },
        { status: 500 }
      ),
    };
  }
}

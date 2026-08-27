// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Health check & warm-up endpoint.
 * Pinging this route keeps the serverless function and database connection warm.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const checkDb = searchParams.get('db') === 'true';

  try {
    let dbStatus = 'skipped';
    
    if (checkDb) {
      // Lightweight query to keep DB connection pool alive
      await db.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    }

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        db: dbStatus,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        error: error.message || 'Database ping failed',
      },
      { status: 500 }
    );
  }
}

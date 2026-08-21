// src/app/api/admin/events/test-webhook/route.ts
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';

export async function POST(req: Request) {
  try {
    const { error } = await requirePermission('MANAGE_EVENTS');
    if (error) return error;

    const { webhookUrl, eventTitle } = await req.json();

    if (!webhookUrl || typeof webhookUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Webhook URL is required' },
        { status: 400 }
      );
    }

    const trimmedUrl = webhookUrl.trim();

    if (!/^https:\/\/(script\.google\.com|hooks\.[a-z0-9.-]+)\//i.test(trimmedUrl)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid webhook URL. Must start with https://script.google.com/macros/s/... or https://hooks.... (Ensure you deployed your Google Apps Script as a Web App with access set to "Anyone").',
        },
        { status: 400 }
      );
    }

    const testPayload = {
      ticketRef: 'EXC-TEST-PING',
      eventTitle: eventTitle || 'Excelsior Verification Test Ping',
      name: 'System Tester (Connection Verification)',
      email: 'verify@excelsior.club',
      phone: '+91 99999 99999',
      paymentStatus: 'VERIFIED',
      registeredAt: new Date().toISOString(),
      isTestPing: true,
    };

    try {
      const response = await fetch(trimmedUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Excelsior-Event-System/1.0',
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(10000), // 10s timeout
        redirect: 'follow',
      });

      if (response.ok || response.status < 400) {
        return NextResponse.json({
          success: true,
          status: response.status,
          message: `Connection successful! Google Sheets webhook responded with HTTP ${response.status}. Test row dispatched.`,
        });
      } else {
        const text = await response.text().catch(() => '');
        return NextResponse.json({
          success: false,
          status: response.status,
          error: `Webhook returned HTTP ${response.status}. Ensure your Google Apps Script Web App is deployed with "Execute as: Me" and "Who has access: Anyone". Response: ${text.slice(0, 150)}`,
        });
      }
    } catch (fetchErr: any) {
      console.warn('Google Sheet webhook verification failed:', fetchErr);
      if (fetchErr.name === 'TimeoutError' || fetchErr.message?.includes('timeout')) {
        return NextResponse.json({
          success: false,
          error: 'Connection timed out after 10s. Please verify your Google Apps Script Web App URL and deployment settings.',
        });
      }
      return NextResponse.json({
        success: false,
        error: `Could not reach webhook endpoint: ${fetchErr.message || 'Network error'}. Check if the URL is correct and public.`,
      });
    }
  } catch (err: any) {
    console.error('Test webhook error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to verify webhook' },
      { status: 500 }
    );
  }
}

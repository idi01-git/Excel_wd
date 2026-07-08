import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendBookReturnReminder } from '@/lib/email';

// Secured by CRON_SECRET — only Vercel Cron or manual invocation with the right header should call this
export async function GET(req: Request) {
  try {
    // Verify cron secret (skip in dev if not set)
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get('authorization');
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Find all APPROVED issue requests that have a dueDate set
    const activeLoans = await db.issueRequest.findMany({
      where: {
        status: 'APPROVED',
        dueDate: { not: null },
      },
      include: {
        book: { select: { title: true } },
        requester: { select: { name: true, email: true } },
      },
    });

    let sent = 0;
    let skipped = 0;

    for (const loan of activeLoans) {
      if (!loan.dueDate || !loan.requester.email) {
        skipped++;
        continue;
      }

      const dueDate = new Date(loan.dueDate);
      const dueDateStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

      // Calculate difference in days (positive = days until due, negative = overdue)
      const diffMs = dueDateStart.getTime() - todayStart.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      let shouldSend = false;

      if (diffDays >= 1 && diffDays <= 3) {
        // 3, 2, 1 days before due → send daily reminder
        shouldSend = true;
      } else if (diffDays === 0) {
        // Due today
        shouldSend = true;
      } else if (diffDays < 0) {
        // Overdue: send every 3rd day after due date (day 3, 6, 9, ...)
        const overdueDays = Math.abs(diffDays);
        if (overdueDays % 3 === 0) {
          shouldSend = true;
        }
      }

      if (!shouldSend) {
        skipped++;
        continue;
      }

      // Check if we already sent a reminder today
      if (loan.lastReminderSent) {
        const lastSent = new Date(loan.lastReminderSent);
        const lastSentDay = new Date(lastSent.getFullYear(), lastSent.getMonth(), lastSent.getDate());
        if (lastSentDay.getTime() === todayStart.getTime()) {
          skipped++;
          continue;
        }
      }

      // Send the email
      const isOverdue = diffDays < 0;
      const daysDiff = Math.abs(diffDays);

      const result = await sendBookReturnReminder({
        to: loan.requester.email,
        bookTitle: loan.book.title,
        borrowerName: loan.requester.name || 'Reader',
        dueDate,
        isOverdue,
        daysDiff,
      });

      if (result.success) {
        // Update lastReminderSent
        await db.issueRequest.update({
          where: { id: loan.id },
          data: { lastReminderSent: now },
        });
        sent++;
      } else {
        console.error(`Failed to send reminder for loan ${loan.id}:`, result.error);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalActiveLoans: activeLoans.length,
        remindersSent: sent,
        skipped,
        timestamp: now.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Cron book-reminders error:', error);
    return NextResponse.json({ error: error.message || 'Cron job failed' }, { status: 500 });
  }
}

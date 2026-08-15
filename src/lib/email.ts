import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Excelsior Library <noreply@resend.dev>';

export async function sendBookReturnReminder({
  to,
  bookTitle,
  borrowerName,
  dueDate,
  isOverdue,
  daysDiff,
}: {
  to: string;
  bookTitle: string;
  borrowerName: string;
  dueDate: Date;
  isOverdue: boolean;
  daysDiff: number;
}) {
  const dueDateStr = dueDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const subject = isOverdue
    ? `⚠️ Overdue: "${bookTitle}" was due ${daysDiff} day${daysDiff > 1 ? 's' : ''} ago`
    : `📚 Reminder: "${bookTitle}" is due ${daysDiff === 0 ? 'today' : `in ${daysDiff} day${daysDiff > 1 ? 's' : ''}`}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${isOverdue ? '#ef4444' : '#6366f1'},${isOverdue ? '#dc2626' : '#8b5cf6'});padding:32px 32px 24px;text-align:center;">
              <div style="font-size:32px;margin-bottom:8px;">${isOverdue ? '⚠️' : '📚'}</div>
              <h1 style="color:#ffffff;font-size:20px;font-weight:800;margin:0;letter-spacing:-0.5px;">
                ${isOverdue ? 'Book Overdue' : 'Return Reminder'}
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
                Hi <strong>${borrowerName}</strong>,
              </p>
              <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
                ${isOverdue 
                  ? `The book you borrowed is <strong style="color:#ef4444;">overdue by ${daysDiff} day${daysDiff > 1 ? 's' : ''}</strong>. Please return it as soon as possible.`
                  : `This is a friendly reminder that your borrowed book is due ${daysDiff === 0 ? '<strong>today</strong>' : `in <strong>${daysDiff} day${daysDiff > 1 ? 's' : ''}</strong>`}.`
                }
              </p>
              
              <!-- Book Card -->
              <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin:20px 0;">
                <p style="color:#6b7280;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin:0 0 8px;">Book</p>
                <p style="color:#111827;font-size:17px;font-weight:800;margin:0 0 12px;">${bookTitle}</p>
                <p style="color:#6b7280;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin:0 0 4px;">Due Date</p>
                <p style="color:${isOverdue ? '#ef4444' : '#111827'};font-size:15px;font-weight:700;margin:0;">
                  ${dueDateStr} ${isOverdue ? '(OVERDUE)' : ''}
                </p>
              </div>

              <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:20px 0 0;">
                Please return the book to the library at your earliest convenience. If you have any questions, reach out to the library team.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="color:#9ca3af;font-size:11px;margin:0;">
                Excelsior Literary Club • Automated Reminder
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Failed to send email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Email send error:', err);
    return { success: false, error: err };
  }
}

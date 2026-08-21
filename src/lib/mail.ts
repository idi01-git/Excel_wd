import nodemailer from 'nodemailer';

type PaymentConfirmedInput = { to: string; recipientName: string; event: { title: string; date: Date; venue: string; time?: string | null } };
type RegistrationConfirmedInput = {
  to: string;
  recipientName: string;
  ticketRef: string;
  event: { title: string; date: Date; venue: string; time?: string | null; rulebookUrl?: string | null };
  paymentPending: boolean;
};

export async function sendRegistrationEmail({ to, recipientName, ticketRef, event, paymentPending }: RegistrationConfirmedInput) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) {
    console.warn('Registration email skipped: SMTP_USER or SMTP_PASS is not configured.');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtpUser, pass: smtpPass },
    });
    const date = event.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const timePart = event.time ? ` · ${event.time}` : '';
    const paymentNote = paymentPending
      ? '<p style="border-left:3px solid #b45309;padding-left:12px;color:#7c2d12">Your payment is pending verification by our team — we will confirm by email once it is approved.</p>'
      : '';
    const rulebookLink = event.rulebookUrl
      ? `<p style="margin-top:20px"><a href="${event.rulebookUrl}" style="color:#161616">Download the rulebook →</a></p>`
      : '';
    await transporter.sendMail({
      from: `"Excelsior" <${smtpUser}>`,
      to,
      subject: `Registered — ${event.title}`,
      html: `<main style="font-family:Georgia,serif;color:#161616;max-width:620px;margin:auto;padding:32px"><p style="font-family:monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#666">Excelsior · Registration received</p><h1 style="font-size:32px;margin:20px 0">You're on the list.</h1><p>Dear ${recipientName},</p><p>Your registration for <strong>${event.title}</strong> has been recorded. Your ticket reference is <span style="font-family:monospace;font-size:15px">${ticketRef}</span>.</p>${paymentNote}<hr style="border:0;border-top:1px solid #ddd;margin:28px 0"/><p><strong>${date}</strong>${timePart}<br/>${event.venue}</p>${rulebookLink}<p style="color:#666;font-size:14px;margin-top:28px">Keep this email for your event record.</p></main>`,
    });
  } catch (error) {
    console.error('Registration email failed:', error);
  }
}

export async function sendPaymentConfirmedEmail({ to, recipientName, event }: PaymentConfirmedInput) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) {
    console.warn('Payment-confirmation email skipped: SMTP_USER or SMTP_PASS is not configured.');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtpUser, pass: smtpPass },
    });
    const date = event.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    await transporter.sendMail({
      from: `"Excelsior" <${smtpUser}>`,
      to,
      subject: `Participation confirmed — ${event.title}`,
      html: `<main style="font-family:Georgia,serif;color:#161616;max-width:620px;margin:auto;padding:32px"><p style="font-family:monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#666">Excelsior · Event confirmation</p><h1 style="font-size:32px;margin:20px 0">Your participation is confirmed.</h1><p>Dear ${recipientName},</p><p>Your payment for <strong>${event.title}</strong> has been verified. We look forward to seeing you there.</p><hr style="border:0;border-top:1px solid #ddd;margin:28px 0"/><p><strong>${date}</strong>${event.time ? ` · ${event.time}` : ''}<br/>${event.venue}</p><p style="color:#666;font-size:14px;margin-top:28px">Keep this email for your event record.</p></main>`,
    });
  } catch (error) {
    console.error('Payment-confirmation email failed:', error);
  }
}

export type EventUpdateEmailInput = {
  to: string;
  recipientName: string;
  eventTitle: string;
  changes: Array<{ field: string; oldVal?: string; newVal: string }>;
  event: {
    title: string;
    date: Date;
    venue: string;
    time?: string | null;
    rulebookUrl?: string | null;
  };
  customNote?: string;
};

export async function sendEventUpdateEmail({
  to,
  recipientName,
  eventTitle,
  changes,
  event,
  customNote,
}: EventUpdateEmailInput) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) {
    console.warn('Event update email skipped: SMTP_USER or SMTP_PASS is not configured.');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtpUser, pass: smtpPass },
    });
    const dateStr = event.date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timePart = event.time ? ` · ${event.time}` : '';

    const changesHtml = changes
      .map(
        (c) =>
          `<li style="margin-bottom:8px"><strong>${c.field}:</strong> ${
            c.oldVal
              ? `<span style="text-decoration:line-through;color:#888;margin-right:6px">${c.oldVal}</span> → `
              : ''
          }<span style="color:#000;font-weight:600">${c.newVal}</span></li>`
      )
      .join('');

    const noteHtml = customNote
      ? `<div style="background-color:#f9fafb;border-left:3px solid #000;padding:12px 16px;margin:20px 0;font-style:italic;color:#333">${customNote}</div>`
      : '';

    await transporter.sendMail({
      from: `"Excelsior" <${smtpUser}>`,
      to,
      subject: `Important Update: ${eventTitle}`,
      html: `
<main style="font-family:Georgia,serif;color:#161616;max-width:620px;margin:auto;padding:32px;background:#ffffff">
  <p style="font-family:monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#666;border-bottom:1px solid #eee;padding-bottom:8px">
    Excelsior Bulletin · Event Schedule & Logistics Update
  </p>
  <h1 style="font-size:28px;margin:20px 0;letter-spacing:-0.5px">Important Event Update</h1>
  <p style="font-size:15px;line-height:1.6">Dear ${recipientName},</p>
  <p style="font-size:15px;line-height:1.6">
    We are writing to inform you that logistics or schedule details for <strong>${eventTitle}</strong> have been updated by the organizing team.
  </p>
  
  <div style="background:#fcfcfc;border:1px solid #e5e5e5;padding:18px 20px;margin:24px 0;border-radius:4px">
    <p style="font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#777;margin:0 0 10px 0;font-weight:bold">
      Summary of Changes:
    </p>
    <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.7">
      ${changesHtml}
    </ul>
  </div>

  ${noteHtml}

  <hr style="border:0;border-top:1px dashed #ccc;margin:28px 0"/>
  
  <p style="font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#777;margin:0 0 6px 0;font-weight:bold">
    Current Confirmed Logistics:
  </p>
  <p style="font-size:15px;margin:0;line-height:1.5">
    <strong>📅 Date:</strong> ${dateStr}${timePart}<br/>
    <strong>📍 Venue:</strong> ${event.venue}
  </p>

  ${
    event.rulebookUrl
      ? `<p style="margin-top:20px"><a href="${event.rulebookUrl}" style="color:#000;font-weight:bold;text-decoration:underline">View Official Guidelines / Rulebook →</a></p>`
      : ''
  }
  
  <p style="color:#777;font-size:13px;margin-top:32px;border-top:1px solid #eee;padding-top:16px">
    Your registration and ticket reservation remain active. If you have any questions, please reach out to the Excelsior team.
  </p>
</main>`,
    });
  } catch (error) {
    console.error('Failed to send event update email to', to, error);
  }
}

export type EventReminderEmailInput = {
  to: string;
  recipientName: string;
  ticketRef?: string;
  event: {
    title: string;
    date: Date;
    venue: string;
    time?: string | null;
    rulebookUrl?: string | null;
  };
};

export async function sendEventReminderEmail({
  to,
  recipientName,
  ticketRef,
  event,
}: EventReminderEmailInput) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) {
    console.warn('Reminder email skipped: SMTP_USER or SMTP_PASS is not configured.');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtpUser, pass: smtpPass },
    });
    const dateStr = event.date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timePart = event.time ? ` · ${event.time}` : '';

    await transporter.sendMail({
      from: `"Excelsior" <${smtpUser}>`,
      to,
      subject: `Reminder: Tomorrow is ${event.title}!`,
      html: `
<main style="font-family:Georgia,serif;color:#161616;max-width:620px;margin:auto;padding:32px;background:#ffffff">
  <p style="font-family:monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#b45309;border-bottom:1px solid #eee;padding-bottom:8px">
    Excelsior Dispatch · 24-Hour Event Reminder
  </p>
  <h1 style="font-size:30px;margin:20px 0;letter-spacing:-0.5px">See you tomorrow!</h1>
  <p style="font-size:15px;line-height:1.6">Dear ${recipientName},</p>
  <p style="font-size:15px;line-height:1.6">
    This is a friendly reminder that <strong>${event.title}</strong> is happening tomorrow.
  </p>
  
  <div style="background:#fafafa;border:1px solid #e5e5e5;padding:18px 20px;margin:24px 0;border-radius:6px">
    <p style="font-size:15px;margin:0 0 8px 0;line-height:1.5">
      <strong>📅 Date:</strong> ${dateStr}${timePart}
    </p>
    <p style="font-size:15px;margin:0;line-height:1.5">
      <strong>📍 Venue:</strong> ${event.venue}
    </p>
    ${ticketRef ? `<p style="font-size:14px;margin:8px 0 0 0;font-family:monospace;color:#444"><strong>🎟️ Pass Reference:</strong> ${ticketRef}</p>` : ''}
  </div>

  ${
    event.rulebookUrl
      ? `<p style="margin-top:20px"><a href="${event.rulebookUrl}" style="color:#000;font-weight:bold;text-decoration:underline">Download Guidelines / Rulebook →</a></p>`
      : ''
  }
  
  <p style="color:#777;font-size:13px;margin-top:32px;border-top:1px solid #eee;padding-top:16px">
    Please arrive 15 minutes prior to the start time. Have your pass code ready.
  </p>
</main>`,
    });
  } catch (error) {
    console.error('Failed to send reminder email to', to, error);
  }
}
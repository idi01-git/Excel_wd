import { db } from '@/lib/db';
import crypto from 'crypto';

/**
 * Generate a cryptographically secure 6-digit numeric OTP code
 */
export function generateOtpCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

import nodemailer from 'nodemailer';

/**
 * Send an OTP verification email to the user via Nodemailer
 */
export async function sendOtpEmail(email: string, code: string, recipientName: string) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    console.warn(`[DEV MODE] SMTP_USER or SMTP_PASS not configured. OTP for ${email}: ${code}`);
    return { success: true, isDev: true, code };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: `"Excelsior" <${smtpUser}>`,
      to: email,
      subject: `${code} is your Excelsior verification code`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Excelsior Verification Code</title>
        </head>
        <body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f4f4f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:40px 16px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#121214;border:1px solid #27272a;border-radius:24px;overflow:hidden;padding:36px 32px;box-shadow:0 20px 40px rgba(0,0,0,0.4);">
                  <!-- Header -->
                  <tr>
                    <td align="center" style="padding-bottom:24px;">
                      <p style="margin:0 0 8px 0;font-family:monospace;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#a1a1aa;">EXCELSIOR SOCIETY</p>
                      <h1 style="margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;color:#ffffff;">Confirm Your Email</h1>
                      <p style="margin:8px 0 0 0;font-size:14px;color:#a1a1aa;line-height:1.5;">Hello ${recipientName || 'Member'}, use the one-time code below to complete your registration.</p>
                    </td>
                  </tr>
                  <!-- OTP Box -->
                  <tr>
                    <td align="center" style="padding:16px 0 24px 0;">
                      <div style="display:inline-block;background-color:#18181b;border:1px solid #3f3f46;border-radius:16px;padding:18px 36px;text-align:center;">
                        <span style="font-family:monospace;font-size:36px;font-weight:800;letter-spacing:8px;color:#ffffff;display:block;">${code}</span>
                        <span style="display:block;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:1px;color:#71717a;margin-top:6px;">Expires in 10 minutes</span>
                      </div>
                    </td>
                  </tr>
                  <!-- Security Notice -->
                  <tr>
                    <td style="border-top:1px solid #27272a;padding-top:20px;text-align:center;">
                      <p style="margin:0;font-size:12px;color:#71717a;line-height:1.5;">
                        This code is single-use and will expire in 10 minutes. If you did not create an account on Excelsior, please safely disregard this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
    return { success: true, isDev: false };
  } catch (error) {
    console.error('Failed to send OTP email via Nodemailer:', error);
    return { success: true, isDev: true, code };
  }
}

/**
 * Save OTP to database with rate limiting & cooldown protection
 */
export async function createAndSaveOtp(email: string, recipientName: string) {
  const cleanEmail = email.toLowerCase().trim();

  // Purge expired OTPs older than 15 minutes
  await db.$executeRawUnsafe(
    `DELETE FROM "EmailOtp" WHERE "expiresAt" < NOW() - INTERVAL '5 minutes'`
  );

  // Rate Limiting: Check recent OTP requests in the last 15 minutes
  const recentRequests: any[] = await db.$queryRawUnsafe(
    `SELECT * FROM "EmailOtp" WHERE "email" = $1 AND "createdAt" > NOW() - INTERVAL '15 minutes' ORDER BY "createdAt" DESC`,
    cleanEmail
  );

  if (recentRequests && recentRequests.length >= 5) {
    throw new Error('Too many verification requests. Please wait a few minutes before requesting another code.');
  }

  // Enforce 45-second cooldown
  if (recentRequests && recentRequests.length > 0) {
    const latest = new Date(recentRequests[0].createdAt).getTime();
    const elapsedSeconds = Math.floor((Date.now() - latest) / 1000);
    if (elapsedSeconds < 45) {
      throw new Error(`Please wait ${45 - elapsedSeconds}s before requesting a new code.`);
    }
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  // Clear existing active codes for this email
  await db.$executeRawUnsafe(
    `DELETE FROM "EmailOtp" WHERE "email" = $1`,
    cleanEmail
  );

  // Insert fresh OTP record
  const id = crypto.randomUUID();
  await db.$executeRawUnsafe(
    `INSERT INTO "EmailOtp" ("id", "email", "code", "attempts", "expiresAt", "createdAt") VALUES ($1, $2, $3, 0, $4, NOW())`,
    id,
    cleanEmail,
    code,
    expiresAt
  );

  // Dispatch email
  const sendResult = await sendOtpEmail(cleanEmail, code, recipientName);
  return { code, ...sendResult };
}

/**
 * Verify submitted OTP code with brute-force protection (max 5 attempts)
 */
export async function verifyOtpCode(email: string, code: string): Promise<{ valid: boolean; error?: string }> {
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.trim();

  const records: any[] = await db.$queryRawUnsafe(
    `SELECT * FROM "EmailOtp" WHERE "email" = $1 AND "expiresAt" > NOW() ORDER BY "createdAt" DESC LIMIT 1`,
    cleanEmail
  );

  if (!records || records.length === 0) {
    return { valid: false, error: 'Verification code has expired or was not requested. Please request a new code.' };
  }

  const record = records[0];

  // Brute force protection
  if (record.attempts >= 5) {
    await db.$executeRawUnsafe(
      `DELETE FROM "EmailOtp" WHERE "id" = $1`,
      record.id
    );
    return { valid: false, error: 'Too many incorrect attempts. This code is now invalidated. Please request a fresh code.' };
  }

  if (record.code !== cleanCode) {
    await db.$executeRawUnsafe(
      `UPDATE "EmailOtp" SET "attempts" = "attempts" + 1 WHERE "id" = $1`,
      record.id
    );
    const remaining = 5 - (record.attempts + 1);
    return {
      valid: false,
      error: `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    };
  }

  // Successfully verified: Delete consumed token
  await db.$executeRawUnsafe(
    `DELETE FROM "EmailOtp" WHERE "id" = $1`,
    record.id
  );

  return { valid: true };
}

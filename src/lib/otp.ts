import { db } from '@/lib/db';
import crypto from 'crypto';

/**
 * Generate a cryptographically secure 6-digit numeric OTP code
 */
export function generateOtpCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

import path from 'path';
import fs from 'fs';
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

    const logoPath = path.join(process.cwd(), 'public/images/image.png');
    const attachments = fs.existsSync(logoPath)
      ? [{ filename: 'image.png', path: logoPath, cid: 'clubLogo' }]
      : [];

    const safeName = recipientName || 'Member';

    await transporter.sendMail({
      from: `"Excelsior-Literary Club of IET Lucknow" <${smtpUser}>`,
      to: email,
      subject: `${code} is your Excelsior verification code`,
      attachments,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
  body,table,td,p,div{margin:0;padding:0;border:0;}
  body{background:#ffffff;font-family:Georgia,'Times New Roman',serif;}
  img{border:0;display:block;}
  .calli{
    font-family:'Great Vibes','Brush Script MT','Lucida Handwriting',cursive;
    font-size:52px;line-height:1.25;color:#001f3f;text-align:center;
  }
  .body-text{
    font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;
    font-size:16px;line-height:1.85;color:#3a3a3a;text-align:center;
  }
  @media only screen and (max-width:600px){
    .email-card{width:100% !important;}
    .inner-pad{padding:28px 18px !important;}
    .calli{font-size:40px !important;}
    .body-text{font-size:15px !important;}
    .badge-cell{padding:10px 20px !important;}
    .detail-val{font-size:13px !important;}
    .logo-img{width:70px !important;height:70px !important;}
    .club-name{font-size:18px !important;letter-spacing:5px !important;}
    .footer-bar{padding:14px 20px !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#ffffff;">

<table role="presentation" cellspacing="0" cellpadding="0"
       border="0" width="100%" style="background:#ffffff;">
  <tr>
    <td align="center" style="padding:30px 10px 0;">

      <table class="email-card" role="presentation"
             cellspacing="0" cellpadding="0" border="0" width="600"
             style="background:#fffdf7;border:1px solid #e2d9c8;
                    border-top:5px solid #001f3f;">
        <tr>
          <td>
            <table role="presentation" cellspacing="0"
                   cellpadding="0" border="0" width="100%">
              <tr>
                <td class="inner-pad" style="padding:45px 50px;">

                  <!-- LOGO -->
                  <table role="presentation" cellspacing="0"
                         cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding-bottom:14px;">
                        <img class="logo-img"
                             src="cid:clubLogo"
                             alt="Excelsior"
                             width="85" height="85"
                             style="width:85px;height:85px;
                                    object-fit:contain;border-radius:4px;margin:0 auto;">
                      </td>
                    </tr>
                  </table>

                  <!-- CLUB NAME -->
                  <table role="presentation" cellspacing="0"
                         cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center">
                        <div class="club-name"
                             style="font-family:'Palatino Linotype',
                                    'Book Antiqua',Palatino,Georgia,serif;
                                    font-size:22px;font-weight:700;
                                    letter-spacing:8px;color:#001f3f;
                                    text-transform:uppercase;
                                    margin-bottom:6px;">
                          EXCELSIOR
                        </div>
                        <div style="font-family:Georgia,'Times New Roman',serif;
                                    font-size:10px;letter-spacing:3px;
                                    color:#d4af37;font-style:italic;
                                    margin-bottom:22px;">
                          The Literary Club of IET Lucknow
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- DIVIDER -->
                  <table role="presentation" cellspacing="0"
                         cellpadding="0" border="0" align="center"
                         style="margin:0 auto 20px;">
                    <tr>
                      <td width="80" height="1"
                          style="background:#d4af37;font-size:1px;
                                 line-height:1px;opacity:0.5;">&nbsp;</td>
                      <td width="10"></td>
                      <td width="6" height="6"
                          style="background:#d4af37;font-size:1px;"></td>
                      <td width="10"></td>
                      <td width="80" height="1"
                          style="background:#d4af37;font-size:1px;
                                 line-height:1px;opacity:0.5;">&nbsp;</td>
                    </tr>
                  </table>

                  <!-- SALUTATION + CALLIGRAPHY NAME -->
                  <table role="presentation" cellspacing="0"
                         cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding-top:10px;">
                        <p style="font-family:Georgia,'Times New Roman',serif;
                                  font-size:14px;font-style:italic;
                                  color:#999;letter-spacing:2px;
                                  margin:0 0 14px 0;text-align:center;">
                          Salutations,
                        </p>
                        <div class="calli">${safeName}</div>
                        <table role="presentation" cellspacing="0"
                               cellpadding="0" border="0" align="center"
                               style="margin:10px auto 28px;">
                          <tr>
                            <td width="160" height="1"
                                style="background:#d4af37;font-size:1px;
                                       line-height:1px;">&nbsp;</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- BODY MESSAGE 1 -->
                  <table role="presentation" cellspacing="0"
                         cellpadding="0" border="0" width="100%">
                    <tr>
                      <td>
                        <p class="body-text" style="margin:0 0 24px 0;">
                          Welcome to the threshold of our literary fellowship.
                          To verify your email and complete your enrollment
                          in the society records, please enter the security authentication
                          code provided below.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- CODE BADGE -->
                  <table role="presentation" cellspacing="0"
                         cellpadding="0" border="0" align="center"
                         style="margin:0 auto 28px;border:1px solid #d4af37;background:#fdfbf7;">
                    <tr>
                      <td class="badge-cell"
                          style="padding:16px 40px;text-align:center;">
                        <div style="font-family:Arial,Helvetica,sans-serif;
                                    font-size:8px;letter-spacing:2.5px;
                                    color:#a0906a;text-transform:uppercase;
                                    margin-bottom:6px;">
                          SECURITY AUTHENTICATION CODE
                        </div>
                        <div style="font-family:monospace,'Courier New',serif;
                                    font-size:36px;letter-spacing:10px;
                                    color:#001f3f;font-weight:800;padding-left:10px;">
                          ${code}
                        </div>
                        <div style="font-family:Georgia,serif;
                                    font-size:10px;font-style:italic;
                                    color:#8c8270;letter-spacing:1px;
                                    margin-top:6px;">
                          Single-use code &bull; Valid for 10 minutes
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- DETAILS PANEL -->
                  <table role="presentation" cellspacing="0"
                         cellpadding="0" border="0" width="100%"
                         style="background:#f8f5ee;border:1px solid #e5ddd0;
                                border-left:3px solid #d4af37;
                                margin-bottom:32px;">
                    <tr>
                      <td style="padding:18px 22px;">
                        <p style="font-family:Georgia,serif;font-size:10px;
                                  font-style:italic;color:#a0906a;
                                  letter-spacing:1px;margin:0 0 12px 0;">
                          Verification Record
                        </p>
                        <table role="presentation" cellspacing="0"
                               cellpadding="0" border="0" width="100%">

                          <tr><td style="padding:7px 0;
                                         border-bottom:1px dotted #ddd5c5;">
                            <table role="presentation" cellspacing="0"
                                   cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="font-family:Georgia,serif;
                                           font-size:10px;font-style:italic;
                                           color:#a0906a;width:45%;">Recipient</td>
                                <td class="detail-val" align="right"
                                    style="font-family:'Cormorant Garamond',
                                           Georgia,serif;font-size:14px;
                                           font-weight:600;color:#001f3f;
                                           width:55%;">${safeName}</td>
                              </tr>
                            </table>
                          </td></tr>

                          <tr><td style="padding:7px 0;
                                         border-bottom:1px dotted #ddd5c5;">
                            <table role="presentation" cellspacing="0"
                                   cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="font-family:Georgia,serif;
                                           font-size:10px;font-style:italic;
                                           color:#a0906a;">Registered Email</td>
                                <td class="detail-val" align="right"
                                    style="font-family:'Cormorant Garamond',
                                           Georgia,serif;font-size:14px;
                                           font-weight:600;
                                           color:#001f3f;">${email}</td>
                              </tr>
                            </table>
                          </td></tr>

                          <tr><td style="padding:7px 0;">
                            <table role="presentation" cellspacing="0"
                                   cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="font-family:Georgia,serif;
                                           font-size:10px;font-style:italic;
                                           color:#a0906a;">Purpose</td>
                                <td class="detail-val" align="right"
                                    style="font-family:'Cormorant Garamond',
                                           Georgia,serif;font-size:14px;
                                           font-weight:600;
                                           color:#001f3f;">
                                  Email Authentication</td>
                              </tr>
                            </table>
                          </td></tr>

                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- CLOSING -->
                  <table role="presentation" cellspacing="0"
                         cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center">
                        <p style="font-family:Georgia,'Times New Roman',serif;
                                  font-size:14px;font-style:italic;color:#777;
                                  line-height:1.7;margin:0 0 18px 0;
                                  text-align:center;">
                          If you did not initiate this request, please safely disregard this email.<br>
                          Your account records remain secure.
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;
                                  font-size:13px;font-style:italic;color:#888;
                                  margin:0 0 5px 0;text-align:center;">
                          Warm Regards,
                        </p>
                        <p style="font-family:'Palatino Linotype',
                                  'Book Antiqua',Palatino,Georgia,serif;
                                  font-size:15px;font-weight:700;color:#001f3f;
                                  letter-spacing:3px;margin:0 0 4px 0;
                                  text-align:center;">
                          TEAM EXCELSIOR
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;
                                  font-size:10px;font-style:italic;
                                  color:#b0a080;letter-spacing:1px;
                                  margin:0;text-align:center;">
                          IET Lucknow
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- QUOTE -->
                  <table role="presentation" cellspacing="0"
                         cellpadding="0" border="0" width="100%"
                         style="border-top:1px solid #e8e0d0;margin-top:30px;">
                    <tr>
                      <td align="center" style="padding-top:22px;">
                        <p style="font-family:Georgia,serif;font-size:26px;
                                  color:#d4af37;line-height:1;
                                  margin:0 0 4px 0;text-align:center;">
                          &#8220;
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;
                                  font-size:12px;font-style:italic;color:#aaa;
                                  line-height:1.6;margin:0 0 6px 0;
                                  text-align:center;">
                          Words are, in my not-so-humble opinion, our most inexhaustible source of magic.
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;
                                  font-size:11px;font-style:italic;
                                  color:#c8bfaf;margin:0;text-align:center;">
                          &mdash; Albus Dumbledore
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

            <!-- FOOTER -->
            <table role="presentation" cellspacing="0"
                   cellpadding="0" border="0" width="100%">
              <tr>
                <td class="footer-bar"
                    style="background:#001f3f;padding:14px 30px;
                           text-align:center;">
                  <p style="font-family:Arial,Helvetica,sans-serif;
                             font-size:9px;letter-spacing:2px;
                             color:rgba(212,175,55,0.65);
                             text-transform:uppercase;margin:0;">
                    &copy; 2026 EXCELSIOR &nbsp;&bull;&nbsp; IET LUCKNOW
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>

</body>
</html>`,
    });
    return { success: true, isDev: false };
  } catch (error) {
    console.error('Failed to send OTP email via Nodemailer:', error);
    return { success: true, isDev: true, code };
  }
}

/**
 * Send a Password Reset OTP email
 */
export async function sendPasswordResetEmail(email: string, code: string, recipientName: string) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    console.warn(`[DEV MODE] SMTP_USER or SMTP_PASS not configured. Password Reset OTP for ${email}: ${code}`);
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

    const logoPath = path.join(process.cwd(), 'public/images/image.png');
    const attachments = fs.existsSync(logoPath)
      ? [{ filename: 'image.png', path: logoPath, cid: 'clubLogo' }]
      : [];

    const safeName = recipientName || 'Member';

    await transporter.sendMail({
      from: `"Excelsior-Literary Club of IET Lucknow" <${smtpUser}>`,
      to: email,
      subject: `${code} is your Excelsior password reset code`,
      attachments,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
  body,table,td,p,div{margin:0;padding:0;border:0;}
  body{background:#ffffff;font-family:Georgia,'Times New Roman',serif;}
  img{border:0;display:block;}
  .calli{
    font-family:'Great Vibes','Brush Script MT','Lucida Handwriting',cursive;
    font-size:52px;line-height:1.25;color:#001f3f;text-align:center;
  }
  .body-text{
    font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;
    font-size:16px;line-height:1.85;color:#3a3a3a;text-align:center;
  }
  @media only screen and (max-width:600px){
    .email-card{width:100% !important;}
    .inner-pad{padding:28px 18px !important;}
    .calli{font-size:40px !important;}
    .body-text{font-size:15px !important;}
    .badge-cell{padding:10px 20px !important;}
    .detail-val{font-size:13px !important;}
    .logo-img{width:70px !important;height:70px !important;}
    .club-name{font-size:18px !important;letter-spacing:5px !important;}
    .footer-bar{padding:14px 20px !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#ffffff;">

<table role="presentation" cellspacing="0" cellpadding="0"
       border="0" width="100%" style="background:#ffffff;">
  <tr>
    <td align="center" style="padding:30px 10px 0;">

      <table class="email-card" role="presentation"
             cellspacing="0" cellpadding="0" border="0" width="600"
             style="background:#fffdf7;border:1px solid #e2d9c8;
                    border-top:5px solid #001f3f;">
        <tr>
          <td>
            <table role="presentation" cellspacing="0"
                   cellpadding="0" border="0" width="100%">
              <tr>
                <td class="inner-pad" style="padding:45px 50px;">

                  <!-- LOGO -->
                  <table role="presentation" cellspacing="0"
                         cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding-bottom:14px;">
                        <img class="logo-img"
                             src="cid:clubLogo"
                             alt="Excelsior"
                             width="85" height="85"
                             style="width:85px;height:85px;
                                    object-fit:contain;border-radius:4px;margin:0 auto;">
                      </td>
                    </tr>
                  </table>

                  <!-- CLUB NAME -->
                  <table role="presentation" cellspacing="0"
                         cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center">
                        <div class="club-name"
                             style="font-family:'Palatino Linotype',
                                    'Book Antiqua',Palatino,Georgia,serif;
                                    font-size:22px;font-weight:700;
                                    letter-spacing:8px;color:#001f3f;
                                    text-transform:uppercase;
                                    margin-bottom:6px;">
                          EXCELSIOR
                        </div>
                        <div style="font-family:Georgia,'Times New Roman',serif;
                                    font-size:10px;letter-spacing:3px;
                                    color:#d4af37;font-style:italic;
                                    margin-bottom:22px;">
                          The Literary Club of IET Lucknow
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- DIVIDER -->
                  <table role="presentation" cellspacing="0"
                         cellpadding="0" border="0" align="center"
                         style="margin:0 auto 20px;">
                    <tr>
                      <td width="80" height="1"
                          style="background:#d4af37;font-size:1px;
                                 line-height:1px;opacity:0.5;">&nbsp;</td>
                      <td width="10"></td>
                      <td width="6" height="6"
                          style="background:#d4af37;font-size:1px;"></td>
                      <td width="10"></td>
                      <td width="80" height="1"
                          style="background:#d4af37;font-size:1px;
                                 line-height:1px;opacity:0.5;">&nbsp;</td>
                    </tr>
                  </table>

                  <!-- SALUTATION + CALLIGRAPHY NAME -->
                  <table role="presentation" cellspacing="0"
                         cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding-top:10px;">
                        <p style="font-family:Georgia,'Times New Roman',serif;
                                  font-size:14px;font-style:italic;
                                  color:#999;letter-spacing:2px;
                                  margin:0 0 14px 0;text-align:center;">
                          Salutations,
                        </p>
                        <div class="calli">${safeName}</div>
                        <table role="presentation" cellspacing="0"
                               cellpadding="0" border="0" align="center"
                               style="margin:10px auto 28px;">
                          <tr>
                            <td width="160" height="1"
                                style="background:#d4af37;font-size:1px;
                                       line-height:1px;">&nbsp;</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- BODY MESSAGE 1 -->
                  <table role="presentation" cellspacing="0"
                         cellpadding="0" border="0" width="100%">
                    <tr>
                      <td>
                        <p class="body-text" style="margin:0 0 24px 0;">
                          We received a request to reset the credentials for your
                          Excelsior account. Use the one-time password recovery code below
                          to select a new password.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- CODE BADGE -->
                  <table role="presentation" cellspacing="0"
                         cellpadding="0" border="0" align="center"
                         style="margin:0 auto 28px;border:1px solid #d4af37;background:#fdfbf7;">
                    <tr>
                      <td class="badge-cell"
                          style="padding:16px 40px;text-align:center;">
                        <div style="font-family:Arial,Helvetica,sans-serif;
                                    font-size:8px;letter-spacing:2.5px;
                                    color:#a0906a;text-transform:uppercase;
                                    margin-bottom:6px;">
                          PASSWORD RECOVERY CODE
                        </div>
                        <div style="font-family:monospace,'Courier New',serif;
                                    font-size:36px;letter-spacing:10px;
                                    color:#001f3f;font-weight:800;padding-left:10px;">
                          ${code}
                        </div>
                        <div style="font-family:Georgia,serif;
                                    font-size:10px;font-style:italic;
                                    color:#8c8270;letter-spacing:1px;
                                    margin-top:6px;">
                          Single-use code &bull; Valid for 10 minutes
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- DETAILS PANEL -->
                  <table role="presentation" cellspacing="0"
                         cellpadding="0" border="0" width="100%"
                         style="background:#f8f5ee;border:1px solid #e5ddd0;
                                border-left:3px solid #d4af37;
                                margin-bottom:32px;">
                    <tr>
                      <td style="padding:18px 22px;">
                        <p style="font-family:Georgia,serif;font-size:10px;
                                  font-style:italic;color:#a0906a;
                                  letter-spacing:1px;margin:0 0 12px 0;">
                          Account Security Record
                        </p>
                        <table role="presentation" cellspacing="0"
                               cellpadding="0" border="0" width="100%">

                          <tr><td style="padding:7px 0;
                                         border-bottom:1px dotted #ddd5c5;">
                            <table role="presentation" cellspacing="0"
                                   cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="font-family:Georgia,serif;
                                           font-size:10px;font-style:italic;
                                           color:#a0906a;width:45%;">Account</td>
                                <td class="detail-val" align="right"
                                    style="font-family:'Cormorant Garamond',
                                           Georgia,serif;font-size:14px;
                                           font-weight:600;color:#001f3f;
                                           width:55%;">${safeName}</td>
                              </tr>
                            </table>
                          </td></tr>

                          <tr><td style="padding:7px 0;
                                         border-bottom:1px dotted #ddd5c5;">
                            <table role="presentation" cellspacing="0"
                                   cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="font-family:Georgia,serif;
                                           font-size:10px;font-style:italic;
                                           color:#a0906a;">Email Target</td>
                                <td class="detail-val" align="right"
                                    style="font-family:'Cormorant Garamond',
                                           Georgia,serif;font-size:14px;
                                           font-weight:600;
                                           color:#001f3f;">${email}</td>
                              </tr>
                            </table>
                          </td></tr>

                          <tr><td style="padding:7px 0;">
                            <table role="presentation" cellspacing="0"
                                   cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="font-family:Georgia,serif;
                                           font-size:10px;font-style:italic;
                                           color:#a0906a;">Action</td>
                                <td class="detail-val" align="right"
                                    style="font-family:'Cormorant Garamond',
                                           Georgia,serif;font-size:14px;
                                           font-weight:600;
                                           color:#001f3f;">
                                  Password Reset</td>
                              </tr>
                            </table>
                          </td></tr>

                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- CLOSING -->
                  <table role="presentation" cellspacing="0"
                         cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center">
                        <p style="font-family:Georgia,'Times New Roman',serif;
                                  font-size:14px;font-style:italic;color:#777;
                                  line-height:1.7;margin:0 0 18px 0;
                                  text-align:center;">
                          If you did not request this password recovery, please ignore this email.<br>
                          Your password will remain unchanged.
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;
                                  font-size:13px;font-style:italic;color:#888;
                                  margin:0 0 5px 0;text-align:center;">
                          Warm Regards,
                        </p>
                        <p style="font-family:'Palatino Linotype',
                                  'Book Antiqua',Palatino,Georgia,serif;
                                  font-size:15px;font-weight:700;color:#001f3f;
                                  letter-spacing:3px;margin:0 0 4px 0;
                                  text-align:center;">
                          TEAM EXCELSIOR
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;
                                  font-size:10px;font-style:italic;
                                  color:#b0a080;letter-spacing:1px;
                                  margin:0;text-align:center;">
                          IET Lucknow
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- QUOTE -->
                  <table role="presentation" cellspacing="0"
                         cellpadding="0" border="0" width="100%"
                         style="border-top:1px solid #e8e0d0;margin-top:30px;">
                    <tr>
                      <td align="center" style="padding-top:22px;">
                        <p style="font-family:Georgia,serif;font-size:26px;
                                  color:#d4af37;line-height:1;
                                  margin:0 0 4px 0;text-align:center;">
                          &#8220;
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;
                                  font-size:12px;font-style:italic;color:#aaa;
                                  line-height:1.6;margin:0 0 6px 0;
                                  text-align:center;">
                          The art of writing is the art of discovering what you believe.
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;
                                  font-size:11px;font-style:italic;
                                  color:#c8bfaf;margin:0;text-align:center;">
                          &mdash; Gustave Flaubert
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

            <!-- FOOTER -->
            <table role="presentation" cellspacing="0"
                   cellpadding="0" border="0" width="100%">
              <tr>
                <td class="footer-bar"
                    style="background:#001f3f;padding:14px 30px;
                           text-align:center;">
                  <p style="font-family:Arial,Helvetica,sans-serif;
                             font-size:9px;letter-spacing:2px;
                             color:rgba(212,175,55,0.65);
                             text-transform:uppercase;margin:0;">
                    &copy; 2026 EXCELSIOR &nbsp;&bull;&nbsp; IET LUCKNOW
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>

</body>
</html>`,
    });
    return { success: true, isDev: false };
  } catch (error) {
    console.error('Failed to send password reset email via Nodemailer:', error);
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

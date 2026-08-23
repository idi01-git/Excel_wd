import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

type PaymentConfirmedInput = {
  to: string;
  recipientName: string;
  event: { title: string; date: Date; venue: string; time?: string | null };
};

type RegistrationConfirmedInput = {
  to: string;
  recipientName: string;
  ticketRef: string;
  event: { title: string; date: Date; venue: string; time?: string | null; rulebookUrl?: string | null };
  paymentPending: boolean;
};

function getEmailAttachments() {
  const logoPath = path.join(process.cwd(), 'public/images/image.png');
  return fs.existsSync(logoPath)
    ? [{ filename: 'image.png', path: logoPath, cid: 'clubLogo' }]
    : [];
}

export async function sendRegistrationEmail({
  to,
  recipientName,
  ticketRef,
  event,
  paymentPending,
}: RegistrationConfirmedInput) {
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
    const safeName = recipientName || 'Participant';

    const rulebookButton = event.rulebookUrl
      ? `<div style="text-align:center;margin:24px 0 10px 0;">
          <a href="${event.rulebookUrl}" style="display:inline-block;background:#001f3f;color:#d4af37;border:1px solid #d4af37;padding:10px 24px;font-family:'Palatino Linotype',Palatino,serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:2px;">
            Download Official Rulebook &rarr;
          </a>
        </div>`
      : '';

    await transporter.sendMail({
      from: `"Excelsior-Literary Club of IET Lucknow" <${smtpUser}>`,
      to,
      subject: `Registration Confirmed — ${event.title}`,
      attachments: getEmailAttachments(),
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

<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;">
  <tr>
    <td align="center" style="padding:30px 10px 0;">

      <table class="email-card" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600"
             style="background:#fffdf7;border:1px solid #e2d9c8;border-top:5px solid #001f3f;">
        <tr>
          <td>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td class="inner-pad" style="padding:45px 50px;">

                  <!-- LOGO -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding-bottom:14px;">
                        <img class="logo-img" src="cid:clubLogo" alt="Excelsior" width="85" height="85"
                             style="width:85px;height:85px;object-fit:contain;border-radius:4px;margin:0 auto;">
                      </td>
                    </tr>
                  </table>

                  <!-- CLUB NAME -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center">
                        <div class="club-name"
                             style="font-family:'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif;
                                    font-size:22px;font-weight:700;letter-spacing:8px;color:#001f3f;
                                    text-transform:uppercase;margin-bottom:6px;">
                          EXCELSIOR
                        </div>
                        <div style="font-family:Georgia,'Times New Roman',serif;font-size:10px;
                                    letter-spacing:3px;color:#d4af37;font-style:italic;margin-bottom:22px;">
                          The Literary Club of IET Lucknow
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- DIVIDER -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 20px;">
                    <tr>
                      <td width="80" height="1" style="background:#d4af37;font-size:1px;line-height:1px;opacity:0.5;">&nbsp;</td>
                      <td width="10"></td>
                      <td width="6" height="6" style="background:#d4af37;font-size:1px;"></td>
                      <td width="10"></td>
                      <td width="80" height="1" style="background:#d4af37;font-size:1px;line-height:1px;opacity:0.5;">&nbsp;</td>
                    </tr>
                  </table>

                  <!-- SALUTATION + CALLIGRAPHY NAME -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding-top:10px;">
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:14px;font-style:italic;
                                  color:#999;letter-spacing:2px;margin:0 0 14px 0;text-align:center;">
                          Salutations,
                        </p>
                        <div class="calli">${safeName}</div>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:10px auto 28px;">
                          <tr>
                            <td width="160" height="1" style="background:#d4af37;font-size:1px;line-height:1px;">&nbsp;</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- BODY MESSAGE 1 -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td>
                        <p class="body-text" style="margin:0 0 24px 0;">
                          Your seat has been reserved in the society roster for
                          <em style="color:#001f3f;font-style:italic;">${event.title}</em>.
                          We are honored to have your voice enrich the discourse of our forthcoming assembly.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- PASS BADGE -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center"
                         style="margin:0 auto 28px;border:1px solid #d4af37;background:#fdfbf7;">
                    <tr>
                      <td class="badge-cell" style="padding:14px 38px;text-align:center;">
                        <div style="font-family:Arial,Helvetica,sans-serif;font-size:7px;letter-spacing:2.5px;
                                    color:#a0906a;text-transform:uppercase;margin-bottom:5px;">
                          OFFICIAL ADMIT PASS REFERENCE
                        </div>
                        <div style="font-family:monospace,'Courier New',serif;font-size:18px;letter-spacing:3px;
                                    color:#001f3f;text-transform:uppercase;font-weight:800;">
                          ${ticketRef}
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- DETAILS PANEL -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                         style="background:#f8f5ee;border:1px solid #e5ddd0;border-left:3px solid #d4af37;margin-bottom:28px;">
                    <tr>
                      <td style="padding:18px 22px;">
                        <p style="font-family:Georgia,serif;font-size:10px;font-style:italic;color:#a0906a;
                                  letter-spacing:1px;margin:0 0 12px 0;">
                          Event Entry Record
                        </p>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">

                          <tr><td style="padding:7px 0;border-bottom:1px dotted #ddd5c5;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="font-family:Georgia,serif;font-size:10px;font-style:italic;color:#a0906a;width:45%;">Participant</td>
                                <td class="detail-val" align="right"
                                    style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;font-weight:600;color:#001f3f;width:55%;">${safeName}</td>
                              </tr>
                            </table>
                          </td></tr>

                          <tr><td style="padding:7px 0;border-bottom:1px dotted #ddd5c5;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="font-family:Georgia,serif;font-size:10px;font-style:italic;color:#a0906a;">Event</td>
                                <td class="detail-val" align="right"
                                    style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;font-weight:600;color:#001f3f;">${event.title}</td>
                              </tr>
                            </table>
                          </td></tr>

                          <tr><td style="padding:7px 0;border-bottom:1px dotted #ddd5c5;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="font-family:Georgia,serif;font-size:10px;font-style:italic;color:#a0906a;">Schedule</td>
                                <td class="detail-val" align="right"
                                    style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;font-weight:600;color:#001f3f;">${date}${timePart}</td>
                              </tr>
                            </table>
                          </td></tr>

                          <tr><td style="padding:7px 0;border-bottom:1px dotted #ddd5c5;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="font-family:Georgia,serif;font-size:10px;font-style:italic;color:#a0906a;">Venue</td>
                                <td class="detail-val" align="right"
                                    style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;font-weight:600;color:#001f3f;">${event.venue}</td>
                              </tr>
                            </table>
                          </td></tr>

                          <tr><td style="padding:7px 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="font-family:Georgia,serif;font-size:10px;font-style:italic;color:#a0906a;">Payment Status</td>
                                <td class="detail-val" align="right"
                                    style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;font-weight:600;color:${paymentPending ? '#b45309' : '#001f3f'};">
                                  ${paymentPending ? 'Verification Pending' : 'Confirmed'}
                                </td>
                              </tr>
                            </table>
                          </td></tr>

                        </table>
                      </td>
                    </tr>
                  </table>

                  ${rulebookButton}

                  <!-- CLOSING -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center">
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:14px;font-style:italic;color:#777;line-height:1.7;margin:0 0 18px 0;text-align:center;">
                          Kindly preserve this admit pass for entry upon arrival.<br>
                          We look forward to seeing you at the assembly.
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:13px;font-style:italic;color:#888;margin:0 0 5px 0;text-align:center;">
                          Warm Regards,
                        </p>
                        <p style="font-family:'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif;font-size:15px;font-weight:700;color:#001f3f;letter-spacing:3px;margin:0 0 4px 0;text-align:center;">
                          TEAM EXCELSIOR
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:10px;font-style:italic;color:#b0a080;letter-spacing:1px;margin:0;text-align:center;">
                          IET Lucknow
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- QUOTE -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                         style="border-top:1px solid #e8e0d0;margin-top:30px;">
                    <tr>
                      <td align="center" style="padding-top:22px;">
                        <p style="font-family:Georgia,serif;font-size:26px;color:#d4af37;line-height:1;margin:0 0 4px 0;text-align:center;">
                          &#8220;
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:12px;font-style:italic;color:#aaa;line-height:1.6;margin:0 0 6px 0;text-align:center;">
                          Literature is the immortality of speech.
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:11px;font-style:italic;color:#c8bfaf;margin:0;text-align:center;">
                          &mdash; August Wilhelm von Schlegel
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

            <!-- FOOTER -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td class="footer-bar" style="background:#001f3f;padding:14px 30px;text-align:center;">
                  <p style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:2px;color:rgba(212,175,55,0.65);text-transform:uppercase;margin:0;">
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
    const timePart = event.time ? ` · ${event.time}` : '';
    const safeName = recipientName || 'Participant';

    await transporter.sendMail({
      from: `"Excelsior-Literary Club of IET Lucknow" <${smtpUser}>`,
      to,
      subject: `Participation Confirmed — ${event.title}`,
      attachments: getEmailAttachments(),
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

<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;">
  <tr>
    <td align="center" style="padding:30px 10px 0;">

      <table class="email-card" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600"
             style="background:#fffdf7;border:1px solid #e2d9c8;border-top:5px solid #001f3f;">
        <tr>
          <td>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td class="inner-pad" style="padding:45px 50px;">

                  <!-- LOGO -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding-bottom:14px;">
                        <img class="logo-img" src="cid:clubLogo" alt="Excelsior" width="85" height="85"
                             style="width:85px;height:85px;object-fit:contain;border-radius:4px;margin:0 auto;">
                      </td>
                    </tr>
                  </table>

                  <!-- CLUB NAME -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center">
                        <div class="club-name"
                             style="font-family:'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif;
                                    font-size:22px;font-weight:700;letter-spacing:8px;color:#001f3f;
                                    text-transform:uppercase;margin-bottom:6px;">
                          EXCELSIOR
                        </div>
                        <div style="font-family:Georgia,'Times New Roman',serif;font-size:10px;
                                    letter-spacing:3px;color:#d4af37;font-style:italic;margin-bottom:22px;">
                          The Literary Club of IET Lucknow
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- DIVIDER -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 20px;">
                    <tr>
                      <td width="80" height="1" style="background:#d4af37;font-size:1px;line-height:1px;opacity:0.5;">&nbsp;</td>
                      <td width="10"></td>
                      <td width="6" height="6" style="background:#d4af37;font-size:1px;"></td>
                      <td width="10"></td>
                      <td width="80" height="1" style="background:#d4af37;font-size:1px;line-height:1px;opacity:0.5;">&nbsp;</td>
                    </tr>
                  </table>

                  <!-- SALUTATION + CALLIGRAPHY NAME -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding-top:10px;">
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:14px;font-style:italic;
                                  color:#999;letter-spacing:2px;margin:0 0 14px 0;text-align:center;">
                          Salutations,
                        </p>
                        <div class="calli">${safeName}</div>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:10px auto 28px;">
                          <tr>
                            <td width="160" height="1" style="background:#d4af37;font-size:1px;line-height:1px;">&nbsp;</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- BODY MESSAGE 1 -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td>
                        <p class="body-text" style="margin:0 0 24px 0;">
                          Your registration fee for
                          <em style="color:#001f3f;font-style:italic;">${event.title}</em>
                          has been formally verified and approved by the Excelsior Treasury.
                          Your participation is fully secured.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- VERIFIED BADGE -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center"
                         style="margin:0 auto 28px;border:1px solid #d4af37;background:#fdfbf7;">
                    <tr>
                      <td class="badge-cell" style="padding:12px 38px;text-align:center;">
                        <div style="font-family:Arial,Helvetica,sans-serif;font-size:7px;letter-spacing:2.5px;
                                    color:#a0906a;text-transform:uppercase;margin-bottom:5px;">
                          TREASURY AUDIT RECORD
                        </div>
                        <div style="font-family:'Palatino Linotype',Palatino,Georgia,serif;font-size:12px;letter-spacing:2.5px;
                                    color:#001f3f;text-transform:uppercase;font-weight:700;">
                          PAYMENT VERIFIED &bull; SEAT CONFIRMED
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- DETAILS PANEL -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                         style="background:#f8f5ee;border:1px solid #e5ddd0;border-left:3px solid #d4af37;margin-bottom:32px;">
                    <tr>
                      <td style="padding:18px 22px;">
                        <p style="font-family:Georgia,serif;font-size:10px;font-style:italic;color:#a0906a;
                                  letter-spacing:1px;margin:0 0 12px 0;">
                          Participation Record
                        </p>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">

                          <tr><td style="padding:7px 0;border-bottom:1px dotted #ddd5c5;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="font-family:Georgia,serif;font-size:10px;font-style:italic;color:#a0906a;width:45%;">Participant</td>
                                <td class="detail-val" align="right"
                                    style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;font-weight:600;color:#001f3f;width:55%;">${safeName}</td>
                              </tr>
                            </table>
                          </td></tr>

                          <tr><td style="padding:7px 0;border-bottom:1px dotted #ddd5c5;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="font-family:Georgia,serif;font-size:10px;font-style:italic;color:#a0906a;">Event</td>
                                <td class="detail-val" align="right"
                                    style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;font-weight:600;color:#001f3f;">${event.title}</td>
                              </tr>
                            </table>
                          </td></tr>

                          <tr><td style="padding:7px 0;border-bottom:1px dotted #ddd5c5;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="font-family:Georgia,serif;font-size:10px;font-style:italic;color:#a0906a;">Date &amp; Time</td>
                                <td class="detail-val" align="right"
                                    style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;font-weight:600;color:#001f3f;">${date}${timePart}</td>
                              </tr>
                            </table>
                          </td></tr>

                          <tr><td style="padding:7px 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="font-family:Georgia,serif;font-size:10px;font-style:italic;color:#a0906a;">Venue</td>
                                <td class="detail-val" align="right"
                                    style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;font-weight:600;color:#001f3f;">${event.venue}</td>
                              </tr>
                            </table>
                          </td></tr>

                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- CLOSING -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center">
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:14px;font-style:italic;color:#777;line-height:1.7;margin:0 0 18px 0;text-align:center;">
                          We look forward to an invigorating exchange of thought and expression.<br>
                          See you at the assembly.
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:13px;font-style:italic;color:#888;margin:0 0 5px 0;text-align:center;">
                          Warm Regards,
                        </p>
                        <p style="font-family:'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif;font-size:15px;font-weight:700;color:#001f3f;letter-spacing:3px;margin:0 0 4px 0;text-align:center;">
                          TEAM EXCELSIOR
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:10px;font-style:italic;color:#b0a080;letter-spacing:1px;margin:0;text-align:center;">
                          IET Lucknow
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- QUOTE -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                         style="border-top:1px solid #e8e0d0;margin-top:30px;">
                    <tr>
                      <td align="center" style="padding-top:22px;">
                        <p style="font-family:Georgia,serif;font-size:26px;color:#d4af37;line-height:1;margin:0 0 4px 0;text-align:center;">
                          &#8220;
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:12px;font-style:italic;color:#aaa;line-height:1.6;margin:0 0 6px 0;text-align:center;">
                          Ideas are like stars; you will not succeed in touching them with your hands. But like the seafaring man on the deserts of waters, you choose them as your guides.
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:11px;font-style:italic;color:#c8bfaf;margin:0;text-align:center;">
                          &mdash; Carl Schurz
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

            <!-- FOOTER -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td class="footer-bar" style="background:#001f3f;padding:14px 30px;text-align:center;">
                  <p style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:2px;color:rgba(212,175,55,0.65);text-transform:uppercase;margin:0;">
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
    const safeName = recipientName || 'Participant';

    const changesRows = changes
      .map(
        (c) =>
          `<tr><td style="padding:6px 0;border-bottom:1px dotted #ddd5c5;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="font-family:Georgia,serif;font-size:10px;font-style:italic;color:#a0906a;width:35%;">${c.field}</td>
                <td class="detail-val" align="right" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:13px;font-weight:600;color:#001f3f;width:65%;">
                  ${c.oldVal ? `<span style="text-decoration:line-through;color:#999;margin-right:6px;">${c.oldVal}</span> &rarr; ` : ''}
                  <span style="color:#001f3f;font-weight:700;">${c.newVal}</span>
                </td>
              </tr>
            </table>
          </td></tr>`
      )
      .join('');

    const noteHtml = customNote
      ? `<div style="background:#fffdf7;border-left:3px solid #d4af37;padding:12px 16px;margin:20px 0;font-style:italic;color:#3a3a3a;font-size:14px;line-height:1.6;">${customNote}</div>`
      : '';

    await transporter.sendMail({
      from: `"Excelsior-Literary Club of IET Lucknow" <${smtpUser}>`,
      to,
      subject: `Schedule Update: ${eventTitle}`,
      attachments: getEmailAttachments(),
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

<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;">
  <tr>
    <td align="center" style="padding:30px 10px 0;">

      <table class="email-card" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600"
             style="background:#fffdf7;border:1px solid #e2d9c8;border-top:5px solid #001f3f;">
        <tr>
          <td>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td class="inner-pad" style="padding:45px 50px;">

                  <!-- LOGO -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding-bottom:14px;">
                        <img class="logo-img" src="cid:clubLogo" alt="Excelsior" width="85" height="85"
                             style="width:85px;height:85px;object-fit:contain;border-radius:4px;margin:0 auto;">
                      </td>
                    </tr>
                  </table>

                  <!-- CLUB NAME -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center">
                        <div class="club-name"
                             style="font-family:'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif;
                                    font-size:22px;font-weight:700;letter-spacing:8px;color:#001f3f;
                                    text-transform:uppercase;margin-bottom:6px;">
                          EXCELSIOR
                        </div>
                        <div style="font-family:Georgia,'Times New Roman',serif;font-size:10px;
                                    letter-spacing:3px;color:#d4af37;font-style:italic;margin-bottom:22px;">
                          The Literary Club of IET Lucknow
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- DIVIDER -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 20px;">
                    <tr>
                      <td width="80" height="1" style="background:#d4af37;font-size:1px;line-height:1px;opacity:0.5;">&nbsp;</td>
                      <td width="10"></td>
                      <td width="6" height="6" style="background:#d4af37;font-size:1px;"></td>
                      <td width="10"></td>
                      <td width="80" height="1" style="background:#d4af37;font-size:1px;line-height:1px;opacity:0.5;">&nbsp;</td>
                    </tr>
                  </table>

                  <!-- SALUTATION + CALLIGRAPHY NAME -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding-top:10px;">
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:14px;font-style:italic;
                                  color:#999;letter-spacing:2px;margin:0 0 14px 0;text-align:center;">
                          Salutations,
                        </p>
                        <div class="calli">${safeName}</div>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:10px auto 28px;">
                          <tr>
                            <td width="160" height="1" style="background:#d4af37;font-size:1px;line-height:1px;">&nbsp;</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- BODY MESSAGE 1 -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td>
                        <p class="body-text" style="margin:0 0 24px 0;">
                          We write to inform you that logistics or scheduling details for
                          <em style="color:#001f3f;font-style:italic;">${eventTitle}</em>
                          have been revised by the organizing committee.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- SUMMARY OF CHANGES PANEL -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                         style="background:#f8f5ee;border:1px solid #e5ddd0;border-left:3px solid #d4af37;margin-bottom:24px;">
                    <tr>
                      <td style="padding:18px 22px;">
                        <p style="font-family:Georgia,serif;font-size:10px;font-style:italic;color:#a0906a;
                                  letter-spacing:1px;margin:0 0 12px 0;">
                          Summary of Logistics Updates
                        </p>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          ${changesRows}
                        </table>
                      </td>
                    </tr>
                  </table>

                  ${noteHtml}

                  <!-- DETAILS PANEL -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                         style="background:#f8f5ee;border:1px solid #e5ddd0;border-left:3px solid #001f3f;margin-bottom:32px;">
                    <tr>
                      <td style="padding:18px 22px;">
                        <p style="font-family:Georgia,serif;font-size:10px;font-style:italic;color:#001f3f;
                                  letter-spacing:1px;margin:0 0 12px 0;">
                          Current Confirmed Assembly Schedule
                        </p>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr><td style="padding:5px 0;">
                            <span style="font-family:Georgia,serif;font-size:11px;color:#777;">Date &amp; Time:</span>
                            <strong style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;color:#001f3f;float:right;">${dateStr}${timePart}</strong>
                          </td></tr>
                          <tr><td style="padding:5px 0;">
                            <span style="font-family:Georgia,serif;font-size:11px;color:#777;">Venue:</span>
                            <strong style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;color:#001f3f;float:right;">${event.venue}</strong>
                          </td></tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- CLOSING -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center">
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:14px;font-style:italic;color:#777;line-height:1.7;margin:0 0 18px 0;text-align:center;">
                          Your registration remains fully active. If you have any inquiries, feel free to contact us.
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:13px;font-style:italic;color:#888;margin:0 0 5px 0;text-align:center;">
                          Warm Regards,
                        </p>
                        <p style="font-family:'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif;font-size:15px;font-weight:700;color:#001f3f;letter-spacing:3px;margin:0 0 4px 0;text-align:center;">
                          TEAM EXCELSIOR
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:10px;font-style:italic;color:#b0a080;letter-spacing:1px;margin:0;text-align:center;">
                          IET Lucknow
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- QUOTE -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                         style="border-top:1px solid #e8e0d0;margin-top:30px;">
                    <tr>
                      <td align="center" style="padding-top:22px;">
                        <p style="font-family:Georgia,serif;font-size:26px;color:#d4af37;line-height:1;margin:0 0 4px 0;text-align:center;">
                          &#8220;
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:12px;font-style:italic;color:#aaa;line-height:1.6;margin:0 0 6px 0;text-align:center;">
                          Change is the end result of all true learning.
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:11px;font-style:italic;color:#c8bfaf;margin:0;text-align:center;">
                          &mdash; Leo Buscaglia
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

            <!-- FOOTER -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td class="footer-bar" style="background:#001f3f;padding:14px 30px;text-align:center;">
                  <p style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:2px;color:rgba(212,175,55,0.65);text-transform:uppercase;margin:0;">
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
    const safeName = recipientName || 'Participant';

    await transporter.sendMail({
      from: `"Excelsior-Literary Club of IET Lucknow" <${smtpUser}>`,
      to,
      subject: `Tomorrow: ${event.title} Assembly`,
      attachments: getEmailAttachments(),
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

<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;">
  <tr>
    <td align="center" style="padding:30px 10px 0;">

      <table class="email-card" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600"
             style="background:#fffdf7;border:1px solid #e2d9c8;border-top:5px solid #001f3f;">
        <tr>
          <td>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td class="inner-pad" style="padding:45px 50px;">

                  <!-- LOGO -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding-bottom:14px;">
                        <img class="logo-img" src="cid:clubLogo" alt="Excelsior" width="85" height="85"
                             style="width:85px;height:85px;object-fit:contain;border-radius:4px;margin:0 auto;">
                      </td>
                    </tr>
                  </table>

                  <!-- CLUB NAME -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center">
                        <div class="club-name"
                             style="font-family:'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif;
                                    font-size:22px;font-weight:700;letter-spacing:8px;color:#001f3f;
                                    text-transform:uppercase;margin-bottom:6px;">
                          EXCELSIOR
                        </div>
                        <div style="font-family:Georgia,'Times New Roman',serif;font-size:10px;
                                    letter-spacing:3px;color:#d4af37;font-style:italic;margin-bottom:22px;">
                          The Literary Club of IET Lucknow
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- DIVIDER -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 20px;">
                    <tr>
                      <td width="80" height="1" style="background:#d4af37;font-size:1px;line-height:1px;opacity:0.5;">&nbsp;</td>
                      <td width="10"></td>
                      <td width="6" height="6" style="background:#d4af37;font-size:1px;"></td>
                      <td width="10"></td>
                      <td width="80" height="1" style="background:#d4af37;font-size:1px;line-height:1px;opacity:0.5;">&nbsp;</td>
                    </tr>
                  </table>

                  <!-- SALUTATION + CALLIGRAPHY NAME -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding-top:10px;">
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:14px;font-style:italic;
                                  color:#999;letter-spacing:2px;margin:0 0 14px 0;text-align:center;">
                          Salutations,
                        </p>
                        <div class="calli">${safeName}</div>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:10px auto 28px;">
                          <tr>
                            <td width="160" height="1" style="background:#d4af37;font-size:1px;line-height:1px;">&nbsp;</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- BODY MESSAGE 1 -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td>
                        <p class="body-text" style="margin:0 0 24px 0;">
                          This is a cordial reminder that the literary gathering for
                          <em style="color:#001f3f;font-style:italic;">${event.title}</em>
                          takes place tomorrow. We eagerly anticipate your presence and insights.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- DETAILS PANEL -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                         style="background:#f8f5ee;border:1px solid #e5ddd0;border-left:3px solid #d4af37;margin-bottom:32px;">
                    <tr>
                      <td style="padding:18px 22px;">
                        <p style="font-family:Georgia,serif;font-size:10px;font-style:italic;color:#a0906a;
                                  letter-spacing:1px;margin:0 0 12px 0;">
                          Assembly Schedule
                        </p>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">

                          <tr><td style="padding:7px 0;border-bottom:1px dotted #ddd5c5;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="font-family:Georgia,serif;font-size:10px;font-style:italic;color:#a0906a;width:45%;">Assembly</td>
                                <td class="detail-val" align="right"
                                    style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;font-weight:600;color:#001f3f;width:55%;">${event.title}</td>
                              </tr>
                            </table>
                          </td></tr>

                          <tr><td style="padding:7px 0;border-bottom:1px dotted #ddd5c5;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="font-family:Georgia,serif;font-size:10px;font-style:italic;color:#a0906a;">Date &amp; Time</td>
                                <td class="detail-val" align="right"
                                    style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;font-weight:600;color:#001f3f;">${dateStr}${timePart}</td>
                              </tr>
                            </table>
                          </td></tr>

                          <tr><td style="padding:7px 0;border-bottom:1px dotted #ddd5c5;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="font-family:Georgia,serif;font-size:10px;font-style:italic;color:#a0906a;">Venue</td>
                                <td class="detail-val" align="right"
                                    style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;font-weight:600;color:#001f3f;">${event.venue}</td>
                              </tr>
                            </table>
                          </td></tr>

                          ${
                            ticketRef
                              ? `<tr><td style="padding:7px 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="font-family:Georgia,serif;font-size:10px;font-style:italic;color:#a0906a;">Admit Pass</td>
                                <td class="detail-val" align="right"
                                    style="font-family:monospace;font-size:13px;font-weight:700;color:#001f3f;">${ticketRef}</td>
                              </tr>
                            </table>
                          </td></tr>`
                              : ''
                          }

                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- CLOSING -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center">
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:14px;font-style:italic;color:#777;line-height:1.7;margin:0 0 18px 0;text-align:center;">
                          Please arrive 15 minutes prior to the start time with your pass reference.<br>
                          Until tomorrow.
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:13px;font-style:italic;color:#888;margin:0 0 5px 0;text-align:center;">
                          Warm Regards,
                        </p>
                        <p style="font-family:'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif;font-size:15px;font-weight:700;color:#001f3f;letter-spacing:3px;margin:0 0 4px 0;text-align:center;">
                          TEAM EXCELSIOR
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:10px;font-style:italic;color:#b0a080;letter-spacing:1px;margin:0;text-align:center;">
                          IET Lucknow
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- QUOTE -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                         style="border-top:1px solid #e8e0d0;margin-top:30px;">
                    <tr>
                      <td align="center" style="padding-top:22px;">
                        <p style="font-family:Georgia,serif;font-size:26px;color:#d4af37;line-height:1;margin:0 0 4px 0;text-align:center;">
                          &#8220;
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:12px;font-style:italic;color:#aaa;line-height:1.6;margin:0 0 6px 0;text-align:center;">
                          A room without books is like a body without a soul.
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:11px;font-style:italic;color:#c8bfaf;margin:0;text-align:center;">
                          &mdash; Marcus Tullius Cicero
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

            <!-- FOOTER -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td class="footer-bar" style="background:#001f3f;padding:14px 30px;text-align:center;">
                  <p style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:2px;color:rgba(212,175,55,0.65);text-transform:uppercase;margin:0;">
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
  } catch (error) {
    console.error('Failed to send reminder email to', to, error);
  }
}
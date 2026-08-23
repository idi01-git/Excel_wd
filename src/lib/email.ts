import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

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
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    console.warn('Email skipped: SMTP_USER or SMTP_PASS is not configured.');
    return { success: true, data: null };
  }

  const dueDateStr = dueDate.toLocaleDateString('en-IN', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const subject = isOverdue
    ? `Overdue Return Notice: "${bookTitle}"`
    : `Circulation Notice: "${bookTitle}" Due Soon`;

  const safeName = borrowerName || 'Reader';

  const logoPath = path.join(process.cwd(), 'public/images/image.png');
  const attachments = fs.existsSync(logoPath)
    ? [{ filename: 'image.png', path: logoPath, cid: 'clubLogo' }]
    : [];

  const html = `<!DOCTYPE html>
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
                          ${
                            isOverdue
                              ? `The volume you hold in custody from the Excelsior Shelf, <em style="color:#001f3f;font-style:italic;">"${bookTitle}"</em>, is currently <strong style="color:#b45309;">overdue by ${daysDiff} day${daysDiff > 1 ? 's' : ''}</strong>. We kindly request its prompt return so other society members may share in its reading.`
                              : `This is a courteous reminder that the volume borrowed from our society library, <em style="color:#001f3f;font-style:italic;">"${bookTitle}"</em>, is scheduled for return ${daysDiff === 0 ? '<strong style="color:#001f3f;">today</strong>' : `in <strong style="color:#001f3f;">${daysDiff} day${daysDiff > 1 ? 's' : ''}</strong>`}.`
                          }
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- BADGE -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center"
                         style="margin:0 auto 28px;border:1px solid ${isOverdue ? '#b45309' : '#d4af37'};background:#fdfbf7;">
                    <tr>
                      <td class="badge-cell" style="padding:12px 38px;text-align:center;">
                        <div style="font-family:Arial,Helvetica,sans-serif;font-size:7px;letter-spacing:2.5px;
                                    color:#a0906a;text-transform:uppercase;margin-bottom:5px;">
                          CIRCULATION DESK RECORD
                        </div>
                        <div style="font-family:'Palatino Linotype',Palatino,Georgia,serif;font-size:11px;letter-spacing:2.5px;
                                    color:${isOverdue ? '#b45309' : '#001f3f'};text-transform:uppercase;font-weight:700;">
                          ${isOverdue ? 'CIRCULATION OVERDUE' : 'BOOK RETURN SCHEDULED'}
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- DETAILS PANEL -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                         style="background:#f8f5ee;border:1px solid #e5ddd0;border-left:3px solid ${isOverdue ? '#b45309' : '#d4af37'};margin-bottom:32px;">
                    <tr>
                      <td style="padding:18px 22px;">
                        <p style="font-family:Georgia,serif;font-size:10px;font-style:italic;color:#a0906a;
                                  letter-spacing:1px;margin:0 0 12px 0;">
                          Library Circulation Record
                        </p>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">

                          <tr><td style="padding:7px 0;border-bottom:1px dotted #ddd5c5;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="font-family:Georgia,serif;font-size:10px;font-style:italic;color:#a0906a;width:40%;">Borrower</td>
                                <td class="detail-val" align="right"
                                    style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;font-weight:600;color:#001f3f;width:60%;">${safeName}</td>
                              </tr>
                            </table>
                          </td></tr>

                          <tr><td style="padding:7px 0;border-bottom:1px dotted #ddd5c5;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="font-family:Georgia,serif;font-size:10px;font-style:italic;color:#a0906a;">Volume Title</td>
                                <td class="detail-val" align="right"
                                    style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;font-weight:600;color:#001f3f;">${bookTitle}</td>
                              </tr>
                            </table>
                          </td></tr>

                          <tr><td style="padding:7px 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="font-family:Georgia,serif;font-size:10px;font-style:italic;color:#a0906a;">Due Date</td>
                                <td class="detail-val" align="right"
                                    style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;font-weight:600;color:${isOverdue ? '#b45309' : '#001f3f'};">
                                  ${dueDateStr} ${isOverdue ? '(OVERDUE)' : ''}
                                </td>
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
                          Please return the book to the library caretakers at your earliest convenience.<br>
                          Thank you for being a conscientious reader.
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
                          A reader lives a thousand lives before he dies. The man who never reads lives only one.
                        </p>
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:11px;font-style:italic;color:#c8bfaf;margin:0;text-align:center;">
                          &mdash; George R.R. Martin
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
</html>`;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const info = await transporter.sendMail({
      from: `"Excelsior-Literary Club of IET Lucknow" <${smtpUser}>`,
      to,
      subject,
      attachments,
      html,
    });

    return { success: true, data: info };
  } catch (err) {
    console.error('Email send error:', err);
    return { success: false, error: err };
  }
}

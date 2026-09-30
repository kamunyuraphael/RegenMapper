import nodemailer, { Transporter } from 'nodemailer';

let transporterPromise: Promise<Transporter> | null = null;

// Uses real SMTP if configured (SMTP_HOST/PORT/USER/PASS — works with Gmail's
// free SMTP via an app password, or any other provider's free tier).
// Falls back to a free Ethereal test account when nothing is configured, so
// local dev works with zero setup — those emails are never actually
// delivered, but a preview link is logged to the console.
function getTransporter(): Promise<Transporter> {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    const testAccount = await nodemailer.createTestAccount();
    console.log(
      'No SMTP configured — using a free Ethereal test inbox. Emails sent this way are not delivered; ' +
        'a preview link will be logged for each one.'
    );
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  })();

  return transporterPromise;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"ReGen Mapper" <no-reply@regenmapper.local>',
    to,
    subject,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`Email preview (${subject} → ${to}): ${previewUrl}`);
  }
}

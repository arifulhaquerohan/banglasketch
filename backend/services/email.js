// Banglasketch – Professional Email Notification Service
const nodemailer = require("nodemailer");
const { parseUserAgent, formatDateBST } = require("./adminCredentials");

// ---------------------------------------------------------------------------
// Configuration & Helpers
// ---------------------------------------------------------------------------
const BRAND = {
  name: "Banglasketch",
  bn: "বাংলা স্কিচ",
  tagline: "Luxury Interior Architecture & Design Studio",
  colors: {
    gold: "#C5A059",
    goldLight: "#E5C778",
    goldDark: "#936D28",
    navy: "#0A2540",
    navyDeep: "#061A30",
    red: "#E07B2A",
    white: "#FAF7F2",
    muted: "#9CA3AF",
    success: "#10B981",
  },
  contact: process.env.CONTACT_EMAIL || "info@banglasketch.com",
  phone: "01712-458794",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function maskEmail(email) {
  if (!email) return "";
  const [local, domain] = email.toLowerCase().split("@");
  if (!domain) return email;
  const visible = Math.min(2, Math.max(1, local.length - 1));
  const masked =
    local.slice(0, visible) +
    "*".repeat(Math.max(0, local.length - visible - 1)) +
    local.slice(-1);
  return `${masked}@${domain}`;
}

function getTransporter() {
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
}

function isPlaceholderCredential(value) {
  if (!value) return true;
  const v = String(value).trim().toLowerCase();
  return (
    v === "your_app_password" ||
    v === "your_email@gmail.com" ||
    v === "your_email" ||
    v === "password"
  );
}

function canSendMail() {
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");
  return Boolean(
    user &&
      pass &&
      !isPlaceholderCredential(user) &&
      !isPlaceholderCredential(pass)
  );
}

// ---------------------------------------------------------------------------
// Email Templates (Luxury Brand System)
// ---------------------------------------------------------------------------

const createEmailContainer = (heading, subHeading, children) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:#F4EFE6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F4EFE6;padding:40px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 25px 60px rgba(10,37,64,0.14);border:1px solid #EBE4D8;">
          <!-- Luxury Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg, ${BRAND.colors.navy} 0%, ${BRAND.colors.navyDeep} 100%);padding:45px 35px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center">
                    <span style="display:inline-block;padding:4px 14px;background:rgba(197,160,89,0.18);border:1px solid rgba(229,199,120,0.35);border-radius:20px;color:${BRAND.colors.goldLight};font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;">
                      ${BRAND.bn} • ARCHITECTURAL STUDIO
                    </span>
                    <h1 style="color:#FAF7F2;margin:8px 0 0;font-size:30px;font-weight:700;letter-spacing:2px;font-family:Georgia,'Times New Roman',serif;">
                      ${BRAND.name}
                    </h1>
                    <p style="color:${BRAND.colors.muted};margin:8px 0 0;font-size:12px;letter-spacing:3px;text-transform:uppercase;">
                      ${BRAND.tagline}
                    </p>
                    <div style="width:50px;height:2px;background:linear-gradient(90deg, transparent, ${BRAND.colors.gold}, transparent);margin:20px auto 0;"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding:42px 38px;background:#FFFFFF;">
              <h2 style="color:${BRAND.colors.navy};margin:0 0 10px;font-size:23px;font-weight:700;letter-spacing:-0.5px;font-family:Georgia,'Times New Roman',serif;">
                ${escapeHtml(heading)}
              </h2>
              <p style="color:#4B5563;margin:0 0 28px;font-size:15px;line-height:1.65;">
                ${escapeHtml(subHeading)}
              </p>
              ${children}
            </td>
          </tr>

          <!-- Luxury Footer -->
          <tr>
            <td style="background:#F9F8F5;padding:32px 36px;text-align:center;border-top:1px solid #EFECE6;">
              <p style="margin:0 0 8px;font-size:13px;color:#6B7280;">
                <strong style="color:${BRAND.colors.navy};font-weight:700;">${BRAND.name}</strong> • ${BRAND.bn}
              </p>
              <p style="margin:0 0 14px;font-size:12px;color:#9CA3AF;line-height:1.5;">
                Hashem Mansion, Level-1, 48 Kazi Nazrul Islam Ave, Dhaka 1215<br>
                Direct Concierge: +${BRAND.phone} • <a href="mailto:${BRAND.contact}" style="color:${BRAND.colors.goldDark};text-decoration:none;">${BRAND.contact}</a>
              </p>
              <div style="width:30px;height:1px;background:#D1D5DB;margin:12px auto;"></div>
              <p style="margin:0;font-size:11px;color:#9CA3AF;">
                &copy; ${new Date().getFullYear()} ${BRAND.name}. Confidential Security Notice.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ---------------------------------------------------------------------------
// Senders
// ---------------------------------------------------------------------------

const sendContactNotification = async (submission) => {
  if (!canSendMail()) return { skipped: true };

  const name = escapeHtml(submission.name);
  const email = escapeHtml(submission.email);
  const phone = escapeHtml(submission.phone || "—");
  const service = escapeHtml(submission.service_type || "—");
  const message = escapeHtml(submission.message);
  const subjectName = String(submission.name || "Website visitor").replace(/[\r\n]/g, " ");

  const html = createEmailContainer(
    "New Client Inquiry Received",
    "A prospective client has submitted a design request via the Banglasketch website.",
    `
    <table style="width:100%;border-collapse:separate;border-spacing:0 12px;font-size:14px;">
      <tr>
        <td style="padding:14px 18px;background:${BRAND.colors.navy};color:${BRAND.colors.goldLight};border-radius:12px 0 0 12px;font-weight:600;">Name</td>
        <td style="padding:14px 18px;background:#FFFFFF;color:#1F2937;border-radius:0 12px 12px 0;font-weight:500;">${name}</td>
      </tr>
      <tr>
        <td style="padding:14px 18px;background:${BRAND.colors.navy};color:${BRAND.colors.goldLight};border-radius:12px 0 0 12px;font-weight:600;">Email</td>
        <td style="padding:14px 18px;background:#FFFFFF;color:#1F2937;border-radius:0 12px 12px 0;"><a href="mailto:${email}" style="color:${BRAND.colors.red};text-decoration:none;">${email}</a></td>
      </tr>
      <tr>
        <td style="padding:14px 18px;background:${BRAND.colors.navy};color:${BRAND.colors.goldLight};border-radius:12px 0 0 12px;font-weight:600;">Phone</td>
        <td style="padding:14px 18px;background:#FFFFFF;color:#1F2937;border-radius:0 12px 12px 0;">${phone}</td>
      </tr>
      <tr>
        <td style="padding:14px 18px;background:${BRAND.colors.navy};color:${BRAND.colors.goldLight};border-radius:12px 0 0 12px;font-weight:600;">Service</td>
        <td style="padding:14px 18px;background:#FFFFFF;color:#1F2937;border-radius:0 12px 12px 0;font-weight:500;">${service}</td>
      </tr>
      <tr>
        <td style="padding:14px 18px;background:${BRAND.colors.navy};color:${BRAND.colors.goldLight};border-radius:12px 0 0 12px;font-weight:600;vertical-align:top;">Message</td>
        <td style="padding:14px 18px;background:#FFFFFF;color:#1F2937;border-radius:0 12px 12px 0;line-height:1.6;">${message}</td>
      </tr>
    </table>
    <p style="text-align:center;margin-top:24px;color:${BRAND.colors.muted};font-size:11px;">Notification received at ${new Date().toLocaleString()}</p>
  `
  );

  await getTransporter().sendMail({
    from: `"${BRAND.name} Inquiries" <${process.env.SMTP_USER}>`,
    to: BRAND.contact,
    subject: `New Client Inquiry — ${subjectName}`,
    html,
  });
};

const sendClientConfirmation = async (submission) => {
  if (!canSendMail()) return { skipped: true };

  const name = escapeHtml(submission.name);
  const message = escapeHtml(submission.message);

  const html = createEmailContainer(
    `Thank You, ${name}!`,
    `We have received your inquiry and our senior design team will review it shortly. We aim to respond within 24 hours to discuss how we can transform your space.`,
    `
    <div style="background:#FFFFFF;border-left:4px solid ${BRAND.colors.gold};padding:20px;border-radius:8px;margin:24px 0;">
      <p style="color:${BRAND.colors.goldDark};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Your Inquiry Summary</p>
      <p style="color:#374151;margin:0;font-style:italic;line-height:1.7;">"${message}"</p>
    </div>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">In the meantime, feel free to reach us directly:</p>
    <p style="color:${BRAND.colors.navy};font-size:15px;font-weight:600;margin:8px 0;">📞 ${BRAND.phone}</p>
    <p style="color:#6B7280;font-size:14px;margin:0;">🌐 <a href="/" style="color:${BRAND.colors.red};text-decoration:none;">Visit banglasketch.com</a></p>
  `
  );

  await getTransporter().sendMail({
    from: `"${BRAND.name}" <${process.env.SMTP_USER}>`,
    to: submission.email,
    subject: `We received your message — ${BRAND.name}`,
    html,
  });
};

// ---------------------------------------------------------------------------
// Admin Password Reset & Security Notifications
// ---------------------------------------------------------------------------

function buildOtpEmailHtml(otp, targetEmail, expiresInMinutes = 10) {
  const masked = maskEmail(targetEmail);

  const html = createEmailContainer(
    "Password Reset Verification Code",
    `A master password reset request was initiated for your Banglasketch CMS account associated with <strong style="color:${BRAND.colors.navy};">${masked}</strong>. Use the single-use security code below to proceed:`,
    `
    <!-- OTP Code Display Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
      <tr>
        <td align="center">
          <div style="background:#FBF8F3;border:2px dashed ${BRAND.colors.gold};border-radius:18px;padding:34px 24px;text-align:center;max-width:380px;box-shadow:0 8px 30px rgba(197,160,89,0.12);">
            <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:${BRAND.colors.goldDark};margin-bottom:14px;font-weight:700;">
              One-Time Verification Code
            </div>
            <div style="font-size:44px;letter-spacing:12px;font-weight:800;color:${BRAND.colors.navy};font-family:'Courier New',Courier,monospace;line-height:1;padding-left:12px;">
              ${otp}
            </div>
            <p style="margin:16px 0 0;font-size:12px;color:#6B7280;">
              Enter this code on the password reset screen.<br>Never share this code with anyone.
            </p>
          </div>
        </td>
      </tr>
    </table>

    <!-- Security Meta Badges (Table Layout for Maximum Client Compatibility) -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 10px;border-top:1px solid #F3F4F6;padding-top:20px;">
      <tr>
        <td align="center" width="33%" style="padding:10px 5px;vertical-align:top;">
          <div style="width:38px;height:38px;border-radius:50%;background:#0A2540;color:#E5C778;line-height:38px;text-align:center;margin:0 auto 8px;font-size:16px;">⏱</div>
          <p style="margin:0;font-size:12px;color:#4B5563;font-weight:500;">Expires in</p>
          <p style="margin:2px 0 0;font-size:12px;color:${BRAND.colors.red};font-weight:700;">${expiresInMinutes} Minutes</p>
        </td>
        <td align="center" width="33%" style="padding:10px 5px;vertical-align:top;">
          <div style="width:38px;height:38px;border-radius:50%;background:#D1FAE5;color:#059669;line-height:38px;text-align:center;margin:0 auto 8px;font-size:16px;">🔒</div>
          <p style="margin:0;font-size:12px;color:#4B5563;font-weight:500;">Encrypted</p>
          <p style="margin:2px 0 0;font-size:12px;color:#059669;font-weight:700;">End-to-End</p>
        </td>
        <td align="center" width="33%" style="padding:10px 5px;vertical-align:top;">
          <div style="width:38px;height:38px;border-radius:50%;background:#FEE2E2;color:#DC2626;line-height:38px;text-align:center;margin:0 auto 8px;font-size:16px;">⚠️</div>
          <p style="margin:0;font-size:12px;color:#4B5563;font-weight:500;">Didn't request?</p>
          <p style="margin:2px 0 0;font-size:12px;color:#DC2626;font-weight:700;">Ignore safely</p>
        </td>
      </tr>
    </table>
  `
  );
  return html;
}

const sendPasswordResetOTP = async ({ to, otp, expiresInMinutes = 10 }) => {
  const target = (to || process.env.ADMIN_RECOVERY_EMAIL || "arifulhaquerohan@gmail.com").trim().toLowerCase();
  const html = buildOtpEmailHtml(otp, target, expiresInMinutes);

  if (canSendMail()) {
    try {
      await getTransporter().sendMail({
        from: `"${BRAND.name} Security" <${process.env.SMTP_USER}>`,
        to: target,
        subject: "Banglasketch CMS Password Reset Code",
        html,
      });
      console.log(`✓ Admin password reset OTP successfully sent to ${target}`);
      return { sent: true, devMode: false };
    } catch (error) {
      console.error("⚠ Failed to send admin OTP email via SMTP:", error.message);
      return { sent: false, devMode: true, error: error.message };
    }
  }
  return { sent: false, error: "Mail delivery unavailable" };
};

const sendAdminLoginNotification = async ({ to, ip, userAgent, timestamp }) => {
  const target = (to || process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_RECOVERY_EMAIL || process.env.SMTP_USER || "arifulhaquerohan@gmail.com").trim().toLowerCase();
  const clientIp = escapeHtml(ip || "Unknown IP");
  const device = escapeHtml(parseUserAgent(userAgent));
  const { bstStr, utcStr } = formatDateBST(timestamp);

  const html = createEmailContainer(
    "Security Alert: Admin Login Detected",
    "A successful login to the Banglasketch CMS Administration Panel was just detected.",
    `
    <div style="background:#FFFFFF;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #E5E7EB;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;color:#374151;">
        <tr>
          <td style="padding:10px 0;color:${BRAND.colors.navy};font-weight:700;width:140px;border-bottom:1px solid #F3F4F6;">Date & Time (BST)</td>
          <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;font-family:monospace;">${bstStr}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:${BRAND.colors.navy};font-weight:700;border-bottom:1px solid #F3F4F6;">UTC Timestamp</td>
          <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;font-size:12px;color:#6B7280;">${utcStr}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:${BRAND.colors.navy};font-weight:700;border-bottom:1px solid #F3F4F6;">IP Address</td>
          <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;font-family:monospace;color:${BRAND.colors.red};">${clientIp}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:${BRAND.colors.navy};font-weight:700;border-bottom:1px solid #F3F4F6;">Device & Browser</td>
          <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;">${device}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:${BRAND.colors.navy};font-weight:700;">Status</td>
          <td style="padding:10px 0;">
            <span style="background:rgba(16,185,129,0.15);color:#059669;border:1px solid rgba(16,185,129,0.3);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">
              ✓ Authorized Session
            </span>
          </td>
        </tr>
      </table>
    </div>
    <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:16px;margin-top:20px;">
      <p style="color:#DC2626;margin:0 0 6px;font-size:13px;font-weight:700;">⚠️ Didn't initiate this login?</p>
      <p style="color:#6B7280;margin:0;font-size:12px;line-height:1.5;">If this activity was not you, please use the <strong>Forgot Password</strong> option immediately to revoke access and secure your account.</p>
    </div>
  `
  );

  if (canSendMail()) {
    try {
      await getTransporter().sendMail({
        from: `"${BRAND.name} Security" <${process.env.SMTP_USER}>`,
        to: target,
        subject: `Security Alert: Admin Login Detected — Bangla Sketch`,
        html,
      });
      console.log(`✓ Admin login notification email sent to ${target}`);
      return { sent: true };
    } catch (error) {
      console.error("⚠ Failed to send admin login notification email:", error.message);
      return { sent: false, error: error.message };
    }
  }
  console.log(`[DEV MODE] Admin login alert for ${target} from ${clientIp} (${device})`);
  return { sent: false, devMode: true };
};

const sendPasswordResetSuccessNotification = async ({ to, ip, timestamp }) => {
  const target = (to || process.env.ADMIN_RECOVERY_EMAIL || process.env.SMTP_USER || "arifulhaquerohan@gmail.com").trim().toLowerCase();
  const clientIp = escapeHtml(ip || "Unknown IP");
  const { bstStr, utcStr } = formatDateBST(timestamp);

  const html = createEmailContainer(
    "Password Reset Successful",
    "Your Banglasketch CMS administrator master password was successfully changed.",
    `
    <div style="text-align:center;margin:24px 0;">
      <div style="width:64px;height:64px;border-radius:50%;background:#D1FAE5;color:#059669;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:28px;">✓</div>
      <p style="color:#059669;font-weight:600;font-size:16px;">Access Credentials Updated</p>
    </div>
    <div style="background:#FFFFFF;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #E5E7EB;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;color:#374151;">
        <tr>
          <td style="padding:10px 0;color:${BRAND.colors.navy};font-weight:700;width:140px;border-bottom:1px solid #F3F4F6;">Reset Time (BST)</td>
          <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;font-family:monospace;">${bstStr}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:${BRAND.colors.navy};font-weight:700;border-bottom:1px solid #F3F4F6;">UTC Timestamp</td>
          <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;font-size:12px;color:#6B7280;">${utcStr}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:${BRAND.colors.navy};font-weight:700;">Origin IP</td>
          <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;font-family:monospace;color:${BRAND.colors.red};">${clientIp}</td>
        </tr>
      </table>
    </div>
    <p style="color:#6B7280;font-size:13px;line-height:1.6;margin-top:20px;">
      If you initiated this change, no further action is needed. If you did not make this change, please recover your account immediately.
    </p>
  `
  );

  if (canSendMail()) {
    try {
      await getTransporter().sendMail({
        from: `"${BRAND.name} Security" <${process.env.SMTP_USER}>`,
        to: target,
        subject: `Banglasketch CMS Password Reset Successful`,
        html,
      });
      console.log(`✓ Admin password reset confirmation email sent to ${target}`);
      return { sent: true };
    } catch (error) {
      console.error("⚠ Failed to send password reset confirmation email:", error.message);
      return { sent: false, error: error.message };
    }
  }
  return { sent: false, devMode: true };
};

module.exports = {
  canSendMail,
  sendContactNotification,
  sendClientConfirmation,
  sendPasswordResetOTP,
  sendAdminLoginNotification,
  sendPasswordResetSuccessNotification,
  parseUserAgent,
  maskEmail,
  escapeHtml,
  BRAND,
};

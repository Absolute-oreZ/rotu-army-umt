import "server-only";
import { escapeHtml } from "../utils";

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "ROTU Army UMT <onboarding@resend.dev>";

export async function sendAdminInvitationEmail({
  to,
  memberName,
  role,
  loginUrl,
}: {
  to: string;
  memberName: string;
  role: string;
  loginUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();

  const safeName = escapeHtml(memberName);
  const safeRole = escapeHtml(roleLabel);
  const safeLoginUrl = escapeHtml(loginUrl);

  const subject = "You've been added as an admin — ROTU Army UMT";
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#18181b">
      <p style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#71717a">ROTU Army UMT</p>
      <h1 style="font-size:20px;font-weight:600;margin:16px 0 8px">Admin Invitation</h1>
      <p style="font-size:14px;line-height:1.6;color:#3f3f46">
        Hi ${safeName}, you have been assigned the <strong>${safeRole}</strong> role on the ROTU Army UMT admin dashboard.
      </p>
      <p style="font-size:14px;line-height:1.6;color:#3f3f46">
        Sign in with your UMT Google account to get started:
      </p>
      <a href="${safeLoginUrl}" style="display:inline-block;margin:16px 0;padding:10px 24px;background:#18181b;color:#fff;font-size:14px;font-weight:500;text-decoration:none;border-radius:6px">
        Sign in to dashboard
      </a>
      <p style="font-size:12px;color:#a1a1aa;margin-top:24px">
        If you did not expect this invitation, you can safely ignore this email.
      </p>
    </div>
  `;
  const text = `Hi ${memberName}, you have been assigned the ${roleLabel} role on the ROTU Army UMT admin dashboard. Sign in with your UMT Google account at ${loginUrl} to get started.`;

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: DEFAULT_FROM_EMAIL, to, subject, html, text }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Failed to send admin invitation email (${response.status}): ${details}`,
    );
  }
}

export async function sendAdminRoleChangeEmail({
  to,
  memberName,
  oldRole,
  newRole,
}: {
  to: string;
  memberName: string;
  oldRole: string;
  newRole: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const oldLabel = oldRole.charAt(0) + oldRole.slice(1).toLowerCase();
  const newLabel = newRole.charAt(0) + newRole.slice(1).toLowerCase();

  const safeName = escapeHtml(memberName);
  const safeOld = escapeHtml(oldLabel);
  const safeNew = escapeHtml(newLabel);

  const subject = "Your admin role has been updated — ROTU Army UMT";
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#18181b">
      <p style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#71717a">ROTU Army UMT</p>
      <h1 style="font-size:20px;font-weight:600;margin:16px 0 8px">Role Updated</h1>
      <p style="font-size:14px;line-height:1.6;color:#3f3f46">
        Hi ${safeName}, your admin role has been changed from <strong>${safeOld}</strong> to <strong>${safeNew}</strong>.
      </p>
      <p style="font-size:14px;line-height:1.6;color:#3f3f46">
        Your dashboard access has been updated accordingly. If you have questions, please contact the Secretary or your supervising Officer.
      </p>
      <p style="font-size:12px;color:#a1a1aa;margin-top:24px">
        If you did not expect this change, please contact your administrator.
      </p>
    </div>
  `;
  const text = `Hi ${memberName}, your admin role has been changed from ${oldLabel} to ${newLabel}. Your dashboard access has been updated accordingly. Contact the Secretary or your supervising Officer if you have questions.`;

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: DEFAULT_FROM_EMAIL, to, subject, html, text }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Failed to send role change email (${response.status}): ${details}`,
    );
  }
}

export async function sendAdminRemovalEmail({
  to,
  memberName,
  role,
}: {
  to: string;
  memberName: string;
  role: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();

  const safeName = escapeHtml(memberName);
  const safeRole = escapeHtml(roleLabel);

  const subject = "Admin access removed — ROTU Army UMT";
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#18181b">
      <p style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#71717a">ROTU Army UMT</p>
      <h1 style="font-size:20px;font-weight:600;margin:16px 0 8px">Access Removed</h1>
      <p style="font-size:14px;line-height:1.6;color:#3f3f46">
        Hi ${safeName}, your <strong>${safeRole}</strong> admin access to the ROTU Army UMT dashboard has been removed.
      </p>
      <p style="font-size:14px;line-height:1.6;color:#3f3f46">
        You will no longer be able to sign in to the admin dashboard. If you believe this was done in error, please contact the Secretary or your supervising Officer.
      </p>
    </div>
  `;
  const text = `Hi ${memberName}, your ${roleLabel} admin access to the ROTU Army UMT dashboard has been removed. You will no longer be able to sign in. Contact the Secretary or your supervising Officer if you believe this was done in error.`;

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: DEFAULT_FROM_EMAIL, to, subject, html, text }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Failed to send removal email (${response.status}): ${details}`,
    );
  }
}

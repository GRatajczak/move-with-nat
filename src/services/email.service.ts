// src/services/email.service.ts

import { EmailError } from "../lib/errors";
import { sendgridService } from "./sendgrid.service";
import type { EmailOptions } from "../interface";

/**
 * Template ID mapping for SendGrid dynamic templates
 * TODO: Replace with actual SendGrid template IDs from your SendGrid account
 */
const TEMPLATE_IDS: Record<string, string> = {
  activation: import.meta.env.SENDGRID_TEMPLATE_ACTIVATION || "",
  "password-reset": import.meta.env.SENDGRID_TEMPLATE_PASSWORD_RESET || "",
};

/**
 * Send email using SendGrid
 *
 * @param options - Email configuration
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const templateId = TEMPLATE_IDS[options.template];

    if (templateId) {
      // Use SendGrid dynamic template
      await sendgridService.sendEmail({
        to: options.to,
        subject: options.subject,
        templateId,
        dynamicTemplateData: options.data,
      });
    } else {
      // Fallback: send as HTML email if no template is configured
      // eslint-disable-next-line no-console
      console.warn(`No SendGrid template ID found for '${options.template}'. Sending as plain HTML email.`);

      const htmlContent = generateFallbackHtml(options.template, options.data);

      await sendgridService.sendEmail({
        to: options.to,
        subject: options.subject,
        html: htmlContent,
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ Email sending failed:", error);
    throw new EmailError("Failed to send email");
  }
}

/**
 * Generate fallback HTML for emails when no template is configured
 */
function generateFallbackHtml(template: string, data: Record<string, unknown>): string {
  const dataString = Object.entries(data)
    .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          ul { list-style: none; padding: 0; }
          li { margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Move with Nat</h1>
          </div>
          <div class="content">
            <p><strong>Template:</strong> ${template}</p>
            <ul>${dataString}</ul>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send activation email to newly created user
 *
 * @param email - User's email address
 * @param firstName - User's first name for personalization
 * @param token - Activation token (can be userId for backward compatibility or actual JWT token)
 */
export async function sendActivationEmail(email: string, firstName: string, token: string): Promise<void> {
  // Get base URL from environment or use default for development
  const baseUrl = import.meta.env.PUBLIC_APP_URL || "http://localhost:3000";
  const activationLink = `${baseUrl}/auth/activate?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Witamy w Move with Nat – Aktywuj swoje konto",
    template: "activation",
    data: {
      firstName,
      activationLink,
      expiresIn: "24 hours",
    },
  });
}

/**
 * Send password reset email
 *
 * @param email - User's email address
 * @param firstName - User's first name
 * @param resetToken - Password reset token
 */
export async function sendPasswordResetEmail(email: string, firstName: string, resetToken: string): Promise<void> {
  const baseUrl = import.meta.env.BASE_URL || "http://localhost:3000";
  // Use the same activation page for password reset (token purpose is embedded in the token)
  const resetLink = `${baseUrl}/auth/activate?token=${resetToken}`;

  await sendEmail({
    to: email,
    subject: "Move with Nat - Password Reset Request",
    template: "password-reset",
    data: {
      firstName,
      activationLink: resetLink,
      expiresIn: "1 hour",
    },
  });
}

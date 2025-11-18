// src/services/email.service.ts

import { EmailError } from "../lib/errors";

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

/**
 * Send email using email provider
 * For MVP: logs to console instead of sending actual emails
 * TODO: Implement actual email sending with SendGrid/Resend/etc.
 *
 * @param options - Email configuration
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    // MVP implementation: log to console
    console.log("📧 Email would be sent:", {
      to: options.to,
      subject: options.subject,
      template: options.template,
      data: options.data,
    });

    // TODO: Implement actual email sending
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: options.to,
    //   from: process.env.FROM_EMAIL,
    //   subject: options.subject,
    //   templateId: getTemplateId(options.template),
    //   dynamicTemplateData: options.data,
    // });

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 100));
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw new EmailError("Failed to send email");
  }
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
  const baseUrl = import.meta.env.PUBLIC_APP_URL || "http://localhost:4321";
  const activationLink = `${baseUrl}/auth/activate?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Welcome to Move with Nat - Activate Your Account",
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
  const baseUrl = import.meta.env.PUBLIC_APP_URL || "http://localhost:4321";
  const resetLink = `${baseUrl}/auth/reset-password?token=${resetToken}`;

  await sendEmail({
    to: email,
    subject: "Move with Nat - Password Reset Request",
    template: "password-reset",
    data: {
      firstName,
      resetLink,
      expiresIn: "1 hour",
    },
  });
}

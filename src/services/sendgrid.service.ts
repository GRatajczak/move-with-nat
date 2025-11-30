import { sendgridClient } from "../lib/sendgrid.client";
import type { MailDataRequired } from "@sendgrid/mail";
import type { SendEmailOptions } from "../interface";

export class SendGridService {
  private defaultFrom: string;

  constructor(defaultFrom?: string) {
    this.defaultFrom = defaultFrom || import.meta.env.SENDGRID_FROM_EMAIL || "";

    if (!this.defaultFrom) {
      throw new Error(
        "Default sender email is required. Set SENDGRID_FROM_EMAIL in environment variables or provide it in constructor"
      );
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const msg = {
      to: options.to,
      from: options.from || this.defaultFrom,
      subject: options.subject,
      ...(options.text && { text: options.text }),
      ...(options.html && { html: options.html }),
      ...(options.templateId && { templateId: options.templateId }),
      ...(options.dynamicTemplateData && {
        dynamicTemplateData: options.dynamicTemplateData,
      }),
    } as MailDataRequired;

    try {
      await sendgridClient.send(msg);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to send email: ${error.message}`);
      }
      throw new Error("Failed to send email");
    }
  }

  async sendMultipleEmails(messages: SendEmailOptions[]): Promise<void> {
    const msgs = messages.map(
      (options) =>
        ({
          to: options.to,
          from: options.from || this.defaultFrom,
          subject: options.subject,
          ...(options.text && { text: options.text }),
          ...(options.html && { html: options.html }),
          ...(options.templateId && { templateId: options.templateId }),
          ...(options.dynamicTemplateData && {
            dynamicTemplateData: options.dynamicTemplateData,
          }),
        }) as MailDataRequired
    );

    try {
      await sendgridClient.send(msgs);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to send emails: ${error.message}`);
      }
      throw new Error("Failed to send emails");
    }
  }
}

export const sendgridService = new SendGridService();

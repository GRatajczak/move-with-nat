/** SERVICES **/
/** SendGrid Email Options **/
export interface SendEmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, unknown>;
}

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

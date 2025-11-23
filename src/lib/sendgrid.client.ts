import sgMail from "@sendgrid/mail";

const sendgridApiKey = import.meta.env.SENDGRID_API_KEY;

if (!sendgridApiKey) {
  throw new Error("SENDGRID_API_KEY is not defined in environment variables");
}

sgMail.setApiKey(sendgridApiKey);

export const sendgridClient = sgMail;

// src/types/auth.ts

export interface InviteUserCommand {
  email: string;
  resend?: boolean;
}

export interface ActivateAccountCommand {
  token: string;
  newPassword?: string;
}

export interface RequestPasswordResetCommand {
  email: string;
}

export interface ConfirmPasswordResetCommand {
  token: string;
  newPassword: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  purpose: "activation" | "password-reset";
  exp: number;
}

import type { Database, UserRole } from "../types/db";

/** AUTHENTICATION & ACCOUNT ACTIVATION COMMANDS **/
/** 1. Invite user (trainer|client) **/
export interface InviteUserCommand {
  email: Database["public"]["Tables"]["users"]["Insert"]["email"];
  role: Extract<UserRole, "trainer" | "client">;
  resend?: boolean;
}

/** 2. Activate account **/
export interface ActivateAccountCommand {
  token: string;
}

/** 3. Request password reset **/
export interface RequestPasswordResetCommand {
  email: Database["public"]["Tables"]["users"]["Insert"]["email"];
}

/** 4. Confirm password reset **/
export interface ConfirmPasswordResetCommand {
  token: string;
  newPassword: string;
}

/** JWT Token Payload **/
export interface TokenPayload {
  userId: string;
  email: string;
  purpose: "activation" | "password-reset";
  exp: number;
}

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  email: string;
  firstName?: string;
  lastName?: string;
}

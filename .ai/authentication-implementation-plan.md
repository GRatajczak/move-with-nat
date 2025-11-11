# API Endpoints Implementation Plan: Authentication

Ten dokument zawiera plany dla endpointów uwierzytelniania i aktywacji konta:

- POST /auth/invite - Wysłanie zaproszenia/aktywacji
- POST /auth/activate - Aktywacja konta
- POST /auth/reset-password/request - Żądanie resetu hasła
- POST /auth/reset-password/confirm - Potwierdzenie resetu hasła

---

## POST /auth/invite - Request Activation / Invitation Email

### Przegląd

Wysyła email z linkiem aktywacyjnym do nowego użytkownika lub ponownie wysyła zaproszenie.

### Request

- **Method:** POST
- **URL:** `/api/auth/invite`
- **Auth:** Public (no JWT required) or Admin (for resend)
- **Body:**

```json
{
  "email": "user@example.com",
  "role": "trainer" | "trainee",
  "resend": false
}
```

### Response (202 Accepted)

```json
{
  "message": "Activation link sent"
}
```

### Authorization

- **Public endpoint** (for self-registration) OR
- **Admin-only** (for inviting users)
- Decision depends on business requirements

### Validation

- **email**: valid format, must exist in users table with status=pending
- **role**: trainer or trainee (not admin)
- **resend**: boolean, default false

### Error Responses

- **400**: Invalid email format, invalid role
- **404**: Email not found (if resend=true)
- **409**: User already active (if resend=false)
- **500**: Email sending failed

### Implementation

```typescript
export async function sendInvite(supabase: SupabaseClient, command: InviteUserCommand): Promise<MessageResponse> {
  // Validate email
  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, is_hidden")
    .eq("email", command.email.toLowerCase())
    .single();

  if (command.resend) {
    // Resend scenario
    if (error || !user) {
      throw new NotFoundError("User not found");
    }

    // Check if already active
    if (!user.is_hidden) {
      throw new ConflictError("User is already active");
    }
  } else {
    // New invite scenario
    if (!user) {
      throw new NotFoundError("User must be created before sending invite");
    }

    if (!user.is_hidden) {
      throw new ConflictError("User is already active");
    }
  }

  // Generate activation token (24h expiry)
  const activationToken = generateActivationToken(user.id, user.email);

  // Send email
  await sendActivationEmail(user.email, activationToken);

  return { message: "Activation link sent" };
}

function generateActivationToken(userId: string, email: string): string {
  // Use JWT with 24h expiry
  return jwt.sign(
    {
      userId,
      email,
      purpose: "activation",
    },
    process.env.JWT_SECRET!,
    { expiresIn: "24h" }
  );
}
```

---

## POST /auth/activate - Activate Account

### Przegląd

Aktywuje konto użytkownika używając tokenu z emaila.

### Request

- **Method:** POST
- **URL:** `/api/auth/activate`
- **Auth:** Public (no JWT)
- **Body:**

```json
{
  "token": "activation_jwt_token"
}
```

### Response (200 OK)

```json
{
  "message": "Account activated"
}
```

### Authorization

- **Public endpoint** - no auth required
- Token validates the request

### Validation

- **token**: required, valid JWT format, not expired
- Token must have purpose="activation"

### Error Responses

- **400**: Missing token, invalid format
- **401**: Invalid or expired token
- **404**: User not found
- **409**: User already activated
- **500**: Internal error

### Implementation

```typescript
export async function activateAccount(
  supabase: SupabaseClient,
  command: ActivateAccountCommand
): Promise<MessageResponse> {
  // Verify and decode token
  let decoded;
  try {
    decoded = jwt.verify(command.token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      purpose: string;
    };
  } catch (error) {
    throw new UnauthorizedError("Invalid or expired token");
  }

  // Validate purpose
  if (decoded.purpose !== "activation") {
    throw new UnauthorizedError("Invalid token purpose");
  }

  // Fetch user
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("id, is_hidden")
    .eq("id", decoded.userId)
    .single();

  if (fetchError || !user) {
    throw new NotFoundError("User not found");
  }

  // Check if already activated
  if (!user.is_hidden) {
    throw new ConflictError("Account already activated");
  }

  // Activate user (set is_hidden = false)
  const { error } = await supabase
    .from("users")
    .update({
      is_hidden: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    throw new DatabaseError("Failed to activate account");
  }

  // TODO: Send welcome email

  return { message: "Account activated" };
}
```

---

## POST /auth/reset-password/request - Request Password Reset

### Przegląd

Wysyła email z linkiem do resetu hasła (1h expiry).

### Request

- **Method:** POST
- **URL:** `/api/auth/reset-password/request`
- **Auth:** Public (no JWT)
- **Body:**

```json
{
  "email": "user@example.com"
}
```

### Response (202 Accepted)

```json
{
  "message": "Reset link sent"
}
```

**Note:** Zawsze zwraca 202, nawet jeśli email nie istnieje (security - nie ujawniaj czy email istnieje)

### Authorization

- **Public endpoint**

### Validation

- **email**: valid format

### Implementation

```typescript
export async function requestPasswordReset(
  supabase: SupabaseClient,
  command: RequestPasswordResetCommand
): Promise<MessageResponse> {
  // Fetch user (but don't reveal if exists)
  const { data: user } = await supabase
    .from("users")
    .select("id, email, is_hidden")
    .eq("email", command.email.toLowerCase())
    .single();

  // Always return success to prevent email enumeration
  if (!user || user.is_hidden) {
    // Log attempt but return success
    console.log(`Password reset requested for non-existent email: ${command.email}`);
    return { message: "Reset link sent" };
  }

  // Generate reset token (1h expiry)
  const resetToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      purpose: "password-reset",
    },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

  // Send email
  await sendPasswordResetEmail(user.email, resetToken);

  return { message: "Reset link sent" };
}
```

---

## POST /auth/reset-password/confirm - Reset Password

### Przegląd

Resetuje hasło używając tokenu z emaila.

### Request

- **Method:** POST
- **URL:** `/api/auth/reset-password/confirm`
- **Auth:** Public (no JWT)
- **Body:**

```json
{
  "token": "reset_jwt_token",
  "newPassword": "P@ssw0rd123"
}
```

### Response (200 OK)

```json
{
  "message": "Password updated"
}
```

### Authorization

- **Public endpoint**
- Token validates the request

### Validation

- **token**: required, valid JWT, not expired, purpose="password-reset"
- **newPassword**: min 8 chars, contains uppercase, lowercase, number, special char

### Error Responses

- **400**: Validation error (weak password)
- **401**: Invalid or expired token
- **404**: User not found
- **500**: Internal error

### Implementation

```typescript
export async function resetPassword(supabase: SupabaseClient, command: ResetPasswordCommand): Promise<MessageResponse> {
  // Verify token
  let decoded;
  try {
    decoded = jwt.verify(command.token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      purpose: string;
    };
  } catch (error) {
    throw new UnauthorizedError("Invalid or expired token");
  }

  // Validate purpose
  if (decoded.purpose !== "password-reset") {
    throw new UnauthorizedError("Invalid token purpose");
  }

  // Validate password strength
  if (!isStrongPassword(command.newPassword)) {
    throw new ValidationError({
      newPassword: "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
    });
  }

  // Fetch user
  const { data: user } = await supabase.from("users").select("id").eq("id", decoded.userId).single();

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Update password in Supabase Auth
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password: command.newPassword,
  });

  if (error) {
    throw new DatabaseError("Failed to update password");
  }

  // TODO: Send password changed confirmation email
  // TODO: Invalidate all existing sessions

  return { message: "Password updated" };
}

function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^a-zA-Z0-9]/.test(password)
  );
}
```

---

## API Route Handlers

### src/pages/api/auth/invite.ts

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { sendInvite } from "@/lib/auth.service";
import { InviteUserCommandSchema } from "@/lib/validation";
import { AppError } from "@/lib/errors";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const validated = InviteUserCommandSchema.parse(body);
    const result = await sendInvite(locals.supabase, validated);

    return new Response(JSON.stringify(result), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
```

### src/pages/api/auth/activate.ts

```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const validated = ActivateAccountCommandSchema.parse(body);
    const result = await activateAccount(locals.supabase, validated);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
```

### src/pages/api/auth/reset-password/request.ts

```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const validated = RequestPasswordResetCommandSchema.parse(body);
    const result = await requestPasswordReset(locals.supabase, validated);

    return new Response(JSON.stringify(result), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
```

### src/pages/api/auth/reset-password/confirm.ts

```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const validated = ResetPasswordCommandSchema.parse(body);
    const result = await resetPassword(locals.supabase, validated);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
```

---

## Validation Schemas

```typescript
const InviteUserCommandSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase(),
  role: z.enum(["trainer", "trainee"]),
  resend: z.boolean().default(false),
});

const ActivateAccountCommandSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

const RequestPasswordResetCommandSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase(),
});

const ResetPasswordCommandSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .refine((pwd) => /[a-z]/.test(pwd) && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd), {
      message: "Password must contain uppercase, lowercase, number, and special character",
    }),
});
```

---

## Email Templates

### Activation Email

**Subject:** Activate your Move with Nat account

**Body:**

```
Hi {firstName},

Welcome to Move with Nat! Click the link below to activate your account:

{activationLink}

This link expires in 24 hours.

If you didn't request this, please ignore this email.

Best regards,
Move with Nat Team
```

### Password Reset Email

**Subject:** Reset your password

**Body:**

```
Hi {firstName},

We received a request to reset your password. Click the link below:

{resetLink}

This link expires in 1 hour.

If you didn't request this, please ignore this email and your password will remain unchanged.

Best regards,
Move with Nat Team
```

---

## Security Considerations

### Token Security

- **JWT Secret**: Store in environment variable, never commit
- **Expiry**: Activation 24h, Reset 1h
- **Purpose field**: Prevents token reuse for different purposes
- **Single use**: Consider storing used tokens in DB (optional)

### Email Enumeration Prevention

- Always return success for password reset request (don't reveal if email exists)
- Same response time regardless of email existence
- Log suspicious activity

### Password Policy

- Minimum 8 characters
- Require: uppercase, lowercase, number, special char
- Consider: password history, common password check (zxcvbn)

### Rate Limiting

- Max 3 invite/reset requests per email per hour
- Max 10 activation attempts per IP per hour
- Exponential backoff for failed attempts

### Brute Force Protection

- Lock account after 5 failed activation attempts
- Require CAPTCHA after 3 failed attempts
- Monitor for suspicious patterns

---

## Testing

```bash
# Send invitation
curl -X POST "http://localhost:4321/api/auth/invite" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","role":"trainer","resend":false}'
# Expected: 202 Accepted

# Activate account
curl -X POST "http://localhost:4321/api/auth/activate" \
  -H "Content-Type: application/json" \
  -d '{"token":"jwt_token_here"}'
# Expected: 200 OK

# Request password reset
curl -X POST "http://localhost:4321/api/auth/reset-password/request" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com"}'
# Expected: 202 Accepted

# Confirm password reset
curl -X POST "http://localhost:4321/api/auth/reset-password/confirm" \
  -H "Content-Type: application/json" \
  -d '{"token":"reset_token","newPassword":"NewP@ssw0rd"}'
# Expected: 200 OK

# Invalid token (should fail)
curl -X POST "http://localhost:4321/api/auth/activate" \
  -H "Content-Type: application/json" \
  -d '{"token":"invalid"}'
# Expected: 401 Unauthorized

# Weak password (should fail)
curl -X POST "http://localhost:4321/api/auth/reset-password/confirm" \
  -H "Content-Type: application/json" \
  -d '{"token":"valid_token","newPassword":"weak"}'
# Expected: 400 Bad Request
```

---

## Environment Variables

```env
# .env
JWT_SECRET=your-secret-key-here-min-32-chars
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=noreply@movewithnat.com
PUBLIC_APP_URL=https://app.movewithnat.com
```

---

## Database Considerations

### Optional: Token Storage Table

For single-use tokens and audit trail:

```sql
CREATE TABLE auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  purpose VARCHAR(50) NOT NULL, -- 'activation' | 'password-reset'
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_auth_tokens_user_id ON auth_tokens(user_id);
CREATE INDEX idx_auth_tokens_expires_at ON auth_tokens(expires_at);
CREATE INDEX idx_auth_tokens_token_hash ON auth_tokens(token_hash);
```

---

## Podsumowanie

✅ **POST /auth/invite** - Wysyłanie zaproszenia (public or admin)  
✅ **POST /auth/activate** - Aktywacja konta (public with token)  
✅ **POST /auth/reset-password/request** - Żądanie resetu (public)  
✅ **POST /auth/reset-password/confirm** - Potwierdzenie resetu (public with token)

**Kluczowe punkty:**

- Public endpoints (no JWT auth)
- JWT tokens for activation/reset with expiry
- Email enumeration protection
- Strong password policy
- Rate limiting required
- Single-use tokens (optional enhancement)

**Security Best Practices:**

- Store JWT secret securely
- Use HTTPS only
- Rate limit all endpoints
- Log all auth attempts
- Monitor suspicious activity
- Consider 2FA for admin accounts (future)

**MVP Limitations:**

- No 2FA
- No password history
- No account lockout
- No email verification for existing users
- Consider these for production

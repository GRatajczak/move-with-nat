"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    email: false,
    password: false,
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setValidationErrors({ email: false, password: false });

    if (!email || !password) {
      setError("Email and password are required.");
      setValidationErrors({
        email: !email,
        password: !password,
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Login failed");
      }

      const { user } = await response.json();

      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect to the homepage. The middleware will handle redirecting to the correct dashboard.
      window.location.href = "/";
    } catch (err) {
      setIsLoading(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} data-testid="login-form" data-hydrated={hydrated} noValidate>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationErrors.email) {
                      setValidationErrors((prev) => ({ ...prev, email: false }));
                    }
                  }}
                  data-testid="login-email"
                  aria-invalid={validationErrors.email}
                  aria-describedby={error ? "login-error" : undefined}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline"
                    data-testid="login-forgot-password"
                  >
                    Przypomnij hasło
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (validationErrors.password) {
                        setValidationErrors((prev) => ({ ...prev, password: false }));
                      }
                    }}
                    data-testid="login-password"
                    aria-invalid={validationErrors.password}
                    aria-describedby={error ? "login-error" : undefined}
                    className="pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-white h-[95%]"
                    aria-pressed={showPassword}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    data-testid="toggle-password-visibility"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                  </Button>
                </div>
              </div>
              {error && (
                <p
                  id="login-error"
                  role="alert"
                  aria-live="polite"
                  className="text-red-500 text-sm"
                  data-testid="login-error"
                >
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" data-testid="login-submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logowanie...
                  </>
                ) : (
                  "Zaloguj się"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;

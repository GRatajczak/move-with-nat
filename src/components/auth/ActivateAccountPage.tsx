// src/components/auth/ActivateAccountPage.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ActivateAccountPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Hasła nie są zgodne");
      return;
    }

    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      setError("W adresie URL nie znaleziono tokena aktywacyjnego");
      return;
    }

    try {
      const response = await fetch("/api/auth/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Konto zostało aktywowane pomyślnie!");
        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
      } else {
        setError(data.error || "Nie udało się aktywować konta");
      }
    } catch (err) {
      console.error("Activation failed:", err);
      setError("Wystąpił nieoczekiwany błąd. Proszę spróbować ponownie.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Aktywuj swoje konto</CardTitle>
          <CardDescription>Ustaw nowe hasło dla swojego konta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Nowe hasło</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Potwierdź hasło</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {message && <p className="text-green-500 text-sm">{message}</p>}
              <Button type="submit" className="w-full">
                Aktywuj konto
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivateAccountPage;

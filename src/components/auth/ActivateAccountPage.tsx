// src/components/auth/ActivateAccountPage.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type TokenPurpose = "activation" | "password-reset" | null;

const ActivateAccountPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tokenPurpose, setTokenPurpose] = useState<TokenPurpose>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Decode token to determine its purpose (client-side display only)
    const token = new URLSearchParams(window.location.search).get("token");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.replace(/-/g, "+").replace(/_/g, "/")));
        setTokenPurpose(decoded.purpose || "activation");
      } catch {
        // If decoding fails, assume activation
        setTokenPurpose("activation");
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast.error("Hasła nie są zgodne");
      setIsLoading(false);
      return;
    }

    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      toast.error("W adresie URL nie znaleziono tokena");
      setIsLoading(false);
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
        const successMessage =
          tokenPurpose === "password-reset"
            ? "Hasło zostało zresetowane pomyślnie!"
            : "Konto zostało aktywowane pomyślnie!";
        toast.success(data.message || successMessage);
        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
      } else {
        toast.error(data.error || "Nie udało się przetworzyć żądania");
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Request failed:", err);
      toast.error("Wystąpił nieoczekiwany błąd. Proszę spróbować ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    if (tokenPurpose === "password-reset") {
      return "Resetuj hasło";
    }
    return "Aktywuj swoje konto";
  };

  const getDescription = () => {
    if (tokenPurpose === "password-reset") {
      return "Wprowadź nowe hasło dla swojego konta.";
    }
    return "Ustaw hasło i aktywuj swoje konto.";
  };

  const getButtonText = () => {
    if (isLoading) {
      return "Przetwarzanie...";
    }
    if (tokenPurpose === "password-reset") {
      return "Zresetuj hasło";
    }
    return "Aktywuj konto";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
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
                  disabled={isLoading}
                  placeholder="Min. 8 znaków, duże, małe, cyfra, znak specjalny"
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
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {getButtonText()}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivateAccountPage;

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientSelect } from "../shared/ClientSelect";
import { AdminClientSelect } from "../shared/AdminClientSelect";
import type { DuplicatePlanModalProps } from "@/interface/plans";

export const DuplicatePlanModal = ({
  isOpen,
  plan,
  onClose,
  onConfirm,
  isSubmitting,
  userRole = "trainer",
}: DuplicatePlanModalProps) => {
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Pre-fill with copy name and clientId when modal opens
  useEffect(() => {
    if (plan && isOpen) {
      setName(`${plan.name} - Kopia`);
      setClientId(plan.clientId || null);
      setError("");
    }
  }, [plan, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Nazwa planu jest wymagana");
      return;
    }

    if (name.length < 3) {
      setError("Nazwa musi mieć min. 3 znaki");
      return;
    }

    if (name.length > 100) {
      setError("Nazwa może mieć max. 100 znaków");
      return;
    }

    if (!plan) return;

    try {
      await onConfirm({
        name: name.trim(),
        clientId: clientId || undefined, // Convert null to undefined
        isHidden: false, // Default to visible for duplicated plan
      });
    } catch {
      setError("Nie udało się zduplikować planu");
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Duplikuj plan</DialogTitle>
            <DialogDescription>Wszystkie ćwiczenia zostaną skopiowane do nowego planu.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Nowa nazwa planu</Label>
              <Input
                id="plan-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nazwa planu"
                maxLength={100}
                disabled={isSubmitting}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-select">Podopieczny</Label>
              {userRole === "admin" ? (
                <AdminClientSelect
                  value={clientId || ""}
                  onChange={(value) => setClientId(value === "" ? null : value)}
                  disabled={isSubmitting}
                />
              ) : (
                <ClientSelect value={clientId} onChange={setClientId} disabled={isSubmitting} allowAll={false} />
              )}
              <p className="text-sm text-muted-foreground">Wybierz podopiecznego dla nowego planu (opcjonalnie)</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? "Duplikowanie..." : "Duplikuj"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

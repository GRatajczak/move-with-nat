import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";

import type { ProfileEditFormData, ProfileEditFormProps } from "@/interface";
import { ProfileEditFormSchema } from "@/lib/validation";
import { useUpdateUser } from "@/hooks/useUpdateUser";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ProfileEditForm({ userId, initialData }: ProfileEditFormProps) {
  const { mutateAsync: updateUser, isPending } = useUpdateUser();

  const form = useForm<ProfileEditFormData>({
    resolver: zodResolver(ProfileEditFormSchema),
    defaultValues: {
      firstName: initialData.firstName,
      lastName: initialData.lastName,
    },
  });

  // Ostrzeżenie o niezapisanych zmianach
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form.formState.isDirty]);

  const onSubmit = async (data: ProfileEditFormData) => {
    await updateUser({
      userId,
      command: {
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });

    form.reset(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imię</FormLabel>
              <FormControl>
                <Input placeholder="Wpisz swoje imię" autoComplete="given-name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>
            Email
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="ml-1 inline-flex h-4 w-4 items-center justify-center text-muted-foreground"
                  aria-label="Dlaczego nie mogę zmienić emaila?"
                >
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Email nie może być zmieniony. Skontaktuj się z administratorem.</TooltipContent>
            </Tooltip>
          </FormLabel>
          <FormControl>
            <Input value={initialData.email} readOnly disabled />
          </FormControl>
          <FormDescription>Email nie może być zmieniony</FormDescription>
        </FormItem>

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nazwisko</FormLabel>
              <FormControl>
                <Input placeholder="Wpisz swoje nazwisko" autoComplete="family-name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending || !form.formState.isDirty}>
          {isPending ? "Zapisywanie..." : "Zapisz zmiany"}
        </Button>
      </form>
    </Form>
  );
}

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { CreateUserFormSchema } from "@/lib/validation";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TrainerSelect } from "@/components/plans/TrainerSelect";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CreateUserFormProps } from "@/interface";
import type { CreateUserFormData } from "@/types/users";

export const CreateUserForm = ({ onSubmit, onCancel, isSubmitting }: CreateUserFormProps) => {
  const defaultValues: CreateUserFormData = {
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    role: "client",
    trainerId: undefined,
  };

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(CreateUserFormSchema),
    defaultValues,
  });

  // Watch role to conditionally show trainer field
  const selectedRole = form.watch("role");

  // Reset trainerId when role changes from client to something else
  useEffect(() => {
    if (selectedRole !== "client") {
      form.setValue("trainerId", undefined);
    }
  }, [selectedRole, form]);

  // Warn on unsaved changes
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

  const handleCancel = () => {
    if (form.formState.isDirty) {
      if (window.confirm("Masz niezapisane zmiany. Czy na pewno chcesz opuścić stronę?")) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  const handleFormSubmit = async (data: CreateUserFormData) => {
    await onSubmit(data);
    form.reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit(handleFormSubmit)(e);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6 mx-auto py-6">
        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="jan.kowalski@example.com" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>
                Adres email użytkownika. Link aktywacyjny zostanie wysłany na ten adres.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* First Name Field */}
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Imię *</FormLabel>
                <FormControl>
                  <Input placeholder="Jan" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Last Name Field */}
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nazwisko *</FormLabel>
                <FormControl>
                  <Input placeholder="Kowalski" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Phone Field */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="+48 123 456 789" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormDescription>Opcjonalny numer telefonu użytkownika</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date of Birth Field */}
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data urodzenia</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        disabled={isSubmitting}
                        data-empty={!field.value}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(new Date(field.value), "PPP", { locale: pl }) : <span>Wybierz datę</span>}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                      }}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                      captionLayout="dropdown-months"
                      fromYear={1900}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>Opcjonalna data urodzenia</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Role Field */}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rola *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz rolę" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="administrator">Administrator</SelectItem>
                  <SelectItem value="trainer">Trener</SelectItem>
                  <SelectItem value="client">Podopieczny</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {selectedRole === "administrator" && "Pełny dostęp do systemu, zarządzanie użytkownikami i treściami."}
                {selectedRole === "trainer" && "Dostęp do zarządzania swoimi podopiecznymi i planami treningowymi."}
                {selectedRole === "client" && "Dostęp do własnych planów treningowych i postępów."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Trainer Field - Conditional (only for clients) */}
        {selectedRole === "client" && (
          <FormField
            control={form.control}
            name="trainerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trener *</FormLabel>
                <FormControl>
                  <TrainerSelect value={field.value || ""} onChange={field.onChange} disabled={isSubmitting} />
                </FormControl>
                <FormDescription>Przypisz trenera, który będzie opiekował się tym podopiecznym.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Anuluj
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Utwórz użytkownika
          </Button>
        </div>
      </form>
    </Form>
  );
};

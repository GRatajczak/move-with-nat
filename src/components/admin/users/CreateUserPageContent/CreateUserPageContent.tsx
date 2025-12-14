import React, { useState } from "react";
import { CreateUserForm } from "../CreateUserForm";
import { useCreateUser } from "@/hooks/useCreateUser";
import type { CreateUserCommand } from "@/interface";
import { CreateUserPageHeader } from "./CreateUserPageHeader";
import { CreateUserSuccessModal } from "./CreateUserSuccessModal";

export const CreateUserContent: React.FC = () => {
  const { mutateAsync: createUser, isPending: isSubmitting } = useCreateUser();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async (data: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
    role: "admin" | "trainer" | "client";
    trainerId?: string;
  }) => {
    const command: CreateUserCommand = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      role: data.role,
      // Only include trainerId if role is "client"
      trainerId: data.role === "client" ? data.trainerId : undefined,
    };

    await createUser(command);

    setShowSuccessModal(true);
  };

  const handleCancel = () => {
    window.location.href = "/admin/users";
  };

  const handleGoBack = () => {
    window.location.href = "/admin/users";
  };

  return (
    <div className="space-y-6">
      <CreateUserPageHeader onCancel={handleCancel} />

      {/* Form */}
      <div className="md:px-0 px-4">
        <CreateUserForm onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={isSubmitting} />
      </div>

      <CreateUserSuccessModal isOpen={showSuccessModal} onOpenChange={setShowSuccessModal} onConfirm={handleGoBack} />
    </div>
  );
};

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
    role: "administrator" | "trainer" | "client";
    trainerId?: string;
  }) => {
    const mapRoleToAPI = (role: "administrator" | "trainer" | "client"): "admin" | "trainer" | "client" => {
      if (role === "administrator") {
        return "admin";
      }
      return role;
    };

    const command: CreateUserCommand = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      role: mapRoleToAPI(data.role),
      trainerId: data.trainerId,
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

      <div className="md:px-0 px-4">
        <CreateUserForm onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={isSubmitting} />
      </div>

      <CreateUserSuccessModal isOpen={showSuccessModal} onOpenChange={setShowSuccessModal} onConfirm={handleGoBack} />
    </div>
  );
};

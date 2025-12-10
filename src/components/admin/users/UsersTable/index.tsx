import type { UsersTableProps } from "@/interface";
import { UsersTableContent } from "./UsersTableContent";

export const UsersTable = (props: UsersTableProps) => {
  return <UsersTableContent {...props} />;
};

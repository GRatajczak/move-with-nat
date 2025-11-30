import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { UserRowItemProps } from "../../../interface";

export const UserRowItem = ({ user, children }: UserRowItemProps) => {
  const { firstName, lastName, email, role } = user;

  return (
    <li className="flex items-center justify-between p-4 pl-0 border-b last:border-0">
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarImage
            src={`https://ui-avatars.com/api/?name=${firstName ?? ""}+${lastName ?? ""}`}
            alt={`${firstName} ${lastName}`}
          />
        </Avatar>
        <div>
          <p className="font-medium text-sm">
            {firstName} {lastName}
            {!firstName && !lastName && <span className="italic text-muted-foreground">Brak danych</span>}
          </p>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
        <Badge variant={role === "trainer" ? "default" : "secondary"} className="ml-2">
          {role}
        </Badge>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </li>
  );
};

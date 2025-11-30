import { Menu } from "lucide-react";
import { Button } from "../ui/button";
import { Breadcrumbs } from "./Breadcrumbs";
import { UserMenu } from "./UserMenu";
import type { TopBarProps } from "../../interface";

export function TopBar({ breadcrumbs, user, onLogout, onMobileMenuOpen }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-4 sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMobileMenuOpen} aria-label="Otwórz menu">
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex-1 min-w-0">
        <Breadcrumbs items={breadcrumbs} />
      </div>
      <div className="flex items-center gap-4">
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}

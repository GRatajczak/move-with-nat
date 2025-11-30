import { TableCell, TableRow } from "@/components/ui/table";
import { ReasonActionMenu } from "./ReasonActionMenu";
import type { ReasonViewModel } from "@/interface";

interface ReasonsTableRowProps {
  reason: ReasonViewModel;
  onEdit: (reason: ReasonViewModel) => void;
  onDelete: (reason: ReasonViewModel) => void;
}

/**
 * Single row in the reasons table, displaying reason data and action menu
 */
export const ReasonsTableRow = ({ reason, onEdit, onDelete }: ReasonsTableRowProps) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("pl-PL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  return (
    <TableRow className="hover:bg-muted/50 transition-colors">
      <TableCell className="font-mono text-sm">{reason.code}</TableCell>
      <TableCell className="font-medium">{reason.label}</TableCell>
      <TableCell className="text-center">{reason.usageCount}</TableCell>
      <TableCell className="text-muted-foreground text-sm">{formatDate(reason.createdAt)}</TableCell>
      <TableCell className="text-right">
        <ReasonActionMenu reason={reason} onEdit={() => onEdit(reason)} onDelete={() => onDelete(reason)} />
      </TableCell>
    </TableRow>
  );
};

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { POStatus } from "@/types/purchase";
import type { SupplierStatus, SupplierGrade } from "@/types/supplier";
import { poStatusLabels } from "@/lib/mock/purchase-orders";

const poStatusVariant: Record<POStatus, "secondary" | "default" | "outline" | "success" | "warning" | "destructive"> = {
  draft:     "secondary",
  approved:  "outline",
  issued:    "default",
  confirmed: "default",
  partial:   "warning",
  received:  "warning",
  closed:    "success",
  cancelled: "destructive",
};

const supplierStatusVariant: Record<SupplierStatus, "success" | "secondary" | "warning" | "destructive"> = {
  active: "success",
  inactive: "secondary",
  pending: "warning",
  blocked: "destructive",
};

const supplierGradeVariant: Record<SupplierGrade, "default" | "success" | "secondary" | "outline" | "warning"> = {
  S: "default",
  A: "success",
  B: "secondary",
  C: "outline",
  D: "warning",
};

interface POStatusBadgeProps {
  status: POStatus;
  className?: string;
}

export function POStatusBadge({ status, className }: POStatusBadgeProps) {
  return (
    <Badge variant={poStatusVariant[status]} className={cn("capitalize", className)}>
      {poStatusLabels[status]}
    </Badge>
  );
}

const supplierStatusLabels: Record<SupplierStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
  blocked: "Blocked",
};

interface SupplierStatusBadgeProps {
  status: SupplierStatus;
  className?: string;
}

export function SupplierStatusBadge({ status, className }: SupplierStatusBadgeProps) {
  return (
    <Badge variant={supplierStatusVariant[status]} className={className}>
      {supplierStatusLabels[status]}
    </Badge>
  );
}

interface SupplierGradeBadgeProps {
  grade: SupplierGrade;
  className?: string;
}

export function SupplierGradeBadge({ grade, className }: SupplierGradeBadgeProps) {
  return (
    <Badge variant={supplierGradeVariant[grade]} className={className}>
      Grade {grade}
    </Badge>
  );
}

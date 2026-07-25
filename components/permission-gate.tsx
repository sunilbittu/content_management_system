import type { ReactNode } from "react";
import { can, type PermissionKey } from "@/lib/permissions";

export function PermissionGate({
  permissions,
  require,
  children,
  fallback = null,
}: {
  permissions: string[];
  require: PermissionKey;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return can(permissions, require) ? <>{children}</> : <>{fallback}</>;
}

import type { PermissionKey } from "@/lib/permissions";

export interface NavItem {
  href: string;
  label: string;
  permission?: PermissionKey;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/content", label: "Content", permission: "content:read" },
  { href: "/media", label: "Media Library", permission: "media:read" },
  { href: "/users", label: "Users & Roles", permission: "users:manage" },
  { href: "/audit", label: "Audit Log", permission: "audit:read" },
];

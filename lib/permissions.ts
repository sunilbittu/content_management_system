export type PermissionKey =
  | "content:read"
  | "content:create"
  | "content:update"
  | "content:delete"
  | "content:publish"
  | "content:schedule"
  | "content:unpublish"
  | "content:rollback"
  | "media:read"
  | "media:upload"
  | "media:update"
  | "media:delete"
  | "users:invite"
  | "users:manage"
  | "roles:manage"
  | "stores:manage"
  | "audit:read"
  | "settings:manage";

export function can(permissions: string[], key: PermissionKey): boolean {
  return permissions.includes(key);
}

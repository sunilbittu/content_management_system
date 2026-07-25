export type ContentStatus =
  | "draft"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "scheduled"
  | "published"
  | "archived";

export interface Store {
  id: string;
  code: string;
  name: string;
}

export interface ContentType {
  id: string;
  key: string;
  name: string;
  description: string | null;
}

export interface ContentEntry {
  id: string;
  content_type: string;
  store_id: string | null;
  locale: string;
  title: string;
  slug: string;
  status: ContentStatus;
  fields: Record<string, unknown>;
  seo: Record<string, unknown>;
  publish_at: string | null;
  unpublish_at: string | null;
  published_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentVersion {
  id: string;
  content_entry_id: string;
  version_number: number;
  payload: { title: string; slug: string; fields: Record<string, unknown>; seo: Record<string, unknown> };
  status_at_save: string | null;
  comment: string | null;
  created_by: string | null;
  created_at: string;
}

export interface MediaAsset {
  id: string;
  store_id: string | null;
  file_path: string;
  file_url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  alt_text: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Role {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_system: boolean;
}

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  store_id: string | null;
  content_types: string[] | null;
  granted_by: string | null;
  created_at: string;
  roles?: Role;
  stores?: Store;
}

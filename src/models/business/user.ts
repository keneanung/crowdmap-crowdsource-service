export type Role = "site_admin" | "map_admin";

export interface User {
  name: string;
  roles: Role[];
  /** Project IDs this user may administer. Legacy single-project map_admin users omit this. */
  mapAdminProjects?: string[];
  salt: string;
  hashed_api_key: string;
  api_key_id?: string;
}

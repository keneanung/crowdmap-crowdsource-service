export type Role = "site_admin" | "map_admin";

export interface User {
  name: string;
  roles: Role[];
  salt: string;
  hashed_api_key: string;
}

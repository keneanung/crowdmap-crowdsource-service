import { Role } from "../business/user.js";

export interface UserResponse {
  name: string;
  roles: Role[];
  mapAdminProjects?: string[];
}

export interface UserRequest {
  name: string;
  roles: Role[];
  mapAdminProjects?: string[];
}

export interface UserRolesRequest {
  roles: Role[];
  mapAdminProjects?: string[];
}

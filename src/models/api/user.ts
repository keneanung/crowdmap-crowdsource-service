import { Role } from "../business/user.js";

export interface UserResponse {
  name: string;
  roles: Role[];
}

export interface UserRequest {
  name: string;
  roles: Role[];
}

export interface UserRolesRequest {
  roles: Role[];
}

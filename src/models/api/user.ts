import { Role } from "../business/user";

export interface UserResponse {
  name: string;
  roles: Role[];
}

export interface UserRequest {
  name: string;
  roles: Role[];
}

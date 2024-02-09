import * as express from "express";
import { iocContainer } from "../ioc/ioc";
import { AuthorizationError } from "../models/api/error";
import { User } from "../models/business/user";
import { UserService } from "../services/userService";

export async function expressAuthentication(
  request: express.Request,
  securityName: string,
  _scopes?: string[],
): Promise<User> {
  if (securityName === "api_key") {
    const token = request.headers["x-api-key"];
    const userService = iocContainer.get<UserService>(UserService);

    if (!token || typeof token !== "string") {
      throw new AuthorizationError("Invalid Token: Access Denied");
    }

    const user = await userService.getUserByApiKey(token);

    if (user) {
      return user;
    } else {
      throw new AuthorizationError("Invalid Token: Access Denied");
    }
  }
  throw new AuthorizationError("Invalid Security");
}

import * as express from "express";
import { iocContainer } from "../ioc/ioc.js";
import { AuthorizationError } from "../models/api/error.js";
import { User } from "../models/business/user.js";
import { UserService } from "../services/userService.js";

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

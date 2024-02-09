import * as express from "express";
import { inject } from "inversify";
import { provide } from "inversify-binding-decorators";
import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";
import { AuthorizationError, ConflictError } from "../models/api/error";
import { UserRequest, UserResponse } from "../models/api/user";
import { User } from "../models/business/user";
import { UserService } from "../services/userService";

@Route("admin")
@Tags("admin")
@provide(AdminController)
@Security("api_key")
export class AdminController extends Controller {
  constructor(
    @inject<UserService>(UserService) private readonly userService: UserService,
  ) {
    super();
  }

  @Get("user")
  @Response<{ message: string }>(403, "Authorization Error")
  public async getUsers(
    @Request() reqest: express.Request & { user: User },
  ): Promise<UserResponse[]> {
    if (!reqest.user.roles.includes("site_admin")) {
      throw new AuthorizationError("Access Denied");
    }
    const users = await this.userService.getUsers();
    return users.map((user) => {
      return {
        name: user.name,
        roles: user.roles,
      };
    });
  }

  @Post("user")
  @Response<{ message: string }>(403, "Authorization Error")
  @Response<{ message: string }>(409, "Resource already exists")
  @SuccessResponse("201", "User created")
  public async addUser(
    @Request() reqest: express.Request & { user: User },
    @Body() body: UserRequest,
  ): Promise<string> {
    if (!reqest.user.roles.includes("site_admin")) {
      throw new AuthorizationError("Access Denied");
    }
    const users = await this.userService.getUsers();
    if (users.find((user) => user.name === body.name)) {
      throw new ConflictError("User already exists");
    }
    const api_key = this.userService.generateApiKey();
    await this.userService.addUser(body.name, api_key, body.roles);
    return api_key;
  }
}

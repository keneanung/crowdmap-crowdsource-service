import * as express from "express";
import { inject } from "inversify";
import { provide } from "inversify-binding-decorators";
import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Put,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
} from "../models/api/error";
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
    @Request() request: express.Request & { user: User },
  ): Promise<UserResponse[]> {
    if (!request.user.roles.includes("site_admin")) {
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
    @Request() request: express.Request & { user: User },
    @Body() body: UserRequest,
  ): Promise<string> {
    if (!request.user.roles.includes("site_admin")) {
      throw new AuthorizationError("Access Denied");
    }
    const users = await this.userService.getUsers();
    if (users.find((user) => user.name === body.name)) {
      throw new ConflictError("User already exists");
    }
    const apiKey = await this.userService.createUser(body.name, body.roles);
    return apiKey;
  }

  @Get("user/me")
  public getMe(
    @Request() request: express.Request & { user: User },
  ): UserResponse {
    return {
      name: request.user.name,
      roles: request.user.roles,
    };
  }

  @Put("user/{user}/api-key")
  @Response<{ message: string }>(403, "Authorization Error")
  @Response<{ message: string }>(404, "User not found")
  public async updateApiKey(
    @Request() request: express.Request & { user: User },
    @Path() user: string,
  ): Promise<string> {
    if (!request.user.roles.includes("site_admin") && user !== "me") {
      throw new AuthorizationError("Access Denied");
    }
    const userToChange =
      user === "me" ? request.user : await this.userService.getUser(user);
    if (!userToChange) {
      throw new NotFoundError("User not found");
    }
    const apiKey = await this.userService.updateApiKey(userToChange);
    return apiKey;
  }
}

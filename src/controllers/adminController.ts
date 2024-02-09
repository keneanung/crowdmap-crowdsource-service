import { inject } from "inversify";
import { provide } from "inversify-binding-decorators";
import { Controller, Get, Response, Route, Security, Tags } from "tsoa";
import { UserResponse } from "../models/api/user";
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

  @Get("users")
  @Response<{ message: string }>(403, "Authorization Error")
  public async  getUsers(): Promise<UserResponse[]> {
    const users = await this.userService.getUsers();
    return users.map((user) => {
      return {
        name: user.name,
        roles: user.roles,
      };
    });
  }
}

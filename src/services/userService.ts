import * as crypto from "crypto";
import { inject } from "inversify";
import { provideSingleton } from "../ioc/provideSingleton";
import { Role, User } from "../models/business/user";
import { UserDbService } from "./userDbService";

@provideSingleton(UserService)
export class UserService {
  constructor(
    @inject<UserDbService>(UserDbService)
    private readonly userDbService: UserDbService,
  ) {}

  public async addUser(user: string, api_key: string, roles: Role[]) {
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey = this.hashApiKey(api_key, salt);
    await this.userDbService.addUser({
      name: user,
      roles,
      salt,
      hashed_api_key: derivedKey.toString("hex"),
    });
  }

  public hashApiKey(api_key: string, salt: string) {
    const iterations = 10000;
    const keylength = 64;
    const hashingAlgo = "sha512";
    const derivedKey = crypto.pbkdf2Sync(
      api_key,
      salt,
      iterations,
      keylength,
      hashingAlgo,
    );
    return derivedKey;
  }

  public async getUserByApiKey(api_key: string): Promise<User | undefined> {
    const users = await this.userDbService.getUsers();
    return users.find(
      (user) =>
        user.hashed_api_key ===
        this.hashApiKey(api_key, user.salt).toString("hex"),
    );
  }

  public async getUsers(): Promise<User[]> {
    return await this.userDbService.getUsers();
  }

  public generateApiKey() {
    return crypto.randomUUID();
  }
}

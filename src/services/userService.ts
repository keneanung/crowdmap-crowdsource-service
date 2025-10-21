import * as crypto from "crypto";
import { inject } from "inversify";
import { provide } from "@inversifyjs/binding-decorators";
import { Role, User } from "../models/business/user";
import { UserDbService } from "./userDbService";

@provide(UserService)
export class UserService {
  constructor(
    @inject(UserDbService)
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

  public async getUser(name: string): Promise<User | undefined> {
    const users = await this.userDbService.getUsers();
    return users.find((user) => user.name === name);
  }

  public async getUsers(): Promise<User[]> {
    return await this.userDbService.getUsers();
  }

  public generateApiKey() {
    return crypto.randomUUID();
  }

  public async createUser(name: string, roles: Role[]) {
    const api_key = this.generateApiKey();
    await this.addUser(name, api_key, roles);
    return api_key;
  }

  public async updateApiKey(user: User) {
    const newApiKey = this.generateApiKey();
    const hashedApiKey = this.hashApiKey(newApiKey, user.salt).toString("hex");
    await this.userDbService.updateApiKey(user, hashedApiKey);
    return newApiKey;
  }
}

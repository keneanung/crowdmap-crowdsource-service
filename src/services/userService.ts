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
    await this.userDbService.addUser(
      await this.buildUser(user, api_key, roles),
    );
  }

  private async buildUser(
    user: string,
    api_key: string,
    roles: Role[],
  ): Promise<User> {
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey = await this.hashApiKey(api_key, salt);
    return {
      name: user,
      roles,
      salt,
      hashed_api_key: derivedKey.toString("hex"),
      api_key_lookup: this.getApiKeyLookup(api_key),
    };
  }

  public hashApiKey(api_key: string, salt: string): Promise<Buffer> {
    const iterations = 10000;
    const keylength = 64;
    const hashingAlgo = "sha512";
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        api_key,
        salt,
        iterations,
        keylength,
        hashingAlgo,
        (error, derivedKey) => {
          if (error) {
            reject(error);
          } else {
            resolve(derivedKey);
          }
        },
      );
    });
  }

  private getApiKeyLookup(api_key: string): string {
    return crypto.createHash("sha256").update(api_key).digest("hex");
  }

  private async apiKeyMatches(api_key: string, user: User): Promise<boolean> {
    const actual = await this.hashApiKey(api_key, user.salt);
    const expected = Buffer.from(user.hashed_api_key, "hex");
    return (
      actual.length === expected.length && crypto.timingSafeEqual(actual, expected)
    );
  }

  public async getUserByApiKey(api_key: string): Promise<User | undefined> {
    const lookup = this.getApiKeyLookup(api_key);
    const indexedUser = await this.userDbService.getUserByApiKeyLookup(lookup);
    if (indexedUser) {
      return (await this.apiKeyMatches(api_key, indexedUser))
        ? indexedUser
        : undefined;
    }

    const legacyUsers = await this.userDbService.getUsersWithoutApiKeyLookup();
    for (const user of legacyUsers) {
      if (await this.apiKeyMatches(api_key, user)) {
        await this.userDbService.setApiKeyLookup(user, lookup);
        user.api_key_lookup = lookup;
        return user;
      }
    }
    return undefined;
  }

  public async getUser(name: string): Promise<User | undefined> {
    return this.userDbService.getUserByName(name);
  }

  public async getUsers(): Promise<User[]> {
    return await this.userDbService.getUsers();
  }

  public deleteUser(name: string): Promise<boolean> {
    return this.userDbService.deleteUser(name);
  }

  public updateRoles(name: string, roles: Role[]): Promise<boolean> {
    return this.userDbService.updateRoles(name, roles);
  }

  public generateApiKey() {
    return crypto.randomUUID();
  }

  public async createUser(name: string, roles: Role[]) {
    const api_key = this.generateApiKey();
    await this.addUser(name, api_key, roles);
    return api_key;
  }

  public async createUserIfMissing(
    name: string,
    roles: Role[],
    apiKey: string,
  ): Promise<boolean> {
    return this.userDbService.addUserIfMissing(
      await this.buildUser(name, apiKey, roles),
    );
  }

  public async updateApiKey(user: User) {
    const newApiKey = this.generateApiKey();
    const hashedApiKey = (await this.hashApiKey(newApiKey, user.salt)).toString(
      "hex",
    );
    await this.userDbService.updateApiKey(
      user,
      hashedApiKey,
      this.getApiKeyLookup(newApiKey),
    );
    return newApiKey;
  }
}

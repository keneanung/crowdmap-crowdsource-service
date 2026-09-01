import { provide } from "@inversifyjs/binding-decorators";
import * as crypto from "crypto";
import { inject } from "inversify";
import { Role, User } from "../models/business/user";
import { UserDbService } from "./userDbService";

const API_KEY_ID_PATTERN =
  /^cm1_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    const parsedApiKey = this.parseApiKey(api_key);
    if (!parsedApiKey) {
      throw new Error("API key must use the cm1_<key-id>.<secret> format");
    }
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey = await this.hashApiKey(parsedApiKey.secret, salt);
    return {
      name: user,
      roles,
      salt,
      hashed_api_key: derivedKey.toString("hex"),
      api_key_id: parsedApiKey.id,
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

  private parseApiKey(
    apiKey: string,
  ): { id: string; secret: string } | undefined {
    const separator = apiKey.indexOf(".");
    if (separator === -1) {
      return undefined;
    }
    const id = apiKey.slice(0, separator);
    const secret = apiKey.slice(separator + 1);
    return API_KEY_ID_PATTERN.test(id) && secret ? { id, secret } : undefined;
  }

  private async apiKeyMatches(api_key: string, user: User): Promise<boolean> {
    const actual = await this.hashApiKey(api_key, user.salt);
    const expected = Buffer.from(user.hashed_api_key, "hex");
    return (
      actual.length === expected.length &&
      crypto.timingSafeEqual(actual, expected)
    );
  }

  public async getUserByApiKey(api_key: string): Promise<User | undefined> {
    const parsedApiKey = this.parseApiKey(api_key);
    if (parsedApiKey) {
      const indexedUser = await this.userDbService.getUserByApiKeyId(
        parsedApiKey.id,
      );
      if (indexedUser) {
        return (await this.apiKeyMatches(parsedApiKey.secret, indexedUser))
          ? indexedUser
          : undefined;
      }
    }

    const legacyUsers = await this.userDbService.getUsersWithoutApiKeyId();
    for (const user of legacyUsers) {
      if (await this.apiKeyMatches(api_key, user)) {
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
    const id = `cm1_${crypto.randomUUID()}`;
    const secret = crypto.randomBytes(32).toString("base64url");
    return `${id}.${secret}`;
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
    const parsedApiKey = this.parseApiKey(newApiKey);
    if (!parsedApiKey) {
      throw new Error("Generated an invalid API key");
    }
    const hashedApiKey = (
      await this.hashApiKey(parsedApiKey.secret, user.salt)
    ).toString("hex");
    await this.userDbService.updateApiKey(user, hashedApiKey, parsedApiKey.id);
    return newApiKey;
  }
}

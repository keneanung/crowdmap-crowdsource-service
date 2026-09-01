import { injectable } from "inversify";
import { User } from "../../src/models/business/user";
import { UserDbService } from "../../src/services/userDbService";

@injectable()
export class MockUserDbService implements UserDbService {
  private users: User[] = [
    {
      name: "admin",
      roles: ["site_admin", "map_admin"],
      salt: "3bf48f852298e68b40e2374e06394d66",
      hashed_api_key:
        "6a24308881db7403ec121caac112a5e3925eb8cc4c53c6b22c8caa547ff17f7e7a7046b80e363bb187a4853f534a1b9aad3a57ecd0c8e941624c5014c0f4141c",
    },
  ];
  public addUser(user: User): Promise<void> {
    this.users.push(user);
    return Promise.resolve();
  }
  public addUserIfMissing(user: User): Promise<boolean> {
    if (this.users.some((existingUser) => existingUser.name === user.name)) {
      return Promise.resolve(false);
    }
    this.users.push(user);
    return Promise.resolve(true);
  }
  public getUserByApiKeyId(apiKeyId: string): Promise<User | undefined> {
    return Promise.resolve(
      this.users.find((user) => user.api_key_id === apiKeyId),
    );
  }
  public getUserByName(name: string): Promise<User | undefined> {
    return Promise.resolve(this.users.find((user) => user.name === name));
  }
  public getUsersWithoutApiKeyId(): Promise<User[]> {
    return Promise.resolve(this.users.filter((user) => !user.api_key_id));
  }
  getUsers(): Promise<User[]> {
    return Promise.resolve(this.users);
  }
  deleteUser(name: string): Promise<boolean> {
    const userIndex = this.users.findIndex((user) => user.name === name);
    if (userIndex === -1) {
      return Promise.resolve(false);
    }
    this.users.splice(userIndex, 1);
    return Promise.resolve(true);
  }
  updateRoles(name: string, roles: User["roles"]): Promise<boolean> {
    const user = this.users.find((candidate) => candidate.name === name);
    if (!user) {
      return Promise.resolve(false);
    }
    user.roles = roles;
    return Promise.resolve(true);
  }
  updateApiKey(user: User, newApiKey: string, apiKeyId: string): Promise<void> {
    const foundUser = this.users.find((u) => u.name === user.name);
    if (!foundUser) {
      return Promise.reject(new Error("Unknown User"));
    }
    foundUser.hashed_api_key = newApiKey;
    foundUser.api_key_id = apiKeyId;
    return Promise.resolve();
  }
}

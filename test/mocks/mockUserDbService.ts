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
      hashed_api_key: "6a24308881db7403ec121caac112a5e3925eb8cc4c53c6b22c8caa547ff17f7e7a7046b80e363bb187a4853f534a1b9aad3a57ecd0c8e941624c5014c0f4141c"
    }
  ];
  public addUser(user: User): Promise<void> {
    this.users.push(user);
    console.log(this.users);
    return Promise.resolve();
  }
  getUsers(): Promise<User[]> {
    return Promise.resolve(this.users);
  }
}

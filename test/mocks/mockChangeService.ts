import { injectable } from "inversify";
import { Change } from "../../src/models/business/change";
import { ChangeService } from "../../src/services/changeService";

@injectable()
export class MockChangeService implements ChangeService {
  private changes: Change[] = [];
  public async addChange(change: Change): Promise<void> {
    this.changes.push(change);
    return Promise.resolve();
  }
  public async getChanges(_timesSeen: number): Promise<Change[]> {
    return Promise.resolve(this.changes);
  }
}

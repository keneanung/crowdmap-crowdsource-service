import { injectable } from "inversify";
import { Change } from "../../src/models/business/change";
import {
  changeBusinessToDb,
  changeDbToBusiness,
  Change as DbChange,
} from "../../src/models/db/change";
import { ChangeService } from "../../src/services/changeService";

@injectable()
export class MockChangeService implements ChangeService {
  private changes: DbChange[] = [];
  public addChange(change: Change): Promise<void> {
    const dbChange = changeBusinessToDb(change);
    this.changes.push(dbChange);
    return Promise.resolve();
  }
  public getChanges(_timesSeen: number): Promise<Change[]> {
    return Promise.resolve(this.changes.map(changeDbToBusiness));
  }
  public applyChanges(apply: string[]): Promise<void> {
    this.changes = this.changes.filter(
      (change) => !apply.includes(change.changeId),
    );
    return Promise.resolve();
  }
}

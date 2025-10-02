import { injectable } from "inversify";
import { uuidv7 } from "uuidv7";
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
    // Generate UUID v7 for new changes, just like the real service
    change.changeId = uuidv7();
    const dbChange = changeBusinessToDb(change);
    this.changes.push(dbChange);
    return Promise.resolve();
  }
  public getChanges(_timesSeen: number, include: string[] = [], exclude: string[] = []): Promise<Change[]> {
    let filteredChanges = this.changes;
    
    if (include.length > 0) {
      filteredChanges = this.changes.filter(change => include.includes(change.changeId ?? ""));
    } else if (exclude.length > 0) {
      filteredChanges = this.changes.filter(change => !exclude.includes(change.changeId ?? ""));
    }
    
    return Promise.resolve(filteredChanges.map(changeDbToBusiness));
  }
  public applyChanges(apply: string[]): Promise<void> {
    this.changes = this.changes.filter(
      (change) => !apply.includes(change.changeId ?? ""),
    );
    return Promise.resolve();
  }
}

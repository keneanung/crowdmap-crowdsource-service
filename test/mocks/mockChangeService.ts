import { injectable } from "inversify";
import type {
  Change,
  UpstreamConflict,
} from "../../src/models/business/change.js";
import {
  changeBusinessToDb,
  changeDbToBusiness,
  Change as DbChange,
} from "../../src/models/db/change.js";
import { ChangeService } from "../../src/services/changeService.js";

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
  public reconcileChanges(
    resolved: string[],
    conflicts: Map<string, UpstreamConflict>,
  ): Promise<void> {
    this.changes = this.changes.filter(
      (change) => !resolved.includes(change.changeId),
    );
    this.changes.forEach((change) => {
      const conflict = conflicts.get(change.changeId);
      if (conflict) change.upstreamConflict = conflict;
    });
    return Promise.resolve();
  }
}

import { injectable } from "inversify";
import type { Change } from "../../src/models/business/change.js";
import {
  changeBusinessToDb,
  changeDbToBusiness,
  Change as DbChange,
} from "../../src/models/db/change.js";
import { ChangeService } from "../../src/services/changeService.js";

@injectable()
export class MockChangeService extends ChangeService {
  private readonly changes = new Map<string, DbChange[]>();
  private scoped(projectId = "default"): DbChange[] {
    let changes = this.changes.get(projectId);
    if (!changes) {
      changes = [];
      this.changes.set(projectId, changes);
    }
    return changes;
  }
  public addChange(change: Change, projectId?: string): Promise<void> {
    const dbChange = changeBusinessToDb(change);
    this.scoped(projectId).push(dbChange);
    return Promise.resolve();
  }
  public getChanges(
    _timesSeen: number,
    _include?: string[],
    _exclude?: string[],
    projectId?: string,
  ): Promise<Change[]> {
    return Promise.resolve(this.scoped(projectId).map(changeDbToBusiness));
  }
  public applyChanges(apply: string[], projectId?: string): Promise<void> {
    const kept = this.scoped(projectId).filter(
      (change) => !apply.includes(change.changeId),
    );
    this.changes.set(projectId ?? "default", kept);
    return Promise.resolve();
  }
  public reconcileChanges(
    resolved: string[],
    projectId?: string,
  ): Promise<void> {
    const kept = this.scoped(projectId).filter(
      (change) => !resolved.includes(change.changeId),
    );
    this.changes.set(projectId ?? "default", kept);
    return Promise.resolve();
  }
}

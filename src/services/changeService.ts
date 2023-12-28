import { provideSingleton } from "../ioc/provideSingleton";
import { Change } from "../models/business/change";

@provideSingleton(ChangeService)
export class ChangeService {
  private changes: Change[];

  constructor() {
    this.changes = [];
  }
  addChange(change: Change) {
    this.changes.push(change);
  }
  getChanges() {
    return this.changes;
  }
}

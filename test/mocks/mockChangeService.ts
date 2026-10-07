import { injectable } from "inversify";
import type { Change } from "../../src/models/business/change.js";
import {
  observationProperty,
  observedReport,
  type CurrentObservation,
} from "../../src/models/business/observation.js";
import {
  changeBusinessToDb,
  changeDbToBusiness,
  Change as DbChange,
} from "../../src/models/db/change.js";
import { ChangeService } from "../../src/services/changeService.js";

@injectable()
export class MockChangeService extends ChangeService {
  private readonly observations = new Map<string, CurrentObservation>();
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
    const scope = projectId ?? "default";
    const definitions = this.scoped(scope);
    let definition = definitions.find(
      (c) =>
        JSON.stringify(changeDbToBusiness(c).getIdentifyingParts()) ===
        JSON.stringify(change.getIdentifyingParts()),
    );
    if (!definition) {
      definition = changeBusinessToDb(change);
      definitions.push(definition);
    }
    const property = observationProperty(change);
    for (const reporter of change.reporters) {
      this.observations.set(JSON.stringify([scope, reporter, property]), {
        projectId: scope,
        reporter,
        property,
        legacy: false,
        reports: [
          observedReport(
            scope,
            reporter,
            definition.changeId,
            change.changeId,
            new Date(),
          ),
        ],
      });
    }
    return Promise.resolve();
  }
  public getChanges(
    timesSeen: number,
    include: string[] = [],
    exclude: string[] = [],
    projectId?: string,
    reporter?: string,
  ): Promise<Change[]> {
    const scope = projectId ?? "default";
    const active = this.scoped(scope)
      .map((definition) => {
        const observations = [...this.observations.values()]
          .filter((o) => o.projectId === scope)
          .flatMap((o) =>
            o.reports
              .filter((r) => r.changeId === definition.changeId)
              .map((r) => ({ ...r, reporter: o.reporter })),
          )
          .sort(
            (a, b) =>
              a.observedAt.getTime() - b.observedAt.getTime() ||
              a.order.localeCompare(b.order),
          );
        const reporters = [...new Set(observations.map((o) => o.reporter))];
        return {
          definition: {
            ...definition,
            reporters,
            numberOfReporters: reporters.length,
          },
          latest: observations.at(-1),
        };
      })
      .filter(
        (c) =>
          c.latest &&
          (c.definition.numberOfReporters >= timesSeen ||
            (reporter !== undefined &&
              c.definition.reporters.includes(reporter))),
      )
      .filter((c) => !include.length || include.includes(c.definition.changeId))
      .filter(
        (c) => !exclude.length || !exclude.includes(c.definition.changeId),
      )
      .sort(
        (a, b) =>
          (a.latest?.observedAt.getTime() ?? 0) -
            (b.latest?.observedAt.getTime() ?? 0) ||
          (a.latest?.order ?? "").localeCompare(b.latest?.order ?? "") ||
          a.definition.changeId.localeCompare(b.definition.changeId),
      );
    return Promise.resolve(active.map((c) => changeDbToBusiness(c.definition)));
  }
  public override getObservations(projectId?: string) {
    return Promise.resolve(
      [...this.observations.values()]
        .filter((o) => o.projectId === (projectId ?? "default"))
        .flatMap((o) => o.reports),
    );
  }
  public override async deleteObservations(ids: string[], projectId?: string) {
    const selected = (await this.getObservations(projectId)).filter((o) =>
      ids.includes(o.observationId),
    );
    for (const o of this.observations.values())
      if (o.projectId === (projectId ?? "default"))
        o.reports = o.reports.filter((r) => !ids.includes(r.observationId));
    return selected.length;
  }
  public applyChanges(apply: string[], projectId?: string): Promise<void> {
    return this.deleteChanges(apply, projectId).then(() => undefined);
  }
  public reconcileChanges(
    resolved: string[],
    projectId?: string,
  ): Promise<void> {
    return this.deleteChanges(resolved, projectId).then(() => undefined);
  }
  public async deleteChanges(
    changeIds: string[],
    projectId?: string,
  ): Promise<number> {
    const active = await this.getChanges(0, changeIds, [], projectId);
    for (const o of this.observations.values())
      if (o.projectId === (projectId ?? "default"))
        o.reports = o.reports.filter((r) => !changeIds.includes(r.changeId));
    return active.length;
  }
}

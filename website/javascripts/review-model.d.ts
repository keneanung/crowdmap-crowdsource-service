export interface ReviewChange {
  changeId: string;
  type: string;
  reporters?: number;
  roomNumber?: number;
  areaId?: number;
  upstreamConflict?: { baselineVersion: string; reason: string };
  [key: string]: unknown;
}

export interface ReviewRelationship {
  change: ReviewChange;
  reason: string;
}
export type ReviewGroups = Map<string, ReviewRelationship[]>;

export function targetKey(change: ReviewChange): string;
export function typeLabel(type: string): string;
export function changeSummary(change: ReviewChange): string;
export function groupChanges(changes: ReviewChange[]): ReviewGroups;
export function isRelated(change: ReviewChange, groups: ReviewGroups): boolean;
export function relationBetween(
  left: ReviewChange,
  right: ReviewChange,
): string | null;
export function relationshipDetails(
  change: ReviewChange,
  groups: ReviewGroups,
): ReviewRelationship[];
export function filterChanges(
  changes: ReviewChange[],
  groups: ReviewGroups,
  filter: "all" | "conflicts" | "upstream" | "selected",
  search: string,
  selected: Set<string>,
): ReviewChange[];
export function canApply(rawVersion: string, apiKey: string): boolean;

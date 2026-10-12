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
export function unselectedChangeIds(
  changes: ReviewChange[],
  selected: Set<string>,
): string[];

export interface ReviewLocationContext {
  loaded?: boolean;
  rooms?: Map<number, { areaId: number; name: string; absent?: boolean }>;
  areas?: Map<number, { name: string; absent?: boolean }>;
}
export interface ReviewLocationGroup {
  key: string;
  areaId?: number;
  label: string;
  rooms: { roomId?: number; label: string; changes: ReviewChange[] }[];
}
export function changeTime(change: ReviewChange): Date | null;
export function groupChangesByLocation(
  changes: ReviewChange[],
  context?: ReviewLocationContext,
  allChanges?: ReviewChange[],
): ReviewLocationGroup[];

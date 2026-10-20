import type {
  ChangelogDetail,
  ChangelogFact,
  ChangelogRoom,
} from "../models/business/changelog.js";

export interface ChangelogContext {
  game?: string;
  mapName?: string;
}

type SpecialExit = Extract<ChangelogDetail, { kind: "specialExit" }>;

/** Complete typed changes, grouped for compact input; samples are never totals. */
export function modelOverview(
  facts: ChangelogFact[],
  context: ChangelogContext = {},
) {
  const areas = new Map<
    number | null,
    {
      areaId: number | null;
      areaName: string;
      changes: ReturnType<typeof modelChange>[];
    }
  >();
  for (const fact of facts) {
    let area = areas.get(fact.areaId);
    if (!area) {
      area = { areaId: fact.areaId, areaName: fact.areaName, changes: [] };
      areas.set(fact.areaId, area);
    }
    area.changes.push(modelChange(fact));
  }
  const metadata = facts
    .flatMap((f) => f.details)
    .filter((d) => d.kind === "roomMetadata");
  const existingMetadata = metadata.filter((d) => !d.room.newlyAdded);
  const initializedMetadata = metadata.filter((d) => d.room.newlyAdded);
  return {
    game: context.game,
    mapName: context.mapName,
    totals: {
      areasAdded: facts
        .filter((f) => f.category === "areas added")
        .reduce((n, f) => n + f.count, 0),
      areasRemoved: facts
        .filter((f) => f.category === "areas deleted")
        .reduce((n, f) => n + f.count, 0),
      metadataOnExistingRooms: {
        propertiesChanged: existingMetadata.length,
        roomsAffected: new Set(existingMetadata.map((d) => d.room.roomId)).size,
      },
      metadataInitializedOnNewRooms: {
        propertiesInitialized: initializedMetadata.length,
        roomsAffected: new Set(initializedMetadata.map((d) => d.room.roomId))
          .size,
      },
      roomsAdded: facts
        .filter((f) => f.category === "rooms added")
        .reduce((n, f) => n + f.count, 0),
      roomsRemoved: facts
        .filter((f) => f.category === "rooms deleted")
        .reduce((n, f) => n + f.count, 0),
      roomsRenamed: facts
        .filter((f) => f.category === "room name changed")
        .reduce((n, f) => n + f.count, 0),
      normalExitsAdded: facts
        .filter((f) => f.category === "normal exits added")
        .reduce((n, f) => n + f.count, 0),
      normalExitsRemoved: facts
        .filter((f) => f.category === "normal exits removed")
        .reduce((n, f) => n + f.count, 0),
      specialExitsAdded: facts
        .filter((f) => f.category === "special exits added")
        .reduce((n, f) => n + f.count, 0),
      specialExitsRemoved: facts
        .filter((f) => f.category === "special exits removed")
        .reduce((n, f) => n + f.count, 0),
    },
    areas: [...areas.values()],
  };
}

function modelChange(fact: ChangelogFact) {
  const details = fact.details;
  const rooms = new Map<
    number,
    { room: ChangelogRoom; propertiesChanged: number }
  >();
  for (const detail of details) {
    if (!("room" in detail)) continue;
    const item = rooms.get(detail.room.roomId) ?? {
      room: detail.room,
      propertiesChanged: 0,
    };
    item.propertiesChanged++;
    rooms.set(detail.room.roomId, item);
  }
  const unit = fact.category.startsWith("rooms ")
    ? "rooms"
    : fact.category.startsWith("areas ") ||
        fact.category === "area names changed"
      ? "areas"
      : fact.category.includes("exits ")
        ? "exits"
        : fact.category.startsWith("labels ")
          ? "labels"
          : fact.category === "room hash mappings changed"
            ? "hash mappings"
            : "properties";
  const total = { count: fact.count, unit };
  if (fact.category === "room metadata properties changed") {
    const perRoom = [...rooms.values()];
    return {
      category: fact.category,
      metadata: {
        propertiesChanged: fact.count,
        roomsAffected: rooms.size,
        existingRoomsChanged: perRoom.filter(({ room }) => !room.newlyAdded)
          .length,
        newRoomsInitialized: perRoom.filter(({ room }) => room.newlyAdded)
          .length,
        perRoom,
      },
    };
  }
  if (
    details.length &&
    details.every(
      (detail): detail is SpecialExit => detail.kind === "specialExit",
    )
  ) {
    const commands = new Map<
      string,
      {
        command: string;
        operation: SpecialExit["operation"];
        exitsChanged: number;
        routes: {
          fromRoom: ChangelogRoom;
          toRoomBefore: SpecialExit["destinationBefore"];
          toRoomAfter: SpecialExit["destinationAfter"];
        }[];
      }
    >();
    for (const detail of details) {
      const key = JSON.stringify([detail.command, detail.operation]);
      let group = commands.get(key);
      if (!group) {
        group = {
          command: detail.command,
          operation: detail.operation,
          exitsChanged: 0,
          routes: [],
        };
        commands.set(key, group);
      }
      group.exitsChanged++;
      group.routes.push({
        fromRoom: detail.room,
        toRoomBefore: detail.destinationBefore,
        toRoomAfter: detail.destinationAfter,
      });
    }
    return {
      category: fact.category,
      total,
      specialExits: [...commands.values()],
    };
  }
  return {
    category: fact.category,
    total,
    roomsAffected: rooms.size || undefined,
    movement: fact.movement,
    details: details.map((detail) =>
      detail.kind === "normalExit"
        ? {
            kind: detail.kind,
            operation: detail.operation,
            fromRoom: detail.room,
            directionAtSource: detail.direction,
            toRoomBefore: detail.destinationBefore,
            toRoomAfter: detail.destinationAfter,
          }
        : detail,
    ),
  };
}

/** Publication facts only: no endpoint rooms, IDs or housekeeping detail. */
export function editorialOverview(
  facts: ChangelogFact[],
  context: ChangelogContext = {},
) {
  const additions = new Map<
    number | null,
    { area: string; rooms: number; normal_exits: number }
  >();
  const room_removals: { area: string; count: number }[] = [];
  const room_moves: { from_area: string; to_area: string; rooms: number }[] =
    [];
  const normal = new Map<
    string,
    { area: string; direction: string; operation: string; count: number }
  >();
  const special = new Map<
    string,
    {
      command: string;
      operation: string;
      areas: Map<number | null, { area: string; count: number }>;
    }
  >();
  const renames: {
    area: string;
    rooms: { from: string | number; to: string | number }[];
  }[] = [];
  const areas: { operation: string; from: string | null; to: string | null }[] =
    [];
  let housekeeping = false;
  for (const fact of facts) {
    if (
      fact.category === "rooms added" ||
      fact.category === "normal exits added"
    ) {
      const group = additions.get(fact.areaId) ?? {
        area: fact.areaName,
        rooms: 0,
        normal_exits: 0,
      };
      if (fact.category === "rooms added") group.rooms += fact.count;
      else group.normal_exits += fact.count;
      additions.set(fact.areaId, group);
      continue;
    }
    if (fact.category === "rooms deleted") {
      room_removals.push({ area: fact.areaName, count: fact.count });
      continue;
    }
    if (fact.movement) {
      room_moves.push({
        from_area: fact.movement.fromAreaName,
        to_area: fact.movement.toAreaName,
        rooms: fact.count,
      });
      continue;
    }
    const names: { from: string | number; to: string | number }[] = [];
    for (const d of fact.details) {
      if (d.kind === "normalExit") {
        const key = JSON.stringify([fact.areaId, d.direction, d.operation]);
        const group = normal.get(key) ?? {
          area: fact.areaName,
          direction: d.direction,
          operation: d.operation,
          count: 0,
        };
        group.count++;
        normal.set(key, group);
      } else if (d.kind === "specialExit") {
        const key = JSON.stringify([d.command, d.operation]);
        const group = special.get(key) ?? {
          command: d.command,
          operation: d.operation,
          areas: new Map<number | null, { area: string; count: number }>(),
        };
        const area = group.areas.get(fact.areaId) ?? {
          area: fact.areaName,
          count: 0,
        };
        area.count++;
        group.areas.set(fact.areaId, area);
        special.set(key, group);
      } else if (d.kind === "roomProperty" && d.property === "name") {
        names.push({ from: d.before, to: d.after });
      } else if (d.kind === "area") {
        areas.push({
          operation: d.operation,
          from: d.nameBefore,
          to: d.nameAfter,
        });
      } else {
        housekeeping = true;
      }
    }
    if (names.length) renames.push({ area: fact.areaName, rooms: names });
    if (!fact.details.length && fact.count) housekeeping = true;
  }
  const exits = [...normal.values()];
  return {
    ...context,
    ...(additions.size ? { additions: [...additions.values()] } : {}),
    ...(room_removals.length ? { room_removals } : {}),
    ...(room_moves.length ? { room_moves } : {}),
    ...(exits.some((e) => e.operation === "removed")
      ? {
          normal_exits_removed: exits
            .filter((e) => e.operation === "removed")
            .map(({ area, direction, count }) => ({ area, direction, count })),
        }
      : {}),
    ...(exits.some((e) => e.operation === "changed")
      ? {
          normal_exits_changed: exits
            .filter((e) => e.operation === "changed")
            .map(({ area, direction, count }) => ({ area, direction, count })),
        }
      : {}),
    ...(special.size
      ? {
          special_exits: [...special.values()].map((g) => ({
            command: g.command,
            operation: g.operation,
            areas: [...g.areas.values()],
          })),
        }
      : {}),
    ...(renames.length ? { renames } : {}),
    ...(areas.length ? { areas } : {}),
    ...(housekeeping
      ? { housekeeping: "Housekeeping updates were also applied." }
      : {}),
    ...(!facts.length ? { no_changes: true } : {}),
  };
}

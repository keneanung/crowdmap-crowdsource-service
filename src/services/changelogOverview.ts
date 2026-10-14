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

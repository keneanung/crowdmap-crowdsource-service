import type {
  MudletArea as ReaderMudletArea,
  MudletMap as ReaderMudletMap,
  MudletRoom as ReaderMudletRoom,
} from "mudlet-map-binary-reader";

declare global {
  namespace Mudlet {
    type MudletMap = ReaderMudletMap;
    type MudletArea = ReaderMudletArea;
    type MudletRoom = ReaderMudletRoom;
  }

  type MudletArea = ReaderMudletArea;
  type MudletRoom = ReaderMudletRoom;
}

export {};

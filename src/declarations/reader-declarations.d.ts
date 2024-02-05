/// <reference types="mudlet-map-binary-reader/types/map" />

declare module "mudlet-map-binary-reader" {
  export const MudletMapReader: {
    read: (mapFile: string) => Mudlet.MudletMap;
    write: (map: Mudlet.MudletMap, file: string) => void;
    exportJson: (
      map: Mudlet.MudletMap,
      file: string,
      minified: boolean,
    ) => string;
    export: (
      map: Mudlet.MudletMap,
      dir?: string,
    ) => { mapData: ExportedMap; colors: { envId: number; colors: number[] } };
  };

  export type ExportedMap = Record<number, ExportedArea>;
  export interface ExportedArea {
    areaName: string;
    areaId: number;
    rooms: object[];
    labels: object[];
  }
}

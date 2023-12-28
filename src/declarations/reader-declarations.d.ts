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
  };
}

// src/types.ts
export type AOI = {
  id: string;
  name: string;
  type: "point" | "polygon" | "polyline" | "rectangle";
  lat?: number;
  lng?: number;
  geojson: any;
};

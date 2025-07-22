export type Coord = {lat: number, lng: number}

export interface PolygonType {
  center: Coord,
  path: Coord[],
  area: number,
  perimeter: number,
  id?: string,
  title?: string
}
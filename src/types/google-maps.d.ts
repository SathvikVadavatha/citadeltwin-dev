/// <reference types="@types/google.maps" />

declare namespace google {
  export namespace maps {
    export type Map = any;
    export type Marker = any;
    export type InfoWindow = any;
    export type LatLng = any;
    export type LatLngLiteral = { lat: number; lng: number };
    export type MapOptions = any;
    export type Polygon = any;
    export type Polyline = any;
    export type Circle = any;
    export type Rectangle = any;
    export type OverlayView = any;
    export type DrawingManager = any;
    export type Data = any;
    export type MVCArray<T = any> = any;
    export type LatLngBounds = any;
    export type LatLngBoundsLiteral = any;
    export type MarkerOptions = any;
    export type PolygonOptions = any;
    export type PolylineOptions = any;
    export type CircleOptions = any;
    export type RectangleOptions = any;
    export type MapTypeId = any;
    export type ControlPosition = any;
    export type GeocoderResult = any;
    export type GeocoderStatus = any;
    export type DirectionsResult = any;
    export type DirectionsStatus = any;
    export type ElevationResult = any;
    export type ElevationStatus = any;
    export type PlaceResult = any;
    export type event = any;

    export namespace drawing {
      export type DrawingManager = any;
      export type OverlayType = any;
    }
    export namespace places {
      export type Autocomplete = any;
      export type SearchBox = any;
    }
    export namespace geometry {
      export namespace spherical {
        export function computeArea(path: any): number;
        export function computeDistanceBetween(from: any, to: any): number;
      }
    }
  }
}

interface Window {
  google: typeof google;
}

/// <reference types="vite/client" />

declare namespace google {
  namespace maps {
    interface Map { [key: string]: any; }
    interface Marker { [key: string]: any; }
    interface InfoWindow { [key: string]: any; }
    interface LatLng { lat(): number; lng(): number; }
    interface LatLngBounds { [key: string]: any; }
    interface LatLngLiteral { lat: number; lng: number; }
    interface LatLngBoundsLiteral { east: number; north: number; south: number; west: number; }
    interface Polygon { [key: string]: any; }
    interface Polyline { [key: string]: any; }
    interface Circle { [key: string]: any; }
    interface Rectangle { [key: string]: any; }
    interface OverlayView { [key: string]: any; }
    interface MVCArray<T = any> { [key: string]: any; }
    interface Data { [key: string]: any; }
    interface Size { [key: string]: any; }
    interface MapMouseEvent { [key: string]: any; }
    interface MapOptions { [key: string]: any; }
    interface MarkerOptions { [key: string]: any; }
    interface PolygonOptions { [key: string]: any; }
    interface PolylineOptions { [key: string]: any; }
    interface CircleOptions { [key: string]: any; }
    interface RectangleOptions { [key: string]: any; }
    interface GeocoderResult { [key: string]: any; }
    interface DirectionsResult { [key: string]: any; }
    interface ElevationResult { [key: string]: any; }
    interface PlaceResult { [key: string]: any; }
    type GeocoderStatus = any;
    type DirectionsStatus = any;
    type ElevationStatus = any;
    type MapTypeId = any;
    type ControlPosition = any;

    namespace drawing {
      interface DrawingManager { [key: string]: any; }
      type OverlayType = any;
    }
    namespace places {
      interface Autocomplete { [key: string]: any; }
      interface SearchBox { [key: string]: any; }
      interface PlaceResult { [key: string]: any; }
    }
    namespace geometry {
      const spherical: any;
      const encoding: any;
      const poly: any;
    }
    namespace event {
      function addListener(instance: any, eventName: string, handler: Function): any;
      function removeListener(listener: any): void;
      function trigger(instance: any, eventName: string, ...args: any[]): void;
    }
  }
}

interface Window {
  google: typeof google;
}

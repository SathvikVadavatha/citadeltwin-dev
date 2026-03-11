// Global type declarations for Google Maps API loaded at runtime
// Using permissive types to avoid strict type checking on dynamically loaded library

declare namespace google {
  namespace maps {
    // Use 'any' for all Google Maps types to avoid strict type checking issues
    type Map = any;
    type Marker = any;
    type InfoWindow = any;
    type LatLng = any;
    type LatLngBounds = any;
    type Polygon = any;
    type Polyline = any;
    type Circle = any;
    type Rectangle = any;
    type OverlayView = any;
    type MVCArray<T = any> = any;
    type Data = any;
    type MapMouseEvent = any;
    type Size = any;

    interface LatLngLiteral { lat: number; lng: number; }
    interface LatLngBoundsLiteral { east: number; north: number; south: number; west: number; }
    type MapOptions = any;
    type MarkerOptions = any;
    type PolygonOptions = any;
    type PolylineOptions = any;
    type CircleOptions = any;
    type RectangleOptions = any;
    type MapTypeId = any;
    type ControlPosition = any;
    type GeocoderResult = any;
    type GeocoderStatus = any;
    type DirectionsResult = any;
    type DirectionsStatus = any;
    type ElevationResult = any;
    type ElevationStatus = any;
    type PlaceResult = any;

    const event: any;
    const MapTypeId: any;
    const ControlPosition: any;

    namespace drawing {
      type DrawingManager = any;
      type OverlayType = any;
      const OverlayType: any;
    }
    namespace places {
      type Autocomplete = any;
      type SearchBox = any;
      type PlaceResult = any;
    }
    namespace geometry {
      const spherical: any;
      const encoding: any;
      const poly: any;
    }
  }
}

interface Window {
  google: typeof google;
}

// Global type declarations for Google Maps API loaded at runtime
// This file provides type stubs so TypeScript doesn't error on google.maps usage

declare namespace google {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options?: any);
      setCenter(latlng: any): void;
      setZoom(zoom: number): void;
      getCenter(): any;
      getZoom(): number;
      getBounds(): any;
      setOptions(options: any): void;
      panTo(latlng: any): void;
      fitBounds(bounds: any): void;
      addListener(event: string, handler: Function): any;
      data: any;
      controls: any[];
    }
    class Marker {
      constructor(options?: any);
      setMap(map: any): void;
      setPosition(latlng: any): void;
      getPosition(): any;
      addListener(event: string, handler: Function): any;
      setIcon(icon: any): void;
      setTitle(title: string): void;
    }
    class InfoWindow {
      constructor(options?: any);
      open(map?: any, anchor?: any): void;
      close(): void;
      setContent(content: string | HTMLElement): void;
    }
    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }
    class LatLngBounds {
      constructor(sw?: any, ne?: any);
      extend(latlng: any): any;
      contains(latlng: any): boolean;
      getCenter(): any;
      getNorthEast(): any;
      getSouthWest(): any;
    }
    class Polygon {
      constructor(options?: any);
      setMap(map: any): void;
      getPath(): any;
      setPath(path: any): void;
      addListener(event: string, handler: Function): any;
    }
    class Polyline {
      constructor(options?: any);
      setMap(map: any): void;
      getPath(): any;
      setPath(path: any): void;
    }
    class Circle {
      constructor(options?: any);
      setMap(map: any): void;
      setCenter(latlng: any): void;
      setRadius(radius: number): void;
    }
    class Rectangle {
      constructor(options?: any);
      setMap(map: any): void;
      setBounds(bounds: any): void;
    }
    class OverlayView {
      setMap(map: any): void;
      getMap(): any;
      getPanes(): any;
      getProjection(): any;
      onAdd(): void;
      draw(): void;
      onRemove(): void;
    }
    class MVCArray<T = any> {
      getLength(): number;
      getAt(index: number): T;
      push(elem: T): number;
      forEach(callback: (elem: T, index: number) => void): void;
    }
    class Data {
      addGeoJson(geoJson: any, options?: any): any[];
      setStyle(style: any): void;
      forEach(callback: (feature: any) => void): void;
      loadGeoJson(url: string, options?: any, callback?: (features: any[]) => void): void;
    }

    interface LatLngLiteral { lat: number; lng: number; }
    interface LatLngBoundsLiteral { east: number; north: number; south: number; west: number; }
    interface MapOptions { center?: any; zoom?: number; mapTypeId?: any; [key: string]: any; }
    interface MarkerOptions { position?: any; map?: any; title?: string; icon?: any; [key: string]: any; }
    interface PolygonOptions { paths?: any; [key: string]: any; }
    interface PolylineOptions { path?: any; [key: string]: any; }
    interface CircleOptions { center?: any; radius?: number; [key: string]: any; }
    interface RectangleOptions { bounds?: any; [key: string]: any; }

    const MapTypeId: { ROADMAP: string; SATELLITE: string; HYBRID: string; TERRAIN: string; [key: string]: string; };
    const ControlPosition: { [key: string]: number; };

    interface GeocoderResult { geometry: { location: any }; formatted_address: string; [key: string]: any; }
    type GeocoderStatus = string;
    interface DirectionsResult { routes: any[]; [key: string]: any; }
    type DirectionsStatus = string;
    interface ElevationResult { elevation: number; location: any; [key: string]: any; }
    type ElevationStatus = string;
    interface PlaceResult { geometry?: { location: any }; name?: string; [key: string]: any; }

    const event: { addListener(instance: any, eventName: string, handler: Function): any; removeListener(listener: any): void; trigger(instance: any, eventName: string, ...args: any[]): void; };

    namespace drawing {
      class DrawingManager {
        constructor(options?: any);
        setMap(map: any): void;
        setDrawingMode(mode: any): void;
      }
      const OverlayType: { [key: string]: string; };
    }
    namespace places {
      class Autocomplete {
        constructor(input: HTMLInputElement, options?: any);
        addListener(event: string, handler: Function): any;
        getPlace(): any;
      }
      class SearchBox {
        constructor(input: HTMLInputElement, options?: any);
        addListener(event: string, handler: Function): any;
        getPlaces(): any[];
      }
    }
    namespace geometry {
      namespace spherical {
        function computeArea(path: any): number;
        function computeDistanceBetween(from: any, to: any): number;
        function computeHeading(from: any, to: any): number;
        function computeLength(path: any): number;
      }
      namespace encoding {
        function decodePath(encodedPath: string): any[];
        function encodePath(path: any): string;
      }
    }
  }
}

interface Window {
  google: typeof google;
}

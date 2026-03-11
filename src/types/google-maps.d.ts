// Declare the google namespace as available globally when loaded via @googlemaps/js-api-loader
// This avoids TS2503/TS2304 errors for google.maps references

declare namespace google {
  export namespace maps {
    class Map {
      constructor(element: HTMLElement, options?: any);
      setCenter(latLng: any): void;
      getCenter(): LatLng | undefined;
      setZoom(zoom: number): void;
      getZoom(): number | undefined;
      setMapTypeId(type: string): void;
      addListener(event: string, handler: (...args: any[]) => void): MapsEventListener;
      fitBounds(bounds: LatLngBounds, padding?: number | any): void;
      getBounds(): LatLngBounds | undefined;
      data: Data;
      controls: any[];
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
      toJSON(): { lat: number; lng: number };
    }

    class LatLngBounds {
      constructor(sw?: LatLng | null, ne?: LatLng | null);
      extend(point: LatLng | { lat: number; lng: number }): LatLngBounds;
      contains(latLng: LatLng): boolean;
      getCenter(): LatLng;
      getNorthEast(): LatLng;
      getSouthWest(): LatLng;
    }

    class Marker {
      constructor(options?: any);
      setMap(map: Map | null): void;
      setPosition(latLng: LatLng | { lat: number; lng: number }): void;
      getPosition(): LatLng | null | undefined;
      addListener(event: string, handler: (...args: any[]) => void): MapsEventListener;
    }

    class InfoWindow {
      constructor(options?: any);
      open(options?: any): void;
      close(): void;
      setContent(content: string | HTMLElement): void;
    }

    class Polygon {
      constructor(options?: any);
      setMap(map: Map | null): void;
      getPath(): any;
      getPaths(): any;
      addListener(event: string, handler: (...args: any[]) => void): MapsEventListener;
    }

    class Polyline {
      constructor(options?: any);
      setMap(map: Map | null): void;
      getPath(): any;
      addListener(event: string, handler: (...args: any[]) => void): MapsEventListener;
    }

    class Circle {
      constructor(options?: any);
      setMap(map: Map | null): void;
      getBounds(): LatLngBounds | null | undefined;
    }

    class Rectangle {
      constructor(options?: any);
      setMap(map: Map | null): void;
      setBounds(bounds: LatLngBounds): void;
    }

    class Data {
      addGeoJson(geoJson: any, options?: any): any[];
      setStyle(style: any): void;
      forEach(callback: (feature: any) => void): void;
      remove(feature: any): void;
      overrideStyle(feature: any, style: any): void;
      revertStyle(feature?: any): void;
      addListener(event: string, handler: (...args: any[]) => void): MapsEventListener;
      setMap(map: Map | null): void;
    }

    class Geocoder {
      geocode(request: any, callback?: (results: any[], status: string) => void): Promise<any>;
    }

    class DirectionsService {
      route(request: any, callback?: (result: any, status: string) => void): Promise<any>;
    }

    class DirectionsRenderer {
      constructor(options?: any);
      setDirections(directions: any): void;
      setMap(map: Map | null): void;
    }

    interface MapsEventListener {
      remove(): void;
    }

    interface MapMouseEvent {
      latLng?: LatLng;
      domEvent?: MouseEvent;
    }

    namespace event {
      function addListener(instance: any, eventName: string, handler: (...args: any[]) => void): MapsEventListener;
      function addListenerOnce(instance: any, eventName: string, handler: (...args: any[]) => void): MapsEventListener;
      function removeListener(listener: MapsEventListener): void;
      function clearListeners(instance: any, eventName: string): void;
      function trigger(instance: any, eventName: string, ...args: any[]): void;
    }

    namespace places {
      class PlacesService {
        constructor(attrContainer: HTMLElement | Map);
        getDetails(request: any, callback: (result: PlaceResult | null, status: string) => void): void;
        nearbySearch(request: any, callback: (results: PlaceResult[] | null, status: string) => void): void;
        textSearch(request: any, callback: (results: PlaceResult[] | null, status: string) => void): void;
      }

      class Autocomplete {
        constructor(input: HTMLInputElement, options?: any);
        getPlace(): PlaceResult;
        addListener(event: string, handler: (...args: any[]) => void): MapsEventListener;
        setBounds(bounds: LatLngBounds): void;
      }

      class SearchBox {
        constructor(input: HTMLInputElement, options?: any);
        getPlaces(): PlaceResult[] | undefined;
        addListener(event: string, handler: (...args: any[]) => void): MapsEventListener;
        setBounds(bounds: LatLngBounds): void;
      }

      interface PlaceResult {
        place_id?: string;
        name?: string;
        formatted_address?: string;
        geometry?: {
          location?: LatLng;
          viewport?: LatLngBounds;
        };
        address_components?: any[];
        types?: string[];
        photos?: any[];
        reviews?: any[];
        opening_hours?: any;
        website?: string;
        formatted_phone_number?: string;
        international_phone_number?: string;
        url?: string;
        utc_offset_minutes?: number;
        vicinity?: string;
        rating?: number;
        user_ratings_total?: number;
        price_level?: number;
        business_status?: string;
        icon?: string;
        icon_mask_base_uri?: string;
        icon_background_color?: string;
      }
    }

    namespace drawing {
      class DrawingManager {
        constructor(options?: any);
        setMap(map: Map | null): void;
        setDrawingMode(mode: string | null): void;
        addListener(event: string, handler: (...args: any[]) => void): MapsEventListener;
      }

      const OverlayType: {
        CIRCLE: string;
        MARKER: string;
        POLYGON: string;
        POLYLINE: string;
        RECTANGLE: string;
      };
    }

    namespace geometry {
      namespace spherical {
        function computeArea(path: any[] | any): number;
        function computeDistanceBetween(from: LatLng, to: LatLng): number;
        function computeLength(path: any[] | any): number;
      }
      namespace encoding {
        function decodePath(encodedPath: string): LatLng[];
        function encodePath(path: any[] | any): string;
      }
    }

    const ControlPosition: {
      TOP_LEFT: number;
      TOP_CENTER: number;
      TOP_RIGHT: number;
      LEFT_TOP: number;
      LEFT_CENTER: number;
      LEFT_BOTTOM: number;
      RIGHT_TOP: number;
      RIGHT_CENTER: number;
      RIGHT_BOTTOM: number;
      BOTTOM_LEFT: number;
      BOTTOM_CENTER: number;
      BOTTOM_RIGHT: number;
    };

    const MapTypeId: {
      ROADMAP: string;
      SATELLITE: string;
      HYBRID: string;
      TERRAIN: string;
    };

    const SymbolPath: {
      CIRCLE: number;
      FORWARD_CLOSED_ARROW: number;
      FORWARD_OPEN_ARROW: number;
      BACKWARD_CLOSED_ARROW: number;
      BACKWARD_OPEN_ARROW: number;
    };
  }
}

interface Window {
  google: typeof google;
}

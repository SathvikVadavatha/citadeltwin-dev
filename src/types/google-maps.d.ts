// Global type declarations for Google Maps API loaded at runtime via @googlemaps/js-api-loader

declare namespace google.maps {
  export interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  export interface GeocoderResult {
    address_components: any[];
    formatted_address: string;
    geometry: {
      location: LatLng;
      viewport: LatLngBounds;
      location_type?: string;
      bounds?: LatLngBounds;
    };
    place_id: string;
    types: string[];
  }

  export class Size {
    constructor(width: number, height: number, widthUnit?: string, heightUnit?: string);
    width: number;
    height: number;
    equals(other: Size): boolean;
  }

  export class Map {
    constructor(element: HTMLElement, options?: any);
    setCenter(latLng: any): void;
    getCenter(): LatLng | undefined;
    setZoom(zoom: number): void;
    getZoom(): number | undefined;
    setMapTypeId(type: string): void;
    addListener(event: string, handler: (...args: any[]) => void): MapsEventListener;
    fitBounds(bounds: LatLngBounds, padding?: number | any): void;
    getBounds(): LatLngBounds | undefined;
    getDiv(): HTMLElement;
    data: Data;
    controls: any[];
  }

  export class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
    toJSON(): LatLngLiteral;
  }

  export class LatLngBounds {
    constructor(sw?: LatLng | LatLngLiteral | null, ne?: LatLng | LatLngLiteral | null);
    extend(point: LatLng | LatLngLiteral): LatLngBounds;
    contains(latLng: LatLng | LatLngLiteral): boolean;
    getCenter(): LatLng;
    getNorthEast(): LatLng;
    getSouthWest(): LatLng;
  }

  export class Marker {
    constructor(options?: any);
    setMap(map: Map | null): void;
    setPosition(latLng: LatLng | LatLngLiteral): void;
    getPosition(): LatLng | null | undefined;
    addListener(event: string, handler: (...args: any[]) => void): MapsEventListener;
  }

  export class InfoWindow {
    constructor(options?: any);
    open(options?: any): void;
    close(): void;
    setContent(content: string | HTMLElement): void;
  }

  export class Polygon {
    constructor(options?: any);
    setMap(map: Map | null): void;
    getPath(): any;
    getPaths(): any;
    setOptions(options: any): void;
    get(key: string): any;
    set(key: string, value: any): void;
    addListener(event: string, handler: (...args: any[]) => void): MapsEventListener;
  }

  export class Polyline {
    constructor(options?: any);
    setMap(map: Map | null): void;
    getPath(): any;
    addListener(event: string, handler: (...args: any[]) => void): MapsEventListener;
  }

  export class Circle {
    constructor(options?: any);
    setMap(map: Map | null): void;
    getBounds(): LatLngBounds | null | undefined;
  }

  export class Rectangle {
    constructor(options?: any);
    setMap(map: Map | null): void;
    setBounds(bounds: LatLngBounds): void;
  }

  export class Data {
    addGeoJson(geoJson: any, options?: any): any[];
    setStyle(style: any): void;
    forEach(callback: (feature: any) => void): void;
    remove(feature: any): void;
    overrideStyle(feature: any, style: any): void;
    revertStyle(feature?: any): void;
    addListener(event: string, handler: (...args: any[]) => void): MapsEventListener;
    setMap(map: Map | null): void;
  }

  export class Geocoder {
    geocode(request: any, callback?: (results: GeocoderResult[], status: string) => void): Promise<any>;
  }

  export class DirectionsService {
    route(request: any, callback?: (result: any, status: string) => void): Promise<any>;
  }

  export class DirectionsRenderer {
    constructor(options?: any);
    setDirections(directions: any): void;
    setMap(map: Map | null): void;
  }

  export interface MapsEventListener {
    remove(): void;
  }

  export interface MapMouseEvent {
    latLng?: LatLng;
    domEvent?: MouseEvent;
  }

  export namespace event {
    function addListener(instance: any, eventName: string, handler: (...args: any[]) => void): MapsEventListener;
    function addListenerOnce(instance: any, eventName: string, handler: (...args: any[]) => void): MapsEventListener;
    function removeListener(listener: MapsEventListener): void;
    function clearListeners(instance: any, eventName: string): void;
    function trigger(instance: any, eventName: string, ...args: any[]): void;
  }

  export namespace places {
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

  export namespace drawing {
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

  export namespace geometry {
    namespace spherical {
      function computeArea(path: any[] | any): number;
      function computeDistanceBetween(from: LatLng, to: LatLng): number;
      function computeLength(path: any[] | any): number;
    }
    namespace encoding {
      function decodePath(encodedPath: string): LatLng[];
      function encodePath(path: any[] | any): string;
    }
    namespace poly {
      function containsLocation(point: LatLng | LatLngLiteral, polygon: Polygon): boolean;
      function isLocationOnEdge(point: LatLng | LatLngLiteral, poly: Polygon | Polyline, tolerance?: number): boolean;
    }
  }

  export const ControlPosition: {
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

  export const MapTypeId: {
    ROADMAP: string;
    SATELLITE: string;
    HYBRID: string;
    TERRAIN: string;
  };

  export const SymbolPath: {
    CIRCLE: number;
    FORWARD_CLOSED_ARROW: number;
    FORWARD_OPEN_ARROW: number;
    BACKWARD_CLOSED_ARROW: number;
    BACKWARD_OPEN_ARROW: number;
  };
}

interface Window {
  google: typeof google;
}

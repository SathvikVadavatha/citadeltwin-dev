/* eslint-disable @typescript-eslint/no-empty-interface */
// Global type augmentation for Google Maps loaded at runtime via @googlemaps/js-api-loader
// The @types/google.maps package provides the `google.maps` namespace.

declare global {
  interface Window {
    google: typeof google;
  }
}

export {};

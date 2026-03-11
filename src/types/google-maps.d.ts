/* eslint-disable @typescript-eslint/no-namespace */
// Augment Window with google maps loaded at runtime
declare global {
  interface Window {
    google: typeof google;
  }
}

export {};

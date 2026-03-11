// Declare google as a global variable so TypeScript doesn't error
// The actual types come from the Google Maps JS API loaded at runtime
declare const google: any;

interface Window {
  google: any;
}

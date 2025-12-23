// Minimal stub - only exports what themeBuilder actually uses
export function warn(...args) {
  if (typeof console !== 'undefined') {
    console.warn(...args);
  }
}


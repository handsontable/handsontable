import {
  CLONE_TYPES,
} from './constants';

const registeredOverlays = {};

/**
 * Register overlay class. If the Overlay under the same name is already registered
 * the class won't be registered.
 *
 * @param {Overlay} overlayClass Overlay class extended from base overlay class {@link Overlay}.
 */
export function registerOverlayOnce(overlayClass) {
  const overlayName = overlayClass.OVERLAY_NAME;

  if (CLONE_TYPES.indexOf(overlayName) === -1) {
    throw new Error(`Unsupported overlay (${overlayName}).`);
  }

  if (!hasOverlay(overlayName)) {
    registeredOverlays[overlayName] = overlayClass;
  }
}

/**
 * Create new instance of overlay type.
 *
 * @param {string} type Overlay type, one of the CLONE_TYPES value.
 * @param {Walkontable} wot The Walkontable instance.
 * @returns {Overlay}
 */
export function createOverlay(type, wot) {
  return new registeredOverlays[type](wot);
}

/**
 * Check if specified overlay was registered.
 *
 * @param {string} type Overlay type, one of the CLONE_TYPES value.
 * @returns {boolean}
 */
export function hasOverlay(type) {
  return registeredOverlays[type] !== void 0;
}

/**
 * Checks if overlay object (`overlay`) is instance of overlay type (`type`).
 *
 * @param {Overlay} overlay Overlay object.
 * @param {string} type Overlay type, one of the CLONE_TYPES value.
 * @returns {boolean}
 */
export function isOverlayTypeOf(overlay, type) {
  if (!overlay || !registeredOverlays[type]) {
    return false;
  }

  return overlay instanceof registeredOverlays[type];
}

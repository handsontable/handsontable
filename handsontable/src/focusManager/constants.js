/**
 * Focus scope types.
 */
export const SCOPE_TYPES = Object.freeze({
  CONTAINER: 'container',
  MODAL: 'modal',
  // DETACHED: 'detached',
});

/**
 * Focus activation sources.
 */
export const FOCUS_SOURCES = Object.freeze({
  UNKNOWN: 'unknown',
  CLICK: 'click',
  FROM_ABOVE: 'from_above',
  FROM_BELOW: 'from_below',
});

/**
 * Keyboard shortcuts group name registered by focus manager.
 */
export const FOCUS_MANAGER_GROUP = 'focusManager';

/**
 * Default shortcuts context name.
 */
export const DEFAULT_SHORTCUTS_CONTEXT = 'grid';

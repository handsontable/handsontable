/**
 * Names of the user-orderable wrapper layout slots.
 */
export const LAYOUT_SLOTS = {
  BEFORE_GRID: 'beforeGrid',
  AFTER_GRID: 'afterGrid',
  OVERLAYS: 'overlays',
} as const;

/**
 * Union of the orderable layout slot names.
 */
export type LayoutSlotName = typeof LAYOUT_SLOTS[keyof typeof LAYOUT_SLOTS];

/**
 * Class added to every element registered in an edge slot (before-grid/after-grid). It carries the
 * shared slot-item border styling.
 */
export const SLOT_ITEM_CLASS = 'ht-slot-element';

/**
 * Default ordering weights for the built-in slot contributors. Lower weight comes first.
 * Plugins should pick weights with gaps (multiples of 100) to leave room between built-ins.
 */
export const LAYOUT_WEIGHTS = {
  PAGINATION: 100,
  LICENSE_NOTIFICATION: 200,
  DIALOG: 100,
} as const;

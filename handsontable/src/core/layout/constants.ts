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

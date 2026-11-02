/**
 * Names of the user-orderable wrapper layout slots. Every slot listed here is orderable through the
 * `layout` setting; add new edge slots (for example `start`/`end`) here to introduce them.
 *
 * The overlays layer (`ht-overlay`) is intentionally not a slot — it renders like the grid: a fixed
 * internal element, always present and not orderable.
 */
export const LAYOUT_SLOTS = {
  TOP: 'top',
  BOTTOM: 'bottom',
} as const;

/**
 * Union of the orderable layout slot names.
 */
export type LayoutSlotName = typeof LAYOUT_SLOTS[keyof typeof LAYOUT_SLOTS];

/**
 * The slot a contributor registers into. Alias of {@link LayoutSlotName} used by the `register` and
 * `layout` APIs — every slot is a user-orderable side.
 */
export type LayoutSide = LayoutSlotName;

/**
 * Class added to every element registered in a slot (top/bottom). It carries the shared slot-item
 * border styling.
 */
export const SLOT_ITEM_CLASS = 'ht-slot-element';

/**
 * Returns the class mirrored onto the root wrapper while the given slot holds at least one slot
 * item. The stylesheets select on this class instead of
 * `.ht-root-wrapper:has(> .ht-slot-<name> > .ht-slot-element)` — a `:has()` selector here makes
 * the browser re-run style invalidation on every grid DOM mutation (every scroll re-render), at a
 * cost that scales with the whole host page.
 *
 * @param {LayoutSlotName} name The slot name.
 * @returns {string} The state class for the slot.
 */
export function getSlotFilledClassName(name: LayoutSlotName): string {
  return `ht-slot-${name}-filled`;
}

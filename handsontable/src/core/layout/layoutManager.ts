import { throwWithCause } from '../../helpers/errors';
import { DomSlot } from './domSlot';
import { LAYOUT_SLOTS, SLOT_ITEM_CLASS, type LayoutSlotName, type LayoutSide } from './constants';

/**
 * User-facing layout configuration: an ordered list of element keys per user-orderable slot. The
 * shape derives from {@link LayoutSide}, so introducing a new slot extends it automatically.
 *
 * The overlays layer is intentionally absent: it renders like the grid (a fixed internal element),
 * not a slot users reorder at runtime.
 */
export type LayoutConfig = { [K in LayoutSide]?: string[] };

/**
 * Options accepted by {@link LayoutManager#register}.
 */
export interface LayoutRegisterOptions {
  side: LayoutSide;
  weight?: number;
}

/**
 * Owns one {@link DomSlot} per orderable wrapper slot and applies the `layout` setting to them.
 */
export class LayoutManager {
  /**
   * The slots keyed by their name.
   *
   * @type {Map<LayoutSlotName, DomSlot>}
   */
  #slots: Map<LayoutSlotName, DomSlot>;

  /**
   * @param {Record<LayoutSlotName, HTMLElement>} elements The slot container elements, keyed by slot name.
   */
  constructor(elements: Record<LayoutSlotName, HTMLElement>) {
    this.#slots = new Map(
      (Object.keys(elements) as LayoutSlotName[]).map(name => [
        name,
        new DomSlot(elements[name], { itemClass: SLOT_ITEM_CLASS }),
      ])
    );
  }

  /**
   * Returns the slot registered under the given name.
   *
   * @param {LayoutSlotName} name The slot name.
   * @returns {DomSlot} The slot.
   */
  getSlot(name: LayoutSlotName): DomSlot {
    const slot = this.#slots.get(name);

    if (!slot) {
      throwWithCause(`Unknown layout slot "${name}".`);
    }

    return slot as DomSlot;
  }

  /**
   * Registers an element into a slot, owning both its DOM placement and its ordering. The element
   * is appended to the slot container in resolved order, so a contributor does not place it in the
   * DOM itself. Re-registering under the same key replaces the previous element.
   *
   * Each contributor owns its weight (lower comes first); pick weights with gaps (multiples of 100)
   * to leave room between contributors.
   *
   * @param {string} key The registration key (also used to remove and to order via the `layout` setting).
   * @param {HTMLElement} element The element to place.
   * @param {LayoutRegisterOptions} options The target slot and ordering weight.
   * @returns {void}
   */
  register(key: string, element: HTMLElement, { side, weight = 0 }: LayoutRegisterOptions): void {
    this.getSlot(side).add(key, element, weight);
  }

  /**
   * Unregisters a key from a slot and detaches its element from the DOM.
   *
   * @param {string} key The registration key.
   * @param {LayoutSide} side The slot the key was registered into.
   * @returns {void}
   */
  unregister(key: string, side: LayoutSide): void {
    this.getSlot(side).remove(key);
  }

  /**
   * Applies the per-slot key order from a layout configuration.
   *
   * @param {LayoutConfig} [config={}] The layout configuration.
   * @returns {void}
   */
  applyConfig(config: LayoutConfig = {}): void {
    Object.values(LAYOUT_SLOTS).forEach(side => this.getSlot(side).setOrder(config[side] ?? []));
  }

  /**
   * Clears all slot contents. The slot map is kept so late `getSlot` calls during teardown
   * (for example a plugin's `disablePlugin` running after the manager is destroyed) stay safe.
   *
   * @returns {void}
   */
  destroy(): void {
    this.#slots.forEach(slot => slot.clear());
  }
}

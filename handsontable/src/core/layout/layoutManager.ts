import { throwWithCause } from '../../helpers/errors';
import { DomSlot } from './domSlot';
import { LAYOUT_SLOTS, SLOT_ITEM_CLASS, type LayoutSlotName } from './constants';

/**
 * User-facing layout configuration: an ordered list of element keys per user-orderable slot.
 *
 * The `overlays` slot is intentionally absent: its ordering (e.g. the dialog layer) is owned by the
 * plugins that register into it, not user-reshuffled at runtime.
 */
export interface LayoutConfig {
  beforeGrid?: string[];
  afterGrid?: string[];
}

/**
 * The user-orderable edge slot a contributor registers into. A shorthand for the slot names, mapped
 * to {@link LAYOUT_SLOTS} by {@link LayoutManager#register}. The `overlays` slot is not included: it
 * is an internal layer reached through {@link LayoutManager#getSlot}, not part of `register`.
 */
export type LayoutSide = 'before' | 'after';

/**
 * Options accepted by {@link LayoutManager#register}.
 */
export interface LayoutRegisterOptions {
  side: LayoutSide;
  weight?: number;
}

const SIDE_TO_SLOT: Record<LayoutSide, LayoutSlotName> = {
  before: LAYOUT_SLOTS.BEFORE_GRID,
  after: LAYOUT_SLOTS.AFTER_GRID,
};

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
   * @param {object} elements The slot container elements.
   * @param {HTMLElement} elements.beforeGrid The before-grid slot element.
   * @param {HTMLElement} elements.afterGrid The after-grid slot element.
   * @param {HTMLElement} elements.overlays The overlays slot element.
   */
  constructor(elements: { beforeGrid: HTMLElement, afterGrid: HTMLElement, overlays: HTMLElement }) {
    this.#slots = new Map([
      [LAYOUT_SLOTS.BEFORE_GRID, new DomSlot(elements.beforeGrid, { itemClass: SLOT_ITEM_CLASS })],
      [LAYOUT_SLOTS.AFTER_GRID, new DomSlot(elements.afterGrid, { itemClass: SLOT_ITEM_CLASS })],
      [LAYOUT_SLOTS.OVERLAYS, new DomSlot(elements.overlays)],
    ]);
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
    this.getSlot(SIDE_TO_SLOT[side]).add(key, element, weight);
  }

  /**
   * Unregisters a key from a slot and detaches its element from the DOM.
   *
   * @param {string} key The registration key.
   * @param {LayoutSide} side The slot the key was registered into.
   * @returns {void}
   */
  unregister(key: string, side: LayoutSide): void {
    this.getSlot(SIDE_TO_SLOT[side]).remove(key);
  }

  /**
   * Applies the per-slot key order from a layout configuration.
   *
   * @param {LayoutConfig} [config={}] The layout configuration.
   * @returns {void}
   */
  applyConfig(config: LayoutConfig = {}): void {
    this.getSlot(LAYOUT_SLOTS.BEFORE_GRID).setOrder(config.beforeGrid ?? []);
    this.getSlot(LAYOUT_SLOTS.AFTER_GRID).setOrder(config.afterGrid ?? []);
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

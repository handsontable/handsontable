import { throwWithCause } from '../../helpers/errors';
import { DomSlot } from './domSlot';
import { LAYOUT_SLOTS, SLOT_ITEM_CLASS, type LayoutSlotName } from './constants';

/**
 * User-facing layout configuration: an ordered list of element keys per orderable slot.
 */
export interface LayoutConfig {
  beforeGrid?: string[];
  afterGrid?: string[];
  overlays?: string[];
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
   * Applies the per-slot key order from a layout configuration.
   *
   * @param {LayoutConfig} [config={}] The layout configuration.
   * @returns {void}
   */
  applyConfig(config: LayoutConfig = {}): void {
    this.getSlot(LAYOUT_SLOTS.BEFORE_GRID).setOrder(config.beforeGrid ?? []);
    this.getSlot(LAYOUT_SLOTS.AFTER_GRID).setOrder(config.afterGrid ?? []);
    this.getSlot(LAYOUT_SLOTS.OVERLAYS).setOrder(config.overlays ?? []);
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

interface SlotEntry {
  element: HTMLElement;
  weight: number;
  seq: number;
}

/**
 * Manages ordered insertion of registered child elements within a single layout slot element.
 *
 * Each child is registered under a string key with a numeric weight. The resolved DOM order is:
 * configured keys first (in the order passed to `setOrder`), then the remaining keys by ascending
 * weight, ties broken by registration order.
 */
export class DomSlot {
  /**
   * The slot container element that registered children are appended to.
   *
   * @type {HTMLElement}
   */
  readonly #parent: HTMLElement;
  /**
   * The registered children keyed by their identifier.
   *
   * @type {Map<string, SlotEntry>}
   */
  #entries = new Map<string, SlotEntry>();
  /**
   * Monotonic counter used as a stable tie-breaker for equal weights.
   *
   * @type {number}
   */
  #seq = 0;
  /**
   * The user-configured key order applied before weight ordering.
   *
   * @type {string[]}
   */
  #order: string[] = [];
  /**
   * Optional class added to every registered element (used to mark slot items for styling).
   *
   * @type {string}
   */
  readonly #itemClass: string;

  /**
   * @param {HTMLElement} parent The slot container element.
   * @param {object} [options] Slot options.
   * @param {string} [options.itemClass=''] Class added to every registered element.
   */
  constructor(parent: HTMLElement, { itemClass = '' }: { itemClass?: string } = {}) {
    this.#parent = parent;
    this.#itemClass = itemClass;
  }

  /**
   * Returns the slot container element.
   *
   * @returns {HTMLElement} The container element.
   */
  getElement(): HTMLElement {
    return this.#parent;
  }

  /**
   * Checks whether a key is registered.
   *
   * @param {string} key The registration key.
   * @returns {boolean} `true` when the key is registered.
   */
  has(key: string): boolean {
    return this.#entries.has(key);
  }

  /**
   * Registers (or replaces) an element under a key and re-applies the slot order.
   *
   * @param {string} key The registration key.
   * @param {HTMLElement} element The element to insert.
   * @param {number} [weight=0] The ordering weight (lower comes first).
   * @returns {void}
   */
  add(key: string, element: HTMLElement, weight = 0): void {
    const existing = this.#entries.get(key);
    const seq = existing ? existing.seq : this.#seq;

    if (existing) {
      existing.element.remove();
    }

    if (this.#itemClass) {
      element.classList.add(this.#itemClass);
    }

    this.#entries.set(key, { element, weight, seq });

    if (!existing) {
      this.#seq += 1;
    }

    this.#reorder();
  }

  /**
   * Unregisters a key and detaches its element from the DOM.
   *
   * @param {string} key The registration key.
   * @returns {void}
   */
  remove(key: string): void {
    const entry = this.#entries.get(key);

    if (!entry) {
      return;
    }

    if (this.#itemClass) {
      entry.element.classList.remove(this.#itemClass);
    }

    entry.element.remove();
    this.#entries.delete(key);
  }

  /**
   * Sets the user-configured key order and re-applies it.
   *
   * @param {string[]} order The ordered list of keys.
   * @returns {void}
   */
  setOrder(order: string[]): void {
    // The `layout` setting is user-provided JS, so tolerate a malformed (non-array) value.
    this.#order = Array.isArray(order) ? order.slice() : [];
    this.#reorder();
  }

  /**
   * Returns the current resolved key order.
   *
   * @returns {string[]} The ordered keys.
   */
  getOrder(): string[] {
    return this.#sortedKeys();
  }

  /**
   * Removes all registered elements and clears the registry.
   *
   * @returns {void}
   */
  clear(): void {
    this.#entries.forEach(entry => entry.element.remove());
    this.#entries.clear();
  }

  /**
   * Returns the registered keys sorted by configured order, then weight, then registration order.
   *
   * @returns {string[]} The sorted keys.
   */
  #sortedKeys(): string[] {
    const order = this.#order;

    return Array.from(this.#entries.keys()).sort((a, b) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);

      if (ai !== -1 || bi !== -1) {
        return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
      }

      const ea = this.#entries.get(a)!;
      const eb = this.#entries.get(b)!;

      return ea.weight !== eb.weight ? ea.weight - eb.weight : ea.seq - eb.seq;
    });
  }

  /**
   * Re-appends registered elements into the container in resolved order.
   *
   * @returns {void}
   */
  #reorder(): void {
    this.#sortedKeys().forEach((key) => {
      this.#parent.appendChild(this.#entries.get(key)!.element);
    });
  }
}

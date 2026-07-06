/**
 * Construction-time DOM scaffolding for `Table` and every subclass.
 *
 * These methods build the wrapper DOM the engine renders into — the `wtSpreader` / `wtHider` /
 * `wtHolder` wrapper chain around the `<table>`, and the `thead`/`tbody`/`colgroup` sections. They run
 * once from the `Table` constructor. They are universal (every table type needs them), so the mixin is
 * applied once to the base `Table` (`mixin(Table, domScaffold)` in `table.ts`) and inherited by all
 * subclasses.
 *
 * Extracted from `table.ts` to keep the class file focused (S19). Behavior is unchanged: the methods
 * run on the `Table` instance (`this`), assigning the same public fields (`TABLE`/`THEAD`/`TBODY`/
 * `COLGROUP`) and reading the same settings. The only change from the in-class version is `this.#deps`
 * → `this.deps` (the read-only getter), since a mixin cannot see the class's private field.
 */
import { isHTMLElement, hasClass, setAttribute } from '../../../../helpers/dom/element';
import { A11Y_PRESENTATION, A11Y_TABINDEX } from '../../../../helpers/a11y';
import { defineGetter } from '../../../../helpers/object';
import type { default as Table } from './baseTable';

/**
 * Construction-time DOM scaffolding, mixed into every `Table` type.
 */
export interface DomScaffold {
  fixTableDomTree(): void;
  createSpreader(table: HTMLTableElement): HTMLElement | undefined;
  createHider(spreader: HTMLElement): HTMLElement | undefined;
  createHolder(hider: HTMLElement): HTMLElement | undefined;
}

const domScaffold = {
  /**
   * Ensures the table has `tbody`, `thead`, and `colgroup` sections, creating any that are missing.
   *
   * @this Table
   */
  fixTableDomTree(this: Table): void {
    const rootDocument = this.deps.rootDocument;

    this.TBODY = this.TABLE.querySelector('tbody');

    if (!this.TBODY) {
      this.TBODY = rootDocument.createElement('tbody');
      this.TABLE.appendChild(this.TBODY);
    }
    this.THEAD = this.TABLE.querySelector('thead');

    if (!this.THEAD) {
      this.THEAD = rootDocument.createElement('thead');
      this.TABLE.insertBefore(this.THEAD, this.TBODY);
    }
    this.COLGROUP = this.TABLE.querySelector('colgroup');

    if (!this.COLGROUP) {
      this.COLGROUP = rootDocument.createElement('colgroup');
      this.TABLE.insertBefore(this.COLGROUP, this.THEAD);
    }
  },

  /**
   * @param {HTMLTableElement} table An element to process.
   * @returns {HTMLElement}
   * @this Table
   */
  createSpreader(this: Table, table: HTMLTableElement): HTMLElement | undefined {
    const parent = table.parentNode;
    let spreader: HTMLDivElement | undefined;

    if (!parent || parent.nodeType !== Node.ELEMENT_NODE ||
        !isHTMLElement(parent) || !hasClass(parent, 'wtHolder')) {
      spreader = this.deps.rootDocument.createElement('div');
      spreader.className = 'wtSpreader';

      if (parent) {
        // if TABLE is detached (e.g. in Jasmine test), it has no parentNode so we cannot attach holder to it
        table.before(spreader);
      }
      spreader.appendChild(table);
    }

    if (spreader) {
      spreader.style.position = 'relative';

      if (this.wtSettings.getSetting('ariaTags')) {
        setAttribute(spreader, [
          A11Y_PRESENTATION()
        ]);
      }
    }

    return spreader;
  },

  /**
   * @param {HTMLElement} spreader An element to the hider element is injected.
   * @returns {HTMLElement}
   * @this Table
   */
  createHider(this: Table, spreader: HTMLElement): HTMLElement | undefined {
    const parent = spreader.parentNode;
    let hider: HTMLDivElement | undefined;

    if (!parent || parent.nodeType !== Node.ELEMENT_NODE ||
        !isHTMLElement(parent) || !hasClass(parent, 'wtHolder')) {
      hider = this.deps.rootDocument.createElement('div');
      hider.className = 'wtHider';

      if (parent) {
        // if TABLE is detached (e.g. in Jasmine test), it has no parentNode so we cannot attach holder to it
        spreader.before(hider);
      }
      hider.appendChild(spreader);
    }

    if (hider && this.wtSettings.getSetting('ariaTags')) {
      setAttribute(hider, [
        A11Y_PRESENTATION()
      ]);
    }

    return hider;
  },

  /**
   * @param {HTMLElement} hider An element to the holder element is injected.
   * @returns {HTMLElement}
   * @this Table
   */
  createHolder(this: Table, hider: HTMLElement): HTMLElement | undefined {
    const parent = hider.parentNode;
    let holder;

    if (!parent || parent.nodeType !== Node.ELEMENT_NODE ||
        !isHTMLElement(parent) || !hasClass(parent, 'wtHolder')) {
      holder = this.deps.rootDocument.createElement('div');
      holder.style.position = 'relative';
      holder.className = 'wtHolder';

      if (this.isMaster) {
        setAttribute(holder, [
          A11Y_TABINDEX(-1),
        ]);
      }

      if (parent) {
        // if TABLE is detached (e.g. in Jasmine test), it has no parentNode so we cannot attach holder to it
        hider.before(holder);
      }
      if (this.isMaster) {
        const holderParent = holder.parentNode;

        // holderParent is null when TABLE is detached (e.g. in Jasmine tests); skip class assignment in that case.
        // isHTMLElement() is used instead of `instanceof HTMLElement` because the latter fails in
        // cross-frame contexts (e.g. when HoT is mounted inside an <iframe> via React portals):
        // the iframe's HTMLElement constructor !== the parent frame's HTMLElement.
        if (isHTMLElement(holderParent)) {
          holderParent.className += 'ht_master handsontable';
          holderParent.setAttribute('dir', this.wtSettings.getSettingPure('rtlMode') ? 'rtl' : 'ltr');

          if (this.wtSettings.getSetting('ariaTags')) {
            setAttribute(holderParent, [
              A11Y_PRESENTATION()
            ]);
          }
        }
      }
      holder.appendChild(hider);
    }

    if (holder && this.wtSettings.getSetting('ariaTags')) {
      setAttribute(holder, [
        A11Y_PRESENTATION()
      ]);
    }

    return holder;
  },
};

defineGetter(domScaffold, 'MIXIN_NAME', 'domScaffold', {
  writable: false,
  enumerable: false,
});

export { domScaffold };

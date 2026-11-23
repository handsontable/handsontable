import type { HotInstance } from '../../core/types';
import {
  hideOwnSelectionBorders,
  markOwnTablesAsPresentational,
  markOwnWrappersAsPresentational,
  markRowAsPresentational,
  removeOwnCellsTabIndex,
  removeOwnHoldersTabIndex,
} from '../a11yNestedGrid';

/**
 * Builds a table with a `thead`, a `tbody`, and an optional nested table inside the first body cell.
 *
 * @param {boolean} withNested Whether the first body cell holds a table with its own sections.
 * @returns {HTMLTableElement}
 */
function createTable(withNested = false): HTMLTableElement {
  const table = document.createElement('table');

  table.appendChild(document.createElement('colgroup'));

  const thead = table.createTHead();
  const tbody = table.createTBody();

  thead.insertRow().insertCell();

  const cell = tbody.insertRow().insertCell();

  if (withNested) {
    const nested = document.createElement('table');

    nested.createTHead();
    nested.createTBody().insertRow().insertCell();
    cell.appendChild(nested);
  }

  return table;
}

/**
 * Builds the slice of a Walkontable table the helper reads: the table, its body, and a scroll holder around
 * it that carries the `tabindex` the engine writes.
 *
 * @param {HTMLTableElement} TABLE The table.
 * @returns {object}
 */
function createWtTable(TABLE: HTMLTableElement) {
  const holder = document.createElement('div');

  holder.setAttribute('tabindex', '-1');
  holder.appendChild(TABLE);

  return { TABLE, TBODY: TABLE.tBodies[0], holder };
}

/**
 * Builds the slice of a grid the helper reads: a master table and the clones of a `fixedRowsTop: 1`
 * grid (a real instance cannot be drawn under jsdom, so the overlays are stubbed by hand).
 *
 * @param {HTMLTableElement} master The master table.
 * @param {HTMLTableElement[]} clones The overlay clone tables.
 * @returns {object}
 */
function createHot(master: HTMLTableElement, clones: HTMLTableElement[]): HotInstance {
  return {
    view: {
      _wt: {
        wtTable: createWtTable(master),
        wtOverlays: {
          getOverlays: () => [
            ...clones.map(TABLE => ({ clone: { wtTable: createWtTable(TABLE) } })),
            { clone: undefined },
          ],
        },
      },
    },
  } as unknown as HotInstance;
}

describe('a11yNestedGrid', () => {
  describe('markOwnTablesAsPresentational()', () => {
    it('should mark table, thead and tbody of the master table and every overlay clone', () => {
      const master = createTable();
      const top = createTable();

      markOwnTablesAsPresentational(createHot(master, [top]));

      [master, top].forEach((table) => {
        expect(table.getAttribute('role')).toBe('presentation');
        expect(table.tHead?.getAttribute('role')).toBe('presentation');
        expect(table.tBodies[0].getAttribute('role')).toBe('presentation');
      });
    });

    it('should mark only the thead and tbody sections of a table', () => {
      const master = createTable();

      markOwnTablesAsPresentational(createHot(master, []));

      expect(master.querySelector('colgroup')?.hasAttribute('role')).toBe(false);
    });

    it('should not touch a table rendered inside a cell', () => {
      const master = createTable(true);
      const nested = master.querySelector('tbody table') as HTMLTableElement;

      markOwnTablesAsPresentational(createHot(master, []));

      expect(master.getAttribute('role')).toBe('presentation');
      expect(nested.hasAttribute('role')).toBe(false);
      expect(nested.tHead?.hasAttribute('role')).toBe(false);
      expect(nested.tBodies[0].hasAttribute('role')).toBe(false);
      expect(nested.querySelector('tr')?.hasAttribute('role')).toBe(false);
    });
  });

  describe('markOwnWrappersAsPresentational()', () => {
    /**
     * Wraps a table in the chain of elements the rendering engine builds around it (overlay, holder, hider,
     * spreader) and appends the chain to the root.
     *
     * @param {HTMLElement} root The grid's root element.
     * @param {HTMLTableElement} TABLE The table.
     * @returns {HTMLElement[]} The wrappers, outermost first.
     */
    function wrapTable(root: HTMLElement, TABLE: HTMLTableElement): HTMLElement[] {
      const wrappers = ['ht_master', 'wtHolder', 'wtHider', 'wtSpreader'].map((className) => {
        const div = document.createElement('div');

        div.className = className;

        return div;
      });

      wrappers.reduce((parent, child) => parent.appendChild(child), root);
      wrappers[wrappers.length - 1].appendChild(TABLE);

      return wrappers;
    }

    /**
     * Builds a grid whose master table and one overlay clone sit in the engine's wrapper chain.
     *
     * @param {HTMLTableElement} master The master table.
     * @param {HTMLTableElement} clone The overlay clone table.
     * @returns {object}
     */
    function createWrappedHot(master: HTMLTableElement, clone: HTMLTableElement) {
      const rootElement = document.createElement('div');
      const masterWrappers = wrapTable(rootElement, master);
      const cloneWrappers = wrapTable(rootElement, clone);
      const hot = {
        rootElement,
        view: {
          _wt: {
            wtTable: { TABLE: master },
            wtOverlays: {
              getOverlays: () => [{ clone: { wtTable: { TABLE: clone } } }, { clone: undefined }],
            },
          },
        },
      } as unknown as HotInstance;

      return { hot, rootElement, masterWrappers, cloneWrappers };
    }

    it('should mark every element between the root and the master table and every overlay clone table', () => {
      const { hot, rootElement, masterWrappers, cloneWrappers } = createWrappedHot(createTable(), createTable());

      markOwnWrappersAsPresentational(hot);

      [...masterWrappers, ...cloneWrappers].forEach((wrapper) => {
        expect(wrapper.getAttribute('role')).toBe('presentation');
      });
      expect(rootElement.hasAttribute('role')).toBe(false);
    });

    it('should keep the role of the root element', () => {
      const { hot, rootElement } = createWrappedHot(createTable(), createTable());

      rootElement.setAttribute('role', 'listbox');
      markOwnWrappersAsPresentational(hot);

      expect(rootElement.getAttribute('role')).toBe('listbox');
    });

    it('should not touch the wrappers of a table rendered inside a cell', () => {
      const master = createTable();
      const { hot } = createWrappedHot(master, createTable());
      const cellWrapper = document.createElement('div');

      cellWrapper.appendChild(createTable());
      master.tBodies[0].rows[0].cells[0].appendChild(cellWrapper);

      markOwnWrappersAsPresentational(hot);

      expect(cellWrapper.hasAttribute('role')).toBe(false);
    });

    it('should stop at the document when a table is not inside the root element', () => {
      const hot = {
        rootElement: document.createElement('div'),
        view: {
          _wt: {
            wtTable: { TABLE: createTable() },
            wtOverlays: { getOverlays: () => [] },
          },
        },
      } as unknown as HotInstance;
      const detached = document.createElement('div');

      detached.appendChild(hot.view._wt.wtTable.TABLE);

      markOwnWrappersAsPresentational(hot);

      expect(detached.hasAttribute('role')).toBe(false);
    });
  });

  describe('hideOwnSelectionBorders()', () => {
    it('should hide the selection border holder of the master table and every overlay clone', () => {
      const masterBorders = document.createElement('div');
      const cloneBorders = document.createElement('div');
      const hot = {
        view: {
          _wt: {
            wtTable: { bordersHolder: masterBorders },
            wtOverlays: {
              getOverlays: () => [
                { clone: { wtTable: { bordersHolder: cloneBorders } } },
                { clone: { wtTable: {} } },
                { clone: undefined },
              ],
            },
          },
        },
      } as unknown as HotInstance;

      hideOwnSelectionBorders(hot);

      expect(masterBorders.getAttribute('aria-hidden')).toBe('true');
      expect(cloneBorders.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('removeOwnHoldersTabIndex()', () => {
    it('should remove the tabindex of the holders of the master table and every overlay clone', () => {
      const master = createTable();
      const top = createTable();

      removeOwnHoldersTabIndex(createHot(master, [top]));

      [master, top].forEach((table) => {
        expect(table.parentElement?.hasAttribute('tabindex')).toBe(false);
      });
    });

    it('should not touch the holder of a table rendered inside a cell', () => {
      const master = createTable(true);
      const nested = master.querySelector('tbody table') as HTMLTableElement;
      const nestedHolder = createWtTable(nested).holder;

      master.tBodies[0].rows[0].cells[0].appendChild(nestedHolder);
      removeOwnHoldersTabIndex(createHot(master, []));

      expect(nestedHolder.getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('removeOwnCellsTabIndex()', () => {
    it('should remove the tabindex of the body cells of the master table and every overlay clone', () => {
      const master = createTable();
      const top = createTable();
      const cells = [master, top].map(table => table.tBodies[0].rows[0].cells[0]);

      cells.forEach(cell => cell.setAttribute('tabindex', '-1'));
      removeOwnCellsTabIndex(createHot(master, [top]));

      cells.forEach(cell => expect(cell.hasAttribute('tabindex')).toBe(false));
    });

    it('should not touch the cells of a table rendered inside a cell, nor a header cell', () => {
      const master = createTable(true);
      const nestedCell = master.querySelector('tbody table td') as HTMLTableCellElement;
      const headerCell = master.tHead?.rows[0].cells[0] as HTMLTableCellElement;

      nestedCell.setAttribute('tabindex', '-1');
      headerCell.setAttribute('tabindex', '-1');
      removeOwnCellsTabIndex(createHot(master, []));

      expect(nestedCell.getAttribute('tabindex')).toBe('-1');
      expect(headerCell.getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('markRowAsPresentational()', () => {
    it('should mark the row of the cell', () => {
      const table = createTable();
      const TD = table.tBodies[0].rows[0].cells[0];

      markRowAsPresentational(TD);

      expect(table.tBodies[0].rows[0].getAttribute('role')).toBe('presentation');
    });

    it('should do nothing for a cell that is not in a row', () => {
      const TD = document.createElement('td');

      expect(() => markRowAsPresentational(TD)).not.toThrow();
      expect(TD.hasAttribute('role')).toBe(false);
    });
  });
});

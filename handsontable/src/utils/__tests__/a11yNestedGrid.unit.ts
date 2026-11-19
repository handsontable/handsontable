import type { HotInstance } from '../../core/types';
import { markOwnTablesAsPresentational, markRowAsPresentational } from '../a11yNestedGrid';

/**
 * Builds a table with a `thead`, a `tbody`, and an optional nested table inside the first body cell.
 *
 * @param {boolean} withNested Whether the first body cell holds a table with its own sections.
 * @returns {HTMLTableElement}
 */
function createTable(withNested = false): HTMLTableElement {
  const table = document.createElement('table');
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
        wtTable: { TABLE: master },
        wtOverlays: {
          getOverlays: () => [
            ...clones.map(TABLE => ({ clone: { wtTable: { TABLE } } })),
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

  describe('markRowAsPresentational()', () => {
    it('should mark the row of the cell', () => {
      const table = createTable();
      const TD = table.tBodies[0].rows[0].cells[0];

      markRowAsPresentational(TD);

      expect(table.tBodies[0].rows[0].getAttribute('role')).toBe('presentation');
    });
  });
});

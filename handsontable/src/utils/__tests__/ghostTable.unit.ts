import GhostTable from '../ghostTable';
import { baseRenderer } from '../../renderers/baseRenderer';
import { textRenderer } from '../../renderers/textRenderer';

/**
 * A minimal Handsontable stand-in: GhostTable only needs the DOM handles, the cell meta, and the
 * renderer registry. The renderers are the REAL ones — the defect is in which of them GhostTable
 * calls, so stubbing them out would test nothing.
 *
 * @param {object} cellMeta The cell meta every sampled cell resolves to.
 * @returns {object}
 */
function createHotMock(cellMeta: Record<string, unknown>) {
  return {
    rootDocument: document,
    rootElement: document.createElement('div'),
    table: document.createElement('table'),
    hasRowHeaders: () => false,
    getColWidth: () => 50,
    colToProp: (col: number) => col,
    getColHeader: () => null,
    getCellMetaTransient: () => cellMeta,
    getCellRenderer: (meta: { renderer?: unknown }) => (
      meta && meta.renderer === 'base' ? baseRenderer : textRenderer
    ),
    view: { appendRowHeader: () => {}, appendColHeader: () => {} },
  };
}

/**
 * One sampled cell, in the shape SamplesGenerator produces.
 *
 * @returns {Map}
 */
function createSamples() {
  return new Map([[0, { strings: [{ col: 0, row: 0, value: 'A1' }] }]]);
}

describe('GhostTable', () => {
  describe('base renderer parity with TableView', () => {
    it('should apply the cell className to the measured TD when adding a row', () => {
      const ghostTable = new GhostTable(createHotMock({ className: 'my-big-font' }));

      ghostTable.addRow(0, createSamples() as never);

      const td = (ghostTable.rows[0].table as HTMLTableElement).querySelector('td');

      expect(td!.classList.contains('my-big-font')).toBe(true);
    });

    it('should apply the cell className to the measured TD when adding a column', () => {
      const ghostTable = new GhostTable(createHotMock({ className: 'my-big-font' }));

      ghostTable.addColumn(0, createSamples() as never);

      const td = (ghostTable.columns[0].table as HTMLTableElement).querySelector('td');

      expect(td!.classList.contains('my-big-font')).toBe(true);
    });

    it('should reset the base-renderer flag so the next real render still applies the classes', () => {
      // The flag lives on the cell meta object, which for a materialized cell is SHARED with the
      // render path. Leaving it set makes TableView skip the base renderer on the next draw, and
      // the REAL cell silently loses its className.
      const cellMeta: Record<string, unknown> = { className: 'my-big-font' };
      const ghostTable = new GhostTable(createHotMock(cellMeta));

      ghostTable.addRow(0, createSamples() as never);

      expect(cellMeta._isBaseRendererCalled).toBe(false);
    });

    it('should not call the base renderer twice when the cell renderer already chained it', () => {
      const cellMeta: Record<string, unknown> = {
        className: 'my-big-font',
        renderer: (...args: Parameters<typeof baseRenderer>) => baseRenderer(...args),
      };
      const hot = createHotMock(cellMeta);
      let baseCalls = 0;

      hot.getCellRenderer = (meta: { renderer?: unknown }) => {
        if (meta && meta.renderer === 'base') {
          baseCalls += 1;

          return baseRenderer;
        }

        return (meta.renderer ?? textRenderer) as typeof textRenderer;
      };

      new GhostTable(hot).addRow(0, createSamples() as never);

      expect(baseCalls).toBe(0);
    });
  });

  describe('sampled value rendering', () => {
    // The AutoRowSize and AutoColumnSize samplers run `valueFormatter` when building samples, so
    // the values GhostTable receives are ALREADY formatted. Re-formatting here double-formats:
    // a date sample formatted to `1/1/24` fails the ISO-only `parseToLocalDate` on the second
    // pass and renders as `#bad-value#`, inflating the measured column width (DEV-2126 Argos
    // regression on the arabic-rtl visual demo).
    it('should render the sampled value verbatim, without re-applying the cell valueFormatter', () => {
      const ghostTable = new GhostTable(createHotMock({
        valueFormatter: (value: unknown) => `${value} formatted again`,
      }));

      ghostTable.addRow(0, createSamples() as never);

      const td = (ghostTable.rows[0].table as HTMLTableElement).querySelector('td');

      expect(td!.textContent).toBe('A1');
    });

    it('should render the sampled value verbatim, without applying the renderer\'s valueFormatter static', () => {
      const cellRenderer = Object.assign(
        (...args: Parameters<typeof textRenderer>) => textRenderer(...args),
        { valueFormatter: (value: unknown) => `${value} via renderer` }
      );
      const hot = createHotMock({ renderer: cellRenderer });

      hot.getCellRenderer = (meta: { renderer?: unknown }) => (
        meta && meta.renderer === 'base' ? baseRenderer : cellRenderer
      ) as typeof textRenderer;

      const ghostTable = new GhostTable(hot);

      ghostTable.addRow(0, createSamples() as never);

      const td = (ghostTable.rows[0].table as HTMLTableElement).querySelector('td');

      expect(td!.textContent).toBe('A1');
    });
  });
  describe('addRowHeadersColumn', () => {
    /**
     * A Handsontable stand-in that has row headers, labelling each row with the passed strings.
     *
     * @param {string[]} labels The row header label of each row.
     * @returns {object}
     */
    function createRowHeaderHotMock(labels: string[]) {
      const hot = createHotMock({});

      hot.hasRowHeaders = () => true;
      hot.view = {
        appendColHeader: () => {},
        appendRowHeader: (visualRow: number, th: HTMLTableCellElement) => {
          th.textContent = labels[visualRow];
        },
      } as never;

      return hot;
    }

    /**
     * A samples map in the shape SamplesGenerator produces for a column of row headers.
     *
     * @param {number[]} rows Visual row indexes to sample.
     * @returns {Map}
     */
    function rowSamples(rows: number[]) {
      return new Map(rows.map(row => [`${row}`, { strings: [{ row, value: `row ${row}` }] }]));
    }

    it('should build one TH per measured row, each wrapped in its own TR inside the TBODY', () => {
      const ghostTable = new GhostTable(createRowHeaderHotMock(['Alpha', 'Beta', 'Gamma']));

      ghostTable.addRowHeadersColumn(rowSamples([0, 2]) as never);

      const table = ghostTable.columns[0].table as HTMLTableElement;
      const rows = table.querySelectorAll('tbody > tr');

      expect(rows.length).toBe(2);
      // The styling is scoped with child combinators, so a TH appended straight into the section
      // would measure unstyled (#4363).
      expect(rows[0].querySelector('th')!.textContent).toBe('Alpha');
      expect(rows[1].querySelector('th')!.textContent).toBe('Gamma');
    });

    it('should mark the measured headers as ghost-table cells', () => {
      const ghostTable = new GhostTable(createRowHeaderHotMock(['Alpha']));

      ghostTable.addRowHeadersColumn(rowSamples([0]) as never);

      const th = (ghostTable.columns[0].table as HTMLTableElement).querySelector('tbody th');

      expect(th!.getAttribute('ghost-table')).toBe('1');
    });

    it('should let the table size itself to its content, overriding the fixed layout htCore imposes', () => {
      const ghostTable = new GhostTable(createRowHeaderHotMock(['Alpha']));

      ghostTable.addRowHeadersColumn(rowSamples([0]) as never);

      const table = ghostTable.columns[0].table as HTMLTableElement;

      // Without both overrides the measurement reads 0, because `.handsontable .htCore` declares
      // `width: 0` and `table-layout: fixed`.
      expect(table.style.tableLayout).toBe('auto');
      expect(table.style.width).toBe('auto');
    });

    it('should register the column under the row header index, so getWidths reports it as column -1', () => {
      const ghostTable = new GhostTable(createRowHeaderHotMock(['Alpha']));

      ghostTable.addRowHeadersColumn(rowSamples([0]) as never);

      expect(ghostTable.columns[0].col).toBe(-1);
    });

    it('should measure a second header level as column -2', () => {
      const ghostTable = new GhostTable(createRowHeaderHotMock(['Alpha']));

      ghostTable.addRowHeadersColumn(rowSamples([0]) as never, 1);

      expect(ghostTable.columns[0].col).toBe(-2);
    });

    it('should add nothing when the grid has no row headers', () => {
      const hot = createRowHeaderHotMock(['Alpha']);

      hot.hasRowHeaders = () => false;

      const ghostTable = new GhostTable(hot);

      ghostTable.addRowHeadersColumn(rowSamples([0]) as never);

      expect(ghostTable.columns.length).toBe(0);
    });

    it('should add nothing when there are no rows to measure', () => {
      const ghostTable = new GhostTable(createRowHeaderHotMock([]));

      ghostTable.addRowHeadersColumn(rowSamples([]) as never);

      expect(ghostTable.columns.length).toBe(0);
    });

    it('should refuse to mix a row headers column into a table already raised vertically', () => {
      const ghostTable = new GhostTable(createRowHeaderHotMock(['Alpha']));

      ghostTable.addRow(0, createSamples() as never);

      expect(() => ghostTable.addRowHeadersColumn(rowSamples([0]) as never)).toThrow();
    });
  });
});

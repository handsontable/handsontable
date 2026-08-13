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

  describe('valueFormatter parity with TableView', () => {
    it('should measure the formatted value, not the raw one', () => {
      const ghostTable = new GhostTable(createHotMock({
        valueFormatter: (value: unknown) => `${value} formatted much longer`,
      }));

      ghostTable.addRow(0, createSamples() as never);

      const td = (ghostTable.rows[0].table as HTMLTableElement).querySelector('td');

      expect(td!.textContent).toBe('A1 formatted much longer');
    });

    it('should apply the renderer\'s own valueFormatter static when the cell has none', () => {
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

      expect(td!.textContent).toBe('A1 via renderer');
    });
  });
});

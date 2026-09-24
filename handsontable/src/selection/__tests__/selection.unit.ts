import Selection from '../selection';
import { IndexMapper } from '../../translations';
import CellCoords from '../../3rdparty/walkontable/src/cell/coords';
import CellRange from '../../3rdparty/walkontable/src/cell/range';
import type { SelectionSettings, SelectionTableProps } from '../types';

/**
 * Builds a `SelectionTableProps` mock wired for a flat, non-hidden 10x10 grid. `countRowHeaders`/
 * `countColHeaders` are the only levers the tests below vary - everything else is identity/no-op so
 * the header-extent math under test is the only thing that can move the result.
 */
function createTableProps(overrides: Partial<SelectionTableProps> = {}): SelectionTableProps {
  const rowIndexMapper = new IndexMapper();
  const columnIndexMapper = new IndexMapper();

  rowIndexMapper.initToLength(10);
  columnIndexMapper.initToLength(10);

  return {
    createCellCoords: (row: number, column: number) => new CellCoords(row, column),
    createCellRange: (highlight: CellCoords, from: CellCoords, to: CellCoords) =>
      new CellRange(highlight, from, to),
    countRows: () => 10,
    countCols: () => 10,
    countRowHeaders: () => 1,
    countColHeaders: () => 1,
    countRenderableRows: () => 10,
    countRenderableColumns: () => 10,
    countRenderableRowsInRange: (startRow: number, endRow: number) => endRow - startRow + 1,
    countRenderableColumnsInRange: (startColumn: number, endColumn: number) => endColumn - startColumn + 1,
    rowIndexMapper,
    columnIndexMapper,
    propToCol: (prop: string | number) => Number(prop),
    isEditorOpened: () => false,
    isPluginEnabled: () => false,
    isDisabledCellSelection: () => false,
    visualToRenderableCoords: (coords: CellCoords) => new CellCoords(coords.row ?? 0, coords.col ?? 0),
    renderableToVisualCoords: (coords: CellCoords) => new CellCoords(coords.row ?? 0, coords.col ?? 0),
    getShortcutManager: () =>
      ({ isCtrlPressed: () => false }) as unknown as ReturnType<SelectionTableProps['getShortcutManager']>,
    findFirstNonHiddenRenderableRow: (from: number) => from,
    findFirstNonHiddenRenderableColumn: (from: number) => from,
    navigableHeaders: () => false,
    fixedRowsBottom: () => 0,
    minSpareRows: () => 0,
    minSpareCols: () => 0,
    autoWrapRow: () => false,
    autoWrapCol: () => false,
    ...overrides,
  };
}

function createSettings(overrides: Partial<SelectionSettings> = {}): SelectionSettings {
  return {
    currentRowClassName: 'currentRow',
    currentColClassName: 'currentCol',
    currentHeaderClassName: 'currentHeader',
    selectionMode: 'range',
    ...overrides,
  };
}

describe('Selection', () => {
  describe('#createHeaderExtentCoords (via applyAndCommit)', () => {
    it('pins the row/column highlight to the leaf header level when the grid has a single header level', () => {
      const tableProps = createTableProps({ countRowHeaders: () => 1, countColHeaders: () => 1 });
      const selection = new Selection(createSettings(), tableProps);
      const coords = tableProps.createCellCoords(1, 1);
      const cellRange = tableProps.createCellRange(coords, coords, coords);

      selection.applyAndCommit(cellRange, 0);

      const [rowHighlight] = selection.highlight.getRowHighlights();
      const [columnHighlight] = selection.highlight.getColumnHighlights();

      expect(rowHighlight!.getCorners()).toEqual([1, -1, 1, -1]);
      expect(columnHighlight!.getCorners()).toEqual([-1, 1, -1, 1]);
    });

    it('spans every header level for the row/column highlight when the grid renders more than one', () => {
      const tableProps = createTableProps({ countRowHeaders: () => 2, countColHeaders: () => 3 });
      const selection = new Selection(createSettings(), tableProps);
      const coords = tableProps.createCellCoords(1, 1);
      const cellRange = tableProps.createCellRange(coords, coords, coords);

      selection.applyAndCommit(cellRange, 0);

      const [rowHighlight] = selection.highlight.getRowHighlights();
      const [columnHighlight] = selection.highlight.getColumnHighlights();

      // Row highlight: header axis (col) spans -countRowHeaders()..-1; row axis is the selected row.
      expect(rowHighlight!.getCorners()).toEqual([1, -2, 1, -1]);
      // Column highlight: header axis (row) spans -countColHeaders()..-1; col axis is the selected column.
      expect(columnHighlight!.getCorners()).toEqual([-3, 1, -1, 1]);
    });

    it('still spans every header level under selectionMode: "single"', () => {
      const tableProps = createTableProps({ countRowHeaders: () => 2, countColHeaders: () => 2 });
      const selection = new Selection(createSettings({ selectionMode: 'single' }), tableProps);
      const coords = tableProps.createCellCoords(1, 1);
      const cellRange = tableProps.createCellRange(coords, coords, coords);

      selection.applyAndCommit(cellRange, 0);

      const [rowHighlight] = selection.highlight.getRowHighlights();
      const [columnHighlight] = selection.highlight.getColumnHighlights();

      expect(rowHighlight!.getCorners()).toEqual([1, -2, 1, -1]);
      expect(columnHighlight!.getCorners()).toEqual([-2, 1, -1, 1]);
    });

    it('does not widen the plain header-selection highlight (currentHeaderClassName) beyond the leaf level', () => {
      const tableProps = createTableProps({ countRowHeaders: () => 3, countColHeaders: () => 3 });
      const selection = new Selection(createSettings(), tableProps);
      // A full-column selection so `#applyHeaderHighlights` commits `rowHeaderHighlight`/`columnHeaderHighlight`.
      const from = tableProps.createCellCoords(-1, 1);
      const to = tableProps.createCellCoords(9, 1);
      const cellRange = tableProps.createCellRange(from, from, to);

      selection.applyAndCommit(cellRange, 0);

      const [columnHeaderHighlight] = selection.highlight.getColumnHeaders();

      // Deliberately still leaf-only (`-1`), unlike the row/column highlight above - see
      // `handsontable/src/plugins/nestedHeaders/AGENTS.md`, "Header-highlight redirect...".
      expect(columnHeaderHighlight!.getCorners()).toEqual([-1, 1, -1, 1]);
    });
  });

  describe('#setHandlesHoveredLayer', () => {
    /**
     * Records every local hook the listed names fire, in order.
     */
    function recordLocalHooks(selection: Selection, names: string[]) {
      const log: Array<[string, unknown[]]> = [];

      names.forEach((name) => {
        selection.addLocalHook(name, (...args: unknown[]) => log.push([name, args]));
      });

      return log;
    }

    it('asks for a redraw once per change of the hovered layer, without replaying the selection', () => {
      const selection = new Selection(createSettings({ selectionMode: 'multiple' }), createTableProps());

      selection.selectCells([[1, 1, 3, 3]]);

      const log = recordLocalHooks(selection, [
        'afterSetHandlesHoveredLayer',
        'beforeSetRangeEnd',
        'afterSetRangeEnd',
        'afterSelectionFinished',
      ]);

      selection.setHandlesHoveredLayer(0);

      expect(selection.getHandlesHoveredLayer()).toBe(0);
      expect(log).toEqual([['afterSetHandlesHoveredLayer', [0]]]);

      selection.setHandlesHoveredLayer(null);

      expect(selection.getHandlesHoveredLayer()).toBeNull();
      expect(log).toEqual([
        ['afterSetHandlesHoveredLayer', [0]],
        ['afterSetHandlesHoveredLayer', [null]],
      ]);
    });

    it('fires nothing when the hovered layer does not change', () => {
      const selection = new Selection(createSettings({ selectionMode: 'multiple' }), createTableProps());

      selection.selectCells([[1, 1, 3, 3]]);
      selection.setHandlesHoveredLayer(0);

      const log = recordLocalHooks(selection, ['afterSetHandlesHoveredLayer']);

      selection.setHandlesHoveredLayer(0);

      expect(log).toEqual([]);
    });
  });
});

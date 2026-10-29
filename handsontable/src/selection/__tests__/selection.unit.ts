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
    isPluginRegistered: () => false,
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
  describe('fill handle visibility (DEV-775)', () => {
    it('should draw the fill handle when the Autofill plugin is registered and enabled', () => {
      const selection = new Selection(createSettings({ fillHandle: true }), createTableProps({
        isPluginRegistered: name => name === 'autofill',
        isPluginEnabled: name => name === 'autofill',
      }));

      expect(selection.isCellCornerVisible()).toBe(true);
    });

    it('should not draw the fill handle when the Autofill plugin is registered but disabled or destroyed', () => {
      const selection = new Selection(createSettings({ fillHandle: true }), createTableProps({
        isPluginRegistered: name => name === 'autofill',
        isPluginEnabled: () => false,
      }));

      expect(selection.isCellCornerVisible()).toBe(false);
      expect(selection.isAreaCornerVisible(0)).toBe(false);
    });

    // A tree-shaken build that never registered `AutofillPlugin` keeps the handle the setting asks for.
    it('should keep drawing the fill handle from the setting when the Autofill plugin is not registered', () => {
      const selection = new Selection(createSettings({ fillHandle: true }), createTableProps());

      expect(selection.isCellCornerVisible()).toBe(true);
    });

    it('should not draw the fill handle when the `fillHandle` setting is off', () => {
      const selection = new Selection(createSettings({ fillHandle: false }), createTableProps({
        isPluginRegistered: () => true,
        isPluginEnabled: () => true,
      }));

      expect(selection.isCellCornerVisible()).toBe(false);
    });
  });

  describe('fill handle with a non-contiguous selection (DEV-540)', () => {
    // `multiple` is the grid's default selection mode; the shared `createSettings()` uses `range`,
    // which keeps one range only.
    const createFillHandleSelection = () => new Selection(
      createSettings({ fillHandle: true, selectionMode: 'multiple' }),
      createTableProps(),
    );
    const select = (selection: Selection, ranges: number[][]) => {
      selection.selectCells(ranges);
    };

    it('should draw the cell corner for one cell and the area corner for one multi-cell range', () => {
      const selection = createFillHandleSelection();

      select(selection, [[1, 1, 1, 1]]);

      expect(selection.isCellCornerVisible()).toBe(true);

      select(selection, [[1, 1, 2, 2]]);

      expect(selection.isAreaCornerVisible(selection.getLayerLevel())).toBe(true);
    });

    it('should draw neither corner when the selection has more than one range', () => {
      const selection = createFillHandleSelection();

      // The last range is a single cell: the cell corner is the one that used to be drawn.
      select(selection, [[1, 1, 2, 2], [4, 3, 4, 3]]);

      expect(selection.getSelectedRange().size()).toBe(2);
      expect(selection.isCellCornerVisible()).toBe(false);
      expect(selection.isAreaCornerVisible(selection.getLayerLevel())).toBe(false);

      // The last range spans several cells: the area corner is the one that used to be drawn.
      select(selection, [[1, 1, 1, 1], [4, 3, 5, 4]]);

      expect(selection.isCellCornerVisible()).toBe(false);
      expect(selection.isAreaCornerVisible(selection.getLayerLevel())).toBe(false);
    });
  });

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

    // Pins the equality guard, which predates the fix: this passes with `refresh()` restored too.
    // The test above is the one that fails on a selection replay.
    it('fires nothing when the hovered layer does not change', () => {
      const selection = new Selection(createSettings({ selectionMode: 'multiple' }), createTableProps());

      selection.selectCells([[1, 1, 3, 3]]);
      selection.setHandlesHoveredLayer(0);

      const log = recordLocalHooks(selection, ['afterSetHandlesHoveredLayer']);

      selection.setHandlesHoveredLayer(0);

      expect(log).toEqual([]);
    });
  });

  describe('cell block provider (DEV-161)', () => {
    /**
     * Creates a block the way a merged cell describes itself.
     */
    function createBlock(row: number, col: number, rowspan: number, colspan: number) {
      return {
        row,
        col,
        rowspan,
        colspan,
        getRange: () => new CellRange(
          new CellCoords(row, col),
          new CellCoords(row, col),
          new CellCoords(row + rowspan - 1, col + colspan - 1),
        ),
      };
    }

    /**
     * Creates a provider over a fixed list of blocks, keeping their order.
     */
    function createProvider(blocks: ReturnType<typeof createBlock>[]) {
      return {
        getBlocks: () => blocks,
        getBlockAt: (row: number, column: number) => blocks.find(block =>
          row >= block.row && row < block.row + block.rowspan &&
          column >= block.col && column < block.col + block.colspan) ?? null,
      };
    }

    /**
     * Reads every layer as `[fromRow, fromCol, toRow, toCol]`.
     */
    function layers(selection: Selection) {
      return Array.from(selection.selectedRange).map(({ from, to }) => [from.row, from.col, to.row, to.col]);
    }

    // C1:C2, B2:B3, A3:A4. From A4:C4 only A3:A4 is touched at first.
    const staircase = () => [createBlock(0, 2, 2, 1), createBlock(1, 1, 2, 1), createBlock(2, 0, 2, 1)];

    it('should leave a range as it is when no provider is registered', () => {
      const selection = new Selection(createSettings(), createTableProps());

      selection.selectCells([[3, 0, 3, 2]]);

      expect(layers(selection)).toEqual([[3, 0, 3, 2]]);
    });

    it('should grow a range over every block it touches, whatever order the blocks are listed in', () => {
      const topDown = new Selection(createSettings(), createTableProps());
      const bottomUp = new Selection(createSettings(), createTableProps());

      topDown.setCellBlockProvider(createProvider(staircase()));
      bottomUp.setCellBlockProvider(createProvider(staircase().reverse()));
      topDown.selectCells([[3, 0, 3, 2]]);
      bottomUp.selectCells([[3, 0, 3, 2]]);

      expect(layers(topDown)).toEqual([[0, 0, 3, 2]]);
      expect(layers(bottomUp)).toEqual([[0, 0, 3, 2]]);
    });

    it('should stop growing ranges once the provider is unregistered', () => {
      const selection = new Selection(createSettings(), createTableProps());

      selection.setCellBlockProvider(createProvider(staircase()));
      selection.setCellBlockProvider(null);
      selection.selectCells([[3, 0, 3, 2]]);

      expect(layers(selection)).toEqual([[3, 0, 3, 2]]);
    });

    it('should not grow a range made from a column header', () => {
      const selection = new Selection(createSettings(), createTableProps());

      selection.setCellBlockProvider(createProvider([createBlock(0, 1, 2, 2)]));
      selection.selectColumns(1);

      expect(selection.isSelectedByColumnHeader()).toBe(true);
      expect(layers(selection)).toEqual([[-1, 1, 9, 1]]);
    });

    it('should grow the active layer when it is not the last one', () => {
      const selection = new Selection(createSettings({ selectionMode: 'multiple' }), createTableProps());

      selection.setCellBlockProvider(createProvider([createBlock(0, 1, 2, 1)]));
      selection.selectCells([[1, 0, 1, 0], [5, 5, 5, 5]]);
      selection.setRangeFocus(new CellCoords(1, 0), 0);
      selection.transformEnd(0, 1);

      // A2 reaches B2 and grows over the block B1:B2; the last layer is left as it was.
      expect(layers(selection)).toEqual([[0, 0, 1, 1], [5, 5, 5, 5]]);
    });

    /**
     * The highlight of the active layer as `[row, col]`.
     */
    function highlightOf(selection: Selection) {
      const { highlight } = selection.getActiveSelectedRange()!;

      return [highlight.row, highlight.col];
    }

    it('should move the highlight onto the top-left of the block it lands in', () => {
      const selection = new Selection(createSettings(), createTableProps());

      selection.setCellBlockProvider(createProvider([createBlock(1, 1, 2, 2)]));
      selection.selectCells([[2, 2, 2, 2]]);

      expect(layers(selection)).toEqual([[1, 1, 2, 2]]);
      expect(highlightOf(selection)).toEqual([1, 1]);
    });

    it('should step an arrow-key move over the whole block', () => {
      const selection = new Selection(createSettings(), createTableProps());

      selection.setCellBlockProvider(createProvider([createBlock(1, 1, 2, 2)]));
      selection.selectCells([[1, 1, 1, 1]]);
      selection.transformStart(0, 1);

      // D2, past the block B2:C3, not C2 inside it.
      expect(highlightOf(selection)).toEqual([1, 3]);
    });

    it('should leave a block sideways on its top row, however it was entered', () => {
      const selection = new Selection(createSettings(), createTableProps());

      selection.setCellBlockProvider(createProvider([createBlock(1, 1, 2, 2)]));
      selection.selectCells([[3, 1, 3, 1]]);
      selection.transformStart(-1, 0); // into B2:C3 from below, on row 3
      selection.transformStart(0, -1);

      expect(highlightOf(selection)).toEqual([1, 0]);
    });

    it('should leave a block vertically on the column it was entered on', () => {
      const selection = new Selection(createSettings(), createTableProps());

      selection.setCellBlockProvider(createProvider([createBlock(1, 1, 2, 2)]));
      selection.selectCells([[3, 2, 3, 2]]);
      selection.transformStart(-1, 0); // into B2:C3 from below, in column C
      selection.transformStart(-1, 0);

      // C1: the step goes past the block's top and keeps column C, not B, the block's left column.
      expect(highlightOf(selection)).toEqual([0, 2]);
    });

    it('should report a range that is exactly one block as a single cell', () => {
      const selection = new Selection(createSettings(), createTableProps());

      selection.setCellBlockProvider(createProvider([createBlock(1, 1, 2, 3)]));
      selection.selectCells([[1, 1, 2, 3]]);

      expect(selection.isMultiple()).toBe(false);

      selection.selectCells([[1, 1, 3, 3]]);

      expect(selection.isMultiple()).toBe(true);
    });

    /**
     * Presses Enter (or Tab) `count` times and reads the highlight after each press.
     */
    function focusSteps(selection: Selection, rowDelta: number, colDelta: number, count: number) {
      const steps = [];

      for (let i = 0; i < count; i++) {
        selection.transformFocus(rowDelta, colDelta);
        steps.push(highlightOf(selection));
      }

      return steps;
    }

    it('should move the Enter focus inside a range cell by cell when no provider is registered', () => {
      const selection = new Selection(createSettings(), createTableProps());

      selection.selectCells([[0, 0, 2, 2]]);
      selection.setRangeFocus(new CellCoords(2, 0));

      expect(focusSteps(selection, 1, 0, 2)).toEqual([[0, 1], [1, 1]]);
    });

    it('should stop the Enter focus once on a block and skip the cells it covers', () => {
      const selection = new Selection(createSettings(), createTableProps());

      selection.setCellBlockProvider(createProvider([createBlock(0, 1, 2, 1)]));
      selection.selectCells([[0, 0, 2, 2]]); // A1:C3 with the block B1:B2
      selection.setRangeFocus(new CellCoords(2, 0));

      // B1 is the block, then B3: B2 is part of the block, not a stop of its own.
      expect(focusSteps(selection, 1, 0, 3)).toEqual([[0, 1], [2, 1], [0, 2]]);
    });

    it('should wrap the Tab focus to the next layer when the rest of the layer is blocks', () => {
      const selection = new Selection(createSettings({ selectionMode: 'multiple' }), createTableProps());

      selection.setCellBlockProvider(createProvider([createBlock(0, 1, 2, 1)]));
      selection.selectCells([[0, 0, 1, 1], [5, 5, 5, 5]]);
      selection.setRangeFocus(new CellCoords(1, 0), 0);
      selection.transformFocus(0, 1);

      // B2 is covered by the block B1:B2, so the layer has no stop left after A2.
      expect(selection.getActiveSelectionLayerIndex()).toBe(1);
      expect(highlightOf(selection)).toEqual([5, 5]);
      expect(selection.selectedRange.peekByIndex(0)!.highlight.col).toBe(0);
    });

    it('should move the focus in the direction a modifyTransformFocus listener leaves', () => {
      const selection = new Selection(createSettings(), createTableProps());

      selection.addLocalHook('beforeModifyTransformFocus', (delta: CellCoords) => {
        delta.row = 0;
        delta.col = 1;
      });
      selection.setCellBlockProvider(createProvider([createBlock(0, 1, 2, 1)]));
      selection.selectCells([[0, 0, 2, 2]]);
      selection.setRangeFocus(new CellCoords(1, 0));
      selection.transformFocus(1, 0); // Enter, turned into Tab by the listener

      // C2: a horizontal step past the block B1:B2, not A3 below and not B2 inside the block.
      expect(highlightOf(selection)).toEqual([1, 2]);
    });

    it('should start an arrow-key move from the focus after Tab skipped a block', () => {
      const selection = new Selection(createSettings(), createTableProps());

      selection.setCellBlockProvider(createProvider([createBlock(0, 1, 2, 1)]));
      selection.selectCells([[0, 0, 2, 2]]);
      selection.setRangeFocus(new CellCoords(1, 0));
      selection.transformFocus(0, 1); // Tab from A2 to C2, past B2, which the block B1:B2 covers
      selection.transformStart(1, 0); // ArrowDown

      // C3, below the focus, not B3 below the block cell Tab skipped.
      expect(layers(selection)).toEqual([[2, 2, 2, 2]]);
    });

    it('should leave a block Shift+Tab moved onto from the column the focus came in on', () => {
      const selection = new Selection(createSettings(), createTableProps());

      selection.setCellBlockProvider(createProvider([createBlock(1, 1, 1, 2)]));
      selection.selectCells([[0, 0, 2, 3]]); // A1:D3 with the block B2:C2
      selection.setRangeFocus(new CellCoords(1, 3));
      selection.transformFocus(0, -1); // Shift+Tab from D2 onto the block, entered at C2

      expect(highlightOf(selection)).toEqual([1, 1]);

      selection.transformStart(-1, 0); // ArrowUp

      // C1, above the cell the focus came in on, not B1 above the block's corner.
      expect(layers(selection)).toEqual([[0, 2, 0, 2]]);
    });

    it('should put the focus on the first visible cell of a block whose corner is hidden', () => {
      const tableProps = createTableProps();

      tableProps.columnIndexMapper.createAndRegisterIndexMap('hidden', 'hiding').setValueAtIndex(1, true);

      const selection = new Selection(createSettings(), tableProps);

      selection.setCellBlockProvider(createProvider([createBlock(0, 1, 2, 2)]));
      selection.selectCells([[0, 0, 2, 2]]); // A1:C3 with the block B1:C2, column B hidden
      selection.setRangeFocus(new CellCoords(0, 0));
      selection.transformFocus(0, 1); // Tab

      // C1, the block's first visible cell, not its hidden corner B1.
      expect(highlightOf(selection)).toEqual([0, 2]);
    });
  });
});

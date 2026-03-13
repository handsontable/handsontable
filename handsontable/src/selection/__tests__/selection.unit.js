import Selection from '../selection';

function createSettings() {
  return {
    currentHeaderClassName: 'initial-header',
    activeHeaderClassName: 'initial-active-header',
    currentRowClassName: 'initial-row',
    currentColClassName: 'initial-column',
    selectionMode: 'single',
    navigableHeaders: false,
    fixedRowsBottom: 0,
    minSpareRows: 0,
    minSpareCols: 0,
    autoWrapRow: false,
    autoWrapCol: false,
    fillHandle: false,
  };
}

function createTableProps() {
  return {
    rowIndexMapper: {},
    columnIndexMapper: {},
    isDisabledCellSelection: () => false,
    createCellCoords: (row, col) => ({ row, col }),
    createCellRange: () => null,
    visualToRenderableCoords: coords => coords,
    renderableToVisualCoords: coords => coords,
    countRenderableRows: () => 0,
    countRenderableColumns: () => 0,
    countRenderableRowsInRange: () => 0,
    countRenderableColumnsInRange: () => 0,
    countRowHeaders: () => 0,
    countColHeaders: () => 0,
  };
}

describe('Selection', () => {
  describe('updateHighlightClassNames', () => {
    it('should update class names for all highlight instances from the current settings', () => {
      const settings = createSettings();
      const selection = new Selection(settings, createTableProps());

      const rowHighlight = selection.highlight.createRowHighlight();
      const columnHighlight = selection.highlight.createColumnHighlight();
      const rowHeaderHighlight = selection.highlight.createRowHeader();
      const columnHeaderHighlight = selection.highlight.createColumnHeader();
      const activeRowHeaderHighlight = selection.highlight.createActiveRowHeader();
      const activeColumnHeaderHighlight = selection.highlight.createActiveColumnHeader();
      const activeCornerHeaderHighlight = selection.highlight.createActiveCornerHeader();

      settings.currentHeaderClassName = 'updated-header';
      settings.activeHeaderClassName = 'updated-active-header';
      settings.currentRowClassName = undefined;
      settings.currentColClassName = 'updated-column';

      selection.updateHighlightClassNames();

      expect(rowHighlight.settings.className).toBeUndefined();
      expect(columnHighlight.settings.className).toBe('updated-column');
      expect(rowHeaderHighlight.settings.className).toBe('updated-header');
      expect(columnHeaderHighlight.settings.className).toBe('updated-header');
      expect(activeRowHeaderHighlight.settings.className).toBe('updated-active-header');
      expect(activeColumnHeaderHighlight.settings.className).toBe('updated-active-header');
      expect(activeCornerHeaderHighlight.settings.className).toBe('updated-active-header');
    });
  });
});

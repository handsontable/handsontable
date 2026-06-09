import Highlight from '../highlight';

function createHighlightInstance(options = {}) {
  return new Highlight({
    rowClassName: 'rowClass',
    columnClassName: 'columnClass',
    headerClassName: 'headerClass',
    activeHeaderClassName: 'activeHeaderClass',
    cellAttributes: [],
    rowIndexMapper: null,
    columnIndexMapper: null,
    disabledCellSelection: () => false,
    cellCornerVisible: () => false,
    areaCornerVisible: () => false,
    visualToRenderableCoords: coords => coords,
    renderableToVisualCoords: coords => coords,
    createCellCoords: (row, column) => ({ row, column }),
    createCellRange: (highlight, from, to) => ({ highlight, from, to }),
    ...options,
  });
}

describe('Highlight', () => {
  describe('isEnabledFor()', () => {
    it('should treat `undefined` the same as `false` (selection enabled)', () => {
      const highlight = createHighlightInstance({
        disabledCellSelection: () => undefined,
      });

      expect(highlight.isEnabledFor('focus', { row: 0, col: 0 })).toBe(true);
      expect(highlight.isEnabledFor('area', { row: 0, col: 0 })).toBe(true);
      expect(highlight.isEnabledFor('header', { row: 0, col: 0 })).toBe(true);
    });

    it('should return `true` when `disabledCellSelection` returns `false`', () => {
      const highlight = createHighlightInstance({
        disabledCellSelection: () => false,
      });

      expect(highlight.isEnabledFor('focus', { row: 0, col: 0 })).toBe(true);
      expect(highlight.isEnabledFor('area', { row: 0, col: 0 })).toBe(true);
      expect(highlight.isEnabledFor('header', { row: 0, col: 0 })).toBe(true);
    });

    it('should return `false` when `disabledCellSelection` returns `true`', () => {
      const highlight = createHighlightInstance({
        disabledCellSelection: () => true,
      });

      expect(highlight.isEnabledFor('focus', { row: 0, col: 0 })).toBe(false);
      expect(highlight.isEnabledFor('area', { row: 0, col: 0 })).toBe(false);
      expect(highlight.isEnabledFor('header', { row: 0, col: 0 })).toBe(false);
    });

    it('should selectively disable highlight types when `disabledCellSelection` returns a string', () => {
      const highlight = createHighlightInstance({
        disabledCellSelection: () => 'current',
      });

      expect(highlight.isEnabledFor('focus', { row: 0, col: 0 })).toBe(false);
      expect(highlight.isEnabledFor('area', { row: 0, col: 0 })).toBe(true);
      expect(highlight.isEnabledFor('header', { row: 0, col: 0 })).toBe(true);
    });

    it('should selectively disable highlight types when `disabledCellSelection` returns an array', () => {
      const highlight = createHighlightInstance({
        disabledCellSelection: () => ['current', 'header'],
      });

      expect(highlight.isEnabledFor('focus', { row: 0, col: 0 })).toBe(false);
      expect(highlight.isEnabledFor('area', { row: 0, col: 0 })).toBe(true);
      expect(highlight.isEnabledFor('header', { row: 0, col: 0 })).toBe(false);
    });
  });

  describe('updateHighlightClassNames()', () => {
    it('should update the rowClassName option and all cached row highlights', () => {
      const highlight = createHighlightInstance();

      // Create and cache a row highlight at layer level 0
      highlight.createRowHighlight();

      const [cachedRowHighlight] = highlight.getRowHighlights();

      expect(cachedRowHighlight.settings.className).toBe('rowClass');

      highlight.updateHighlightClassNames({ rowClassName: 'newRowClass' });

      expect(highlight.options.rowClassName).toBe('newRowClass');
      expect(cachedRowHighlight.settings.className).toBe('newRowClass');
    });

    it('should update the columnClassName option and all cached column highlights', () => {
      const highlight = createHighlightInstance();

      // Create and cache a column highlight at layer level 0
      highlight.createColumnHighlight();

      const [cachedColumnHighlight] = highlight.getColumnHighlights();

      expect(cachedColumnHighlight.settings.className).toBe('columnClass');

      highlight.updateHighlightClassNames({ columnClassName: 'newColumnClass' });

      expect(highlight.options.columnClassName).toBe('newColumnClass');
      expect(cachedColumnHighlight.settings.className).toBe('newColumnClass');
    });

    it('should update the headerClassName option and all cached row/column header highlights', () => {
      const highlight = createHighlightInstance();

      // Create and cache header highlights at layer level 0
      highlight.createRowHeader();
      highlight.createColumnHeader();

      const [cachedRowHeader] = highlight.getRowHeaders();
      const [cachedColumnHeader] = highlight.getColumnHeaders();

      expect(cachedRowHeader.settings.className).toBe('headerClass');
      expect(cachedColumnHeader.settings.className).toBe('headerClass');

      highlight.updateHighlightClassNames({ headerClassName: 'newHeaderClass' });

      expect(highlight.options.headerClassName).toBe('newHeaderClass');
      expect(cachedRowHeader.settings.className).toBe('newHeaderClass');
      expect(cachedColumnHeader.settings.className).toBe('newHeaderClass');
    });

    it('should update the activeHeaderClassName option and all cached active header highlights', () => {
      const highlight = createHighlightInstance();

      // Create and cache active header highlights at layer level 0
      highlight.createActiveRowHeader();
      highlight.createActiveColumnHeader();
      highlight.createActiveCornerHeader();

      const [cachedActiveRowHeader] = highlight.getActiveRowHeaders();
      const [cachedActiveColumnHeader] = highlight.getActiveColumnHeaders();
      const [cachedActiveCornerHeader] = highlight.getActiveCornerHeaders();

      expect(cachedActiveRowHeader.settings.className).toBe('activeHeaderClass');
      expect(cachedActiveColumnHeader.settings.className).toBe('activeHeaderClass');
      expect(cachedActiveCornerHeader.settings.className).toBe('activeHeaderClass');

      highlight.updateHighlightClassNames({ activeHeaderClassName: 'newActiveHeaderClass' });

      expect(highlight.options.activeHeaderClassName).toBe('newActiveHeaderClass');
      expect(cachedActiveRowHeader.settings.className).toBe('newActiveHeaderClass');
      expect(cachedActiveColumnHeader.settings.className).toBe('newActiveHeaderClass');
      expect(cachedActiveCornerHeader.settings.className).toBe('newActiveHeaderClass');
    });

    it('should set className to undefined when a class name is explicitly unset', () => {
      const highlight = createHighlightInstance();

      highlight.createRowHighlight();

      const [cachedRowHighlight] = highlight.getRowHighlights();

      expect(cachedRowHighlight.settings.className).toBe('rowClass');

      highlight.updateHighlightClassNames({ rowClassName: undefined });

      expect(highlight.options.rowClassName).toBeUndefined();
      expect(cachedRowHighlight.settings.className).toBeUndefined();
    });

    it('should only update the specified class names, leaving others unchanged', () => {
      const highlight = createHighlightInstance();

      highlight.createRowHighlight();
      highlight.createColumnHighlight();

      const [cachedRowHighlight] = highlight.getRowHighlights();
      const [cachedColumnHighlight] = highlight.getColumnHighlights();

      highlight.updateHighlightClassNames({ rowClassName: 'updatedRowClass' });

      expect(cachedRowHighlight.settings.className).toBe('updatedRowClass');
      expect(cachedColumnHighlight.settings.className).toBe('columnClass'); // unchanged
    });

    it('should update newly created highlights with the new class name after updateHighlightClassNames is called', () => {
      const highlight = createHighlightInstance();

      highlight.updateHighlightClassNames({ rowClassName: 'newRowClass' });

      // Create a row highlight after the update
      highlight.createRowHighlight();

      const [cachedRowHighlight] = highlight.getRowHighlights();

      expect(cachedRowHighlight.settings.className).toBe('newRowClass');
    });
  });
});

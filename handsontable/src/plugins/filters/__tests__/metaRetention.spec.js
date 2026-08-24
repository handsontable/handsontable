describe('Filters - cell meta retention', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should not materialize a cell meta object for every source row when filtering a column', async() => {
    handsontable({
      data: createSpreadsheetData(5000, 5),
      filters: true,
      dropdownMenu: true,
      width: 300,
      height: 200, // only a small slice of the 5000 rows is rendered
      colWidths: 50,
      rowHeights: 23,
      autoColumnSize: false, // would otherwise sample (and materialize meta for) every cell at load
      autoRowSize: false,
    });

    const plugin = getPlugin('filters');
    const materializedBefore = hot().getCellsMeta().length;

    // `contains '2'` matches a subset of the auto-generated cell values
    plugin.addCondition(0, 'contains', ['2']);
    plugin.filter();
    await render();

    const materializedAfter = hot().getCellsMeta().length;

    // The filter scans every source row. Before the fix this grew the meta cache by ~countSourceRows
    // (one ColumnMeta per scanned cell, retained). After the fix the scan uses transient meta, so the
    // materialized count stays bounded to roughly the rendered viewport - far below the row count.
    expect(materializedAfter).toBeLessThan(countSourceRows());
    expect(materializedAfter).toBeLessThan(1000);
    // the scan adds at most a viewport's worth of meta, not one per source row
    expect(materializedAfter - materializedBefore).toBeLessThan(1000);
    // sanity: the filter actually narrowed the view
    expect(countRows()).toBeLessThan(5000);
    expect(countRows()).toBeGreaterThan(0);
  });

  it('should keep filtering correct across multiple columns (AND intersection)', async() => {
    handsontable({
      data: createSpreadsheetData(100, 5),
      filters: true,
      dropdownMenu: true,
      width: 400,
      height: 300,
    });

    const plugin = getPlugin('filters');

    // Single-column reference result.
    plugin.addCondition(0, 'contains', ['1']);
    plugin.filter();
    await render();

    const afterCol0 = getDataAtCol(0);

    expect(afterCol0.length).toBeGreaterThan(0);
    afterCol0.forEach((value) => {
      expect(`${value}`).toContain('1');
    });

    // Add a second column condition - result must be the intersection (uses meta.row internally).
    plugin.addCondition(1, 'contains', ['2']);
    plugin.filter();
    await render();

    const col0 = getDataAtCol(0);
    const col1 = getDataAtCol(1);

    expect(col0.length).toBe(col1.length);
    col0.forEach((value) => {
      expect(`${value}`).toContain('1');
    });
    col1.forEach((value) => {
      expect(`${value}`).toContain('2');
    });

    // Intersection is never larger than either single-column result.
    expect(col0.length).toBeLessThanOrEqual(afterCol0.length);
  });

  it('should preserve a per-cell meta override (cell option) while filtering', async() => {
    handsontable({
      data: createSpreadsheetData(50, 3),
      filters: true,
      dropdownMenu: true,
      cell: [
        { row: 4, col: 0, className: 'ht-custom-marker' },
      ],
      width: 400,
      height: 300,
    });

    const plugin = getPlugin('filters');

    plugin.addCondition(0, 'contains', ['1']);
    plugin.filter();
    plugin.clearConditions();
    plugin.filter();
    await render();

    // The declarative per-cell override must survive the filter scan (it has its own cached meta,
    // which the non-caching read reuses rather than discarding).
    expect(getCellMeta(4, 0).className).toContain('ht-custom-marker');
  });
});

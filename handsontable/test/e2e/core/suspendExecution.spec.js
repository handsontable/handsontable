describe('Core.suspendExecution', () => {
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

  it('should suspend the table execution process', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
    });
    const columnIndexCacheUpdated = jasmine.createSpy('columnIndexCacheUpdated');
    const rowIndexCacheUpdated = jasmine.createSpy('rowIndexCacheUpdated');

    columnIndexMapper().addLocalHook('cacheUpdated', columnIndexCacheUpdated);
    rowIndexMapper().addLocalHook('cacheUpdated', rowIndexCacheUpdated);

    expect(hot.executionSuspendedCounter).toBe(0);

    await suspendExecution();

    columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);
    rowIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

    expect(hot.executionSuspendedCounter).toBe(1);
    expect(columnIndexCacheUpdated).not.toHaveBeenCalled();
    expect(rowIndexCacheUpdated).not.toHaveBeenCalled();
  });

  it('should wrap multiple calls of the table suspend execution', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
    });
    const columnIndexCacheUpdated = jasmine.createSpy('columnIndexCacheUpdated');
    const rowIndexCacheUpdated = jasmine.createSpy('rowIndexCacheUpdated');

    columnIndexMapper().addLocalHook('cacheUpdated', columnIndexCacheUpdated);
    rowIndexMapper().addLocalHook('cacheUpdated', rowIndexCacheUpdated);

    expect(hot.executionSuspendedCounter).toBe(0);

    await suspendExecution();

    columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

    await suspendExecution();

    rowIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

    await suspendExecution();
    await suspendExecution();

    columnIndexMapper().setIndexesSequence([0, 1, 2, 3, 4]);

    await suspendExecution();

    rowIndexMapper().setIndexesSequence([0, 1, 2, 3, 4]);

    expect(hot.executionSuspendedCounter).toBe(5);
    expect(columnIndexCacheUpdated).not.toHaveBeenCalled();
    expect(rowIndexCacheUpdated).not.toHaveBeenCalled();
  });
});

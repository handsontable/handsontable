describe('Core.resumeExecution', () => {
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

  it('should resume the table execution process and update the internal cache', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
    });
    const columnIndexCacheUpdated = jasmine.createSpy('columnIndexCacheUpdated');
    const rowIndexCacheUpdated = jasmine.createSpy('rowIndexCacheUpdated');

    columnIndexMapper().addLocalHook('cacheUpdated', columnIndexCacheUpdated);
    rowIndexMapper().addLocalHook('cacheUpdated', rowIndexCacheUpdated);

    await suspendExecution();

    columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);
    rowIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);
    rowIndexMapper().setIndexesSequence([4, 0, 1, 2, 3]);
    columnIndexMapper().setIndexesSequence([0, 4, 3, 2, 1]);

    await resumeExecution();

    expect(hot.executionSuspendedCounter).toBe(0);
    expect(columnIndexCacheUpdated).toHaveBeenCalledOnceWith({
      indexesSequenceChanged: true,
      trimmedIndexesChanged: false,
      hiddenIndexesChanged: false,
    });
    expect(rowIndexCacheUpdated).toHaveBeenCalledOnceWith({
      indexesSequenceChanged: true,
      trimmedIndexesChanged: false,
      hiddenIndexesChanged: false,
    });
  });

  it('should update the cache only on the last resume call (a call that resets the counter of nested suspend calls)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
    });
    const columnIndexCacheUpdated = jasmine.createSpy('columnIndexCacheUpdated');
    const rowIndexCacheUpdated = jasmine.createSpy('rowIndexCacheUpdated');

    columnIndexMapper().addLocalHook('cacheUpdated', columnIndexCacheUpdated);
    rowIndexMapper().addLocalHook('cacheUpdated', rowIndexCacheUpdated);

    await suspendExecution();
    await suspendExecution();
    await suspendExecution();

    columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

    await resumeExecution();

    expect(hot.executionSuspendedCounter).toBe(2);

    rowIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

    await resumeExecution();

    expect(hot.executionSuspendedCounter).toBe(1);

    rowIndexMapper().setIndexesSequence([1, 2, 3, 4, 0]);
    columnIndexMapper().setIndexesSequence([0, 1, 2, 3, 4]);

    await resumeExecution(); // Counter is now equals to 0, it calls render.
    await resumeExecution();
    await resumeExecution();
    await resumeExecution();

    expect(hot.executionSuspendedCounter).toBe(0);
    expect(columnIndexCacheUpdated).toHaveBeenCalledOnceWith({
      indexesSequenceChanged: true,
      trimmedIndexesChanged: false,
      hiddenIndexesChanged: false,
    });
    expect(rowIndexCacheUpdated).toHaveBeenCalledOnceWith({
      indexesSequenceChanged: true,
      trimmedIndexesChanged: false,
      hiddenIndexesChanged: false,
    });
  });
});

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

  it('should resume the table execution process and update the internal cache', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
    });
    const columnIndexCacheUpdated = jasmine.createSpy('columnIndexCacheUpdated');
    const rowIndexCacheUpdated = jasmine.createSpy('rowIndexCacheUpdated');

    hot.columnIndexMapper.addLocalHook('cacheUpdated', columnIndexCacheUpdated);
    hot.rowIndexMapper.addLocalHook('cacheUpdated', rowIndexCacheUpdated);

    hot.suspendExecution();
    hot.columnIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);
    hot.rowIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);
    hot.rowIndexMapper.setIndexesSequence([4, 0, 1, 2, 3]);
    hot.columnIndexMapper.setIndexesSequence([0, 4, 3, 2, 1]);
    hot.resumeExecution();

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

  it('should update the cache only on the last resume call (a call that resets the counter of nested suspend calls)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
    });
    const columnIndexCacheUpdated = jasmine.createSpy('columnIndexCacheUpdated');
    const rowIndexCacheUpdated = jasmine.createSpy('rowIndexCacheUpdated');

    hot.columnIndexMapper.addLocalHook('cacheUpdated', columnIndexCacheUpdated);
    hot.rowIndexMapper.addLocalHook('cacheUpdated', rowIndexCacheUpdated);

    hot.suspendExecution();
    hot.suspendExecution();
    hot.suspendExecution();

    hot.columnIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);
    hot.resumeExecution();

    expect(hot.executionSuspendedCounter).toBe(2);

    hot.rowIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);
    hot.resumeExecution();

    expect(hot.executionSuspendedCounter).toBe(1);

    hot.rowIndexMapper.setIndexesSequence([1, 2, 3, 4, 0]);
    hot.columnIndexMapper.setIndexesSequence([0, 1, 2, 3, 4]);
    hot.resumeExecution(); // Counter is now equals to 0, it calls render.
    hot.resumeExecution();
    hot.resumeExecution();
    hot.resumeExecution();

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

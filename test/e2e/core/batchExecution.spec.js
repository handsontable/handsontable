describe('Core.batchExecution', () => {
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

  it('should batch multi-line operations into one execution call', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
    });
    const columnIndexCacheUpdated = jasmine.createSpy('columnIndexCacheUpdated');
    const rowIndexCacheUpdated = jasmine.createSpy('rowIndexCacheUpdated');

    hot.columnIndexMapper.addLocalHook('cacheUpdated', columnIndexCacheUpdated);
    hot.rowIndexMapper.addLocalHook('cacheUpdated', rowIndexCacheUpdated);

    spyOn(hot, 'suspendExecution').and.callThrough();
    spyOn(hot, 'resumeExecution').and.callThrough();

    const result = hot.batchExecution(() => {
      hot.columnIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);
      hot.rowIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);
      hot.rowIndexMapper.setIndexesSequence([4, 0, 1, 2, 3]);
      hot.columnIndexMapper.setIndexesSequence([0, 4, 3, 2, 1]);

      return 'test';
    });

    expect(result).toBe('test');
    expect(hot.suspendExecution).toHaveBeenCalledOnceWith();
    expect(hot.suspendExecution).toHaveBeenCalledBefore(hot.resumeExecution);
    expect(hot.resumeExecution).toHaveBeenCalledOnceWith(false);
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

  it('should batch nested multi-line operations into one execution call', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
    });
    const columnIndexCacheUpdated = jasmine.createSpy('columnIndexCacheUpdated');
    const rowIndexCacheUpdated = jasmine.createSpy('rowIndexCacheUpdated');

    hot.columnIndexMapper.addLocalHook('cacheUpdated', columnIndexCacheUpdated);
    hot.rowIndexMapper.addLocalHook('cacheUpdated', rowIndexCacheUpdated);

    spyOn(hot, 'suspendExecution').and.callThrough();
    spyOn(hot, 'resumeExecution').and.callThrough();

    const result = hot.batchExecution(() => {
      hot.columnIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);
      hot.rowIndexMapper.setIndexesSequence([4, 0, 1, 2, 3]);

      hot.batchExecution(() => {
        hot.columnIndexMapper.setIndexesSequence([0, 4, 3, 2, 1]);

        hot.batchExecution(() => {
          hot.rowIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);
        });
      });

      return 'test';
    });

    expect(result).toBe('test');
    expect(hot.suspendExecution).toHaveBeenCalledTimes(3);
    expect(hot.resumeExecution).toHaveBeenCalledTimes(3);
    expect(hot.resumeExecution).toHaveBeenCalledWith(false);
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

  it('should be possible to trigger cache update manually for wrapped operations', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
    });
    const columnIndexCacheUpdated = jasmine.createSpy('columnIndexCacheUpdated');
    const rowIndexCacheUpdated = jasmine.createSpy('rowIndexCacheUpdated');

    hot.columnIndexMapper.addLocalHook('cacheUpdated', columnIndexCacheUpdated);
    hot.rowIndexMapper.addLocalHook('cacheUpdated', rowIndexCacheUpdated);

    spyOn(hot, 'suspendExecution').and.callThrough();
    spyOn(hot, 'resumeExecution').and.callThrough();

    const result = hot.batchExecution(() => {
      hot.columnIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);
      hot.rowIndexMapper.setIndexesSequence([4, 0, 1, 2, 3]);

      hot.batchExecution(() => {
        hot.columnIndexMapper.setIndexesSequence([0, 4, 3, 2, 1]);

        hot.batchExecution(() => {
          hot.batchExecution(() => {
            hot.columnIndexMapper.setIndexesSequence([0, 1, 2, 4, 3]);
            hot.rowIndexMapper.setIndexesSequence([0, 1, 2, 4, 3]);
          }, true);

          hot.rowIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);
        }, true);

        hot.columnIndexMapper.setIndexesSequence([0, 1, 2, 3, 4]);
      });

      return 'test';
    });

    expect(result).toBe('test');
    expect(hot.suspendExecution).toHaveBeenCalledTimes(4);
    expect(hot.resumeExecution).toHaveBeenCalledTimes(4);
    expect(hot.resumeExecution).toHaveBeenCalledWith(false);
    expect(columnIndexCacheUpdated).toHaveBeenCalledTimes(2);
    expect(columnIndexCacheUpdated).toHaveBeenCalledWith({
      indexesSequenceChanged: true,
      trimmedIndexesChanged: false,
      hiddenIndexesChanged: false,
    });
    expect(rowIndexCacheUpdated).toHaveBeenCalledTimes(2);
    expect(rowIndexCacheUpdated).toHaveBeenCalledWith({
      indexesSequenceChanged: true,
      trimmedIndexesChanged: false,
      hiddenIndexesChanged: false,
    });
  });
});

describe('Core.batch', () => {
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

  it('should batch multi-line operations into one render and execution call', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      autoColumnSize: false,
      autoRowSize: false,
    });
    spyOn(hot, 'suspendRender').and.callThrough();
    spyOn(hot, 'suspendExecution').and.callThrough();
    spyOn(hot, 'resumeExecution').and.callThrough();
    spyOn(hot, 'resumeRender').and.callThrough();
    spyOn(hot.view.wt, 'draw');
    spyOn(hot.view.wt.wtOverlays, 'adjustElementsSize');

    const columnIndexCacheUpdated = jasmine.createSpy('columnIndexCacheUpdated');
    const rowIndexCacheUpdated = jasmine.createSpy('rowIndexCacheUpdated');

    hot.columnIndexMapper.addLocalHook('cacheUpdated', columnIndexCacheUpdated);
    hot.rowIndexMapper.addLocalHook('cacheUpdated', rowIndexCacheUpdated);

    const result = hot.batch(() => {
      hot.setDataAtCell(2, 2, 'X');
      hot.alter('insert_row', 1, 3);
      hot.alter('insert_col', 1, 3);

      hot.columnIndexMapper.setIndexesSequence([0, 4, 5, 6, 7, 1, 2, 3]);
      hot.rowIndexMapper.setIndexesSequence([0, 4, 5, 6, 7, 1, 2, 3]);

      hot.setDataAtCell(2, 2, 'Y');

      hot.columnIndexMapper.setIndexesSequence([0, 1, 2, 3, 4, 5, 6, 7]);
      hot.rowIndexMapper.setIndexesSequence([0, 1, 2, 3, 4, 5, 6, 7]);

      return 'test';
    });

    expect(result).toBe('test');
    expect(hot.suspendRender).toHaveBeenCalledOnceWith();
    expect(hot.suspendRender).toHaveBeenCalledBefore(hot.resumeRender);
    expect(hot.suspendRender).toHaveBeenCalledBefore(hot.suspendExecution);
    expect(hot.suspendExecution).toHaveBeenCalledOnceWith();
    expect(hot.suspendExecution).toHaveBeenCalledBefore(hot.resumeExecution);
    expect(hot.resumeExecution).toHaveBeenCalledOnceWith();
    expect(hot.resumeExecution).toHaveBeenCalledBefore(hot.resumeRender);
    expect(hot.resumeRender).toHaveBeenCalledOnceWith();
    expect(hot.view.wt.draw).toHaveBeenCalledOnceWith(false); // fast redraw?
    expect(hot.view.wt.wtOverlays.adjustElementsSize).toHaveBeenCalledOnceWith(true);
    expect(columnIndexCacheUpdated).toHaveBeenCalledTimes(3);
    expect(columnIndexCacheUpdated).toHaveBeenCalledWith(true, false, false);
    expect(rowIndexCacheUpdated).toHaveBeenCalledTimes(3);
    expect(rowIndexCacheUpdated).toHaveBeenCalledWith(true, false, false);
  });
});

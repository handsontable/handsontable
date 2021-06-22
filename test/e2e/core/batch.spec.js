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

    expect(columnIndexCacheUpdated).toHaveBeenCalledWith({
      indexesSequenceChanged: true,
      trimmedIndexesChanged: false,
      hiddenIndexesChanged: false,
    });
    expect(rowIndexCacheUpdated).toHaveBeenCalledTimes(3);
    expect(rowIndexCacheUpdated).toHaveBeenCalledWith({
      indexesSequenceChanged: true,
      trimmedIndexesChanged: false,
      hiddenIndexesChanged: false,
    });
  });

  it('should batch showing/hiding headers correctly', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      colHeaders: false,
      rowHeaders: false,
    });

    expect(getTopClone().width()).toBe(0);
    expect(getTopClone().height()).toBe(0);
    expect(getTopLeftClone().width()).toBe(null);
    expect(getTopLeftClone().height()).toBe(null);
    expect(getLeftClone().width()).toBe(0);
    expect(getLeftClone().height()).toBe(0);

    hot.batch(() => {
      hot.updateSettings({
        colHeaders: true,
        rowHeaders: true,
      });
    });

    expect(getTopClone().width()).toBe(300);
    expect(getTopClone().height()).toBe(26);
    expect(getTopLeftClone().width()).toBe(50);
    expect(getTopLeftClone().height()).toBe(26);
    expect(getLeftClone().width()).toBe(50);
    expect(getLeftClone().height()).toBe(142);

    hot.batch(() => {
      hot.updateSettings({
        colHeaders: false,
        rowHeaders: false,
      });
    });

    // The top header disappears by setting the width to 0, the height is not touched
    expect(getTopClone().width()).toBe(0);
    expect(getTopClone().height()).toBe(26);
    expect(getTopLeftClone().width()).toBe(0);
    expect(getTopLeftClone().height()).toBe(0);
    expect(getLeftClone().width()).toBe(0);
    expect(getLeftClone().height()).toBe(142);
  });

  it('should batch adjusting fixed headers correctly', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      fixedRowsTop: 0,
      fixedColumnsLeft: 0,
      fixedRowsBottom: 0,
    });

    expect(getTopClone().width()).toBe(0);
    expect(getTopClone().height()).toBe(0);
    expect(getTopLeftClone().width()).toBe(null);
    expect(getTopLeftClone().height()).toBe(null);
    expect(getLeftClone().width()).toBe(0);
    expect(getLeftClone().height()).toBe(0);
    expect(getBottomLeftClone().width()).toBe(null);
    expect(getBottomLeftClone().height()).toBe(null);
    expect(getBottomClone().width()).toBe(0);
    expect(getBottomClone().height()).toBe(0);

    hot.batch(() => {
      hot.updateSettings({
        fixedRowsTop: 1,
        fixedColumnsLeft: 1,
        fixedRowsBottom: 1,
      });
    });

    expect(getTopClone().width()).toBe(250);
    expect(getTopClone().height()).toBe(24);
    expect(getTopLeftClone().width()).toBe(50);
    expect(getTopLeftClone().height()).toBe(24);
    expect(getLeftClone().width()).toBe(50);
    expect(getLeftClone().height()).toBe(116);
    expect(getBottomLeftClone().width()).toBe(50);
    expect(getBottomLeftClone().height()).toBe(24);
    expect(getBottomClone().width()).toBe(250);
    expect(getBottomClone().height()).toBe(24);

    hot.batch(() => {
      hot.updateSettings({
        fixedRowsTop: 0,
        fixedColumnsLeft: 0,
        fixedRowsBottom: 0,
      });
    });

    // The top header disappears by setting the width to 0, the height is not touched
    expect(getTopClone().width()).toBe(0);
    expect(getTopClone().height()).toBe(24);
    expect(getTopLeftClone().width()).toBe(0);
    expect(getTopLeftClone().height()).toBe(0);
    expect(getLeftClone().width()).toBe(0);
    expect(getLeftClone().height()).toBe(116);
    expect(getBottomLeftClone().width()).toBe(0);
    expect(getBottomLeftClone().height()).toBe(0);
    // The bottom header disappears by setting the width to 0, the height is not touched
    expect(getBottomClone().width()).toBe(0);
    expect(getBottomClone().height()).toBe(24);
  });
});

/* eslint-disable handsontable/require-await */
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
      data: createSpreadsheetData(5, 5),
      autoColumnSize: false,
      autoRowSize: false,
    });

    spyOn(hot, 'suspendRender').and.callThrough();
    spyOn(hot, 'suspendExecution').and.callThrough();
    spyOn(hot, 'resumeExecution').and.callThrough();
    spyOn(hot, 'resumeRender').and.callThrough();
    spyOn(hot.view._wt, 'draw');
    spyOn(hot.view._wt.wtOverlays, 'adjustElementsSize');

    const columnIndexCacheUpdated = jasmine.createSpy('columnIndexCacheUpdated');
    const rowIndexCacheUpdated = jasmine.createSpy('rowIndexCacheUpdated');

    columnIndexMapper().addLocalHook('cacheUpdated', columnIndexCacheUpdated);
    rowIndexMapper().addLocalHook('cacheUpdated', rowIndexCacheUpdated);

    const result = await batch(() => {
      setDataAtCell(2, 2, 'X');
      alter('insert_row_above', 1, 3);
      alter('insert_col_start', 1, 3);

      columnIndexMapper().setIndexesSequence([0, 4, 5, 6, 7, 1, 2, 3]);
      rowIndexMapper().setIndexesSequence([0, 4, 5, 6, 7, 1, 2, 3]);

      setDataAtCell(2, 2, 'Y');

      columnIndexMapper().setIndexesSequence([0, 1, 2, 3, 4, 5, 6, 7]);
      rowIndexMapper().setIndexesSequence([0, 1, 2, 3, 4, 5, 6, 7]);

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
    expect(hot.view._wt.draw).toHaveBeenCalledOnceWith(false); // fast redraw?
    expect(hot.view._wt.wtOverlays.adjustElementsSize).toHaveBeenCalledTimes(1);
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

  it('should batch showing/hiding headers correctly', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      colHeaders: false,
      rowHeaders: false,
    });

    expect(getTopClone().width()).toBe(0);
    expect(getTopClone().height()).toBe(0);
    expect(getTopInlineStartClone().width()).toBe(0);
    expect(getTopInlineStartClone().height()).toBe(0);
    expect(getInlineStartClone().width()).toBe(0);
    expect(getInlineStartClone().height()).toBe(0);

    await batch(() => {
      updateSettings({
        colHeaders: true,
        rowHeaders: true,
      });
    });

    expect(getTopClone().width()).toBe(300);
    expect(getTopClone().height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(26);
      main.toBe(29);
      horizon.toBe(37);
    });
    expect(getTopInlineStartClone().width()).toBe(50);
    expect(getTopInlineStartClone().height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(26);
      main.toBe(29);
      horizon.toBe(37);
    });
    expect(getInlineStartClone().width()).toBe(50);
    expect(getInlineStartClone().height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(142);
      main.toBe(175);
      horizon.toBe(223);
    });

    await batch(() => {
      updateSettings({
        colHeaders: false,
        rowHeaders: false,
      });
    });

    expect(getTopClone().width()).toBe(0);
    expect(getTopClone().height()).toBe(0);
    expect(getTopInlineStartClone().width()).toBe(0);
    expect(getTopInlineStartClone().height()).toBe(0);
    expect(getInlineStartClone().width()).toBe(0);
    expect(getInlineStartClone().height()).toBe(0);
  });

  it('should batch adjusting fixed headers correctly', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      fixedRowsTop: 0,
      fixedColumnsStart: 0,
      fixedRowsBottom: 0,
    });

    expect(getTopClone().width()).toBe(0);
    expect(getTopClone().height()).toBe(0);
    expect(getTopInlineStartClone().width()).toBe(0);
    expect(getTopInlineStartClone().height()).toBe(0);
    expect(getInlineStartClone().width()).toBe(0);
    expect(getInlineStartClone().height()).toBe(0);
    expect(getBottomInlineStartClone().width()).toBe(0);
    expect(getBottomInlineStartClone().height()).toBe(0);
    expect(getBottomClone().width()).toBe(0);
    expect(getBottomClone().height()).toBe(0);

    await batch(() => {
      updateSettings({
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
      });
    });

    expect(getTopClone().width()).toBe(250);
    expect(getTopClone().height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(24);
      main.toBe(30);
      horizon.toBe(38);
    });
    expect(getTopInlineStartClone().width()).toBe(50);
    expect(getTopInlineStartClone().height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(24);
      main.toBe(30);
      horizon.toBe(38);
    });
    expect(getInlineStartClone().width()).toBe(50);
    expect(getInlineStartClone().height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(116);
      main.toBe(147);
      horizon.toBe(187);
    });
    expect(getBottomInlineStartClone().width()).toBe(50);
    expect(getBottomInlineStartClone().height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(24);
      main.toBe(30);
      horizon.toBe(38);
    });
    expect(getBottomClone().width()).toBe(250);
    expect(getBottomClone().height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(24);
      main.toBe(30);
      horizon.toBe(38);
    });

    await batch(() => {
      updateSettings({
        fixedRowsTop: 0,
        fixedColumnsStart: 0,
        fixedRowsBottom: 0,
      });
    });

    expect(getTopClone().width()).toBe(0);
    expect(getTopClone().height()).toBe(0);
    expect(getTopInlineStartClone().width()).toBe(0);
    expect(getTopInlineStartClone().height()).toBe(0);
    expect(getInlineStartClone().width()).toBe(0);
    expect(getInlineStartClone().height()).toBe(0);
    expect(getBottomInlineStartClone().width()).toBe(0);
    expect(getBottomInlineStartClone().height()).toBe(0);
    expect(getBottomClone().width()).toBe(0);
    expect(getBottomClone().height()).toBe(0);
  });
});

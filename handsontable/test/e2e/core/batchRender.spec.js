describe('Core.batchRender', () => {
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

  it('should batch multi-line operations into one render call', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
    });

    spyOn(hot, 'suspendRender').and.callThrough();
    spyOn(hot, 'resumeRender').and.callThrough();
    spyOn(hot.view.wt, 'draw');
    spyOn(hot.view.wt.wtOverlays, 'adjustElementsSize');

    const result = hot.batchRender(() => {
      // fast render
      hot.selectCell(1, 1);
      // slow render
      hot.setDataAtCell(2, 2, 'X');

      return hot.getDataAtCell(2, 2);
    });

    expect(result).toBe('X');
    expect(hot.suspendRender).toHaveBeenCalledOnceWith();
    expect(hot.suspendRender).toHaveBeenCalledBefore(hot.resumeRender);
    expect(hot.resumeRender).toHaveBeenCalledOnceWith();
    expect(hot.view.wt.draw).toHaveBeenCalledOnceWith(false); // fast redraw?
    expect(hot.view.wt.wtOverlays.adjustElementsSize).toHaveBeenCalledOnceWith(true);
    expect(hot.view.wt.wtOverlays.adjustElementsSize).toHaveBeenCalledBefore(hot.view.wt.draw);
  });

  it('should batch nested multi-line operations into one render call', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
    });

    spyOn(hot, 'suspendRender').and.callThrough();
    spyOn(hot, 'resumeRender').and.callThrough();
    spyOn(hot.view.wt, 'draw');
    spyOn(hot.view.wt.wtOverlays, 'adjustElementsSize');

    const result = hot.batchRender(() => {
      hot.alter('insert_row', 1, 5);
      hot.alter('insert_col', 1, 5);

      hot.batchRender(() => {
        hot.setDataAtCell(1, 1, 'x');
        hot.setDataAtCell(2, 2, 'c');
        hot.setDataAtCell(3, 3, 'v');

        hot.batchRender(() => {
          hot.selectCell(1, 1);
        });
      });

      return hot.getDataAtCell(1, 1);
    });

    expect(result).toBe('x');
    expect(hot.suspendRender).toHaveBeenCalledTimes(3);
    expect(hot.resumeRender).toHaveBeenCalledTimes(3);
    expect(hot.view.wt.draw).toHaveBeenCalledOnceWith(false); // fast redraw?
    expect(hot.view.wt.wtOverlays.adjustElementsSize).toHaveBeenCalledOnceWith(true);
  });
});

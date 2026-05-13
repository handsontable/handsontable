/* eslint-disable handsontable/require-await */
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
      data: createSpreadsheetData(5, 5),
    });

    spyOn(hot, 'suspendRender').and.callThrough();
    spyOn(hot, 'resumeRender').and.callThrough();
    spyOn(hot.view._wt, 'draw');
    spyOn(hot.view._wt.wtOverlays, 'adjustElementsSize');

    const result = batchRender(() => {
      // fast render
      selectCell(1, 1);
      // slow render
      setDataAtCell(2, 2, 'X');

      return hot.getDataAtCell(2, 2);
    });

    expect(result).toBe('X');
    expect(hot.suspendRender).toHaveBeenCalledOnceWith();
    expect(hot.suspendRender).toHaveBeenCalledBefore(hot.resumeRender);
    expect(hot.resumeRender).toHaveBeenCalledOnceWith();
    expect(hot.view._wt.draw).toHaveBeenCalledOnceWith(false); // fast redraw?
    expect(hot.view._wt.wtOverlays.adjustElementsSize).toHaveBeenCalledTimes(1);
    expect(hot.view._wt.draw).toHaveBeenCalledBefore(hot.view._wt.wtOverlays.adjustElementsSize);
  });

  it('should batch nested multi-line operations into one render call', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
    });

    spyOn(hot, 'suspendRender').and.callThrough();
    spyOn(hot, 'resumeRender').and.callThrough();
    spyOn(hot.view._wt, 'draw');
    spyOn(hot.view._wt.wtOverlays, 'adjustElementsSize');

    const result = batchRender(() => {
      alter('insert_row_above', 1, 5);
      alter('insert_col_start', 1, 5);

      batchRender(() => {
        setDataAtCell(1, 1, 'x');
        setDataAtCell(2, 2, 'c');
        setDataAtCell(3, 3, 'v');

        batchRender(() => {
          selectCell(1, 1);
        });
      });

      return getDataAtCell(1, 1);
    });

    expect(result).toBe('x');
    expect(hot.suspendRender).toHaveBeenCalledTimes(3);
    expect(hot.resumeRender).toHaveBeenCalledTimes(3);
    expect(hot.view._wt.draw).toHaveBeenCalledOnceWith(false); // fast redraw?
    expect(hot.view._wt.wtOverlays.adjustElementsSize).toHaveBeenCalledTimes(1);
  });
});

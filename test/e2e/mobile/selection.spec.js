const id = 'testContainer';

describe('Selection', () => {
  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should show selection handles', () => {
    const hot = handsontable({
      width: 400,
      height: 400
    });

    hot.selectCell(1, 1);

    const topLeftSelectionHandle = spec().$container.find('.ht_master .htBorders div:first-child .topLeftSelectionHandle')[0];
    const bottomRightSelectionHandle = spec().$container.find('.ht_master .htBorders div:first-child .bottomRightSelectionHandle')[0];

    expect(topLeftSelectionHandle.style.display).toEqual('block');
    expect(bottomRightSelectionHandle.style.display).toEqual('block');
  });

  it('should show both selection handles after drag & drop', async() => {
    const hot = handsontable({
      width: 400,
      height: 400
    });

    hot.selectCell(1, 1);

    await sleep(100);

    triggerTouchEvent('touchstart', spec().$container.find('.htBorders .bottomRightSelectionHandle-HitArea')[0]);
    triggerTouchEvent('touchmove', spec().$container.find('tbody tr:eq(1) td:eq(2)')[0]);
    triggerTouchEvent('touchmove', spec().$container.find('tbody tr:eq(1) td:eq(3)')[0]);
    triggerTouchEvent('touchend', spec().$container.find('tbody tr:eq(1) td:eq(3)')[0]);

    await sleep(100);

    const topLeftSelectionHandle = spec().$container.find('.ht_master .htBorders div:last-child .topLeftSelectionHandle')[0];
    const bottomRightSelectionHandle = spec().$container.find('.ht_master .htBorders div:last-child .bottomRightSelectionHandle')[0];

    expect(topLeftSelectionHandle.style.display).toBe('block');
    expect(bottomRightSelectionHandle.style.display).toBe('block');
    expect(hot.getSelected()).toEqual([[1, 1, 1, 2]]);
  });

  it('should not call the `select` method on the "focusable" textarea when selecting a cell', async() => {
    const hot = handsontable({
      data: [['test']],
      width: 400,
      height: 400
    });

    hot.selectCell(0, 0);

    const copyPastePlugin = hot.getPlugin('copyPaste');
    const focusableElement = copyPastePlugin.focusableElement.getFocusableElement();
    spyOn(focusableElement, 'select');

    hot.selectCell(0, 0);

    expect(focusableElement.select).not.toHaveBeenCalled();
  });
});

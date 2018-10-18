describe('Selection', () => {
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

  it('should show selection handles', () => {
    const hot = handsontable({
      width: 400,
      height: 400
    });

    hot.selectCell(1, 1);

    const topLeftSelectionHandle = spec().$container.find('.ht_master .htBorders div:last-child .topLeftSelectionHandle')[0];
    const bottomRightSelectionHandle = spec().$container.find('.ht_master .htBorders div:last-child .bottomRightSelectionHandle')[0];

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

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(2)').simulate('mouseover').simulate('mouseup');

    await sleep(100);

    const topLeftSelectionHandle = spec().$container.find('.ht_master .htBorders div:first-child .topLeftSelectionHandle')[0];
    const bottomRightSelectionHandle = spec().$container.find('.ht_master .htBorders div:first-child .bottomRightSelectionHandle')[0];

    expect(topLeftSelectionHandle.style.display).toEqual('block');
    expect(bottomRightSelectionHandle.style.display).toEqual('block');
  });
});

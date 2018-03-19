describe('Selection', () => {
  const id = 'testContainer';

  beforeEach(function () {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should show selection handles', async function () {
    const hot = handsontable({
      width: 400,
      height: 400
    });

    hot.selectCell(1, 1);

    const topLeftSelectionHandle = this.$container.find('.ht_master .htBorders div:last-child .topLeftSelectionHandle')[0];
    const bottomRightSelectionHandle = this.$container.find('.ht_master .htBorders div:last-child .bottomRightSelectionHandle')[0];

    expect(topLeftSelectionHandle.style.display).toEqual('block');
    expect(bottomRightSelectionHandle.style.display).toEqual('block');
  });
});

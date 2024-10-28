describe('MultipleSelectionHandles', () => {
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

  it('should contain backward compatible CSS classes', () => {
    handsontable({
      width: 400,
      height: 400
    });

    selectCell(1, 1);

    const topSelectionHandle = spec().$container
      .find('.ht_master .htBorders div:first-child .topSelectionHandle');
    const bottomSelectionHandle = spec().$container
      .find('.ht_master .htBorders div:first-child .bottomSelectionHandle');
    const topSelectionHandleHitArea = spec().$container
      .find('.ht_master .htBorders div:first-child .topSelectionHandle-HitArea');
    const bottomSelectionHandleHitArea = spec().$container
      .find('.ht_master .htBorders div:first-child .bottomSelectionHandle-HitArea');

    // legacy CSS classes
    expect(topSelectionHandle[0]).toHaveClass('topLeftSelectionHandle');
    expect(bottomSelectionHandle[0]).toHaveClass('bottomRightSelectionHandle');
    expect(topSelectionHandleHitArea[0]).toHaveClass('topLeftSelectionHandle-HitArea');
    expect(bottomSelectionHandleHitArea[0]).toHaveClass('bottomRightSelectionHandle-HitArea');
  });
});

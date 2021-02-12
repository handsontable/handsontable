describe('Core header widths under a scale transform', () => {
  beforeEach(function() {
    this.$container = $('<div/>').appendTo('body');
  });

  afterEach(function() {
    destroy();
    this.$container.remove();
  });

  it('no scale', () => {
    handsontable({
      rowHeaders: true
    });

    const leftClone = $('.ht_clone_left')[0];
    expect(leftClone.getBoundingClientRect().width).toEqual(50);
    expect(leftClone.offsetWidth).toEqual(50);
  });

  it('scale(0.75)', () => {
    spec().$container.css('transform-origin', 'top left');
    spec().$container.css('transform', 'scale(0.75)');

    handsontable({
      rowHeaders: true
    });

    const leftClone = $('.ht_clone_left')[0];
    expect(leftClone.getBoundingClientRect().width).toEqual(50 * 0.75);
    expect(leftClone.offsetWidth).toEqual(50);
  });
});

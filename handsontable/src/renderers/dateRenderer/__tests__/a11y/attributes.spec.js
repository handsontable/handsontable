describe('a11y DOM attributes (ARIA tags)', () => {
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

  it('should add an `aria-haspopup=dialog` attribute to every date-typed cell', () => {
    handsontable({
      renderer: 'date',
    });

    expect(getCell(0, 0).getAttribute('aria-haspopup')).toEqual('dialog');
  });
});

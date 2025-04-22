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

  it('should add an `aria-invalid` attribute to every invalid cell', async() => {
    const hot = handsontable({
      data: [['a']],
      validator: 'numeric'
    });

    hot.validateCells();

    await sleep(50);

    expect(getCell(0, 0).getAttribute('aria-invalid')).toEqual('true');
  });
});

describe('CellDecorator (RTL mode)', () => {
  const id = 'testContainer';

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should render the cell without messing with "dir" attribute', () => {
    handsontable({
      data: [['foo']],
      renderer: 'base'
    });

    expect(getCell(0, 0).getAttribute('dir')).toBeNull();
  });
});

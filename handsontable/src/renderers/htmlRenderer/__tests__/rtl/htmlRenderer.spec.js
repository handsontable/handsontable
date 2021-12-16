describe('HTMLRenderer (RTL mode)', () => {
  const id = 'testContainer';

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$container = $(`<div id="${id}" style="width: 300px; height: 200px;"></div>`).appendTo('body');
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
      renderer: 'html'
    });

    expect(getCell(0, 0).getAttribute('dir')).toBeNull();
  });
});

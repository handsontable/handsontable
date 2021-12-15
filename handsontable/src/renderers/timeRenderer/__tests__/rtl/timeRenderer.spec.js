describe('TimeRenderer (RTL mode)', () => {
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

  it('should render the cell with "dir" attribute set as "ltr"', () => {
    const hot = handsontable({
      renderer: 'time',
    });

    const td = document.createElement('td');

    Handsontable.renderers.TimeRenderer(hot, td, 0, 0, 0, '', {});

    expect(td.dir).toBe('ltr');
  });
});

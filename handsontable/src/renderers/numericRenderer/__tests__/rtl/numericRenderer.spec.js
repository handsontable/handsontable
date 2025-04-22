describe('NumericRenderer (RTL mode)', () => {
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

  it('should render the cell with "dir" attribute set as "ltr" as long as the value is of a numeric-like type', () => {
    handsontable({
      data: [[1, '1', '1.1']],
      renderer: 'numeric'
    });

    expect(getCell(0, 0).getAttribute('dir')).toBe('ltr');
    expect(getCell(0, 1).getAttribute('dir')).toBe('ltr');
    expect(getCell(0, 2).getAttribute('dir')).toBe('ltr');
  });

  it('should render the cell without messing "dir" attribute as long as the value is not of a numeric-like type', () => {
    handsontable({
      data: [['1z', 'z', true]],
      renderer: 'numeric'
    });

    expect(getCell(0, 0).getAttribute('dir')).toBeNull();
    expect(getCell(0, 1).getAttribute('dir')).toBeNull();
    expect(getCell(0, 2).getAttribute('dir')).toBeNull();
  });
});

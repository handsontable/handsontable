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

  it('should add an `aria-haspopup` attribute to select-typed cells' +
    ' had been checked', () => {
    handsontable({
      data: [['test 1']],
      columns: [
        {
          type: 'select'
        }
      ]
    });

    expect(getCell(0, 0).getAttribute('aria-haspopup')).toEqual('listbox');
  });
});

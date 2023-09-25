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

  it('should add an `aria-checked` attribute to every checkbox-typed cell and mark it `checked` when the checkbox' +
    ' had been checked', () => {
    handsontable({
      data: [[false], [true], [false]],
      columns: [
        {
          type: 'checkbox'
        }
      ]
    });

    expect(getCell(0, 0).getAttribute('aria-checked')).toEqual('false');
    expect(getCell(1, 0).getAttribute('aria-checked')).toEqual('true');
    expect(getCell(2, 0).getAttribute('aria-checked')).toEqual('false');

    setDataAtCell(0, 0, true);

    expect(getCell(0, 0).getAttribute('aria-checked')).toEqual('true');

    $(getCell(2, 0, true).querySelector('input')).simulate('click');

    expect(getCell(2, 0).getAttribute('aria-checked')).toEqual('true');

    $(getCell(2, 0, true).querySelector('input')).simulate('click');

    expect(getCell(2, 0).getAttribute('aria-checked')).toEqual('false');
  });
});

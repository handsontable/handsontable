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

  it('should add an `aria-checked` attribute to every input of the checkbox-typed cells and mark it `checked` when' +
    ' the checkbox had been checked', () => {
    handsontable({
      data: [[false], [true], [false]],
      columns: [
        {
          type: 'checkbox'
        }
      ]
    });

    const getInputAtCell = (row, col) => getCell(row, col, true).querySelector('input');

    expect(getInputAtCell(0, 0).getAttribute('aria-checked')).toEqual('false');
    expect(getInputAtCell(1, 0).getAttribute('aria-checked')).toEqual('true');
    expect(getInputAtCell(2, 0).getAttribute('aria-checked')).toEqual('false');

    setDataAtCell(0, 0, true);

    expect(getInputAtCell(0, 0).getAttribute('aria-checked')).toEqual('true');

    $(getInputAtCell(2, 0)).simulate('click');

    expect(getInputAtCell(2, 0).getAttribute('aria-checked')).toEqual('true');

    $(getInputAtCell(2, 0)).simulate('click');

    expect(getInputAtCell(2, 0).getAttribute('aria-checked')).toEqual('false');
  });

  it('should add an `aria-label` attribute to every input of the checkbox-typed cells describing the current state' +
    ' of the checkbox', () => {
    handsontable({
      data: [[false], [true], [false]],
      columns: [
        {
          type: 'checkbox'
        }
      ]
    });

    const getInputAtCell = (row, col) => getCell(row, col, true).querySelector('input');

    expect(getInputAtCell(0, 0).getAttribute('aria-label')).toEqual('Unchecked');
    expect(getInputAtCell(1, 0).getAttribute('aria-label')).toEqual('Checked');
    expect(getInputAtCell(2, 0).getAttribute('aria-label')).toEqual('Unchecked');

    setDataAtCell(0, 0, true);

    expect(getInputAtCell(0, 0).getAttribute('aria-label')).toEqual('Checked');

    $(getInputAtCell(2, 0)).simulate('click');

    expect(getInputAtCell(2, 0).getAttribute('aria-label')).toEqual('Checked');

    $(getInputAtCell(2, 0)).simulate('click');

    expect(getInputAtCell(2, 0).getAttribute('aria-label')).toEqual('Unchecked');
  });

  it('should add an `role=checkbox` attribute to every input of the checkbox-typed cells and mark it `checked` when' +
    ' the checkbox had been checked', () => {
    handsontable({
      data: [[false], [true], [false]],
      columns: [
        {
          type: 'checkbox'
        }
      ]
    });

    const getInputAtCell = (row, col) => getCell(row, col, true).querySelector('input');

    expect(getInputAtCell(0, 0).getAttribute('role')).toEqual('checkbox');
    expect(getInputAtCell(1, 0).getAttribute('role')).toEqual('checkbox');
    expect(getInputAtCell(2, 0).getAttribute('role')).toEqual('checkbox');
  });
});

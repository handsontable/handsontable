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

  it('should add the `aria-expanded` attribute to a collapsible header - `true` if it\'s expanded, `false` otherwise', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      rowHeaders: true,
      colHeaders: true,
      nestedHeaders: [
        ['A0', { label: 'B0', colspan: 4 }, 'F0', 'G0', 'H0', 'I0', 'J0'],
        ['A1', { label: 'B1', colspan: 2 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
        ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
      ],
      collapsibleColumns: true
    });

    expect(getCell(-3, 1).getAttribute('aria-expanded')).toEqual('true');
    expect(getCell(-2, 1).getAttribute('aria-expanded')).toEqual('true');

    hot.getPlugin('collapsibleColumns').collapseAll();

    expect(getCell(-3, 1).getAttribute('aria-expanded')).toEqual('false');
    expect(getCell(-2, 1).getAttribute('aria-expanded')).toEqual('false');

    hot.getPlugin('collapsibleColumns').expandAll();

    expect(getCell(-3, 1).getAttribute('aria-expanded')).toEqual('true');
    expect(getCell(-2, 1).getAttribute('aria-expanded')).toEqual('true');
  });

  it('should add the `aria-hidden` attribute to the collapse/expand button', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      rowHeaders: true,
      colHeaders: true,
      nestedHeaders: [
        ['A0', { label: 'B0', colspan: 4 }, 'F0', 'G0', 'H0', 'I0', 'J0'],
        ['A1', { label: 'B1', colspan: 2 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
        ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
      ],
      collapsibleColumns: true
    });

    expect(getCell(-3, 1).querySelector('.collapsibleIndicator').getAttribute('aria-hidden')).toEqual('true');
    expect(getCell(-2, 1).querySelector('.collapsibleIndicator').getAttribute('aria-hidden')).toEqual('true');

    hot.getPlugin('collapsibleColumns').collapseAll();

    expect(getCell(-3, 1).querySelector('.collapsibleIndicator').getAttribute('aria-hidden')).toEqual('true');
    expect(getCell(-2, 1).querySelector('.collapsibleIndicator').getAttribute('aria-hidden')).toEqual('true');

    hot.getPlugin('collapsibleColumns').expandAll();

    expect(getCell(-3, 1).querySelector('.collapsibleIndicator').getAttribute('aria-hidden')).toEqual('true');
    expect(getCell(-2, 1).querySelector('.collapsibleIndicator').getAttribute('aria-hidden')).toEqual('true');
  });
});

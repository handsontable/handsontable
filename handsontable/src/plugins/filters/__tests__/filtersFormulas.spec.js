import HyperFormula from 'hyperformula';

describe('Filters with formulas', () => {
  const id = 'testContainer';
  const data = [
    ['=SUM(B1:B2)', 1, '=A$1'],
    ['=$B1', 2, '=SUM(A1:A2)'],
  ];

  beforeAll(() => {
    // Note: please keep in mind that this language will be registered for all e2e tests!
    // It's stored globally for already loaded Handsontable library.

    Handsontable.languages.registerLanguageDictionary({
      languageCode: 'longerForTests',
      'Filters:conditions.isEmpty': 'This is very long text for conditional menu item'
    });
  });

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should filter cell with relative formula in the first cell', async() => {
    const hot = handsontable({
      data,
      columnHeaders: true,
      filters: true,
      formulas: {
        engine: HyperFormula
      },
      dropdownMenu: true,
      width: 500,
      height: 300
    });
    const plugin = hot.getPlugin('filters');

    plugin.addCondition(0, 'eq', ['3']);
    plugin.filter();

    expect(getData()[0][0]).toBe(3);
  });

  it('should filter cell with absolute formula in the first cell', async() => {
    const hot = handsontable({
      data,
      columnHeaders: true,
      filters: true,
      formulas: {
        engine: HyperFormula
      },
      dropdownMenu: true,
      width: 500,
      height: 300
    });
    const plugin = hot.getPlugin('filters');

    plugin.addCondition(1, 'eq', ['1']);
    plugin.filter();

    expect(getData()[0][0]).toBe(3);
  });

  it('should filter cell with absolute formula in the cell', async() => {
    const hot = handsontable({
      data,
      columnHeaders: true,
      filters: true,
      formulas: {
        engine: HyperFormula
      },
      dropdownMenu: true,
      width: 500,
      height: 300
    });
    const plugin = hot.getPlugin('filters');

    plugin.addCondition(2, 'eq', ['3']);
    plugin.filter();

    expect(getData()[0][2]).toBe(3);
  });

  it('should filter cell with relative formula in the cell', async() => {
    const hot = handsontable({
      data,
      columnHeaders: true,
      filters: true,
      formulas: {
        engine: HyperFormula
      },
      dropdownMenu: true,
      width: 500,
      height: 300
    });
    const plugin = hot.getPlugin('filters');

    plugin.addCondition(2, 'eq', ['4']);
    plugin.filter();

    expect(getData()[0][2]).toBe(4);
  });
});

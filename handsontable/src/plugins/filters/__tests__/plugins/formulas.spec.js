import HyperFormula from 'hyperformula';

describe('Filters UI cooperation with Formulas', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('numeric cells', () => {
    const data = [
      ['=SUM(B1:B2)', 1, '=A$1'],
      ['=$B1', 2, '=SUM(A1:A2)'],
    ];

    it('should filter cell with relative formula in the first cell', async() => {
      const hot = handsontable({
        data,
        colHeaders: true,
        filters: true,
        formulas: {
          engine: HyperFormula
        },
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

  describe('text cells', () => {
    const data = [
      ['=B1&B2', 'foo', '=A$1'],
      ['=$B1', 'bar', '=A1&A2'],
    ];

    it('should filter cell with relative formula in the first cell', async() => {
      const hot = handsontable({
        data,
        colHeaders: true,
        filters: true,
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });
      const plugin = hot.getPlugin('filters');

      plugin.addCondition(0, 'by_value', [['foobar']]);
      plugin.filter();

      expect(getData()[0][0]).toBe('foobar');
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

      plugin.addCondition(1, 'by_value', [['foo']]);
      plugin.filter();

      expect(getData()[0][0]).toBe('foobar');
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

      plugin.addCondition(2, 'by_value', [['foobar']]);
      plugin.filter();

      expect(getData()[0][2]).toBe('foobar');
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

      plugin.addCondition(2, 'by_value', [['foobarfoo']]);
      plugin.filter();

      expect(getData()[0][2]).toBe('foobarfoo');
    });
  });
});

import HyperFormula from 'hyperformula';

const fillHandleSelector = '.wtBorder.current.corner';

const autofill = (endRow, endCol) => {
  spec().$container.find(fillHandleSelector).simulate('mousedown');

  spec().$container
    .find(`tbody tr:eq(${endRow}) td:eq(${endCol})`)
    .simulate('mouseover')
    .simulate('mouseup');
};

describe('Formulas general', () => {
  const debug = false;
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (debug) {
      return;
    }

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should initialize the plugin properly with an array of arrays', () => {
    const hot = handsontable({
      data: [['10', '=A1 * 2']],
      formulas: {
        engine: HyperFormula
      }
    });

    expect(hot.getSourceData()).toEqual([['10', '=A1 * 2']]);
  });

  it('should initialize the plugin properly with an array of objects', () => {
    const hot = handsontable({
      data: [
        { num: 1, double: '=A1 * 2' },
        { num: 2, double: '=A2 * 2' },
        { num: 3, double: '=A3 * 2' },
        { num: 4, double: '=A4 * 2' },
        { num: 5, double: '=A5 * 2' },
      ],
      formulas: {
        engine: HyperFormula
      },
      columns: [{ data: 'num' }, { data: 'double' }]
    });

    expect(hot.getSourceDataArray()).toEqual([
      [1, '=A1 * 2'],
      [2, '=A2 * 2'],
      [3, '=A3 * 2'],
      [4, '=A4 * 2'],
      [5, '=A5 * 2']
    ]);

    hot.setDataAtCell(0, 0, 10);

    expect(hot.getSourceDataArray()).toEqual([
      [10, '=A1 * 2'],
      [2, '=A2 * 2'],
      [3, '=A3 * 2'],
      [4, '=A4 * 2'],
      [5, '=A5 * 2']
    ]);
  });

  it('should calculate table (simple example)', () => {
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300
    });

    expect(hot.getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
    expect(hot.getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, '=SUM(E5)']);
  });

  it('should calculate table (advanced example)', () => {
    const hot = handsontable({
      data: getDataAdvancedExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300
    });

    expect(hot.getDataAtRow(0)).toEqual(['Example #1', '', '', '', '', '', '', '']);
    expect(hot.getDataAtRow(1)).toEqual(['Text', 'yellow', 'red', 'blue', 'green', 'pink', 'gray', '']);
    expect(hot.getDataAtRow(2)).toEqual(['Yellow dog on green grass', 'yellow', '', '', 'green', '', '', '']);
    expect(hot.getDataAtRow(3)).toEqual(['Gray sweater with blue stripes', '', '', 'blue', '', '', 'gray', '']);
    expect(hot.getDataAtRow(4)).toEqual(['A red sun on a pink horizon', '', 'red', '', '', 'pink', '', '']);
    expect(hot.getDataAtRow(5)).toEqual(['Blue neon signs everywhere', '', '', 'blue', '', '', '', '']);
    expect(hot.getDataAtRow(6)).toEqual(['Waves of blue and green', '', '', 'blue', 'green', '', '', '']);
    expect(hot.getDataAtRow(7)).toEqual(['Hot pink socks and gray socks', '', '', '', '', 'pink', 'gray', '']);
    expect(hot.getDataAtRow(8)).toEqual(['Deep blue eyes', '', '', 'blue', '', '', '', '']);
    expect(hot.getDataAtRow(9)).toEqual(['Count of colors', 1, 1, 4, 2, 2, 2, 'SUM: 12']);
    expect(hot.getDataAtRow(10)).toEqual(['', '', '', '', '', '', '', '']);
    expect(hot.getDataAtRow(11)).toEqual(['Example #2', '', '', '', '', '', '', '']);
    expect(hot.getDataAtRow(12)).toEqual(['Name', 'Email', 'Email domain', '', '', '', '', '']);
    expect(hot.getDataAtRow(13)).toEqual(['Ann Chang', 'achang@maaker.com', 'maaker.com', '', '', '', '', '']);
    expect(hot.getDataAtRow(14)).toEqual(['Jan Siuk', 'jan@yahoo.com', 'yahoo.com', '', '', '', '', '']);
    expect(hot.getDataAtRow(15)).toEqual(['Ken Siuk', 'ken@gmail.com', 'gmail.com', '', '', '', '', '']);
    expect(hot.getDataAtRow(16)).toEqual(['Marcin Kowalski', 'ken@syndex.pl', 'syndex.pl', '', '', '', '', '']);
  });

  // TODO was semicolon, now comma?
  it('should calculate table with comma as separator of formula arguments', () => {
    const data = getDataSimpleExampleFormulas();

    data[2][4] = '=SUM(A4,2,3)';
    data[4][2] = '=SUM(B5,E3)';

    const hot = handsontable({
      data,
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300
    });

    expect(hot.getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
    expect(hot.getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, '=SUM(E5)']);
  });

  it('should recalculate table with formulas defined where the next cell is depend on the previous cell', () => {
    const afterChange = jasmine.createSpy();
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300,
      afterChange,
    });

    hot.setDataAtCell(0, 1, '=B5');
    hot.setDataAtCell(0, 2, '=B1');
    hot.setDataAtCell(0, 3, '=C1');
    hot.setDataAtCell(4, 5, '=D1');

    expect(hot.getDataAtRow(0)).toEqual([0, 8042, 8042, 8042, 'Mini', 0]);
    expect(hot.getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 8042]);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, 8042]);

    hot.setDataAtCell(1, 0, 10);

    expect(hot.getDataAtRow(0)).toEqual([0, 6043, 6043, 6043, 'Mini', 0]);
    expect(hot.getDataAtRow(1)).toEqual([10, 0, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 6043]);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 6043, 8059, '#DIV/0!', 12, 6043]);
  });

  it('should omit leading apostrophe characters from `getData`, but not `getSourceData`', () => {
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300
    });

    expect(hot.getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
    expect(hot.getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, '=SUM(E5)']);

    expect(hot.getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
    expect(hot.getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(hot.getSourceDataAtRow(2)).toEqual([2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1']);
    expect(hot.getSourceDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getSourceDataAtRow(4)).toEqual([2012, '=SUM(A2:A5)', '=SUM(B5,E3)', '=A2/B2', 12, '\'=SUM(E5)']);
  });

  it('should throw error while parsing invalid cell coordinates syntax', () => {
    const data = getDataSimpleExampleFormulas();

    data[0][0] = '=SUM($$A4;2;3)';
    data[0][1] = '=A$$$$$1';
    data[0][2] = '=A1$';
    data[0][3] = '=SUM(A2:D2$)';

    const hot = handsontable({
      data,
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300
    });

    hot.setDataAtCell(2, 0, '=A1$');
    hot.setDataAtCell(3, 0, '=$A$$1');

    expect(hot.getDataAtRow(0)).toEqual(['#ERROR!', '#ERROR!', '#ERROR!', '#ERROR!', 'Mini', '#ERROR!']);
    expect(hot.getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual(['#ERROR!', 5, 2905, 2867, '#ERROR!', '#ERROR!']);
    expect(hot.getDataAtRow(3)).toEqual(['#ERROR!', 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, '#ERROR!', '#ERROR!', '#DIV/0!', 12, '=SUM(E5)']);
  });

  it('should not throw on `updateSettings` with an object that doesn\'t contain an `engine` key', () => {
    const hot = handsontable({
      data: [[]],
      formulas: {
        engine: HyperFormula
      }
    });

    expect(() => hot.updateSettings({
      colWidths() {
        return 400;
      }
    })).not.toThrow();
  });

  it('should return correct values according to plugin state updated by updateSettings()', () => {
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300
    });

    hot.updateSettings({ formulas: false });

    expect(hot.getDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
    expect(hot.getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, '=Sum(a2:a5)', '=SUM(B5,E3)', '=A2/B2', 12, '\'=SUM(E5)']);

    hot.updateSettings({
      formulas: {
        engine: HyperFormula
      }
    });

    expect(hot.getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
    expect(hot.getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, '=SUM(E5)']);
  });

  it('should return correct values according to plugin state updated by disablePlugin/enablePlugin methods', () => {
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300
    });

    hot.getPlugin('formulas').disablePlugin();
    hot.render();

    expect(hot.getDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
    expect(hot.getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, '=Sum(a2:a5)', '=SUM(B5,E3)', '=A2/B2', 12, '\'=SUM(E5)']);

    hot.getPlugin('formulas').enablePlugin();
    hot.render();

    expect(hot.getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
    expect(hot.getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, '=SUM(E5)']);
  });

  it('should recalculate table after changing cell value (setDataAtCell)', () => {
    const afterChange = jasmine.createSpy();
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300,
      afterChange,
    });

    hot.setDataAtCell(1, 1, 20);

    expect(hot.getDataAtRow(0)).toEqual([20, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 20]);
    expect(hot.getDataAtRow(1)).toEqual([2009, 20, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, 100.45, 12, '=SUM(E5)']);
    expect(afterChange.calls.argsFor(1)).toEqual([[[1, 1, 0, 20]], 'edit']);
  });

  it('should recalculate table after changing source cell value (setSourceDataAtCell)', () => {
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300
    });

    hot.setSourceDataAtCell(1, 1, 20);

    expect(hot.getDataAtRow(0)).toEqual([20, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 20]);
    expect(hot.getDataAtRow(1)).toEqual([2009, 20, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, 100.45, 12, '=SUM(E5)']);
  });

  it('should recalculate table after changing cell value into formula expression written in lower case', () => {
    const afterChange = jasmine.createSpy();
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300,
      afterChange,
    });

    hot.setDataAtCell(1, 1, '=Sum(a2:A4)');

    expect(hot.getDataAtRow(0)).toEqual([6030, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 6030]);
    expect(hot.getDataAtRow(1)).toEqual([2009, 6030, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, 0.333167495854063, 12, '=SUM(E5)']);
    expect(afterChange.calls.argsFor(1)).toEqual([[[1, 1, 0, '=Sum(a2:A4)']], 'edit']);
  });

  it('should prevent recalculate table after changing cell value into escaped formula expression', () => {
    const afterChange = jasmine.createSpy();
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300,
      afterChange,
    });

    hot.setDataAtCell(1, 1, '\'=SUM(A2:A4)');

    expect(hot.getDataAtRow(0)).toEqual(['=SUM(A2:A4)', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=SUM(A2:A4)']);
    expect(hot.getDataAtRow(1)).toEqual([2009, '=SUM(A2:A4)', 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, '#VALUE!', 12, '=SUM(E5)']);
    expect(afterChange.calls.argsFor(1))
      .toEqual([[[1, 1, 0, '\'=SUM(A2:A4)']], 'edit']);
  });

  it('should recalculate table after changing cell value from escaped formula expression into valid formula expression',
    () => {
      const afterChange = jasmine.createSpy();
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300,
        afterChange,
      });

      hot.setDataAtCell(4, 5, hot.getDataAtCell(4, 5));

      expect(hot.getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
      expect(hot.getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
      expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, 12]);
      expect(afterChange.calls.argsFor(1))
        .toEqual([[[4, 5, '\'=SUM(E5)', '=SUM(E5)']], 'edit']);
    });

  it('should recalculate table after changing cell value from primitive value into formula expression', () => {
    const afterChange = jasmine.createSpy();
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300,
      afterChange,
    });

    hot.setDataAtCell(1, 1, '=SUM(A2:A4)');

    expect(hot.getDataAtRow(0)).toEqual([6030, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 6030]);
    expect(hot.getDataAtRow(1)).toEqual([2009, 6030, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, 0.333167495854063, 12, '=SUM(E5)']);
    expect(afterChange.calls.argsFor(1)).toEqual([[[1, 1, 0, '=SUM(A2:A4)']], 'edit']);
  });

  it('should recalculate table after changing cell value from formula expression into primitive value', () => {
    const afterChange = jasmine.createSpy();
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300,
      afterChange,
    });

    hot.setDataAtCell(4, 1, 15);

    expect(hot.getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
    expect(hot.getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 15, 2031, '#DIV/0!', 12, '=SUM(E5)']);
    expect(afterChange.calls.argsFor(1))
      .toEqual([[[4, 1, '=SUM(A2:A5)', 15]], 'edit']);
  });

  it('should recalculate table after changing cell value from formula expression into another formula expression',
    () => {
      const afterChange = jasmine.createSpy();
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300,
        afterChange,
      });

      hot.setDataAtCell(4, 1, '=SUM(A2:A4)');

      expect(hot.getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
      expect(hot.getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
      expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getDataAtRow(4)).toEqual([2012, 6030, 8046, '#DIV/0!', 12, '=SUM(E5)']);
      expect(afterChange.calls.argsFor(1))
        .toEqual([[[4, 1, '=SUM(A2:A5)', '=SUM(A2:A4)']], 'edit']);
    });

  it('should correctly recalculate formulas when precedents cells are located out of table viewport', () => {
    const hot = handsontable({
      data: getDataForFormulas(0, 'name', ['=B39']),
      columns: getColumnsForFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 200
    });

    hot.setDataAtCell(38, 1, 'foo bar');

    expect(hot.getDataAtCell(0, 1)).toBe('foo bar');
  });

  it('should mark cell with circular dependency as #CYCLE!', () => {
    const hot = handsontable({
      data: getDataForFormulas(0, 'name', ['=B1']),
      columns: getColumnsForFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#CYCLE!');
  });

  // Discussion on why `null` instead of `#REF!` at
  // https://github.com/handsontable/handsontable/issues/7668
  describe('Out of range cells', () => {
    it('should return null for columns', () => {
      const hot = handsontable({
        data: getDataForFormulas(0, 'name', ['=K1']),
        columns: getColumnsForFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      // evaluateNullToZero is enabled by default
      expect(hot.getDataAtCell(0, 1)).toBe(0);
    });

    it('should return null for rows', () => {
      const hot = handsontable({
        data: getDataForFormulas(0, 'name', ['=A1000']),
        columns: getColumnsForFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      // evaluateNullToZero is enabled by default
      expect(hot.getDataAtCell(0, 1)).toBe(0);
    });
  });

  it('should recalculate volatile functions upon data changes', () => {
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300
    });

    hot.setDataAtCell(0, 0, '=RAND()');

    const firstCellBefore = hot.getDataAtCell(0, 0);

    expect(hot.getDataAtRow(0)).toEqual([firstCellBefore, 'Maserati', 'Mazda', 'Mercedes', 'Mini', firstCellBefore]);
    expect(hot.getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, '=SUM(E5)']);

    hot.setDataAtCell(1, 1, 10);

    const firstCellAfter = hot.getDataAtCell(0, 0);

    expect(firstCellBefore).not.toEqual(firstCellAfter);

    expect(hot.getDataAtRow(0)).toEqual([firstCellAfter, 'Maserati', 'Mazda', 'Mercedes', 'Mini', firstCellAfter]);
    expect(hot.getDataAtRow(1)).toEqual([2009, 10, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, 200.9, 12, '=SUM(E5)']);
  });

  describe('alter table (insert row)', () => {
    it('should recalculate table after added new empty rows', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300,
      });

      hot.alter('insert_row', 1, 2);

      expect(hot.getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
      expect(hot.getDataAtRow(1)).toEqual([null, null, null, null, null, null]);
      expect(hot.getDataAtRow(2)).toEqual([null, null, null, null, null, null]);
      expect(hot.getDataAtRow(3)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(hot.getDataAtRow(4)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
      expect(hot.getDataAtRow(5)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getDataAtRow(6)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, '=SUM(E5)']);
    });

    it('should recalculate table after changing values into newly added row', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      hot.alter('insert_row', 2, 3);
      hot.setDataAtCell(3, 0, 2234);

      expect(hot.getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
      expect(hot.getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(hot.getDataAtRow(2)).toEqual([null, null, null, null, null, null]);
      expect(hot.getDataAtRow(3)).toEqual([2234, null, null, null, null, null]);
      expect(hot.getDataAtRow(4)).toEqual([null, null, null, null, null, null]);
      expect(hot.getDataAtRow(5)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
      expect(hot.getDataAtRow(6)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getDataAtRow(7)).toEqual([2012, 10276, 12292, '#DIV/0!', 12, '=SUM(E5)']);
    });
  });

  describe('alter table (insert column)', () => {
    it('should recalculate table after added new empty columns', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300,
        contextMenu: true,
      });

      hot.alter('insert_col', 1, 2);

      expect(hot.getDataAtRow(0)).toEqual([0, null, null, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
      expect(hot.getDataAtRow(1)).toEqual([2009, null, null, 0, 2941, 4303, 354, 5814]);
      expect(hot.getDataAtRow(2)).toEqual([2010, null, null, 5, 2905, 2867, 2016, 'Maserati']);
      expect(hot.getDataAtRow(3)).toEqual([2011, null, null, 4, 2517, 4822, 552, 6127]);
      expect(hot.getDataAtRow(4)).toEqual([2012, null, null, 8042, 10058, '#DIV/0!', 12, '=SUM(E5)']);
    });

    it('should recalculate table after changing values into newly added column', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300,
        contextMenu: true,
      });

      hot.alter('insert_col', 1, 2);
      hot.setDataAtCell(1, 3, 2);

      expect(hot.getDataAtRow(0)).toEqual([2, null, null, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 2]);
      expect(hot.getDataAtRow(1)).toEqual([2009, null, null, 2, 2941, 4303, 354, 5814]);
      expect(hot.getDataAtRow(2)).toEqual([2010, null, null, 5, 2905, 2867, 2016, 'Maserati']);
      expect(hot.getDataAtRow(3)).toEqual([2011, null, null, 4, 2517, 4822, 552, 6127]);
      expect(hot.getDataAtRow(4)).toEqual([2012, null, null, 8042, 10058, 1004.5, 12, '=SUM(E5)']);
    });
  });

  describe('alter table (remove row)', () => {
    it('should recalculate table after removed rows', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      hot.alter('remove_row', 1, 1);

      expect(hot.getDataAtRow(0)).toEqual(['#REF!', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '#REF!']);
      expect(hot.getDataAtRow(1)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
      expect(hot.getDataAtRow(2)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getDataAtRow(3)).toEqual([2012, 6033, 8049, '#REF!', 12, '=SUM(E5)']);
    });

    it('should recalculate table and replace coordinates in formula expressions into #REF! value (removing 2 rows)',
      () => {
        const hot = handsontable({
          data: getDataSimpleExampleFormulas(),
          formulas: {
            engine: HyperFormula
          },
          width: 500,
          height: 300
        });

        hot.alter('remove_row', 1, 2);

        expect(hot.getSourceDataAtRow(0)).toEqual(['=#REF!', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
        expect(hot.getSourceDataAtRow(1)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
        expect(hot.getSourceDataAtRow(2))
          .toEqual([2012, '=SUM(A2:A3)', '=SUM(B3,#REF!)', '=#REF!/#REF!', 12, '\'=SUM(E5)']);
        expect(hot.getDataAtRow(0)).toEqual(['#REF!', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '#REF!']);
        expect(hot.getDataAtRow(1)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
        expect(hot.getDataAtRow(2)).toEqual([2012, 4023, '#REF!', '#REF!', 12, '=SUM(E5)']);
      });

    it('should recalculate table and replace coordinates in formula expressions ' +
      'into #REF! value (removing first 4 rows)', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      hot.alter('remove_row', 0, 4);

      expect(hot.getSourceDataAtRow(0))
        .toEqual([2012, '=SUM(A1:A1)', '=SUM(B1,#REF!)', '=#REF!/#REF!', 12, '\'=SUM(E5)']);
      expect(hot.getDataAtRow(0)).toEqual([2012, 2012, '#REF!', '#REF!', 12, '=SUM(E5)']);
    });

    it('should recalculate table and update formula expression after removing rows ' +
      'intersected on the bottom of cell range', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      hot.alter('insert_row', 3, 2);
      hot.setDataAtCell(6, 1, '=SUM(A2:A4)');

      hot.alter('remove_row', 2, 3);

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(2)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(3)).toEqual([2012, '=SUM(A2:A2)', '=SUM(B4,#REF!)', '=A2/B2', 12, '\'=SUM(E5)']);
      expect(hot.getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
      expect(hot.getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(hot.getDataAtRow(2)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getDataAtRow(3)).toEqual([2012, 2009, '#REF!', '#DIV/0!', 12, '=SUM(E5)']);
    });

    it('should recalculate table and update formula expression after removing rows intersected ' +
      'on the top of cell range', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      hot.setDataAtCell(4, 1, '=SUM(A2:A4)');

      hot.alter('remove_row', 0, 2);

      expect(hot.getSourceDataAtRow(0)).toEqual([2010, 5, 2905, 2867, '=SUM(A2,2,3)', '=#REF!']);
      expect(hot.getSourceDataAtRow(1)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(2))
        .toEqual([2012, '=SUM(A1:A2)', '=SUM(B3,E1)', '=#REF!/#REF!', 12, '\'=SUM(E5)']);
      expect(hot.getDataAtRow(0)).toEqual([2010, 5, 2905, 2867, 2016, '#REF!']);
      expect(hot.getDataAtRow(1)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getDataAtRow(2)).toEqual([2012, 4021, 6037, '#REF!', 12, '=SUM(E5)']);
    });

    it('should recalculate table and update formula expression after removing rows contains whole cell range', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      hot.alter('insert_row', 3, 2);
      hot.setDataAtCell(6, 1, '=SUM(A2:A4)');

      hot.alter('remove_row', 0, 4);

      expect(hot.getSourceDataAtRow(0)).toEqual([null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(1)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(2))
        .toEqual([2012, '=SUM(#REF!)', '=SUM(B3,#REF!)', '=#REF!/#REF!', 12, '\'=SUM(E5)']);
      expect(hot.getDataAtRow(0)).toEqual([null, null, null, null, null, null]);
      expect(hot.getDataAtRow(1)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getDataAtRow(2)).toEqual([2012, '#REF!', '#REF!', '#REF!', 12, '=SUM(E5)']);
    });
  });

  describe('alter table (remove column)', () => {
    it('should recalculate table after removed columns', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      hot.alter('remove_col', 1, 1);

      expect(hot.getSourceDataAtRow(0)).toEqual(['=#REF!', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([2009, 2941, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(2)).toEqual([2010, 2905, 2867, '=SUM(A4,2,3)', '=#REF!']);
      expect(hot.getSourceDataAtRow(3)).toEqual([2011, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(4)).toEqual([2012, '=SUM(#REF!,D3)', '=A2/#REF!', 12, '\'=SUM(E5)']);
      expect(hot.getDataAtRow(0)).toEqual(['#REF!', 'Mazda', 'Mercedes', 'Mini', '#REF!']);
      expect(hot.getDataAtRow(1)).toEqual([2009, 2941, 4303, 354, 5814]);
      expect(hot.getDataAtRow(2)).toEqual([2010, 2905, 2867, 2016, '#REF!']);
      expect(hot.getDataAtRow(3)).toEqual([2011, 2517, 4822, 552, 6127]);
      expect(hot.getDataAtRow(4)).toEqual([2012, '#REF!', '#REF!', 12, '=SUM(E5)']);
    });

    it('should recalculate table and replace coordinates in formula expressions into #REF! ' +
      'value (removing 2 columns)', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      hot.alter('remove_col', 1, 2);

      expect(hot.getSourceDataAtRow(0)).toEqual(['=#REF!', 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([2009, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(2)).toEqual([2010, 2867, '=SUM(A4,2,3)', '=#REF!']);
      expect(hot.getSourceDataAtRow(3)).toEqual([2011, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(4)).toEqual([2012, '=A2/#REF!', 12, '\'=SUM(E5)']);
      expect(hot.getDataAtRow(0)).toEqual(['#REF!', 'Mercedes', 'Mini', '#REF!']);
      expect(hot.getDataAtRow(1)).toEqual([2009, 4303, 354, 5814]);
      expect(hot.getDataAtRow(2)).toEqual([2010, 2867, 2016, '#REF!']);
      expect(hot.getDataAtRow(3)).toEqual([2011, 4822, 552, 6127]);
      expect(hot.getDataAtRow(4)).toEqual([2012, '#REF!', 12, '=SUM(E5)']);
    });

    it('should recalculate table and replace coordinates in formula expressions into #REF! value ' +
      '(removing first 4 columns)', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      hot.alter('remove_col', 0, 4);

      expect(hot.getSourceDataAtRow(0)).toEqual(['Mini', '=#REF!']);
      expect(hot.getSourceDataAtRow(1)).toEqual([354, 5814]);
      expect(hot.getSourceDataAtRow(2)).toEqual(['=SUM(#REF!,2,3)', '=#REF!']);
      expect(hot.getSourceDataAtRow(3)).toEqual([552, 6127]);
      expect(hot.getSourceDataAtRow(4)).toEqual([12, '\'=SUM(E5)']);
      expect(hot.getDataAtRow(0)).toEqual(['Mini', '#REF!']);
      expect(hot.getDataAtRow(1)).toEqual([354, 5814]);
      expect(hot.getDataAtRow(2)).toEqual(['#REF!', '#REF!']);
      expect(hot.getDataAtRow(3)).toEqual([552, 6127]);
      expect(hot.getDataAtRow(4)).toEqual([12, '=SUM(E5)']);
    });

    it('should recalculate table and update formula expression after removing columns intersected ' +
      'on the right of cell range', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      hot.setDataAtCell(1, 5, '=Sum(B2:D2)');

      hot.alter('remove_col', 2, 3);

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([2009, 0, '=SUM(B2:B2)']);
      expect(hot.getSourceDataAtRow(2)).toEqual([2010, 5, '=$B1']);
      expect(hot.getSourceDataAtRow(3)).toEqual([2011, 4, 6127]);
      expect(hot.getSourceDataAtRow(4)).toEqual([2012, '=SUM(A2:A5)', '\'=SUM(E5)']);
      expect(hot.getDataAtRow(0)).toEqual([0, 'Maserati', 0]);
      expect(hot.getDataAtRow(1)).toEqual([2009, 0, 0]);
      expect(hot.getDataAtRow(2)).toEqual([2010, 5, 'Maserati']);
      expect(hot.getDataAtRow(3)).toEqual([2011, 4, 6127]);
      expect(hot.getDataAtRow(4)).toEqual([2012, 8042, '=SUM(E5)']);
    });

    it('should recalculate table and update formula expression after removing columns intersected ' +
      'on the left of cell range', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      hot.setDataAtCell(1, 5, '=Sum(B2:D2)');

      hot.alter('remove_col', 0, 3);

      expect(hot.getSourceDataAtRow(0)).toEqual(['Mercedes', 'Mini', '=#REF!']);
      expect(hot.getSourceDataAtRow(1)).toEqual([4303, 354, '=SUM(A2:A2)']);
      expect(hot.getSourceDataAtRow(2)).toEqual([2867, '=SUM(#REF!,2,3)', '=#REF!']);
      expect(hot.getSourceDataAtRow(3)).toEqual([4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(4)).toEqual(['=#REF!/#REF!', 12, '\'=SUM(E5)']);
      expect(hot.getDataAtRow(0)).toEqual(['Mercedes', 'Mini', '#REF!']);
      expect(hot.getDataAtRow(1)).toEqual([4303, 354, 4303]);
      expect(hot.getDataAtRow(2)).toEqual([2867, '#REF!', '#REF!']);
      expect(hot.getDataAtRow(3)).toEqual([4822, 552, 6127]);
      expect(hot.getDataAtRow(4)).toEqual(['#REF!', 12, '=SUM(E5)']);
    });

    it('should recalculate table and update formula expression after removing columns ' +
      'contains whole cell range', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      hot.setDataAtCell(1, 5, '=Sum(B2:D2)');

      hot.alter('remove_col', 0, 4);

      expect(hot.getSourceDataAtRow(0)).toEqual(['Mini', '=#REF!']);
      expect(hot.getSourceDataAtRow(1)).toEqual([354, '=SUM(#REF!)']);
      expect(hot.getSourceDataAtRow(2)).toEqual(['=SUM(#REF!,2,3)', '=#REF!']);
      expect(hot.getSourceDataAtRow(3)).toEqual([552, 6127]);
      expect(hot.getSourceDataAtRow(4)).toEqual([12, '\'=SUM(E5)']);
      expect(hot.getDataAtRow(0)).toEqual(['Mini', '#REF!']);
      expect(hot.getDataAtRow(1)).toEqual([354, '#REF!']);
      expect(hot.getDataAtRow(2)).toEqual(['#REF!', '#REF!']);
      expect(hot.getDataAtRow(3)).toEqual([552, 6127]);
      expect(hot.getDataAtRow(4)).toEqual([12, '=SUM(E5)']);
    });
  });

  describe('alter table (mixed operations)', () => {
    it('should recalculate table and replace coordinates in formula expressions', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      hot.alter('remove_col', 3);
      hot.alter('remove_row', 2);
      hot.alter('remove_row', 2);
      hot.alter('insert_row', 0);
      hot.alter('remove_col', 3);
      hot.alter('insert_col', 3);

      expect(hot.getSourceDataAtRow(0)).toEqual([null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(1)).toEqual(['=$B$3', 'Maserati', 'Mazda', null, '=A$2']);
      expect(hot.getSourceDataAtRow(2)).toEqual([2009, 0, 2941, null, 5814]);
      expect(hot.getSourceDataAtRow(3)).toEqual([2012, '=SUM(A3:A4)', '=SUM(B4,#REF!)', null, '\'=SUM(E5)']);
      expect(hot.getDataAtRow(0)).toEqual([null, null, null, null, null]);
      expect(hot.getDataAtRow(1)).toEqual([0, 'Maserati', 'Mazda', null, 0]);
      expect(hot.getDataAtRow(2)).toEqual([2009, 0, 2941, null, 5814]);
      expect(hot.getDataAtRow(3)).toEqual([2012, 4021, '#REF!', null, '=SUM(E5)']);
    });
  });

  describe('undo/redo', () => {
    it('should restore previous edited formula expression and recalculate table after that', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      hot.setDataAtCell(0, 5, '=B5');
      hot.undo();

      expect(hot.getSourceDataAtCell(0, 5)).toBe('=A$1');
      expect(hot.getDataAtCell(0, 5)).toBe(0);

      hot.redo();

      expect(hot.getSourceDataAtCell(0, 5)).toBe('=B5');
      expect(hot.getDataAtCell(0, 5)).toBe(8042);
    });

    it('should restore previous state after alter table (mixed insert operations)', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300,
        contextMenu: true,
      });

      hot.alter('insert_row', 1, 3);
      hot.alter('insert_col', 1);
      hot.alter('insert_col', 4, 2);
      hot.alter('insert_row', 5);
      hot.undo();

      expect(hot.getSourceDataAtRow(0))
        .toEqual(['=$C$5', null, 'Maserati', 'Mazda', null, null, 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([null, null, null, null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(2)).toEqual([null, null, null, null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(3)).toEqual([null, null, null, null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(4)).toEqual([2009, null, 0, 2941, null, null, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(5)).toEqual([2010, null, 5, 2905, null, null, 2867, '=SUM(A7,2,3)', '=$C1']);
      expect(hot.getSourceDataAtRow(6)).toEqual([2011, null, 4, 2517, null, null, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(7))
        .toEqual([2012, null, '=SUM(A5:A8)', '=SUM(C8,H6)', null, null, '=A5/C5', 12, '\'=SUM(E5)']);

      hot.undo();

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$C$5', null, 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([null, null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(2)).toEqual([null, null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(3)).toEqual([null, null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(4)).toEqual([2009, null, 0, 2941, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(5)).toEqual([2010, null, 5, 2905, 2867, '=SUM(A7,2,3)', '=$C1']);
      expect(hot.getSourceDataAtRow(6)).toEqual([2011, null, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(7))
        .toEqual([2012, null, '=SUM(A5:A8)', '=SUM(C8,F6)', '=A5/C5', 12, '\'=SUM(E5)']);

      hot.undo();

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$B$5', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(2)).toEqual([null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(3)).toEqual([null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(4)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(5)).toEqual([2010, 5, 2905, 2867, '=SUM(A7,2,3)', '=$B1']);
      expect(hot.getSourceDataAtRow(6)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(7))
        .toEqual([2012, '=SUM(A5:A8)', '=SUM(B8,E6)', '=A5/B5', 12, '\'=SUM(E5)']);

      hot.undo();

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(2)).toEqual([2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1']);
      expect(hot.getSourceDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(4))
        .toEqual([2012, '=SUM(A2:A5)', '=SUM(B5,E3)', '=A2/B2', 12, '\'=SUM(E5)']);
    });

    it('should redo into the next state after alter table (mixed insert operations)', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300,
        contextMenu: true,
      });

      hot.alter('insert_row', 1, 3);
      hot.alter('insert_col', 1);
      hot.alter('insert_col', 4, 2);
      hot.alter('insert_row', 5);
      hot.undo();
      hot.undo();
      hot.undo();
      hot.undo();

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(2)).toEqual([2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1']);
      expect(hot.getSourceDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(4)).toEqual([2012, '=SUM(A2:A5)', '=SUM(B5,E3)', '=A2/B2', 12, '\'=SUM(E5)']);

      hot.redo();

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$B$5', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(2)).toEqual([null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(3)).toEqual([null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(4)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(5)).toEqual([2010, 5, 2905, 2867, '=SUM(A7,2,3)', '=$B1']);
      expect(hot.getSourceDataAtRow(6)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(7)).toEqual([2012, '=SUM(A5:A8)', '=SUM(B8,E6)', '=A5/B5', 12, '\'=SUM(E5)']);

      hot.redo();

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$C$5', null, 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([null, null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(2)).toEqual([null, null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(3)).toEqual([null, null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(4)).toEqual([2009, null, 0, 2941, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(5)).toEqual([2010, null, 5, 2905, 2867, '=SUM(A7,2,3)', '=$C1']);
      expect(hot.getSourceDataAtRow(6)).toEqual([2011, null, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(7)).toEqual([2012, null, '=SUM(A5:A8)', '=SUM(C8,F6)', '=A5/C5', 12, '\'=SUM(E5)']);

      hot.redo();

      expect(hot.getSourceDataAtRow(0))
        .toEqual(['=$C$5', null, 'Maserati', 'Mazda', null, null, 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([null, null, null, null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(2)).toEqual([null, null, null, null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(3)).toEqual([null, null, null, null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(4)).toEqual([2009, null, 0, 2941, null, null, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(5)).toEqual([2010, null, 5, 2905, null, null, 2867, '=SUM(A7,2,3)', '=$C1']);
      expect(hot.getSourceDataAtRow(6)).toEqual([2011, null, 4, 2517, null, null, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(7))
        .toEqual([2012, null, '=SUM(A5:A8)', '=SUM(C8,H6)', null, null, '=A5/C5', 12, '\'=SUM(E5)']);
    });

    xit('should restore previous state after alter table (mixed remove operations)', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300,
        contextMenu: true,
      });

      hot.alter('remove_row', 2);
      hot.alter('remove_col', 2, 2);
      hot.alter('remove_row', 0, 2);
      hot.alter('remove_col', 3);
      hot.undo();

      expect(hot.getSourceDataAtRow(0)).toEqual([2011, 4, 552, 6127]);
      expect(hot.getSourceDataAtRow(1)).toEqual([2012, '=SUM(A1:A2)', 12, '=SUM(E5)']);

      hot.undo();

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([2009, 0, 354, 5814]);
      expect(hot.getSourceDataAtRow(2)).toEqual([2011, 4, 552, 6127]);
      expect(hot.getSourceDataAtRow(3)).toEqual([2012, '=SUM(A2:A4)', 12, '=SUM(E5)']);

      hot.undo();

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(2)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(3)).toEqual([2012, '=SUM(A2:A4)', '=SUM(B4,#REF!)', '=A2/B2', 12, '=SUM(E5)']);

      hot.undo();

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(2)).toEqual([2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1']);
      expect(hot.getSourceDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(4)).toEqual([2012, '=Sum(a2:a5)', '=SUM(B5,E3)', '=A2/B2', 12, '=SUM(E5)']);
    });

    xit('should redo into the next state after alter table (mixed remove operations)', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300,
        contextMenu: true,
      });

      hot.alter('remove_row', 2);
      hot.alter('remove_col', 2, 2);
      hot.alter('remove_row', 0, 2);
      hot.alter('remove_col', 3);
      hot.undo();
      hot.undo();
      hot.undo();
      hot.undo();

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(2)).toEqual([2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1']);
      expect(hot.getSourceDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(4)).toEqual([2012, '=Sum(a2:a5)', '=SUM(B5,E3)', '=A2/B2', 12, '=SUM(E5)']);

      hot.redo();

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(2)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(3)).toEqual([2012, '=SUM(A2:A4)', '=SUM(B4,#REF!)', '=A2/B2', 12, '=SUM(E5)']);

      hot.redo();

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([2009, 0, 354, 5814]);
      expect(hot.getSourceDataAtRow(2)).toEqual([2011, 4, 552, 6127]);
      expect(hot.getSourceDataAtRow(3)).toEqual([2012, '=SUM(A2:A4)', 12, '=SUM(E5)']);

      hot.redo();

      expect(hot.getSourceDataAtRow(0)).toEqual([2011, 4, 552, 6127]);
      expect(hot.getSourceDataAtRow(1)).toEqual([2012, '=SUM(A1:A2)', 12, '=SUM(E5)']);
    });

    it('should work properly while doing cell used by some formula empty', () => {
      handsontable({
        data: [
          [5, '=A1+1', '=B1+1'],
        ],
        contextMenu: true,
        colHeaders: true,
        formulas: {
          engine: HyperFormula
        }
      });

      setDataAtCell(0, 0, null);

      expect(getSourceData()).toEqual([
        [null, '=A1+1', '=B1+1'],
      ]);
      expect(getData()).toEqual([
        [null, 1, 2],
      ]);

      undo();

      expect(getSourceData()).toEqual([
        [5, '=A1+1', '=B1+1'],
      ]);
      expect(getData()).toEqual([
        [5, 6, 7],
      ]);

      redo();

      expect(getSourceData()).toEqual([
        [null, '=A1+1', '=B1+1'],
      ]);
      expect(getData()).toEqual([
        [null, 1, 2],
      ]);
    });

    it('should cooperate properly with `setDataAtCell` action for multiple cells', () => {
      handsontable({
        data: [
          [0, '=A1+1', '=B1+1'],
        ],
        contextMenu: true,
        colHeaders: true,
        formulas: {
          engine: HyperFormula
        }
      });

      setDataAtCell([
        [0, 0, '=B1+2'],
        [0, 1, '=C1+2'],
        [0, 2, 10],
      ]);

      undo();

      expect(getSourceData()).toEqual([
        [0, '=A1+1', '=B1+1'],
      ]);
      expect(getData()).toEqual([
        [0, 1, 2],
      ]);

      redo();

      expect(getSourceData()).toEqual([
        ['=B1+2', '=C1+2', 10],
      ]);
      expect(getData()).toEqual([
        [14, 12, 10],
      ]);

      undo();

      expect(getSourceData()).toEqual([
        [0, '=A1+1', '=B1+1'],
      ]);
      expect(getData()).toEqual([
        [0, 1, 2],
      ]);
    });

    it('should show proper values when doing undo/redo after moving rows', () => {
      handsontable({
        data: [
          [5],
          ['=A1+1'],
          ['=A2+1'],
        ],
        contextMenu: true,
        colHeaders: true,
        rowHeaders: true,
        formulas: {
          engine: HyperFormula
        },
        manualRowMove: true,
      });

      getPlugin('manualRowMove').moveRow(0, 1);
      render();

      undo();

      expect(getSourceData()).toEqual([
        [5],
        ['=A1+1'],
        ['=A2+1'],
      ]);
      expect(getData()).toEqual([
        [5],
        [6],
        [7],
      ]);

      redo();

      expect(getSourceData()).toEqual([
        [5],
        ['=A1+1'],
        ['=A2+1'],
      ]);
      expect(getData()).toEqual([
        [6],
        [5],
        [7],
      ]);
    });

    it('should show proper values when doing undo/redo after changing sheet size', () => {
      handsontable({
        data: [
          [0, '=A1+1', '=B1+1'],
        ],
        contextMenu: true,
        colHeaders: true,
        formulas: {
          engine: HyperFormula
        }
      });

      alter('insert_col', 0);
      alter('remove_col', 0);

      expect(getSourceData()).toEqual([
        [0, '=A1+1', '=B1+1'],
      ]);
      expect(getData()).toEqual([
        [0, 1, 2],
      ]);

      undo();

      expect(getSourceData()).toEqual([
        [null, 0, '=B1+1', '=C1+1'],
      ]);
      expect(getData()).toEqual([
        [null, 0, 1, 2],
      ]);

      undo();

      expect(getSourceData()).toEqual([
        [0, '=A1+1', '=B1+1'],
      ]);
      expect(getData()).toEqual([
        [0, 1, 2],
      ]);

      redo();

      expect(getSourceData()).toEqual([
        [null, 0, '=B1+1', '=C1+1'],
      ]);
      expect(getData()).toEqual([
        [null, 0, 1, 2],
      ]);

      redo();

      expect(getSourceData()).toEqual([
        [0, '=A1+1', '=B1+1'],
      ]);
      expect(getData()).toEqual([
        [0, 1, 2],
      ]);
    });

    describe('should show proper value when doing undo/redo after reducing sheet size', () => {
      it('(removing cell with value used by some formula)', () => {
        handsontable({
          data: [
            [2],
            ['=A1*10']
          ],
          contextMenu: true,
          colHeaders: true,
          formulas: {
            engine: HyperFormula
          }
        });

        alter('remove_row', 0);

        undo();

        expect(getSourceData()).toEqual([
          [2],
          ['=A1*10'],
        ]);
        expect(getData()).toEqual([
          [2],
          [20],
        ]);

        redo();

        expect(getSourceData()).toEqual([
          ['=#REF!*10'],
        ]);
        expect(getData()).toEqual([
          ['#REF!'],
        ]);
      });

      it('(removing formula using value from some cell)', () => {
        handsontable({
          data: [
            [2],
            ['=A1*10']
          ],
          contextMenu: true,
          colHeaders: true,
          formulas: {
            engine: HyperFormula
          }
        });

        alter('remove_row', 1);

        undo();

        expect(getSourceData()).toEqual([
          [2],
          ['=A1*10'],
        ]);
        expect(getData()).toEqual([
          [2],
          [20],
        ]);

        redo();

        expect(getSourceData()).toEqual([
          [2],
        ]);
        expect(getData()).toEqual([
          [2],
        ]);
      });
    });

    describe('should cooperate with the Autofill plugin properly', () => {
      it('(overwriting formula)', async() => {
        handsontable({
          data: [
            [2, 3, 4, 5],
            ['=A1*10', null, '=A2*10', null],
          ],
          contextMenu: true,
          colHeaders: true,
          formulas: {
            engine: HyperFormula
          }
        });

        selectCell(0, 0);
        // Overwritten formula
        autofill(1, 0);

        await sleep(100);

        expect(getSourceData()).toEqual([
          [2, 3, 4, 5],
          [2, null, '=A2*10', null],
        ]);
        expect(getData()).toEqual([
          [2, 3, 4, 5],
          [2, null, 20, null],
        ]);

        autofill(1, 1);

        await sleep(100);

        expect(getSourceData()).toEqual([
          [2, 2, 4, 5],
          [2, 2, '=A2*10', null],
        ]);
        expect(getData()).toEqual([
          [2, 2, 4, 5],
          [2, 2, 20, null],
        ]);

        undo();

        expect(getSourceData()).toEqual([
          [2, 3, 4, 5],
          [2, null, '=A2*10', null],
        ]);
        expect(getData()).toEqual([
          [2, 3, 4, 5],
          [2, null, 20, null],
        ]);

        undo();

        expect(getSourceData()).toEqual([
          [2, 3, 4, 5],
          ['=A1*10', null, '=A2*10', null],
        ]);
        expect(getData()).toEqual([
          [2, 3, 4, 5],
          [20, null, 200, null],
        ]);

        redo();

        expect(getSourceData()).toEqual([
          [2, 3, 4, 5],
          [2, null, '=A2*10', null],
        ]);
        expect(getData()).toEqual([
          [2, 3, 4, 5],
          [2, null, 20, null],
        ]);

        redo();

        expect(getSourceData()).toEqual([
          [2, 2, 4, 5],
          [2, 2, '=A2*10', null],
        ]);
        expect(getData()).toEqual([
          [2, 2, 4, 5],
          [2, 2, 20, null],
        ]);

        undo();

        expect(getSourceData()).toEqual([
          [2, 3, 4, 5],
          [2, null, '=A2*10', null],
        ]);
        expect(getData()).toEqual([
          [2, 3, 4, 5],
          [2, null, 20, null],
        ]);
      });

      it('(populating formula)', async() => {
        handsontable({
          data: [
            [2, 3, 4, 5],
            ['=A1*10', null, '=A2*10', null],
          ],
          contextMenu: true,
          colHeaders: true,
          formulas: {
            engine: HyperFormula
          }
        });

        selectCell(1, 2);

        autofill(1, 3);

        await sleep(100);

        undo();

        expect(getSourceData()).toEqual([
          [2, 3, 4, 5],
          ['=A1*10', null, '=A2*10', null],
        ]);
        expect(getData()).toEqual([
          [2, 3, 4, 5],
          [20, null, 200, null],
        ]);

        redo();

        expect(getSourceData()).toEqual([
          [2, 3, 4, 5],
          ['=A1*10', null, '=A2*10', '=B2*10'],
        ]);
        expect(getData()).toEqual([
          [2, 3, 4, 5],
          [20, null, 200, 0],
        ]);

        undo();

        expect(getSourceData()).toEqual([
          [2, 3, 4, 5],
          ['=A1*10', null, '=A2*10', null],
        ]);
        expect(getData()).toEqual([
          [2, 3, 4, 5],
          [20, null, 200, null],
        ]);
      });

      it('(populating simple values)', async() => {
        handsontable({
          data: [
            [2, 3, 4, 5],
            ['=A1*10', null, '=A2*10', null],
          ],
          contextMenu: true,
          colHeaders: true,
          formulas: {
            engine: HyperFormula
          }
        });

        selectCell(0, 0);

        autofill(0, 3);

        await sleep(100);

        undo();

        expect(getSourceData()).toEqual([
          [2, 3, 4, 5],
          ['=A1*10', null, '=A2*10', null],
        ]);
        expect(getData()).toEqual([
          [2, 3, 4, 5],
          [20, null, 200, null],
        ]);

        redo();

        expect(getSourceData()).toEqual([
          [2, 2, 2, 2],
          ['=A1*10', null, '=A2*10', null],
        ]);
        expect(getData()).toEqual([
          [2, 2, 2, 2],
          [20, null, 200, null],
        ]);

        undo();

        expect(getSourceData()).toEqual([
          [2, 3, 4, 5],
          ['=A1*10', null, '=A2*10', null],
        ]);
        expect(getData()).toEqual([
          [2, 3, 4, 5],
          [20, null, 200, null],
        ]);
      });
    });
  });

  describe('Autofill', () => {
    it('should not override result of simple autofill (populating one cell) #8050', async() => {
      handsontable({
        data: [
          { car: 'Mercedes A 160', year: 2017 },
          { car: 'Citroen C4 Coupe', year: 2018 },
          { car: 'Audi A4 Avant', year: 2019 },
          { car: 'Opel Astra', year: 2020 },
          { car: 'BMW 320i Coupe', year: 2021 }
        ],
        columns: [
          {
            data: 'car'
          },
          {
            data: 'year',
            type: 'numeric'
          },
        ],
        formulas: {
          engine: HyperFormula
        },
      });

      selectCell(0, 0);
      autofill(0, 1);

      await sleep(100);

      expect(getData()).toEqual([
        ['Mercedes A 160', 'Mercedes A 160'],
        ['Citroen C4 Coupe', 2018],
        ['Audi A4 Avant', 2019],
        ['Opel Astra', 2020],
        ['BMW 320i Coupe', 2021],
      ]);
    });

    it('should not override result of simple autofill (populating more cells) #8050', () => {
      handsontable({
        data: [
          [1, 2, 3, 5, 7],
          [6, 7, 9, 7, 8],
          [5, 7, 9, 0, 4],
          [null],
          [1, 2, 3, 5, 7],
          [6, 7, 9, 7, 8],
          [5, 7, 9, 0, 4]
        ],
        colHeaders: true,
        formulas: {
          engine: HyperFormula
        },
      });

      selectCell(0, 0, 6, 1);
      autofill(6, 4);

      expect(getData()).toEqual([
        [1, 2, 1, 2, 1],
        [6, 7, 6, 7, 6],
        [5, 7, 5, 7, 5],
        [null, null, null, null, null],
        [1, 2, 1, 2, 1],
        [6, 7, 6, 7, 6],
        [5, 7, 5, 7, 5]
      ]);
    });

    it('should not autofill if `beforeAutofill` returned false', () => {
      const hot = handsontable({
        data: [
          ['=A1', 'x', 'x'],
        ],
        formulas: {
          engine: HyperFormula
        },
        beforeAutofill: () => false
      });

      selectCell(0, 0);
      autofill(0, 2);

      expect(hot.getSourceData()).toEqual([['=A1', 'x', 'x']]);
    });

    it('should not use the plugin\'s autofill if `beforeAutofill` returned values', () => {
      const hot = handsontable({
        data: [
          ['=A1', 'x', 'x'],
        ],
        formulas: {
          engine: HyperFormula
        },
        beforeAutofill: () => [['a']]
      });

      selectCell(0, 0);
      autofill(0, 2);

      expect(hot.getSourceData()).toEqual([['=A1', 'a', 'a']]);
    });

    it('should autofill an array of objects correctly', () => {
      const hot = handsontable({
        formulas: {
          engine: HyperFormula
        },
        data: [
          { num: 1, double: '=A1 * 2', target: 'x' },
          { num: 2, double: '=A2 * 2', target: 'x' },
          { num: 3, double: '=A3 * 2', target: 'x' },
          { num: 4, double: '=A4 * 2', target: 'x' },
          { num: 5, double: '=A5 * 2', target: 'x' },
        ]
      });

      selectCell(0, 1, 4, 1);
      autofill(4, 2);

      expect(hot.getSourceDataArray()).toEqual([
        [1, '=A1 * 2', '=B1 * 2'],
        [2, '=A2 * 2', '=B2 * 2'],
        [3, '=A3 * 2', '=B3 * 2'],
        [4, '=A4 * 2', '=B4 * 2'],
        [5, '=A5 * 2', '=B5 * 2']
      ]);
    });

    // Most of these tests will produce invalid values (out of bound addresses,
    // #CYCLE! errors), but we only care about the formula offsets.
    //
    // https://docs.google.com/spreadsheets/d/1ERI3YEe7GYWUKdKGPU4C97yUh1fOM6HILZY03AB8wwk/edit?usp=sharing
    it('should correctly autofill - single cell, down', () => {
      const hot = handsontable({
        data: [
          ['=A1'],
          ['x'],
          ['x']
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      selectCell(0, 0);
      autofill(2, 0);

      expect(hot.getSourceData()).toEqual([
        ['=A1'],
        ['=A2'],
        ['=A3']
      ]);
    });

    it('should correctly autofill - single cell, right', () => {
      const hot = handsontable({
        data: [
          ['=A1', 'x', 'x']
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      selectCell(0, 0);
      autofill(0, 2);

      expect(hot.getSourceData()).toEqual([
        ['=A1', '=B1', '=C1']
      ]);
    });

    it('should correctly autofill - range, down, partial', () => {
      const hot = handsontable({
        data: [
          ['=E6', '=E10'],
          ['=G6', '=G10'],
          ['=I6', '=I10'],
          ['x', 'x'],
          ['x', 'x'],
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      selectCell(0, 0, 2, 1);
      autofill(4, 1);

      expect(hot.getSourceData()).toEqual([
        ['=E6', '=E10'],
        ['=G6', '=G10'],
        ['=I6', '=I10'],
        ['=E9', '=E13'],
        ['=G9', '=G13'],
      ]);
    });

    it('should correctly autofill - range, down, overflow', () => {
      const hot = handsontable({
        data: [
          ['=E6', '=E10'],
          ['=G6', '=G10'],
          ['=I6', '=I10'],
          ['x', 'x'],
          ['x', 'x'],
          ['x', 'x'],
          ['x', 'x'],
          ['x', 'x'],
          ['x', 'x'],
          ['y', 'y'],
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      selectCell(0, 0, 2, 1);
      autofill(8, 1);

      expect(hot.getSourceData()).toEqual([
        ['=E6', '=E10'],
        ['=G6', '=G10'],
        ['=I6', '=I10'],
        ['=E9', '=E13'],
        ['=G9', '=G13'],
        ['=I9', '=I13'],
        ['=E12', '=E16'],
        ['=G12', '=G16'],
        ['=I12', '=I16'],
        ['y', 'y'],
      ]);
    });

    it('should correctly autofill - range, right, partial', () => {
      const hot = handsontable({
        data: [
          ['=E6', '=E10', 'x', 'y'],
          ['=G6', '=G10', 'x', 'y'],
          ['=I6', '=I10', 'x', 'y'],
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      selectCell(0, 0, 2, 1);
      autofill(2, 2);

      expect(hot.getSourceData()).toEqual([
        ['=E6', '=E10', '=G6', 'y'],
        ['=G6', '=G10', '=I6', 'y'],
        ['=I6', '=I10', '=K6', 'y'],
      ]);
    });

    it('should correctly autofill - range, right, overflow', () => {
      const hot = handsontable({
        data: [
          ['=E6', '=E10', 'x', 'x', 'x', 'y'],
          ['=G6', '=G10', 'x', 'x', 'x', 'y'],
          ['=I6', '=I10', 'x', 'x', 'x', 'y']
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      selectCell(0, 0, 2, 1);
      autofill(2, 4);

      expect(hot.getSourceData()).toEqual([
        ['=E6', '=E10', '=G6', '=G10', '=I6', 'y'],
        ['=G6', '=G10', '=I6', '=I10', '=K6', 'y'],
        ['=I6', '=I10', '=K6', '=K10', '=M6', 'y']
      ]);
    });

    it('should correctly autofill - range, left, partial', () => {
      const hot = handsontable({
        data: [
          ['y', 'x', '=E6', '=E10'],
          ['y', 'x', '=G6', '=G10'],
          ['y', 'x', '=I6', '=I10'],
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      selectCell(0, 2, 2, 3);
      autofill(2, 1);

      expect(hot.getSourceData()).toEqual([
        ['y', '=C10', '=E6', '=E10'],
        ['y', '=E10', '=G6', '=G10'],
        ['y', '=G10', '=I6', '=I10'],
      ]);
    });

    it('should correctly autofill - range, left, overflow', () => {
      const hot = handsontable({
        data: [
          ['y', 'x', 'x', 'x', '=E6', '=E10'],
          ['y', 'x', 'x', 'x', '=G6', '=G10'],
          ['y', 'x', 'x', 'x', '=I6', '=I10'],
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      selectCell(0, 4, 2, 5);
      autofill(2, 1);

      expect(hot.getSourceData()).toEqual([
        ['y', '=A10', '=C6', '=C10', '=E6', '=E10'],
        ['y', '=C10', '=E6', '=E10', '=G6', '=G10'],
        ['y', '=E10', '=G6', '=G10', '=I6', '=I10'],
      ]);
    });

    it('should correctly autofill - range, left, odd', () => {
      const hot = handsontable({
        data: [['y', 'x', 'x', 'x', 'x', 'x', 'x', '=Z3', '=Z5', '=Z8']],
        formulas: {
          engine: HyperFormula
        }
      });

      selectCell(0, 7, 0, 9);
      autofill(0, 1);

      expect(hot.getSourceData()).toEqual([
        ['y', '=T3', '=T5', '=T8', '=W3', '=W5', '=W8', '=Z3', '=Z5', '=Z8']
      ]);
    });

    it('should correctly autofill - range, up, partial', () => {
      const hot = handsontable({
        data: [
          ['x', 'x'],
          ['=E7', '=E10'],
          ['=G7', '=G10'],
          ['=I7', '=I10']
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      selectCell(1, 0, 3, 1);
      autofill(0, 1);

      expect(hot.getSourceData()).toEqual([
        ['=I4', '=I7'],
        ['=E7', '=E10'],
        ['=G7', '=G10'],
        ['=I7', '=I10']
      ]);
    });

    it('should correctly autofill - range, up, overflow', () => {
      const hot = handsontable({
        data: [
          ['y', 'y'],
          ['x', 'x'],
          ['x', 'x'],
          ['x', 'x'],
          ['x', 'x'],
          ['x', 'x'],
          ['=E7', '=E10'],
          ['=G7', '=G10'],
          ['=I7', '=I10'],
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      selectCell(6, 0, 8, 1);
      autofill(1, 1);

      expect(hot.getSourceData()).toEqual([
        ['y', 'y'],
        ['=G1', '=G4'],
        ['=I1', '=I4'],
        ['=E4', '=E7'],
        ['=G4', '=G7'],
        ['=I4', '=I7'],
        ['=E7', '=E10'],
        ['=G7', '=G10'],
        ['=I7', '=I10'],
      ]);
    });

    it('should correctly autofill - range, up, even', () => {
      const hot = handsontable({
        data: [['y'], ['x'], ['x'], ['x'], ['x'], ['x'], ['x'], ['=A9'], ['=A12']],
        formulas: {
          engine: HyperFormula
        }
      });

      selectCell(7, 0, 8, 0);
      autofill(1, 0);

      expect(hot.getSourceData()).toEqual([
        ['y'], ['=A3'], ['=A6'], ['=A5'], ['=A8'], ['=A7'], ['=A10'], ['=A9'], ['=A12']
      ]);
    });

    it('should allow for mutating autofill results when using formulas (#8107)', () => {
      handsontable({
        data: [
          ['2016', 1, 1, 2, 3],
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      addHook('beforeChange', (changes) => { changes[0] = null; });

      selectCell(0, 0);
      autofill(0, 2);

      expect(getData()).toEqual([['2016', 1, '2016', 2, 3]]);
    });
  });

  describe('Formulas#getCellType', () => {
    it('should return `FORMULA`', () => {
      const hot = handsontable({
        data: [['=2 + 2']],
        formulas: {
          engine: HyperFormula
        }
      });

      expect(hot.getPlugin('formulas').getCellType(0, 0)).toEqual('FORMULA');
    });

    it('should return `VALUE`', () => {
      const hot = handsontable({
        data: [['4']],
        formulas: {
          engine: HyperFormula
        }
      });

      expect(hot.getPlugin('formulas').getCellType(0, 0)).toEqual('VALUE');
    });

    it('should return `ARRAYFORMULA`', () => {
      const hot = handsontable({
        data: [
          ['1', '2'],
          ['3', '4'],
          ['x', ''],
          ['', ''],
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      hot.setDataAtCell(2, 0, '=ARRAYFORMULA(TRANSPOSE(A1:B2))');

      expect(hot.getPlugin('formulas').getCellType(2, 0)).toEqual('ARRAYFORMULA');
    });

    it('should return `EMPTY` when out of bounds', () => {
      const hot = handsontable({
        data: [['4']],
        formulas: {
          engine: HyperFormula
        }
      });

      expect(hot.getPlugin('formulas').getCellType(10, 10)).toEqual('EMPTY');
    });

    it('should return correct values for background sheets', () => {
      const hf = HyperFormula.buildFromSheets({
        one: [['4']],
        two: [['=2 + 2']]
      });

      const hot = handsontable({
        formulas: {
          engine: hf,
          sheetName: 'one'
        }
      });

      const sheet = hot.getPlugin('formulas').engine.getSheetId('two');

      expect(hot.getPlugin('formulas').getCellType(0, 0, sheet)).toEqual('FORMULA');
    });
  });

  describe('hyperformula alter operation blocks', () => {
    it('should block creating too many rows', () => {
      const hot = handsontable({
        data: [],
        formulas: {
          engine: {
            hyperformula: HyperFormula
          }
        },
        // TODO: Temporarily overwrite the default value due to https://github.com/handsontable/handsontable/issues/7840
        maxRows: 10000
      });

      hot.alter('insert_row', 0, 20000);

      expect(hot.countRows()).toEqual(0);
    });

    it('should block creating too many columns', () => {
      const hot = handsontable({
        data: [[]],
        formulas: {
          engine: HyperFormula
        },
        // TODO: Temporarily overwrite the default value due to https://github.com/handsontable/handsontable/issues/7840
        maxCols: 10000
      });

      hot.alter('insert_col', 0, 20000);

      expect(hot.countCols()).toEqual(0);
    });
  });

  it('should not render multiple times when updating many cells', () => {
    const afterViewRender = jasmine.createSpy();

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      formulas: {
        engine: HyperFormula
      },
      afterViewRender
    });

    expect(afterViewRender).toHaveBeenCalledTimes(1);

    selectCell(1, 1, 5, 5);

    spec().$container.find('textarea.handsontableInput').simulate('keydown', { keyCode: 46 });
    spec().$container.find('textarea.handsontableInput').simulate('keyup', { keyCode: 46 });

    expect(afterViewRender).toHaveBeenCalledTimes(2);
  });

  it('should freeze correct columns with ManualColumnFreeze', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      formulas: {
        engine: HyperFormula
      },
      manualColumnFreeze: true
    });

    hot.getPlugin('ManualColumnFreeze').freezeColumn(2);

    expect(hot.getData()).toEqual([
      ['C1', 'A1', 'B1', 'D1', 'E1'],
      ['C2', 'A2', 'B2', 'D2', 'E2'],
      ['C3', 'A3', 'B3', 'D3', 'E3'],
      ['C4', 'A4', 'B4', 'D4', 'E4'],
      ['C5', 'A5', 'B5', 'D5', 'E5']
    ]);

    hot.getPlugin('ManualColumnFreeze').freezeColumn(2);

    expect(hot.getData()).toEqual([
      ['C1', 'B1', 'A1', 'D1', 'E1'],
      ['C2', 'B2', 'A2', 'D2', 'E2'],
      ['C3', 'B3', 'A3', 'D3', 'E3'],
      ['C4', 'B4', 'A4', 'D4', 'E4'],
      ['C5', 'B5', 'A5', 'D5', 'E5']
    ]);
  });

  it('should support basic sorting', () => {
    const hot = handsontable({
      data: [
        ['B1', 3.9],
        ['B2', 1.13],
        ['B1+B2', '=SUM(B1:B2)']
      ],
      colHeaders: true,
      rowHeaders: true,
      contextMenu: true,
      formulas: {
        engine: HyperFormula
      },
      columnSorting: {
        sortEmptyCells: true,
        initialConfig: {
          column: 1,
          sortOrder: 'asc'
        }
      }
    });

    expect(hot.getData()).toEqual([
      ['B2', 1.13],
      ['B1', 3.9],
      ['B1+B2', 5.03]
    ]);

    hot.getPlugin('columnSorting').sort({
      column: 1,
      sortOrder: 'desc'
    });

    expect(hot.getData()).toEqual([
      ['B1+B2', 5.03],
      ['B1', 3.9],
      ['B2', 1.13]
    ]);

    hot.getPlugin('columnSorting').clearSort();

    expect(hot.getData()).toEqual([
      ['B1', 3.9],
      ['B2', 1.13],
      ['B1+B2', 5.03]
    ]);
  });

  describe('basic filtering support', () => {
    it('should filter by condition', () => {
      const hot = handsontable({
        data: [
          ['Lorem', 'ipsum', 'dolor', 'sit', '12/1/2015', 23],
          ['adipiscing', 'elit', 'Ut', 'imperdiet', '5/12/2015', 6],
          ['Pellentesque', 'vulputate', 'leo', 'semper', '10/23/2015', 26],
          ['diam', 'et', 'malesuada', 'libero', '12/1/2014', 98],
          ['orci', 'et', 'dignissim', 'hendrerit', '12/1/2016', 8.5]
        ],
        columns: [
          { type: 'text' },
          { type: 'text' },
          { type: 'text' },
          { type: 'text' },
          { type: 'date', dateFormat: 'M/D/YYYY' },
          { type: 'numeric' }
        ],
        colHeaders: true,
        rowHeaders: true,
        dropdownMenu: true,
        filters: true,
        formulas: {
          engine: HyperFormula
        }
      });

      hot.getPlugin('filters').addCondition(0, 'eq', ['orci']);
      hot.getPlugin('filters').filter();

      expect(hot.getData()).toEqual([['orci', 'et', 'dignissim', 'hendrerit', '12/1/2016', 8.5]]);
    });

    it('should filter by value', () => {
      const hot = handsontable({
        data: [
          ['Lorem', 'ipsum', 'dolor', 'sit', '12/1/2015', 23],
          ['adipiscing', 'elit', 'Ut', 'imperdiet', '5/12/2015', 6],
          ['Pellentesque', 'vulputate', 'leo', 'semper', '10/23/2015', 26],
          ['diam', 'et', 'malesuada', 'libero', '12/1/2014', 98],
          ['orci', 'et', 'dignissim', 'hendrerit', '12/1/2016', 8.5]
        ],
        columns: [
          { type: 'text' },
          { type: 'text' },
          { type: 'text' },
          { type: 'text' },
          { type: 'date', dateFormat: 'M/D/YYYY' },
          { type: 'numeric' }
        ],
        colHeaders: true,
        rowHeaders: true,
        dropdownMenu: true,
        filters: true,
        formulas: {
          engine: HyperFormula
        }
      });

      hot.getPlugin('filters').addCondition(0, 'by_value', [['orci']]);
      hot.getPlugin('filters').filter();

      expect(hot.getData()).toEqual([['orci', 'et', 'dignissim', 'hendrerit', '12/1/2016', 8.5]]);
    });
  });

  it('should have very basic support for nested rows', () => {
    const data = [
      {
        category: 'Best Rock Performance',
        artist: null,
        title: null,
        label: null,
        __children: [
          {
            title: 'Don\'t Wanna Fight',
            artist: 'Alabama Shakes',
            label: 'ATO Records'
          },
          {
            title: 'What Kind Of Man',
            artist: 'Florence & The Machine',
            label: 'Republic'
          },
          {
            title: 'Something From Nothing',
            artist: 'Foo Fighters',
            label: 'RCA Records'
          },
          {
            title: 'Ex\'s & Oh\'s',
            artist: 'Elle King',
            label: 'RCA Records'
          },
          {
            title: 'Moaning Lisa Smile',
            artist: 'Wolf Alice',
            label: 'RCA Records/Dirty Hit'
          }
        ]
      },
      {
        category: 'Best Metal Performance',
        __children: [
          {
            title: 'Cirice',
            artist: 'Ghost',
            label: 'Loma Vista Recordings'
          },
          {
            title: 'Identity',
            artist: 'August Burns Red',
            label: 'Fearless Records'
          },
          {
            title: '512',
            artist: 'Lamb Of God',
            label: 'Epic Records'
          },
          {
            title: 'Thank You',
            artist: 'Sevendust',
            label: '7Bros Records'
          },
          {
            title: 'Custer',
            artist: 'Slipknot',
            label: 'Roadrunner Records'
          }
        ]
      },
      {
        category: 'Best Rock Song',
        __children: [
          {
            title: 'Don\'t Wanna Fight',
            artist: 'Alabama Shakes',
            label: 'ATO Records'
          },
          {
            title: 'Ex\'s & Oh\'s',
            artist: 'Elle King',
            label: 'RCA Records'
          },
          {
            title: 'Hold Back The River',
            artist: 'James Bay',
            label: 'Republic'
          },
          {
            title: 'Lydia',
            artist: 'Highly Suspect',
            label: '300 Entertainment'
          },
          {
            title: 'What Kind Of Man',
            artist: 'Florence & The Machine',
            label: 'Republic'
          }
        ]
      },
      {
        category: 'Best Rock Album',
        __children: [
          {
            title: 'Drones',
            artist: 'Muse',
            label: 'Warner Bros. Records'
          },
          {
            title: 'Chaos And The Calm',
            artist: 'James Bay',
            label: 'Republic'
          },
          {
            title: 'Kintsugi',
            artist: 'Death Cab For Cutie',
            label: 'Atlantic'
          },
          {
            title: 'Mister Asylum',
            artist: 'Highly Suspect',
            label: '300 Entertainment'
          },
          {
            title: '.5: The Gray Chapter',
            artist: 'Slipknot',
            label: 'Roadrunner Records'
          }
        ]
      }
    ];

    const hot = handsontable({
      data,
      rowHeaders: true,
      colHeaders: ['Category', 'Artist', 'Title', 'Album', 'Label'],
      nestedRows: true,
      contextMenu: true,
      formulas: {
        engine: HyperFormula
      },
      licenseKey: 'non-commercial-and-evaluation'
    });

    hot.getPlugin('nestedRows').collapsingUI.collapseMultipleChildren([0, 6, 18]);

    expect(hot.getData()).toEqual([
      ['Best Rock Performance', null, null, null],
      ['Best Metal Performance', null, null, null],
      ['Best Rock Song', null, null, null],
      [null, 'Alabama Shakes', 'Don\'t Wanna Fight', 'ATO Records'],
      [null, 'Elle King', 'Ex\'s & Oh\'s', 'RCA Records'],
      [null, 'James Bay', 'Hold Back The River', 'Republic'],
      [null, 'Highly Suspect', 'Lydia', '300 Entertainment'],
      [null, 'Florence & The Machine', 'What Kind Of Man', 'Republic'],
      ['Best Rock Album', null, null, null]
    ]);
  });

  it('should support moving columns', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(1, 5),
      manualColumnMove: true,
      colHeaders: true
    });

    hot.getPlugin('ManualColumnMove').moveColumn(2, 0);

    hot.getPlugin('ManualColumnMove').moveColumn(3, 0);
    hot.getPlugin('ManualColumnMove').moveColumn(3, 0);

    hot.render();

    expect(hot.getData()).toEqual([['B1', 'D1', 'C1', 'A1', 'E1']]);
  });

  it('should support moving rows', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 1),
      manualRowMove: true
    });

    hot.getPlugin('ManualRowMove').moveRow(2, 0);

    hot.getPlugin('ManualRowMove').moveRow(3, 0);
    hot.getPlugin('ManualRowMove').moveRow(3, 0);

    hot.render();

    expect(hot.getData()).toEqual([
      ['A2'],
      ['A4'],
      ['A3'],
      ['A1'],
      ['A5']
    ]);
  });

  describe('should perform CRUD operations in HyperFormula based on physical indexes', () => {
    describe('performing CRUD actions', () => {
      it('should remove rows in the right place', () => {
        const hot = handsontable({
          data: [
            [1, 'a', 'b', '1c'],
            [2, 'a', 'b', '2c'],
            ['trimmed', 'row', '', ''],
            ['trimmed', 'row', '', ''],
            ['trimmed', 'row', '', ''],
            [3, 'a', 'b', '3c'],
            [4, 'a', 'b', '4c'],
          ],
          formulas: {
            engine: HyperFormula
          },
          trimRows: [2, 3, 4]
        });

        hot.alter('remove_row', 1, 2);

        expect(hot.getSourceData()).toEqual([
          [1, 'a', 'b', '1c'],
          ['trimmed', 'row', '', ''],
          ['trimmed', 'row', '', ''],
          ['trimmed', 'row', '', ''],
          [4, 'a', 'b', '4c']
        ]);
      });

      it('should remove columns in the right place', () => {
        const hot = handsontable({
          data: [
            [1, 'a', 'b', '1c'],
            [2, 'a', 'b', '2c']
          ],
          formulas: {
            engine: HyperFormula
          },
          manualColumnMove: [1, 0, 2, 3]
        });

        hot.alter('remove_col', 1, 2);

        expect(hot.getData()).toEqual([
          ['a', '1c'],
          ['a', '2c']
        ]);
      });

      it('should add rows in the right place', () => {
        const hot = handsontable({
          data: [
            [1, 'a', 'b', '1c'],
            [2, 'a', 'b', '2c'],
            ['trimmed', 'row', '', ''],
            ['trimmed', 'row', '', ''],
            ['trimmed', 'row', '', ''],
            [3, 'a', 'b', '3c'],
            [4, 'a', 'b', '4c']
          ],
          formulas: {
            engine: HyperFormula
          },
          trimRows: [2, 3, 4]
        });

        hot.alter('insert_row', 2, 2);

        expect(hot.getData()).toEqual([
          [1, 'a', 'b', '1c'],
          [2, 'a', 'b', '2c'],
          [null, null, null, null],
          [null, null, null, null],
          [3, 'a', 'b', '3c'],
          [4, 'a', 'b', '4c']
        ]);
      });

      it('should add columns in the right place', () => {
        const hot = handsontable({
          data: [
            [1, 'a', 'b', '1c'],
            [2, 'a', 'b', '2c']
          ],
          formulas: {
            engine: HyperFormula
          },
          manualColumnMove: [1, 0, 2, 3]
        });

        hot.alter('insert_col', 1, 2);

        expect(hot.getData()).toEqual([
          ['a', null, null, 1, 'b', '1c'],
          ['a', null, null, 2, 'b', '2c']
        ]);
      });
    });
  });

  it('should not crash when declaring a named expression with a sheet name that contains a `-` (#8057)', () => {
    const errors = [];

    try {
      handsontable({
        data: [
          [1, 2, 3, 4, 5],
          [9, 8, 7, 6, '=myOwnCalc'],
        ],
        formulas: {
          engine: HyperFormula,
          sheetName: 'my-sheet',
          namedExpressions: [
            {
              name: 'myOwnCalc',
              expression: '=my-sheet!$A$1+100',
            }
          ],
        }
      });

    } catch (e) {
      errors.push(e);
    }

    expect(errors.length).withContext('Number of errors being thrown.').toEqual(0);
    expect(getData()).toEqual([
      [1, 2, 3, 4, 5],
      [9, 8, 7, 6, '#NAME?'],
    ]);
  });
});

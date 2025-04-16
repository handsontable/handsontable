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

  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
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

  it('should initialize the plugin properly with an array of arrays', async() => {
    handsontable({
      data: [['10', '=A1 * 2']],
      formulas: {
        engine: HyperFormula
      }
    });

    expect(getSourceData()).toEqual([['10', '=A1 * 2']]);
  });

  it('should initialize the plugin properly with an array of objects', async() => {
    handsontable({
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

    expect(getSourceDataArray()).toEqual([
      [1, '=A1 * 2'],
      [2, '=A2 * 2'],
      [3, '=A3 * 2'],
      [4, '=A4 * 2'],
      [5, '=A5 * 2']
    ]);

    await setDataAtCell(0, 0, 10);

    expect(getSourceDataArray()).toEqual([
      [10, '=A1 * 2'],
      [2, '=A2 * 2'],
      [3, '=A3 * 2'],
      [4, '=A4 * 2'],
      [5, '=A5 * 2']
    ]);
  });

  it('should calculate table (simple example)', async() => {
    handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300
    });

    expect(getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
    expect(getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getDataAtRow(4)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, '=SUM(E5)']);
  });

  it('should calculate table (advanced example)', async() => {
    handsontable({
      data: getDataAdvancedExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300
    });

    expect(getDataAtRow(0)).toEqual(['Example #1', '', '', '', '', '', '', '']);
    expect(getDataAtRow(1)).toEqual(['Text', 'yellow', 'red', 'blue', 'green', 'pink', 'gray', '']);
    expect(getDataAtRow(2)).toEqual(['Yellow dog on green grass', 'yellow', '', '', 'green', '', '', '']);
    expect(getDataAtRow(3)).toEqual(['Gray sweater with blue stripes', '', '', 'blue', '', '', 'gray', '']);
    expect(getDataAtRow(4)).toEqual(['A red sun on a pink horizon', '', 'red', '', '', 'pink', '', '']);
    expect(getDataAtRow(5)).toEqual(['Blue neon signs everywhere', '', '', 'blue', '', '', '', '']);
    expect(getDataAtRow(6)).toEqual(['Waves of blue and green', '', '', 'blue', 'green', '', '', '']);
    expect(getDataAtRow(7)).toEqual(['Hot pink socks and gray socks', '', '', '', '', 'pink', 'gray', '']);
    expect(getDataAtRow(8)).toEqual(['Deep blue eyes', '', '', 'blue', '', '', '', '']);
    expect(getDataAtRow(9)).toEqual(['Count of colors', 1, 1, 4, 2, 2, 2, 'SUM: 12']);
    expect(getDataAtRow(10)).toEqual(['', '', '', '', '', '', '', '']);
    expect(getDataAtRow(11)).toEqual(['Example #2', '', '', '', '', '', '', '']);
    expect(getDataAtRow(12)).toEqual(['Name', 'Email', 'Email domain', '', '', '', '', '']);
    expect(getDataAtRow(13)).toEqual(['Ann Chang', 'achang@maaker.com', 'maaker.com', '', '', '', '', '']);
    expect(getDataAtRow(14)).toEqual(['Jan Siuk', 'jan@yahoo.com', 'yahoo.com', '', '', '', '', '']);
    expect(getDataAtRow(15)).toEqual(['Ken Siuk', 'ken@gmail.com', 'gmail.com', '', '', '', '', '']);
    expect(getDataAtRow(16)).toEqual(['Marcin Kowalski', 'ken@syndex.pl', 'syndex.pl', '', '', '', '', '']);
  });

  // TODO was semicolon, now comma?
  it('should calculate table with comma as separator of formula arguments', async() => {
    const data = getDataSimpleExampleFormulas();

    data[2][4] = '=SUM(A4,2,3)';
    data[4][2] = '=SUM(B5,E3)';

    handsontable({
      data,
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300
    });

    expect(getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
    expect(getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getDataAtRow(4)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, '=SUM(E5)']);
  });

  it('should recalculate table with formulas defined where the next cell is depend on the previous cell', async() => {
    const afterChange = jasmine.createSpy();

    handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300,
      afterChange,
    });

    setDataAtCell(0, 1, '=B5');
    setDataAtCell(0, 2, '=B1');
    setDataAtCell(0, 3, '=C1');
    setDataAtCell(4, 5, '=D1');

    expect(getDataAtRow(0)).toEqual([0, 8042, 8042, 8042, 'Mini', 0]);
    expect(getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 8042]);
    expect(getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getDataAtRow(4)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, 8042]);

    await setDataAtCell(1, 0, 10);

    expect(getDataAtRow(0)).toEqual([0, 6043, 6043, 6043, 'Mini', 0]);
    expect(getDataAtRow(1)).toEqual([10, 0, 2941, 4303, 354, 5814]);
    expect(getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 6043]);
    expect(getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getDataAtRow(4)).toEqual([2012, 6043, 8059, '#DIV/0!', 12, 6043]);
  });

  it('should omit leading apostrophe characters from `getData`, but not `getSourceData`', async() => {
    handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300
    });

    expect(getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
    expect(getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getDataAtRow(4)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, '=SUM(E5)']);

    expect(getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
    expect(getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(getSourceDataAtRow(2)).toEqual([2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1']);
    expect(getSourceDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getSourceDataAtRow(4)).toEqual([2012, '=SUM(A2:A5)', '=SUM(B5,E3)', '=A2/B2', 12, '\'=SUM(E5)']);
  });

  it('should throw error while parsing invalid cell coordinates syntax', async() => {
    const data = getDataSimpleExampleFormulas();

    data[0][0] = '=SUM($$A4;2;3)';
    data[0][1] = '=A$$$$$1';
    data[0][2] = '=A1$';
    data[0][3] = '=SUM(A2:D2$)';

    handsontable({
      data,
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300
    });

    setDataAtCell(2, 0, '=A1$');
    setDataAtCell(3, 0, '=$A$$1');

    expect(getDataAtRow(0)).toEqual(['#ERROR!', '#ERROR!', '#ERROR!', '#ERROR!', 'Mini', '#ERROR!']);
    expect(getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(getDataAtRow(2)).toEqual(['#ERROR!', 5, 2905, 2867, '#ERROR!', '#ERROR!']);
    expect(getDataAtRow(3)).toEqual(['#ERROR!', 4, 2517, 4822, 552, 6127]);
    expect(getDataAtRow(4)).toEqual([2012, '#ERROR!', '#ERROR!', '#DIV/0!', 12, '=SUM(E5)']);
  });

  it('should not throw on `updateSettings` with an object that doesn\'t contain an `engine` key', async() => {
    handsontable({
      data: [[]],
      formulas: {
        engine: HyperFormula
      }
    });

    expect(() => updateSettings({
      colWidths() {
        return 400;
      }
    })).not.toThrow();
  });

  it('should return correct values according to plugin state updated by updateSettings()', async() => {
    handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300
    });

    await updateSettings({ formulas: false });

    expect(getDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
    expect(getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1']);
    expect(getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getDataAtRow(4)).toEqual([2012, '=Sum(a2:a5)', '=SUM(B5,E3)', '=A2/B2', 12, '\'=SUM(E5)']);

    await updateSettings({
      formulas: {
        engine: HyperFormula
      }
    });

    expect(getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
    expect(getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getDataAtRow(4)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, '=SUM(E5)']);
  });

  it('should return correct values according to plugin state updated by disablePlugin/enablePlugin methods', async() => {
    handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300
    });

    getPlugin('formulas').disablePlugin();
    await render();

    expect(getDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
    expect(getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1']);
    expect(getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getDataAtRow(4)).toEqual([2012, '=Sum(a2:a5)', '=SUM(B5,E3)', '=A2/B2', 12, '\'=SUM(E5)']);

    getPlugin('formulas').enablePlugin();
    await render();

    expect(getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
    expect(getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getDataAtRow(4)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, '=SUM(E5)']);
  });

  it('should recalculate table after changing cell value (setDataAtCell)', async() => {
    const afterChange = jasmine.createSpy();

    handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300,
      afterChange,
    });

    await setDataAtCell(1, 1, 20);

    expect(getDataAtRow(0)).toEqual([20, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 20]);
    expect(getDataAtRow(1)).toEqual([2009, 20, 2941, 4303, 354, 5814]);
    expect(getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getDataAtRow(4)).toEqual([2012, 8042, 10058, 100.45, 12, '=SUM(E5)']);
    expect(afterChange.calls.argsFor(1)).toEqual([[[1, 1, 0, 20]], 'edit']);
  });

  it('should recalculate table after changing source cell value (setSourceDataAtCell)', async() => {
    handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300
    });

    setSourceDataAtCell(1, 1, 20);

    expect(getDataAtRow(0)).toEqual([20, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 20]);
    expect(getDataAtRow(1)).toEqual([2009, 20, 2941, 4303, 354, 5814]);
    expect(getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getDataAtRow(4)).toEqual([2012, 8042, 10058, 100.45, 12, '=SUM(E5)']);
  });

  it('should recalculate table after changing cell value into formula expression written in lower case', async() => {
    const afterChange = jasmine.createSpy();

    handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300,
      afterChange,
    });

    await setDataAtCell(1, 1, '=Sum(a2:A4)');

    expect(getDataAtRow(0)).toEqual([6030, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 6030]);
    expect(getDataAtRow(1)).toEqual([2009, 6030, 2941, 4303, 354, 5814]);
    expect(getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getDataAtRow(4)).toEqual([2012, 8042, 10058, 0.333167495854063, 12, '=SUM(E5)']);
    expect(afterChange.calls.argsFor(1)).toEqual([[[1, 1, 0, '=Sum(a2:A4)']], 'edit']);
  });

  it('should prevent recalculate table after changing cell value into escaped formula expression', async() => {
    const afterChange = jasmine.createSpy();

    handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300,
      afterChange,
    });

    await setDataAtCell(1, 1, '\'=SUM(A2:A4)');

    expect(getDataAtRow(0)).toEqual(['=SUM(A2:A4)', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=SUM(A2:A4)']);
    expect(getDataAtRow(1)).toEqual([2009, '=SUM(A2:A4)', 2941, 4303, 354, 5814]);
    expect(getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getDataAtRow(4)).toEqual([2012, 8042, 10058, '#VALUE!', 12, '=SUM(E5)']);
    expect(afterChange.calls.argsFor(1))
      .toEqual([[[1, 1, 0, '\'=SUM(A2:A4)']], 'edit']);
  });

  it('should recalculate table after changing cell value from escaped formula expression into valid formula expression',
    async() => {
      const afterChange = jasmine.createSpy();

      handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300,
        afterChange,
      });

      await setDataAtCell(4, 5, getDataAtCell(4, 5));

      expect(getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
      expect(getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
      expect(getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(getDataAtRow(4)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, 12]);
      expect(afterChange.calls.argsFor(1))
        .toEqual([[[4, 5, '\'=SUM(E5)', '=SUM(E5)']], 'edit']);
    });

  it('should recalculate table after changing cell value from primitive value into formula expression', async() => {
    const afterChange = jasmine.createSpy();

    handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300,
      afterChange,
    });

    await setDataAtCell(1, 1, '=SUM(A2:A4)');

    expect(getDataAtRow(0)).toEqual([6030, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 6030]);
    expect(getDataAtRow(1)).toEqual([2009, 6030, 2941, 4303, 354, 5814]);
    expect(getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getDataAtRow(4)).toEqual([2012, 8042, 10058, 0.333167495854063, 12, '=SUM(E5)']);
    expect(afterChange.calls.argsFor(1)).toEqual([[[1, 1, 0, '=SUM(A2:A4)']], 'edit']);
  });

  it('should recalculate table after changing cell value from formula expression into primitive value', async() => {
    const afterChange = jasmine.createSpy();

    handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300,
      afterChange,
    });

    await setDataAtCell(4, 1, 15);

    expect(getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
    expect(getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getDataAtRow(4)).toEqual([2012, 15, 2031, '#DIV/0!', 12, '=SUM(E5)']);
    expect(afterChange.calls.argsFor(1))
      .toEqual([[[4, 1, '=SUM(A2:A5)', 15]], 'edit']);
  });

  it('should recalculate table after changing cell value from formula expression into another formula expression',
    async() => {
      const afterChange = jasmine.createSpy();

      handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300,
        afterChange,
      });

      await setDataAtCell(4, 1, '=SUM(A2:A4)');

      expect(getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
      expect(getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
      expect(getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(getDataAtRow(4)).toEqual([2012, 6030, 8046, '#DIV/0!', 12, '=SUM(E5)']);
      expect(afterChange.calls.argsFor(1))
        .toEqual([[[4, 1, '=SUM(A2:A5)', '=SUM(A2:A4)']], 'edit']);
    });

  it('should correctly recalculate formulas when precedents cells are located out of table viewport', async() => {
    handsontable({
      data: getDataForFormulas(0, 'name', ['=B39']),
      columns: getColumnsForFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 200
    });

    await setDataAtCell(38, 1, 'foo bar');

    expect(getDataAtCell(0, 1)).toBe('foo bar');
  });

  it('should mark cell with circular dependency as #CYCLE!', async() => {
    handsontable({
      data: getDataForFormulas(0, 'name', ['=B1']),
      columns: getColumnsForFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300
    });

    expect(getDataAtCell(0, 1)).toBe('#CYCLE!');
  });

  it('should get dates in proper format and do not throw an error while using `getDataAtCell` inside `cells` method', async() => {
    const data = [];

    // Creating bigger dataset. Some of cells won't be rendered.
    for (let i = 0; i < 50; i += 1) {
      data.push(['28/02/1900', '=A1']);
    }

    handsontable({
      data,
      formulas: {
        engine: HyperFormula
      },
      cells(row, col) {
        const cellProperties = {};

        expect(this.instance.getDataAtCell(row, col)).toBe('28/02/1900');

        return cellProperties;
      },
      columns: [{
        type: 'date',
        dateFormat: 'DD/MM/YYYY'
      }, {
        type: 'date',
        dateFormat: 'DD/MM/YYYY'
      }],
      width: 500,
      height: 300
    });
  });

  it('should return a correctly formatted date while using `getDataAtCell` inside `cells` method with custom dateFormat', async() => {
    const data = [['02/28/1900', '03/01/1900', '=DATEDIF(A1, B1, "D")']];

    handsontable({
      data,
      formulas: {
        engine: HyperFormula
      },
      cells(row, col) {
        if (col === 2) {
          expect(this.instance.getDataAtCell(row, col)).toBe(1);
        }
      },
      columns: [
        { type: 'date', dateFormat: 'MM/DD/YYYY' },
        { type: 'date', dateFormat: 'MM/DD/YYYY' },
        { type: 'numeric' }
      ]
    });
  });

  // Discussion on why `null` instead of `#REF!` at
  // https://github.com/handsontable/handsontable/issues/7668
  describe('Out of range cells', () => {
    it('should return null for columns', async() => {
      handsontable({
        data: getDataForFormulas(0, 'name', ['=K1']),
        columns: getColumnsForFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      // evaluateNullToZero is enabled by default
      expect(getDataAtCell(0, 1)).toBe(0);
    });

    it('should return null for rows', async() => {
      handsontable({
        data: getDataForFormulas(0, 'name', ['=A1000']),
        columns: getColumnsForFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      // evaluateNullToZero is enabled by default
      expect(getDataAtCell(0, 1)).toBe(0);
    });
  });

  it('should recalculate volatile functions upon data changes', async() => {
    handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: {
        engine: HyperFormula
      },
      width: 500,
      height: 300
    });

    await setDataAtCell(0, 0, '=RAND()');

    const firstCellBefore = getDataAtCell(0, 0);

    expect(getDataAtRow(0)).toEqual([firstCellBefore, 'Maserati', 'Mazda', 'Mercedes', 'Mini', firstCellBefore]);
    expect(getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getDataAtRow(4)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, '=SUM(E5)']);

    await setDataAtCell(1, 1, 10);

    const firstCellAfter = getDataAtCell(0, 0);

    expect(firstCellBefore).not.toEqual(firstCellAfter);

    expect(getDataAtRow(0)).toEqual([firstCellAfter, 'Maserati', 'Mazda', 'Mercedes', 'Mini', firstCellAfter]);
    expect(getDataAtRow(1)).toEqual([2009, 10, 2941, 4303, 354, 5814]);
    expect(getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(getDataAtRow(4)).toEqual([2012, 8042, 10058, 200.9, 12, '=SUM(E5)']);
  });

  describe('alter table (insert row)', () => {
    it('should recalculate table after added new empty rows', async() => {
      handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300,
      });

      await alter('insert_row_above', 1, 2);

      expect(getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
      expect(getDataAtRow(1)).toEqual([null, null, null, null, null, null]);
      expect(getDataAtRow(2)).toEqual([null, null, null, null, null, null]);
      expect(getDataAtRow(3)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(getDataAtRow(4)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
      expect(getDataAtRow(5)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(getDataAtRow(6)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, '=SUM(E5)']);
    });

    it('should recalculate table after changing values into newly added row', async() => {
      handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      await alter('insert_row_above', 2, 3);
      await setDataAtCell(3, 0, 2234);

      expect(getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
      expect(getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(getDataAtRow(2)).toEqual([null, null, null, null, null, null]);
      expect(getDataAtRow(3)).toEqual([2234, null, null, null, null, null]);
      expect(getDataAtRow(4)).toEqual([null, null, null, null, null, null]);
      expect(getDataAtRow(5)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
      expect(getDataAtRow(6)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(getDataAtRow(7)).toEqual([2012, 10276, 12292, '#DIV/0!', 12, '=SUM(E5)']);
    });
  });

  describe('alter table (insert column)', () => {
    it('should recalculate table after added new empty columns', async() => {
      handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300,
        contextMenu: true,
      });

      await alter('insert_col_start', 1, 2);

      expect(getDataAtRow(0)).toEqual([0, null, null, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
      expect(getDataAtRow(1)).toEqual([2009, null, null, 0, 2941, 4303, 354, 5814]);
      expect(getDataAtRow(2)).toEqual([2010, null, null, 5, 2905, 2867, 2016, 'Maserati']);
      expect(getDataAtRow(3)).toEqual([2011, null, null, 4, 2517, 4822, 552, 6127]);
      expect(getDataAtRow(4)).toEqual([2012, null, null, 8042, 10058, '#DIV/0!', 12, '=SUM(E5)']);
    });

    it('should recalculate table after changing values into newly added column', async() => {
      handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300,
        contextMenu: true,
      });

      await alter('insert_col_start', 1, 2);
      await setDataAtCell(1, 3, 2);

      expect(getDataAtRow(0)).toEqual([2, null, null, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 2]);
      expect(getDataAtRow(1)).toEqual([2009, null, null, 2, 2941, 4303, 354, 5814]);
      expect(getDataAtRow(2)).toEqual([2010, null, null, 5, 2905, 2867, 2016, 'Maserati']);
      expect(getDataAtRow(3)).toEqual([2011, null, null, 4, 2517, 4822, 552, 6127]);
      expect(getDataAtRow(4)).toEqual([2012, null, null, 8042, 10058, 1004.5, 12, '=SUM(E5)']);
    });
  });

  describe('alter table (remove row)', () => {
    it('should recalculate table after removed rows', async() => {
      handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      await alter('remove_row', 1, 1);

      expect(getDataAtRow(0)).toEqual(['#REF!', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '#REF!']);
      expect(getDataAtRow(1)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
      expect(getDataAtRow(2)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(getDataAtRow(3)).toEqual([2012, 6033, 8049, '#REF!', 12, '=SUM(E5)']);
    });

    it('should correctly remove rows with bigger index than 10 (#dev-1841)', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        formulas: {
          engine: HyperFormula,
        },
      });

      const engine = getPlugin('formulas').engine;

      spyOn(engine, 'removeRows').and.callThrough();
      await alter('remove_row', 9, 3);

      expect(engine.removeRows.calls.argsFor(0)).toEqual([0, [11, 1]]);
      expect(engine.removeRows.calls.argsFor(1)).toEqual([0, [10, 1]]);
      expect(engine.removeRows.calls.argsFor(2)).toEqual([0, [9, 1]]);
    });

    it('should not throw an error after removing all rows', async() => {
      expect(async() => {
        handsontable({
          data: getDataSimpleExampleFormulas(),
          formulas: {
            engine: HyperFormula
          },
          width: 500,
          height: 300
        });

        await alter('remove_row', 0, 5);
      }).not.toThrow();
    });

    it('should not throw an error after removing all columns', async() => {
      expect(async() => {
        handsontable({
          data: getDataSimpleExampleFormulas(),
          formulas: {
            engine: HyperFormula
          },
          width: 500,
          height: 300
        });

        await alter('remove_col', 0, 6);
      }).not.toThrow();
    });

    it('should recalculate table and replace coordinates in formula expressions into #REF! value (removing 2 rows)',
      async() => {
        handsontable({
          data: getDataSimpleExampleFormulas(),
          formulas: {
            engine: HyperFormula
          },
          width: 500,
          height: 300
        });

        await alter('remove_row', 1, 2);

        expect(getSourceDataAtRow(0)).toEqual(['=#REF!', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
        expect(getSourceDataAtRow(1)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
        expect(getSourceDataAtRow(2))
          .toEqual([2012, '=SUM(A2:A3)', '=SUM(B3,#REF!)', '=#REF!/#REF!', 12, '\'=SUM(E5)']);
        expect(getDataAtRow(0)).toEqual(['#REF!', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '#REF!']);
        expect(getDataAtRow(1)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
        expect(getDataAtRow(2)).toEqual([2012, 4023, '#REF!', '#REF!', 12, '=SUM(E5)']);
      });

    it('should recalculate table and replace coordinates in formula expressions ' +
      'into #REF! value (removing first 4 rows)', async() => {
      handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      await alter('remove_row', 0, 4);

      expect(getSourceDataAtRow(0))
        .toEqual([2012, '=SUM(A1:A1)', '=SUM(B1,#REF!)', '=#REF!/#REF!', 12, '\'=SUM(E5)']);
      expect(getDataAtRow(0)).toEqual([2012, 2012, '#REF!', '#REF!', 12, '=SUM(E5)']);
    });

    it('should recalculate table and update formula expression after removing rows ' +
      'intersected on the bottom of cell range', async() => {
      handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      await alter('insert_row_above', 3, 2);
      await setDataAtCell(6, 1, '=SUM(A2:A4)');

      await alter('remove_row', 2, 3);

      expect(getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(getSourceDataAtRow(2)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(getSourceDataAtRow(3)).toEqual([2012, '=SUM(A2:A2)', '=SUM(B4,#REF!)', '=A2/B2', 12, '\'=SUM(E5)']);
      expect(getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
      expect(getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(getDataAtRow(2)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(getDataAtRow(3)).toEqual([2012, 2009, '#REF!', '#DIV/0!', 12, '=SUM(E5)']);
    });

    it('should recalculate table and update formula expression after removing rows intersected ' +
      'on the top of cell range', async() => {
      handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      await setDataAtCell(4, 1, '=SUM(A2:A4)');

      await alter('remove_row', 0, 2);

      expect(getSourceDataAtRow(0)).toEqual([2010, 5, 2905, 2867, '=SUM(A2,2,3)', '=#REF!']);
      expect(getSourceDataAtRow(1)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(getSourceDataAtRow(2))
        .toEqual([2012, '=SUM(A1:A2)', '=SUM(B3,E1)', '=#REF!/#REF!', 12, '\'=SUM(E5)']);
      expect(getDataAtRow(0)).toEqual([2010, 5, 2905, 2867, 2016, '#REF!']);
      expect(getDataAtRow(1)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(getDataAtRow(2)).toEqual([2012, 4021, 6037, '#REF!', 12, '=SUM(E5)']);
    });

    it('should recalculate table and update formula expression after removing rows contains whole cell range', async() => {
      handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      await alter('insert_row_above', 3, 2);
      await setDataAtCell(6, 1, '=SUM(A2:A4)');

      await alter('remove_row', 0, 4);

      expect(getSourceDataAtRow(0)).toEqual([null, null, null, null, null, null]);
      expect(getSourceDataAtRow(1)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(getSourceDataAtRow(2))
        .toEqual([2012, '=SUM(#REF!)', '=SUM(B3,#REF!)', '=#REF!/#REF!', 12, '\'=SUM(E5)']);
      expect(getDataAtRow(0)).toEqual([null, null, null, null, null, null]);
      expect(getDataAtRow(1)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(getDataAtRow(2)).toEqual([2012, '#REF!', '#REF!', '#REF!', 12, '=SUM(E5)']);
    });
  });

  describe('alter table (remove column)', () => {
    it('should recalculate table after removed columns', async() => {
      handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      await alter('remove_col', 1, 1);

      expect(getSourceDataAtRow(0)).toEqual(['=#REF!', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(getSourceDataAtRow(1)).toEqual([2009, 2941, 4303, 354, 5814]);
      expect(getSourceDataAtRow(2)).toEqual([2010, 2905, 2867, '=SUM(A4,2,3)', '=#REF!']);
      expect(getSourceDataAtRow(3)).toEqual([2011, 2517, 4822, 552, 6127]);
      expect(getSourceDataAtRow(4)).toEqual([2012, '=SUM(#REF!,D3)', '=A2/#REF!', 12, '\'=SUM(E5)']);
      expect(getDataAtRow(0)).toEqual(['#REF!', 'Mazda', 'Mercedes', 'Mini', '#REF!']);
      expect(getDataAtRow(1)).toEqual([2009, 2941, 4303, 354, 5814]);
      expect(getDataAtRow(2)).toEqual([2010, 2905, 2867, 2016, '#REF!']);
      expect(getDataAtRow(3)).toEqual([2011, 2517, 4822, 552, 6127]);
      expect(getDataAtRow(4)).toEqual([2012, '#REF!', '#REF!', 12, '=SUM(E5)']);
    });

    it('should correctly remove columns with bigger index than 10 (#dev-1841)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 20),
        formulas: {
          engine: HyperFormula,
        },
      });

      const engine = getPlugin('formulas').engine;

      spyOn(engine, 'removeColumns').and.callThrough();
      await alter('remove_col', 9, 3);

      expect(engine.removeColumns.calls.argsFor(0)).toEqual([0, [11, 1]]);
      expect(engine.removeColumns.calls.argsFor(1)).toEqual([0, [10, 1]]);
      expect(engine.removeColumns.calls.argsFor(2)).toEqual([0, [9, 1]]);
    });

    it('should recalculate table and replace coordinates in formula expressions into #REF! ' +
      'value (removing 2 columns)', async() => {
      handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      await alter('remove_col', 1, 2);

      expect(getSourceDataAtRow(0)).toEqual(['=#REF!', 'Mercedes', 'Mini', '=A$1']);
      expect(getSourceDataAtRow(1)).toEqual([2009, 4303, 354, 5814]);
      expect(getSourceDataAtRow(2)).toEqual([2010, 2867, '=SUM(A4,2,3)', '=#REF!']);
      expect(getSourceDataAtRow(3)).toEqual([2011, 4822, 552, 6127]);
      expect(getSourceDataAtRow(4)).toEqual([2012, '=A2/#REF!', 12, '\'=SUM(E5)']);
      expect(getDataAtRow(0)).toEqual(['#REF!', 'Mercedes', 'Mini', '#REF!']);
      expect(getDataAtRow(1)).toEqual([2009, 4303, 354, 5814]);
      expect(getDataAtRow(2)).toEqual([2010, 2867, 2016, '#REF!']);
      expect(getDataAtRow(3)).toEqual([2011, 4822, 552, 6127]);
      expect(getDataAtRow(4)).toEqual([2012, '#REF!', 12, '=SUM(E5)']);
    });

    it('should recalculate table and replace coordinates in formula expressions into #REF! value ' +
      '(removing first 4 columns)', async() => {
      handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      await alter('remove_col', 0, 4);

      expect(getSourceDataAtRow(0)).toEqual(['Mini', '=#REF!']);
      expect(getSourceDataAtRow(1)).toEqual([354, 5814]);
      expect(getSourceDataAtRow(2)).toEqual(['=SUM(#REF!,2,3)', '=#REF!']);
      expect(getSourceDataAtRow(3)).toEqual([552, 6127]);
      expect(getSourceDataAtRow(4)).toEqual([12, '\'=SUM(E5)']);
      expect(getDataAtRow(0)).toEqual(['Mini', '#REF!']);
      expect(getDataAtRow(1)).toEqual([354, 5814]);
      expect(getDataAtRow(2)).toEqual(['#REF!', '#REF!']);
      expect(getDataAtRow(3)).toEqual([552, 6127]);
      expect(getDataAtRow(4)).toEqual([12, '=SUM(E5)']);
    });

    it('should recalculate table and update formula expression after removing columns intersected ' +
      'on the right of cell range', async() => {
      handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      await setDataAtCell(1, 5, '=Sum(B2:D2)');

      await alter('remove_col', 2, 3);

      expect(getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', '=A$1']);
      expect(getSourceDataAtRow(1)).toEqual([2009, 0, '=SUM(B2:B2)']);
      expect(getSourceDataAtRow(2)).toEqual([2010, 5, '=$B1']);
      expect(getSourceDataAtRow(3)).toEqual([2011, 4, 6127]);
      expect(getSourceDataAtRow(4)).toEqual([2012, '=SUM(A2:A5)', '\'=SUM(E5)']);
      expect(getDataAtRow(0)).toEqual([0, 'Maserati', 0]);
      expect(getDataAtRow(1)).toEqual([2009, 0, 0]);
      expect(getDataAtRow(2)).toEqual([2010, 5, 'Maserati']);
      expect(getDataAtRow(3)).toEqual([2011, 4, 6127]);
      expect(getDataAtRow(4)).toEqual([2012, 8042, '=SUM(E5)']);
    });

    it('should recalculate table and update formula expression after removing columns intersected ' +
      'on the left of cell range', async() => {
      handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      await setDataAtCell(1, 5, '=Sum(B2:D2)');

      await alter('remove_col', 0, 3);

      expect(getSourceDataAtRow(0)).toEqual(['Mercedes', 'Mini', '=#REF!']);
      expect(getSourceDataAtRow(1)).toEqual([4303, 354, '=SUM(A2:A2)']);
      expect(getSourceDataAtRow(2)).toEqual([2867, '=SUM(#REF!,2,3)', '=#REF!']);
      expect(getSourceDataAtRow(3)).toEqual([4822, 552, 6127]);
      expect(getSourceDataAtRow(4)).toEqual(['=#REF!/#REF!', 12, '\'=SUM(E5)']);
      expect(getDataAtRow(0)).toEqual(['Mercedes', 'Mini', '#REF!']);
      expect(getDataAtRow(1)).toEqual([4303, 354, 4303]);
      expect(getDataAtRow(2)).toEqual([2867, '#REF!', '#REF!']);
      expect(getDataAtRow(3)).toEqual([4822, 552, 6127]);
      expect(getDataAtRow(4)).toEqual(['#REF!', 12, '=SUM(E5)']);
    });

    it('should recalculate table and update formula expression after removing columns ' +
      'contains whole cell range', async() => {
      handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      await setDataAtCell(1, 5, '=Sum(B2:D2)');

      await alter('remove_col', 0, 4);

      expect(getSourceDataAtRow(0)).toEqual(['Mini', '=#REF!']);
      expect(getSourceDataAtRow(1)).toEqual([354, '=SUM(#REF!)']);
      expect(getSourceDataAtRow(2)).toEqual(['=SUM(#REF!,2,3)', '=#REF!']);
      expect(getSourceDataAtRow(3)).toEqual([552, 6127]);
      expect(getSourceDataAtRow(4)).toEqual([12, '\'=SUM(E5)']);
      expect(getDataAtRow(0)).toEqual(['Mini', '#REF!']);
      expect(getDataAtRow(1)).toEqual([354, '#REF!']);
      expect(getDataAtRow(2)).toEqual(['#REF!', '#REF!']);
      expect(getDataAtRow(3)).toEqual([552, 6127]);
      expect(getDataAtRow(4)).toEqual([12, '=SUM(E5)']);
    });
  });

  describe('alter table (mixed operations)', () => {
    it('should recalculate table and replace coordinates in formula expressions', async() => {
      handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      await alter('remove_col', 3);
      await alter('remove_row', 2);
      await alter('remove_row', 2);
      await alter('insert_row_above', 0);
      await alter('remove_col', 3);
      await alter('insert_col_start', 3);

      expect(getSourceDataAtRow(0)).toEqual([null, null, null, null, null]);
      expect(getSourceDataAtRow(1)).toEqual(['=$B$3', 'Maserati', 'Mazda', null, '=A$2']);
      expect(getSourceDataAtRow(2)).toEqual([2009, 0, 2941, null, 5814]);
      expect(getSourceDataAtRow(3)).toEqual([2012, '=SUM(A3:A4)', '=SUM(B4,#REF!)', null, '\'=SUM(E5)']);
      expect(getDataAtRow(0)).toEqual([null, null, null, null, null]);
      expect(getDataAtRow(1)).toEqual([0, 'Maserati', 'Mazda', null, 0]);
      expect(getDataAtRow(2)).toEqual([2009, 0, 2941, null, 5814]);
      expect(getDataAtRow(3)).toEqual([2012, 4021, '#REF!', null, '=SUM(E5)']);
    });
  });

  describe('undo/redo', () => {
    it('should restore previous edited formula expression and recalculate table after that', async() => {
      handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300
      });

      await setDataAtCell(0, 5, '=B5');
      getPlugin('undoRedo').undo();

      expect(getSourceDataAtCell(0, 5)).toBe('=A$1');
      expect(getDataAtCell(0, 5)).toBe(0);

      getPlugin('undoRedo').redo();

      expect(getSourceDataAtCell(0, 5)).toBe('=B5');
      expect(getDataAtCell(0, 5)).toBe(8042);
    });

    it('should restore previous state after alter table (mixed insert operations)', async() => {
      handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300,
        contextMenu: true,
      });

      await alter('insert_row_above', 1, 3);
      await alter('insert_col_start', 1);
      await alter('insert_col_start', 4, 2);
      await alter('insert_row_above', 5);
      getPlugin('undoRedo').undo();

      expect(getSourceDataAtRow(0))
        .toEqual(['=$C$5', null, 'Maserati', 'Mazda', null, null, 'Mercedes', 'Mini', '=A$1']);
      expect(getSourceDataAtRow(1)).toEqual([null, null, null, null, null, null, null, null, null]);
      expect(getSourceDataAtRow(2)).toEqual([null, null, null, null, null, null, null, null, null]);
      expect(getSourceDataAtRow(3)).toEqual([null, null, null, null, null, null, null, null, null]);
      expect(getSourceDataAtRow(4)).toEqual([2009, null, 0, 2941, null, null, 4303, 354, 5814]);
      expect(getSourceDataAtRow(5)).toEqual([2010, null, 5, 2905, null, null, 2867, '=SUM(A7,2,3)', '=$C1']);
      expect(getSourceDataAtRow(6)).toEqual([2011, null, 4, 2517, null, null, 4822, 552, 6127]);
      expect(getSourceDataAtRow(7))
        .toEqual([2012, null, '=SUM(A5:A8)', '=SUM(C8,H6)', null, null, '=A5/C5', 12, '\'=SUM(E5)']);

      getPlugin('undoRedo').undo();

      expect(getSourceDataAtRow(0)).toEqual(['=$C$5', null, 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(getSourceDataAtRow(1)).toEqual([null, null, null, null, null, null, null]);
      expect(getSourceDataAtRow(2)).toEqual([null, null, null, null, null, null, null]);
      expect(getSourceDataAtRow(3)).toEqual([null, null, null, null, null, null, null]);
      expect(getSourceDataAtRow(4)).toEqual([2009, null, 0, 2941, 4303, 354, 5814]);
      expect(getSourceDataAtRow(5)).toEqual([2010, null, 5, 2905, 2867, '=SUM(A7,2,3)', '=$C1']);
      expect(getSourceDataAtRow(6)).toEqual([2011, null, 4, 2517, 4822, 552, 6127]);
      expect(getSourceDataAtRow(7))
        .toEqual([2012, null, '=SUM(A5:A8)', '=SUM(C8,F6)', '=A5/C5', 12, '\'=SUM(E5)']);

      getPlugin('undoRedo').undo();

      expect(getSourceDataAtRow(0)).toEqual(['=$B$5', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(getSourceDataAtRow(1)).toEqual([null, null, null, null, null, null]);
      expect(getSourceDataAtRow(2)).toEqual([null, null, null, null, null, null]);
      expect(getSourceDataAtRow(3)).toEqual([null, null, null, null, null, null]);
      expect(getSourceDataAtRow(4)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(getSourceDataAtRow(5)).toEqual([2010, 5, 2905, 2867, '=SUM(A7,2,3)', '=$B1']);
      expect(getSourceDataAtRow(6)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(getSourceDataAtRow(7))
        .toEqual([2012, '=SUM(A5:A8)', '=SUM(B8,E6)', '=A5/B5', 12, '\'=SUM(E5)']);

      getPlugin('undoRedo').undo();

      expect(getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(getSourceDataAtRow(2)).toEqual([2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1']);
      expect(getSourceDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(getSourceDataAtRow(4))
        .toEqual([2012, '=SUM(A2:A5)', '=SUM(B5,E3)', '=A2/B2', 12, '\'=SUM(E5)']);
    });

    it('should redo into the next state after alter table (mixed insert operations)', async() => {
      handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300,
        contextMenu: true,
      });

      await alter('insert_row_above', 1, 3);
      await alter('insert_col_start', 1);
      await alter('insert_col_start', 4, 2);
      await alter('insert_row_above', 5);
      getPlugin('undoRedo').undo();
      getPlugin('undoRedo').undo();
      getPlugin('undoRedo').undo();
      getPlugin('undoRedo').undo();

      expect(getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(getSourceDataAtRow(2)).toEqual([2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1']);
      expect(getSourceDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(getSourceDataAtRow(4)).toEqual([2012, '=SUM(A2:A5)', '=SUM(B5,E3)', '=A2/B2', 12, '\'=SUM(E5)']);

      getPlugin('undoRedo').redo();

      expect(getSourceDataAtRow(0)).toEqual(['=$B$5', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(getSourceDataAtRow(1)).toEqual([null, null, null, null, null, null]);
      expect(getSourceDataAtRow(2)).toEqual([null, null, null, null, null, null]);
      expect(getSourceDataAtRow(3)).toEqual([null, null, null, null, null, null]);
      expect(getSourceDataAtRow(4)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(getSourceDataAtRow(5)).toEqual([2010, 5, 2905, 2867, '=SUM(A7,2,3)', '=$B1']);
      expect(getSourceDataAtRow(6)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(getSourceDataAtRow(7)).toEqual([2012, '=SUM(A5:A8)', '=SUM(B8,E6)', '=A5/B5', 12, '\'=SUM(E5)']);

      getPlugin('undoRedo').redo();

      expect(getSourceDataAtRow(0)).toEqual(['=$C$5', null, 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(getSourceDataAtRow(1)).toEqual([null, null, null, null, null, null, null]);
      expect(getSourceDataAtRow(2)).toEqual([null, null, null, null, null, null, null]);
      expect(getSourceDataAtRow(3)).toEqual([null, null, null, null, null, null, null]);
      expect(getSourceDataAtRow(4)).toEqual([2009, null, 0, 2941, 4303, 354, 5814]);
      expect(getSourceDataAtRow(5)).toEqual([2010, null, 5, 2905, 2867, '=SUM(A7,2,3)', '=$C1']);
      expect(getSourceDataAtRow(6)).toEqual([2011, null, 4, 2517, 4822, 552, 6127]);
      expect(getSourceDataAtRow(7)).toEqual([2012, null, '=SUM(A5:A8)', '=SUM(C8,F6)', '=A5/C5', 12, '\'=SUM(E5)']);

      getPlugin('undoRedo').redo();

      expect(getSourceDataAtRow(0))
        .toEqual(['=$C$5', null, 'Maserati', 'Mazda', null, null, 'Mercedes', 'Mini', '=A$1']);
      expect(getSourceDataAtRow(1)).toEqual([null, null, null, null, null, null, null, null, null]);
      expect(getSourceDataAtRow(2)).toEqual([null, null, null, null, null, null, null, null, null]);
      expect(getSourceDataAtRow(3)).toEqual([null, null, null, null, null, null, null, null, null]);
      expect(getSourceDataAtRow(4)).toEqual([2009, null, 0, 2941, null, null, 4303, 354, 5814]);
      expect(getSourceDataAtRow(5)).toEqual([2010, null, 5, 2905, null, null, 2867, '=SUM(A7,2,3)', '=$C1']);
      expect(getSourceDataAtRow(6)).toEqual([2011, null, 4, 2517, null, null, 4822, 552, 6127]);
      expect(getSourceDataAtRow(7))
        .toEqual([2012, null, '=SUM(A5:A8)', '=SUM(C8,H6)', null, null, '=A5/C5', 12, '\'=SUM(E5)']);
    });

    xit('should restore previous state after alter table (mixed remove operations)', async() => {
      handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300,
        contextMenu: true,
      });

      await alter('remove_row', 2);
      await alter('remove_col', 2, 2);
      await alter('remove_row', 0, 2);
      await alter('remove_col', 3);
      getPlugin('undoRedo').undo();

      expect(getSourceDataAtRow(0)).toEqual([2011, 4, 552, 6127]);
      expect(getSourceDataAtRow(1)).toEqual([2012, '=SUM(A1:A2)', 12, '=SUM(E5)']);

      getPlugin('undoRedo').undo();

      expect(getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mini', '=A$1']);
      expect(getSourceDataAtRow(1)).toEqual([2009, 0, 354, 5814]);
      expect(getSourceDataAtRow(2)).toEqual([2011, 4, 552, 6127]);
      expect(getSourceDataAtRow(3)).toEqual([2012, '=SUM(A2:A4)', 12, '=SUM(E5)']);

      getPlugin('undoRedo').undo();

      expect(getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(getSourceDataAtRow(2)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(getSourceDataAtRow(3)).toEqual([2012, '=SUM(A2:A4)', '=SUM(B4,#REF!)', '=A2/B2', 12, '=SUM(E5)']);

      getPlugin('undoRedo').undo();

      expect(getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(getSourceDataAtRow(2)).toEqual([2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1']);
      expect(getSourceDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(getSourceDataAtRow(4)).toEqual([2012, '=Sum(a2:a5)', '=SUM(B5,E3)', '=A2/B2', 12, '=SUM(E5)']);
    });

    xit('should redo into the next state after alter table (mixed remove operations)', async() => {
      handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        width: 500,
        height: 300,
        contextMenu: true,
      });

      await alter('remove_row', 2);
      await alter('remove_col', 2, 2);
      await alter('remove_row', 0, 2);
      await alter('remove_col', 3);
      getPlugin('undoRedo').undo();
      getPlugin('undoRedo').undo();
      getPlugin('undoRedo').undo();
      getPlugin('undoRedo').undo();

      expect(getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(getSourceDataAtRow(2)).toEqual([2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1']);
      expect(getSourceDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(getSourceDataAtRow(4)).toEqual([2012, '=Sum(a2:a5)', '=SUM(B5,E3)', '=A2/B2', 12, '=SUM(E5)']);

      getPlugin('undoRedo').redo();

      expect(getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(getSourceDataAtRow(2)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(getSourceDataAtRow(3)).toEqual([2012, '=SUM(A2:A4)', '=SUM(B4,#REF!)', '=A2/B2', 12, '=SUM(E5)']);

      getPlugin('undoRedo').redo();

      expect(getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mini', '=A$1']);
      expect(getSourceDataAtRow(1)).toEqual([2009, 0, 354, 5814]);
      expect(getSourceDataAtRow(2)).toEqual([2011, 4, 552, 6127]);
      expect(getSourceDataAtRow(3)).toEqual([2012, '=SUM(A2:A4)', 12, '=SUM(E5)']);

      getPlugin('undoRedo').redo();

      expect(getSourceDataAtRow(0)).toEqual([2011, 4, 552, 6127]);
      expect(getSourceDataAtRow(1)).toEqual([2012, '=SUM(A1:A2)', 12, '=SUM(E5)']);
    });

    it('should work properly while doing cell used by some formula empty', async() => {
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

      await setDataAtCell(0, 0, null);

      expect(getSourceData()).toEqual([
        [null, '=A1+1', '=B1+1'],
      ]);
      expect(getData()).toEqual([
        [null, 1, 2],
      ]);

      getPlugin('undoRedo').undo();

      expect(getSourceData()).toEqual([
        [5, '=A1+1', '=B1+1'],
      ]);
      expect(getData()).toEqual([
        [5, 6, 7],
      ]);

      getPlugin('undoRedo').redo();

      expect(getSourceData()).toEqual([
        [null, '=A1+1', '=B1+1'],
      ]);
      expect(getData()).toEqual([
        [null, 1, 2],
      ]);
    });

    it('should cooperate properly with `setDataAtCell` action for multiple cells', async() => {
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

      await setDataAtCell([
        [0, 0, '=B1+2'],
        [0, 1, '=C1+2'],
        [0, 2, 10],
      ]);

      getPlugin('undoRedo').undo();

      expect(getSourceData()).toEqual([
        [0, '=A1+1', '=B1+1'],
      ]);
      expect(getData()).toEqual([
        [0, 1, 2],
      ]);

      getPlugin('undoRedo').redo();

      expect(getSourceData()).toEqual([
        ['=B1+2', '=C1+2', 10],
      ]);
      expect(getData()).toEqual([
        [14, 12, 10],
      ]);

      getPlugin('undoRedo').undo();

      expect(getSourceData()).toEqual([
        [0, '=A1+1', '=B1+1'],
      ]);
      expect(getData()).toEqual([
        [0, 1, 2],
      ]);
    });

    it('should show proper values when doing undo/redo after moving rows', async() => {
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

      await render();

      getPlugin('undoRedo').undo();

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

      getPlugin('undoRedo').redo();

      expect(getSourceData()).toEqual([
        [5],
        ['=A2+1'],
        ['=A1+1'],
      ]);
      expect(getData()).toEqual([
        [6],
        [5],
        [7],
      ]);
    });

    it('should show proper values when doing undo/redo after changing sheet size', async() => {
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

      await alter('insert_col_start', 0);
      await alter('remove_col', 0);

      expect(getSourceData()).toEqual([
        [0, '=A1+1', '=B1+1'],
      ]);
      expect(getData()).toEqual([
        [0, 1, 2],
      ]);

      getPlugin('undoRedo').undo();

      expect(getSourceData()).toEqual([
        [null, 0, '=B1+1', '=C1+1'],
      ]);
      expect(getData()).toEqual([
        [null, 0, 1, 2],
      ]);

      getPlugin('undoRedo').undo();

      expect(getSourceData()).toEqual([
        [0, '=A1+1', '=B1+1'],
      ]);
      expect(getData()).toEqual([
        [0, 1, 2],
      ]);

      getPlugin('undoRedo').redo();

      expect(getSourceData()).toEqual([
        [null, 0, '=B1+1', '=C1+1'],
      ]);
      expect(getData()).toEqual([
        [null, 0, 1, 2],
      ]);

      getPlugin('undoRedo').redo();

      expect(getSourceData()).toEqual([
        [0, '=A1+1', '=B1+1'],
      ]);
      expect(getData()).toEqual([
        [0, 1, 2],
      ]);
    });

    describe('should show proper value when doing undo/redo after reducing sheet size', () => {
      it('(removing cell with value used by some formula)', async() => {
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

        await alter('remove_row', 0);

        getPlugin('undoRedo').undo();

        expect(getSourceData()).toEqual([
          [2],
          ['=A1*10'],
        ]);
        expect(getData()).toEqual([
          [2],
          [20],
        ]);

        getPlugin('undoRedo').redo();

        expect(getSourceData()).toEqual([
          ['=#REF!*10'],
        ]);
        expect(getData()).toEqual([
          ['#REF!'],
        ]);
      });

      it('(removing formula using value from some cell)', async() => {
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

        await alter('remove_row', 1);

        getPlugin('undoRedo').undo();

        expect(getSourceData()).toEqual([
          [2],
          ['=A1*10'],
        ]);
        expect(getData()).toEqual([
          [2],
          [20],
        ]);

        getPlugin('undoRedo').redo();

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

        await selectCell(0, 0);
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

        getPlugin('undoRedo').undo();

        expect(getSourceData()).toEqual([
          [2, 3, 4, 5],
          [2, null, '=A2*10', null],
        ]);
        expect(getData()).toEqual([
          [2, 3, 4, 5],
          [2, null, 20, null],
        ]);

        getPlugin('undoRedo').undo();

        expect(getSourceData()).toEqual([
          [2, 3, 4, 5],
          ['=A1*10', null, '=A2*10', null],
        ]);
        expect(getData()).toEqual([
          [2, 3, 4, 5],
          [20, null, 200, null],
        ]);

        getPlugin('undoRedo').redo();

        expect(getSourceData()).toEqual([
          [2, 3, 4, 5],
          [2, null, '=A2*10', null],
        ]);
        expect(getData()).toEqual([
          [2, 3, 4, 5],
          [2, null, 20, null],
        ]);

        getPlugin('undoRedo').redo();

        expect(getSourceData()).toEqual([
          [2, 2, 4, 5],
          [2, 2, '=A2*10', null],
        ]);
        expect(getData()).toEqual([
          [2, 2, 4, 5],
          [2, 2, 20, null],
        ]);

        getPlugin('undoRedo').undo();

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

        await selectCell(1, 2);

        autofill(1, 3);

        await sleep(100);

        getPlugin('undoRedo').undo();

        expect(getSourceData()).toEqual([
          [2, 3, 4, 5],
          ['=A1*10', null, '=A2*10', null],
        ]);
        expect(getData()).toEqual([
          [2, 3, 4, 5],
          [20, null, 200, null],
        ]);

        getPlugin('undoRedo').redo();

        expect(getSourceData()).toEqual([
          [2, 3, 4, 5],
          ['=A1*10', null, '=A2*10', '=B2*10'],
        ]);
        expect(getData()).toEqual([
          [2, 3, 4, 5],
          [20, null, 200, 0],
        ]);

        getPlugin('undoRedo').undo();

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

        await selectCell(0, 0);

        autofill(0, 3);

        await sleep(100);

        getPlugin('undoRedo').undo();

        expect(getSourceData()).toEqual([
          [2, 3, 4, 5],
          ['=A1*10', null, '=A2*10', null],
        ]);
        expect(getData()).toEqual([
          [2, 3, 4, 5],
          [20, null, 200, null],
        ]);

        getPlugin('undoRedo').redo();

        expect(getSourceData()).toEqual([
          [2, 2, 2, 2],
          ['=A1*10', null, '=A2*10', null],
        ]);
        expect(getData()).toEqual([
          [2, 2, 2, 2],
          [20, null, 200, null],
        ]);

        getPlugin('undoRedo').undo();

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

      await selectCell(0, 0);
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

    it('should not override result of simple autofill (populating more cells) #8050', async() => {
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

      await selectCell(0, 0, 6, 1);
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

    it('should not autofill if `beforeAutofill` returned false', async() => {
      handsontable({
        data: [
          ['=A1', 'x', 'x'],
        ],
        formulas: {
          engine: HyperFormula
        },
        beforeAutofill: () => false
      });

      await selectCell(0, 0);
      autofill(0, 2);

      expect(getSourceData()).toEqual([['=A1', 'x', 'x']]);
    });

    it('should not use the plugin\'s autofill if `beforeAutofill` returned values', async() => {
      handsontable({
        data: [
          ['=A1', 'x', 'x'],
        ],
        formulas: {
          engine: HyperFormula
        },
        beforeAutofill: () => [['a']]
      });

      await selectCell(0, 0);
      autofill(0, 2);

      expect(getSourceData()).toEqual([['=A1', 'a', 'a']]);
    });

    it('should autofill an array of objects correctly', async() => {
      handsontable({
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

      await selectCell(0, 1, 4, 1);
      autofill(4, 2);

      expect(getSourceDataArray()).toEqual([
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
    it('should correctly autofill - single cell, down', async() => {
      handsontable({
        data: [
          ['=A1'],
          ['x'],
          ['x']
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      await selectCell(0, 0);
      autofill(2, 0);

      expect(getSourceData()).toEqual([
        ['=A1'],
        ['=A2'],
        ['=A3']
      ]);
    });

    it('should correctly autofill - single cell, right', async() => {
      handsontable({
        data: [
          ['=A1', 'x', 'x']
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      await selectCell(0, 0);
      autofill(0, 2);

      expect(getSourceData()).toEqual([
        ['=A1', '=B1', '=C1']
      ]);
    });

    it('should correctly autofill - range, down, partial', async() => {
      handsontable({
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

      await selectCell(0, 0, 2, 1);
      autofill(4, 1);

      expect(getSourceData()).toEqual([
        ['=E6', '=E10'],
        ['=G6', '=G10'],
        ['=I6', '=I10'],
        ['=E9', '=E13'],
        ['=G9', '=G13'],
      ]);
    });

    it('should correctly autofill - range, down, overflow', async() => {
      handsontable({
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

      await selectCell(0, 0, 2, 1);
      autofill(8, 1);

      expect(getSourceData()).toEqual([
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

    it('should correctly autofill - range, right, partial', async() => {
      handsontable({
        data: [
          ['=E6', '=E10', 'x', 'y'],
          ['=G6', '=G10', 'x', 'y'],
          ['=I6', '=I10', 'x', 'y'],
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      await selectCell(0, 0, 2, 1);
      autofill(2, 2);

      expect(getSourceData()).toEqual([
        ['=E6', '=E10', '=G6', 'y'],
        ['=G6', '=G10', '=I6', 'y'],
        ['=I6', '=I10', '=K6', 'y'],
      ]);
    });

    it('should correctly autofill - range, right, overflow', async() => {
      handsontable({
        data: [
          ['=E6', '=E10', 'x', 'x', 'x', 'y'],
          ['=G6', '=G10', 'x', 'x', 'x', 'y'],
          ['=I6', '=I10', 'x', 'x', 'x', 'y']
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      await selectCell(0, 0, 2, 1);
      autofill(2, 4);

      expect(getSourceData()).toEqual([
        ['=E6', '=E10', '=G6', '=G10', '=I6', 'y'],
        ['=G6', '=G10', '=I6', '=I10', '=K6', 'y'],
        ['=I6', '=I10', '=K6', '=K10', '=M6', 'y']
      ]);
    });

    it('should correctly autofill - range, left, partial', async() => {
      handsontable({
        data: [
          ['y', 'x', '=E6', '=E10'],
          ['y', 'x', '=G6', '=G10'],
          ['y', 'x', '=I6', '=I10'],
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      await selectCell(0, 2, 2, 3);
      autofill(2, 1);

      expect(getSourceData()).toEqual([
        ['y', '=C10', '=E6', '=E10'],
        ['y', '=E10', '=G6', '=G10'],
        ['y', '=G10', '=I6', '=I10'],
      ]);
    });

    it('should correctly autofill - range, left, overflow', async() => {
      handsontable({
        data: [
          ['y', 'x', 'x', 'x', '=E6', '=E10'],
          ['y', 'x', 'x', 'x', '=G6', '=G10'],
          ['y', 'x', 'x', 'x', '=I6', '=I10'],
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      await selectCell(0, 4, 2, 5);
      autofill(2, 1);

      expect(getSourceData()).toEqual([
        ['y', '=A10', '=C6', '=C10', '=E6', '=E10'],
        ['y', '=C10', '=E6', '=E10', '=G6', '=G10'],
        ['y', '=E10', '=G6', '=G10', '=I6', '=I10'],
      ]);
    });

    it('should correctly autofill - range, left, odd', async() => {
      handsontable({
        data: [['y', 'x', 'x', 'x', 'x', 'x', 'x', '=Z3', '=Z5', '=Z8']],
        formulas: {
          engine: HyperFormula
        }
      });

      await selectCell(0, 7, 0, 9);
      autofill(0, 1);

      expect(getSourceData()).toEqual([
        ['y', '=T3', '=T5', '=T8', '=W3', '=W5', '=W8', '=Z3', '=Z5', '=Z8']
      ]);
    });

    it('should correctly autofill - range, up, partial', async() => {
      handsontable({
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

      await selectCell(1, 0, 3, 1);
      autofill(0, 1);

      expect(getSourceData()).toEqual([
        ['=I4', '=I7'],
        ['=E7', '=E10'],
        ['=G7', '=G10'],
        ['=I7', '=I10']
      ]);
    });

    it('should correctly autofill - range, up, overflow', async() => {
      handsontable({
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

      await selectCell(6, 0, 8, 1);
      autofill(1, 1);

      expect(getSourceData()).toEqual([
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

    it('should correctly autofill - range, up, even', async() => {
      handsontable({
        data: [['y'], ['x'], ['x'], ['x'], ['x'], ['x'], ['x'], ['=A9'], ['=A12']],
        formulas: {
          engine: HyperFormula
        }
      });

      await selectCell(7, 0, 8, 0);
      autofill(1, 0);

      expect(getSourceData()).toEqual([
        ['y'], ['=A3'], ['=A6'], ['=A5'], ['=A8'], ['=A7'], ['=A10'], ['=A9'], ['=A12']
      ]);
    });

    it('should allow for mutating autofill results when using formulas (#8107)', async() => {
      handsontable({
        data: [
          ['2016', 1, 1, 2, 3],
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      addHook('beforeChange', (changes) => { changes[0] = null; });

      await selectCell(0, 0);
      autofill(0, 2);

      expect(getData()).toEqual([['2016', 1, '2016', 2, 3]]);
    });
  });

  describe('Formulas#getCellType', () => {
    it('should return `FORMULA`', async() => {
      handsontable({
        data: [['=2 + 2']],
        formulas: {
          engine: HyperFormula
        }
      });

      expect(getPlugin('formulas').getCellType(0, 0)).toEqual('FORMULA');
    });

    it('should return `VALUE`', async() => {
      handsontable({
        data: [['4']],
        formulas: {
          engine: HyperFormula
        }
      });

      expect(getPlugin('formulas').getCellType(0, 0)).toEqual('VALUE');
    });

    it('should return `ARRAYFORMULA`', async() => {
      handsontable({
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

      await setDataAtCell(2, 0, '=ARRAYFORMULA(TRANSPOSE(A1:B2))');

      expect(getPlugin('formulas').getCellType(2, 0)).toEqual('ARRAYFORMULA');
    });

    it('should return `EMPTY` when out of bounds', async() => {
      handsontable({
        data: [['4']],
        formulas: {
          engine: HyperFormula
        }
      });

      expect(getPlugin('formulas').getCellType(10, 10)).toEqual('EMPTY');
    });

    it('should return correct values for background sheets', async() => {
      const hf = HyperFormula.buildFromSheets({
        one: [['4']],
        two: [['=2 + 2']]
      });

      handsontable({
        formulas: {
          engine: hf,
          sheetName: 'one'
        }
      });

      const sheet = getPlugin('formulas').engine.getSheetId('two');

      expect(getPlugin('formulas').getCellType(0, 0, sheet)).toEqual('FORMULA');
    });
  });

  describe('hyperformula alter operation blocks', () => {
    it('should block creating too many rows', async() => {
      handsontable({
        data: [],
        formulas: {
          engine: {
            hyperformula: HyperFormula
          }
        },
        // TODO: Temporarily overwrite the default value due to https://github.com/handsontable/handsontable/issues/7840
        maxRows: 10000
      });

      await alter('insert_row_above', 0, 20000);

      expect(countRows()).toEqual(0);
    });

    it('should block creating too many columns', async() => {
      handsontable({
        data: [[]],
        formulas: {
          engine: HyperFormula
        },
        // TODO: Temporarily overwrite the default value due to https://github.com/handsontable/handsontable/issues/7840
        maxCols: 10000
      });

      await alter('insert_col_start', 0, 20000);

      expect(countCols()).toEqual(0);
    });
  });

  it('should not render multiple times when updating many cells', async() => {
    const afterViewRender = jasmine.createSpy();

    handsontable({
      data: createSpreadsheetData(10, 10),
      formulas: {
        engine: HyperFormula
      },
      afterViewRender
    });

    expect(afterViewRender).toHaveBeenCalledTimes(1);

    await selectCell(1, 1, 5, 5);
    await keyDownUp('delete');

    expect(afterViewRender).toHaveBeenCalledTimes(2);
  });

  it('should freeze correct columns with ManualColumnFreeze', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      formulas: {
        engine: HyperFormula
      },
      manualColumnFreeze: true
    });

    getPlugin('ManualColumnFreeze').freezeColumn(2);

    expect(getData()).toEqual([
      ['C1', 'A1', 'B1', 'D1', 'E1'],
      ['C2', 'A2', 'B2', 'D2', 'E2'],
      ['C3', 'A3', 'B3', 'D3', 'E3'],
      ['C4', 'A4', 'B4', 'D4', 'E4'],
      ['C5', 'A5', 'B5', 'D5', 'E5']
    ]);

    getPlugin('ManualColumnFreeze').freezeColumn(2);

    expect(getData()).toEqual([
      ['C1', 'B1', 'A1', 'D1', 'E1'],
      ['C2', 'B2', 'A2', 'D2', 'E2'],
      ['C3', 'B3', 'A3', 'D3', 'E3'],
      ['C4', 'B4', 'A4', 'D4', 'E4'],
      ['C5', 'B5', 'A5', 'D5', 'E5']
    ]);
  });

  it('should support basic sorting', async() => {
    handsontable({
      data: [
        ['B2', 3.5, '=B2'],
        ['B1', 99, '=B1'],
        ['SUM(B1:B2)', 1.5, '=SUM(B1:B2)'],
      ],
      colHeaders: true,
      rowHeaders: true,
      contextMenu: true,
      formulas: {
        engine: HyperFormula
      },
      columnSorting: true,
    });

    getPlugin('columnSorting').sort({
      column: 1,
      sortOrder: 'asc'
    });

    expect(getData()).toEqual([
      ['SUM(B1:B2)', 1.5, '#REF!'],
      ['B2', 3.5, 99],
      ['B1', 99, 3.5],
    ]);

    // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
    // (the same as at the start).
    expect(getSourceData()).toEqual([
      ['B2', 3.5, '=B3'],
      ['B1', 99, '=B2'],
      ['SUM(B1:B2)', 1.5, '=SUM(#REF!)'],
    ]);

    getPlugin('columnSorting').sort({
      column: 1,
      sortOrder: 'desc'
    });

    expect(getData()).toEqual([
      ['B1', 99, '#REF!'],
      ['B2', 3.5, 1.5],
      ['SUM(B1:B2)', 1.5, '#REF!'],
    ]);

    // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
    // (the same as at the start).
    expect(getSourceData()).toEqual([
      ['B2', 3.5, '=B3'],
      ['B1', 99, '=#REF!'],
      ['SUM(B1:B2)', 1.5, '=SUM(#REF!)'],
    ]);

    getPlugin('columnSorting').clearSort();

    expect(getData()).toEqual([
      ['B2', 3.5, 99],
      ['B1', 99, '#REF!'],
      ['SUM(B1:B2)', 1.5, '#REF!'],
    ]);

    // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
    // (the same as at the start).
    expect(getSourceData()).toEqual([
      ['B2', 3.5, '=B2'],
      ['B1', 99, '=#REF!'],
      ['SUM(B1:B2)', 1.5, '=SUM(#REF!)'],
    ]);
  });

  it('should sort properly when some cell is referencing to element outside the table boundaries', async() => {
    handsontable({
      data: [
        [1, '=A3'],
        [2, '=A1'],
        [3, '=A2'],
      ],
      colHeaders: true,
      rowHeaders: true,
      contextMenu: true,
      formulas: {
        engine: HyperFormula
      },
      columnSorting: true,
    });

    getPlugin('columnSorting').sort({
      column: 0,
      sortOrder: 'asc'
    });

    expect(getData()).toEqual([
      [1, 3],
      [2, 1],
      [3, 2],
    ]);

    expect(getSourceData()).toEqual([
      [1, '=A3'],
      [2, '=A1'],
      [3, '=A2'],
    ]);

    getPlugin('columnSorting').sort({
      column: 0,
      sortOrder: 'desc'
    });

    expect(getData()).toEqual([
      [3, '#REF!'],
      [2, 3],
      [1, 0],
    ]);

    // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
    // (the same as at the start).
    expect(getSourceData()).toEqual([
      [1, '=A5'],
      [2, '=A1'],
      [3, '=#REF!'],
    ]);

    getPlugin('columnSorting').clearSort();

    expect(getData()).toEqual([
      [1, 3],
      [2, 1],
      [3, '#REF!'],
    ]);

    // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
    // (the same as at the start).
    expect(getSourceData()).toEqual([
      [1, '=A3'],
      [2, '=A1'],
      [3, '=#REF!'],
    ]);
  });

  describe('basic filtering support', () => {
    it('should filter by condition', async() => {
      handsontable({
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

      getPlugin('filters').addCondition(0, 'eq', ['orci']);
      getPlugin('filters').filter();

      expect(getData()).toEqual([['orci', 'et', 'dignissim', 'hendrerit', '12/1/2016', 8.5]]);
    });

    it('should filter by value', async() => {
      handsontable({
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

      getPlugin('filters').addCondition(0, 'by_value', [['orci']]);
      getPlugin('filters').filter();

      expect(getData()).toEqual([['orci', 'et', 'dignissim', 'hendrerit', '12/1/2016', 8.5]]);
    });
  });

  it('should have very basic support for nested rows', async() => {
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

    handsontable({
      data,
      rowHeaders: true,
      colHeaders: ['Category', 'Artist', 'Title', 'Album', 'Label'],
      nestedRows: true,
      contextMenu: true,
      formulas: {
        engine: HyperFormula
      },
    });

    getPlugin('nestedRows').collapsingUI.collapseMultipleChildren([0, 6, 18]);

    expect(getData()).toEqual([
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

  it('should support moving columns', async() => {
    handsontable({
      data: createSpreadsheetData(1, 5),
      manualColumnMove: true,
      colHeaders: true
    });

    getPlugin('ManualColumnMove').moveColumn(2, 0);

    getPlugin('ManualColumnMove').moveColumn(3, 0);
    getPlugin('ManualColumnMove').moveColumn(3, 0);

    await render();

    expect(getData()).toEqual([['B1', 'D1', 'C1', 'A1', 'E1']]);
  });

  it('should support moving rows', async() => {
    handsontable({
      data: createSpreadsheetData(5, 1),
      manualRowMove: true
    });

    getPlugin('ManualRowMove').moveRow(2, 0);

    getPlugin('ManualRowMove').moveRow(3, 0);
    getPlugin('ManualRowMove').moveRow(3, 0);

    await render();

    expect(getData()).toEqual([
      ['A2'],
      ['A4'],
      ['A3'],
      ['A1'],
      ['A5']
    ]);
  });

  describe('should perform CRUD operations in HyperFormula based on physical indexes', () => {
    describe('performing CRUD actions', () => {
      it('should remove rows in the right place', async() => {
        handsontable({
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

        await alter('remove_row', 1, 2);

        expect(getSourceData()).toEqual([
          [1, 'a', 'b', '1c'],
          ['trimmed', 'row', '', ''],
          ['trimmed', 'row', '', ''],
          ['trimmed', 'row', '', ''],
          [4, 'a', 'b', '4c']
        ]);
      });

      it('should remove columns in the right place', async() => {
        handsontable({
          data: [
            [1, 'a', 'b', '1c'],
            [2, 'a', 'b', '2c']
          ],
          formulas: {
            engine: HyperFormula
          },
          manualColumnMove: [1, 0, 2, 3]
        });

        await alter('remove_col', 1, 2);

        expect(getData()).toEqual([
          ['a', '1c'],
          ['a', '2c']
        ]);
      });

      it('should add rows in the right place', async() => {
        handsontable({
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

        await alter('insert_row_above', 2, 2);

        expect(getData()).toEqual([
          [1, 'a', 'b', '1c'],
          [2, 'a', 'b', '2c'],
          [null, null, null, null],
          [null, null, null, null],
          [3, 'a', 'b', '3c'],
          [4, 'a', 'b', '4c']
        ]);
      });

      it('should add columns in the right place', async() => {
        handsontable({
          data: [
            [1, 'a', 'b', '1c'],
            [2, 'a', 'b', '2c']
          ],
          formulas: {
            engine: HyperFormula
          },
          manualColumnMove: [1, 0, 2, 3]
        });

        await alter('insert_col_start', 1, 2);

        expect(getData()).toEqual([
          ['a', null, null, 1, 'b', '1c'],
          ['a', null, null, 2, 'b', '2c']
        ]);
      });
    });
  });

  it('should not overwrite source data by formula calculation values when there are some merge cells', async() => {
    handsontable({
      data: [
        [null, '=SUM(C1*2)', 3, '=SUM(C1*2)', null],
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, '=SUM(D1*3)', null, null, null],
      ],
      formulas: {
        engine: HyperFormula
      },
      mergeCells: [{
        row: 0,
        col: 3,
        rowspan: 2,
        colspan: 2
      }, {
        row: 3,
        col: 1,
        rowspan: 1,
        colspan: 2
      }],
    });

    expect(getSourceData()).toEqual([
      [null, '=SUM(C1*2)', 3, '=SUM(C1*2)', null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, '=SUM(D1*3)', null, null, null],
    ]);
    expect(getData()).toEqual([
      [null, 6, 3, 6, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, 18, null, null, null]
    ]);
  });

  it('should not crash when declaring a named expression with a sheet name that contains a `-` (#8057)', async() => {
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

  it('should recalculate the formulas after calling the `loadData` method', async() => {
    handsontable({
      data: [
        [0],
      ],
      formulas: {
        engine: HyperFormula,
      }
    });

    loadData([
      [1, 2, 3, 4, 5],
      [9, 8, 7, 6, '=A1 + B1']
    ]);

    expect(getDataAtCell(1, 4)).toEqual(3);
  });

  it('should recalculate the formulas after calling the `updateData` method', async() => {
    handsontable({
      data: [
        [0],
      ],
      formulas: {
        engine: HyperFormula,
      }
    });

    updateData([
      [1, 2, 3, 4, 5],
      [9, 8, 7, 6, '=A1 + B1']
    ]);

    expect(getDataAtCell(1, 4)).toEqual(3);
  });

  it('should display calculated formula after changing value using `beforeChange` hook #6932', async() => {
    handsontable({
      data: [
        ['2016', 1, 1, 2, 3],
        ['2017', 10, 11, 12, 13],
        ['2018', 20, 11, 14, 13],
        ['2019', 30, 15, 12, 13],
      ],
      rowHeaders: true,
      colHeaders: true,
      formulas: {
        engine: HyperFormula
      },
      beforeChange(beforeChanges) {
        beforeChanges[0][3] = '=SUM(B3:E3)';
      },
    });

    await setDataAtCell(0, 0, 1);

    expect(getData()).toEqual([
      [58, 1, 1, 2, 3],
      ['2017', 10, 11, 12, 13],
      ['2018', 20, 11, 14, 13],
      ['2019', 30, 15, 12, 13],
    ]);
    expect(getSourceData()).toEqual([
      ['=SUM(B3:E3)', 1, 1, 2, 3],
      ['2017', 10, 11, 12, 13],
      ['2018', 20, 11, 14, 13],
      ['2019', 30, 15, 12, 13],
    ]);
  });

  describe('renaming sheet for HF instance', () => {
    it('should update HOT\'s plugin internal property', async() => {
      let sheetNameInsideHook = '';
      const hfInstance = HyperFormula.buildEmpty({});

      handsontable({
        data: [
          ['01/03/1900'],
          ['=A1']
        ],
        formulas: {
          engine: hfInstance,
          sheetName: 'Sheet1'
        },
        columns: [{
          type: 'date',
          dateFormat: 'DD/MM/YYYY'
        }],
      });

      addHook('afterSheetRenamed', async() => {
        sheetNameInsideHook = getPlugin('formulas').sheetName;
      });

      hfInstance.renameSheet(0, 'Lorem Ipsum');

      expect(getPlugin('formulas').sheetName).toBe('Lorem Ipsum');
      expect(sheetNameInsideHook).toBe('Lorem Ipsum');
    });

    it('should not throw an error while performing actions on HOT with renamed sheet', async() => {
      const hfInstance = HyperFormula.buildEmpty({});

      handsontable({
        data: [
          ['01/03/1900'],
          ['=A1']
        ],
        formulas: {
          engine: hfInstance,
          sheetName: 'Sheet1'
        },
        columns: [{
          type: 'date',
          dateFormat: 'DD/MM/YYYY'
        }],
      });

      hfInstance.renameSheet(0, 'Lorem Ipsum');

      expect(() => {
        setDataAtCell(0, 1, 'new value');
      }).not.toThrow();

      expect(getDataAtCell(0, 1)).toBe('new value');
    });
  });

  describe('handling dates', () => {
    it('should handle date functions properly', async() => {
      handsontable({
        data: [
          ['=DATE(2022, 8, 1)', '=DATEVALUE("01/03/2020")'],
          ['=EDATE(A1, 1)', '=DAYS(A1, A2)'],
          ['=A2', '=DATEDIF(TODAY(), NOW(), "D")'],
        ],
        formulas: {
          engine: HyperFormula,
        },
        columns: [{
          type: 'date',
          dateFormat: 'MM/DD/YYYY'
        }, {
          type: 'numeric'
        }],
      });

      expect(getData()).toEqual([
        ['08/01/2022', 43891], // A Datestring handled using HF's `dateFormats` option.
        ['09/01/2022', -31],
        ['09/01/2022', 0],
      ]);

      expect(getSourceData()).toEqual([
        ['=DATE(2022, 8, 1)', '=DATEVALUE("01/03/2020")'],
        ['=EDATE(A1, 1)', '=DAYS(A1, A2)'],
        ['=A2', '=DATEDIF(TODAY(), NOW(), "D")'],
      ]);
    });

    it('should handle improper on start dates properly (mismatching date formatting) #1', async() => {
      handsontable({
        data: [
          ['13/12/2022'],
          ['=A1']
        ],
        formulas: {
          engine: HyperFormula,
        },
        columns: [{
          type: 'date',
          dateFormat: 'MM/DD/YYYY'
        }],
      });

      const formulasPlugin = getPlugin('formulas');

      expect(formulasPlugin.engine.getSheetValues(0)).toEqual([
        ['13/12/2022'], // Not converted - improper date (we treat it as a string)
        ['13/12/2022'],
      ]);

      expect(formulasPlugin.engine.getSheetSerialized(0)).toEqual([
        ['\'13/12/2022'],
        ['=A1'],
      ]);

      expect(getData()).toEqual([
        ['13/12/2022'],
        ['13/12/2022'],
      ]);

      expect(getSourceData()).toEqual([
        ['13/12/2022'],
        ['=A1'],
      ]);

      validateCells();

      await sleep(50);

      expect(getCellMeta(0, 0).valid).toBe(false);
      expect(getCellMeta(1, 0).valid).toBe(false);
    });

    it('should handle improper on start dates properly (mismatching date formatting) #2', async() => {
      handsontable({
        data: [
          ['13/12/2022'],
          ['=A1']
        ],
        formulas: {
          engine: HyperFormula,
        },
        columns: [{
          type: 'date',
          dateFormat: 'DD-MM-YYYY'
        }],
      });

      const formulasPlugin = getPlugin('formulas');

      expect(formulasPlugin.engine.getSheetValues(0)).toEqual([
        ['13/12/2022'], // Not converted - improper date (we treat it as a string)
        ['13/12/2022'],
      ]);

      expect(formulasPlugin.engine.getSheetSerialized(0)).toEqual([
        ['\'13/12/2022'],
        ['=A1'],
      ]);

      expect(getData()).toEqual([
        ['13/12/2022'],
        ['13/12/2022'],
      ]);

      expect(getSourceData()).toEqual([
        ['13/12/2022'],
        ['=A1'],
      ]);

      validateCells();

      await sleep(50);

      expect(getCellMeta(0, 0).valid).toBe(false);
      expect(getCellMeta(1, 0).valid).toBe(false);
    });

    it('should handle correct on start dates properly (mismatching date formatting)', async() => {
      handsontable({
        data: [
          ['12/11/2022'],
          ['=A1']
        ],
        formulas: {
          engine: HyperFormula,
        },
        columns: [{
          type: 'date',
          dateFormat: 'MM/DD/YYYY'
        }],
      });

      const formulasPlugin = getPlugin('formulas');

      expect(formulasPlugin.engine.getSheetValues(0)).toEqual([
        [44906], // 11 Dec 2022
        [44906], // 11 Dec 2022
      ]);

      expect(formulasPlugin.engine.getSheetSerialized(0)).toEqual([
        ['11/12/2022'],
        ['=A1'],
      ]);

      expect(getData()).toEqual([
        ['12/11/2022'],
        ['12/11/2022'],
      ]);

      expect(getSourceData()).toEqual([
        ['12/11/2022'],
        ['=A1'],
      ]);

      validateCells();

      await sleep(100);

      expect(getCellMeta(0, 0).valid).toBe(true);
      expect(getCellMeta(1, 0).valid).toBe(true);
    });

    it('should handle dates after change properly (mismatching date formatting)', async() => {
      handsontable({
        data: [
          ['12/11/2022'],
          ['=A1']
        ],
        formulas: {
          engine: HyperFormula,
        },
        columns: [{
          type: 'date',
          dateFormat: 'MM/DD/YYYY'
        }],
      });

      const formulasPlugin = getPlugin('formulas');

      await setDataAtCell(0, 0, '13/12/2022');

      await sleep(50);

      expect(formulasPlugin.engine.getSheetValues(0)).toEqual([
        ['13/12/2022'], // Not converted - improper date (we treat it as a string)
        ['13/12/2022'],
      ]);

      expect(formulasPlugin.engine.getSheetSerialized(0)).toEqual([
        ['\'13/12/2022'],
        ['=A1'],
      ]);

      expect(getData()).toEqual([
        ['13/12/2022'],
        ['13/12/2022'],
      ]);

      expect(getSourceData()).toEqual([
        ['13/12/2022'],
        ['=A1'],
      ]);

      validateCells();

      await sleep(100);

      expect(getCellMeta(0, 0).valid).toBe(false);
      expect(getCellMeta(1, 0).valid).toBe(false);

      await setDataAtCell(0, 0, '12/11/2022');

      await sleep(100);

      expect(formulasPlugin.engine.getSheetValues(0)).toEqual([
        [44906], // 11 Dec 2022
        [44906], // 11 Dec 2022
      ]);

      expect(formulasPlugin.engine.getSheetSerialized(0)).toEqual([
        ['11/12/2022'],
        ['=A1'],
      ]);

      expect(getData()).toEqual([
        ['12/11/2022'],
        ['12/11/2022'],
      ]);

      expect(getSourceData()).toEqual([
        ['12/11/2022'],
        ['=A1'],
      ]);

      validateCells();

      await sleep(100);

      expect(getCellMeta(0, 0).valid).toBe(true);
      expect(getCellMeta(1, 0).valid).toBe(true);
    });

    it('should handle dates properly (matching date formatting)', async() => {
      handsontable({
        data: [
          ['12/11/2022'],
          ['=A1']
        ],
        formulas: {
          engine: HyperFormula,
        },
        columns: [{
          type: 'date',
          dateFormat: 'DD/MM/YYYY'
        }],
      });

      const formulasPlugin = getPlugin('formulas');

      expect(formulasPlugin.engine.getSheetValues(0)).toEqual([
        [44877], // 12 Nov 2022
        [44877], // 12 Nov 2022
      ]);

      expect(formulasPlugin.engine.getSheetSerialized(0)).toEqual([
        ['12/11/2022'],
        ['=A1'],
      ]);

      expect(getData()).toEqual([
        ['12/11/2022'],
        ['12/11/2022'],
      ]);

      expect(getSourceData()).toEqual([
        ['12/11/2022'],
        ['=A1'],
      ]);

      validateCells();

      await sleep(50);

      expect(getCellMeta(0, 0).valid).toBe(true);
      expect(getCellMeta(1, 0).valid).toBe(true);

      await setDataAtCell(0, 0, '12/13/2022');

      await sleep(50);

      expect(formulasPlugin.engine.getSheetValues(0)).toEqual([
        ['12/13/2022'], // Not converted - improper date (we treat it as a string)
        ['12/13/2022'],
      ]);

      expect(formulasPlugin.engine.getSheetSerialized(0)).toEqual([
        ['\'12/13/2022'],
        ['=A1'],
      ]);

      expect(getData()).toEqual([
        ['12/13/2022'],
        ['12/13/2022'],
      ]);

      expect(getSourceData()).toEqual([
        ['12/13/2022'],
        ['=A1'],
      ]);

      validateCells();

      await sleep(50);

      expect(getCellMeta(0, 0).valid).toBe(false);
      expect(getCellMeta(1, 0).valid).toBe(false);

      await setDataAtCell(0, 0, '13/11/2022');

      await sleep(50);

      expect(formulasPlugin.engine.getSheetValues(0)).toEqual([
        [44878], // 13 Nov 2022
        [44878], // 13 Nov 2022
      ]);

      expect(formulasPlugin.engine.getSheetSerialized(0)).toEqual([
        ['13/11/2022'],
        ['=A1'],
      ]);

      expect(getData()).toEqual([
        ['13/11/2022'],
        ['13/11/2022'],
      ]);

      expect(getSourceData()).toEqual([
        ['13/11/2022'],
        ['=A1'],
      ]);

      validateCells();

      await sleep(50);

      expect(getCellMeta(0, 0).valid).toBe(true);
      expect(getCellMeta(1, 0).valid).toBe(true);
    });

    it('should handle HF configuration property (HF instance should not overwrite `leapYear1900` and `nullDate` properties)', async() => {
      // Create an external HyperFormula instance
      const hfInstance = HyperFormula.buildEmpty({});

      handsontable({
        data: [
          ['01/03/1900'],
          ['=A1']
        ],
        formulas: {
          engine: hfInstance,
          sheetName: 'Sheet1'
        },
        columns: [{
          type: 'date',
          dateFormat: 'DD/MM/YYYY'
        }],
      });

      const formulasPlugin = getPlugin('formulas');

      expect(formulasPlugin.engine.getSheetValues(0)).toEqual([
        [61],
        [61],
      ]);

      expect(formulasPlugin.engine.getSheetSerialized(0)).toEqual([
        ['01/03/1900'],
        ['=A1'],
      ]);

      expect(getData()).toEqual([
        ['01/03/1900'],
        ['01/03/1900'],
      ]);

      expect(getSourceData()).toEqual([
        ['01/03/1900'],
        ['=A1'],
      ]);
    });

    it('should not show warn for default HyperFormula configuration', async() => {
      const warnSpy = spyOn(console, 'warn');

      handsontable({
        data: [
          ['01/03/1900'],
          ['=A1']
        ],
        formulas: {
          engine: HyperFormula,
        },
        columns: [{
          type: 'date',
          dateFormat: 'DD/MM/YYYY'
        }],
      });

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should not show warn for not overwritten HF\'s configuration options such as `leapYear1900` and `nullDate`', async() => {
      // Create an external HyperFormula instance
      const hfInstance = HyperFormula.buildEmpty({});
      const warnSpy = spyOn(console, 'warn');

      handsontable({
        data: [
          ['01/03/1900'],
          ['=A1']
        ],
        formulas: {
          engine: hfInstance,
          sheetName: 'Sheet1'
        },
        columns: [{
          type: 'date',
          dateFormat: 'DD/MM/YYYY'
        }],
      });

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should show warn for overwritten HF\'s configuration option such as `leapYear1900`', async() => {
      // Create an external HyperFormula instance
      const hfInstance = HyperFormula.buildEmpty({
        leapYear1900: true,
      });
      const warnSpy = spyOn(console, 'warn');

      handsontable({
        data: [
          ['01/03/1900'],
          ['=A1']
        ],
        formulas: {
          engine: hfInstance,
          sheetName: 'Sheet1'
        },
        columns: [{
          type: 'date',
          dateFormat: 'DD/MM/YYYY'
        }],
      });

      expect(warnSpy).toHaveBeenCalled();
    });

    it('should show warn for overwritten HF\'s configuration option such as `nullDate`', async() => {
      // Create an external HyperFormula instance
      const hfInstance = HyperFormula.buildEmpty({
        nullDate: {
          year: 1970,
          month: 0,
          day: 0,
        },
      });
      const warnSpy = spyOn(console, 'warn');

      handsontable({
        data: [
          ['01/03/1900'],
          ['=A1']
        ],
        formulas: {
          engine: hfInstance,
          sheetName: 'Sheet1'
        },
        columns: [{
          type: 'date',
          dateFormat: 'DD/MM/YYYY'
        }],
      });

      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('handling numeric values', () => {
    it('should handle numeric calculations properly after passing a value with a comma (#dev-546)', async() => {
      handsontable({
        data: [
          [10.45000, 60.0000, '=A1*10003.2298'],
        ],
        formulas: {
          engine: HyperFormula,
        },
        columns: [{
          type: 'numeric',
          numericFormat: {
            pattern: '0,0.00000'
          }
        },
        {
          type: 'numeric',
          numericFormat: {
            pattern: '0,0.00000'
          }
        },
        {
          type: 'numeric',
          numericFormat: {
            pattern: '0,0.00 $',
          }
        }],
      });

      expect(getData()).toEqual([
        [10.45, 60, 104533.75141],
      ]);

      await setDataAtCell(0, 0, '11,8');

      await sleep(50);

      expect(getData()).toEqual([
        [11.8, 60, 118038.11164],
      ]);
    });

    it('should handle improper on start dates properly (mismatching date formatting) #1', async() => {
      handsontable({
        data: [
          ['13/12/2022'],
          ['=A1']
        ],
        formulas: {
          engine: HyperFormula,
        },
        columns: [{
          type: 'date',
          dateFormat: 'MM/DD/YYYY'
        }],
      });

      const formulasPlugin = getPlugin('formulas');

      expect(formulasPlugin.engine.getSheetValues(0)).toEqual([
        ['13/12/2022'], // Not converted - improper date (we treat it as a string)
        ['13/12/2022'],
      ]);

      expect(formulasPlugin.engine.getSheetSerialized(0)).toEqual([
        ['\'13/12/2022'],
        ['=A1'],
      ]);

      expect(getData()).toEqual([
        ['13/12/2022'],
        ['13/12/2022'],
      ]);

      expect(getSourceData()).toEqual([
        ['13/12/2022'],
        ['=A1'],
      ]);

      validateCells();

      await sleep(50);

      expect(getCellMeta(0, 0).valid).toBe(false);
      expect(getCellMeta(1, 0).valid).toBe(false);
    });

    it('should handle improper on start dates properly (mismatching date formatting) #2', async() => {
      handsontable({
        data: [
          ['13/12/2022'],
          ['=A1']
        ],
        formulas: {
          engine: HyperFormula,
        },
        columns: [{
          type: 'date',
          dateFormat: 'DD-MM-YYYY'
        }],
      });

      const formulasPlugin = getPlugin('formulas');

      expect(formulasPlugin.engine.getSheetValues(0)).toEqual([
        ['13/12/2022'], // Not converted - improper date (we treat it as a string)
        ['13/12/2022'],
      ]);

      expect(formulasPlugin.engine.getSheetSerialized(0)).toEqual([
        ['\'13/12/2022'],
        ['=A1'],
      ]);

      expect(getData()).toEqual([
        ['13/12/2022'],
        ['13/12/2022'],
      ]);

      expect(getSourceData()).toEqual([
        ['13/12/2022'],
        ['=A1'],
      ]);

      validateCells();

      await sleep(50);

      expect(getCellMeta(0, 0).valid).toBe(false);
      expect(getCellMeta(1, 0).valid).toBe(false);
    });

    it('should handle correct on start dates properly (mismatching date formatting)', async() => {
      handsontable({
        data: [
          ['12/11/2022'],
          ['=A1']
        ],
        formulas: {
          engine: HyperFormula,
        },
        columns: [{
          type: 'date',
          dateFormat: 'MM/DD/YYYY'
        }],
      });

      const formulasPlugin = getPlugin('formulas');

      expect(formulasPlugin.engine.getSheetValues(0)).toEqual([
        [44906], // 11 Dec 2022
        [44906], // 11 Dec 2022
      ]);

      expect(formulasPlugin.engine.getSheetSerialized(0)).toEqual([
        ['11/12/2022'],
        ['=A1'],
      ]);

      expect(getData()).toEqual([
        ['12/11/2022'],
        ['12/11/2022'],
      ]);

      expect(getSourceData()).toEqual([
        ['12/11/2022'],
        ['=A1'],
      ]);

      validateCells();

      await sleep(100);

      expect(getCellMeta(0, 0).valid).toBe(true);
      expect(getCellMeta(1, 0).valid).toBe(true);
    });

    it('should handle dates after change properly (mismatching date formatting)', async() => {
      handsontable({
        data: [
          ['12/11/2022'],
          ['=A1']
        ],
        formulas: {
          engine: HyperFormula,
        },
        columns: [{
          type: 'date',
          dateFormat: 'MM/DD/YYYY'
        }],
      });

      const formulasPlugin = getPlugin('formulas');

      await setDataAtCell(0, 0, '13/12/2022');

      await sleep(50);

      expect(formulasPlugin.engine.getSheetValues(0)).toEqual([
        ['13/12/2022'], // Not converted - improper date (we treat it as a string)
        ['13/12/2022'],
      ]);

      expect(formulasPlugin.engine.getSheetSerialized(0)).toEqual([
        ['\'13/12/2022'],
        ['=A1'],
      ]);

      expect(getData()).toEqual([
        ['13/12/2022'],
        ['13/12/2022'],
      ]);

      expect(getSourceData()).toEqual([
        ['13/12/2022'],
        ['=A1'],
      ]);

      validateCells();

      await sleep(100);

      expect(getCellMeta(0, 0).valid).toBe(false);
      expect(getCellMeta(1, 0).valid).toBe(false);

      await setDataAtCell(0, 0, '12/11/2022');

      await sleep(100);

      expect(formulasPlugin.engine.getSheetValues(0)).toEqual([
        [44906], // 11 Dec 2022
        [44906], // 11 Dec 2022
      ]);

      expect(formulasPlugin.engine.getSheetSerialized(0)).toEqual([
        ['11/12/2022'],
        ['=A1'],
      ]);

      expect(getData()).toEqual([
        ['12/11/2022'],
        ['12/11/2022'],
      ]);

      expect(getSourceData()).toEqual([
        ['12/11/2022'],
        ['=A1'],
      ]);

      validateCells();

      await sleep(100);

      expect(getCellMeta(0, 0).valid).toBe(true);
      expect(getCellMeta(1, 0).valid).toBe(true);
    });

    it('should handle dates properly (matching date formatting)', async() => {
      handsontable({
        data: [
          ['12/11/2022'],
          ['=A1']
        ],
        formulas: {
          engine: HyperFormula,
        },
        columns: [{
          type: 'date',
          dateFormat: 'DD/MM/YYYY'
        }],
      });

      const formulasPlugin = getPlugin('formulas');

      expect(formulasPlugin.engine.getSheetValues(0)).toEqual([
        [44877], // 12 Nov 2022
        [44877], // 12 Nov 2022
      ]);

      expect(formulasPlugin.engine.getSheetSerialized(0)).toEqual([
        ['12/11/2022'],
        ['=A1'],
      ]);

      expect(getData()).toEqual([
        ['12/11/2022'],
        ['12/11/2022'],
      ]);

      expect(getSourceData()).toEqual([
        ['12/11/2022'],
        ['=A1'],
      ]);

      validateCells();

      await sleep(50);

      expect(getCellMeta(0, 0).valid).toBe(true);
      expect(getCellMeta(1, 0).valid).toBe(true);

      await setDataAtCell(0, 0, '12/13/2022');

      await sleep(50);

      expect(formulasPlugin.engine.getSheetValues(0)).toEqual([
        ['12/13/2022'], // Not converted - improper date (we treat it as a string)
        ['12/13/2022'],
      ]);

      expect(formulasPlugin.engine.getSheetSerialized(0)).toEqual([
        ['\'12/13/2022'],
        ['=A1'],
      ]);

      expect(getData()).toEqual([
        ['12/13/2022'],
        ['12/13/2022'],
      ]);

      expect(getSourceData()).toEqual([
        ['12/13/2022'],
        ['=A1'],
      ]);

      validateCells();

      await sleep(50);

      expect(getCellMeta(0, 0).valid).toBe(false);
      expect(getCellMeta(1, 0).valid).toBe(false);

      await setDataAtCell(0, 0, '13/11/2022');

      await sleep(50);

      expect(formulasPlugin.engine.getSheetValues(0)).toEqual([
        [44878], // 13 Nov 2022
        [44878], // 13 Nov 2022
      ]);

      expect(formulasPlugin.engine.getSheetSerialized(0)).toEqual([
        ['13/11/2022'],
        ['=A1'],
      ]);

      expect(getData()).toEqual([
        ['13/11/2022'],
        ['13/11/2022'],
      ]);

      expect(getSourceData()).toEqual([
        ['13/11/2022'],
        ['=A1'],
      ]);

      validateCells();

      await sleep(50);

      expect(getCellMeta(0, 0).valid).toBe(true);
      expect(getCellMeta(1, 0).valid).toBe(true);
    });

    it('should handle HF configuration property (HF instance should not overwrite `leapYear1900` and `nullDate` properties)', async() => {
      // Create an external HyperFormula instance
      const hfInstance = HyperFormula.buildEmpty({});

      handsontable({
        data: [
          ['01/03/1900'],
          ['=A1']
        ],
        formulas: {
          engine: hfInstance,
          sheetName: 'Sheet1'
        },
        columns: [{
          type: 'date',
          dateFormat: 'DD/MM/YYYY'
        }],
      });

      const formulasPlugin = getPlugin('formulas');

      expect(formulasPlugin.engine.getSheetValues(0)).toEqual([
        [61],
        [61],
      ]);

      expect(formulasPlugin.engine.getSheetSerialized(0)).toEqual([
        ['01/03/1900'],
        ['=A1'],
      ]);

      expect(getData()).toEqual([
        ['01/03/1900'],
        ['01/03/1900'],
      ]);

      expect(getSourceData()).toEqual([
        ['01/03/1900'],
        ['=A1'],
      ]);
    });

    it('should not show warn for default HyperFormula configuration', async() => {
      const warnSpy = spyOn(console, 'warn');

      handsontable({
        data: [
          ['01/03/1900'],
          ['=A1']
        ],
        formulas: {
          engine: HyperFormula,
        },
        columns: [{
          type: 'date',
          dateFormat: 'DD/MM/YYYY'
        }],
      });

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should not show warn for not overwritten HF\'s configuration options such as `leapYear1900` and `nullDate`', async() => {
      // Create an external HyperFormula instance
      const hfInstance = HyperFormula.buildEmpty({});
      const warnSpy = spyOn(console, 'warn');

      handsontable({
        data: [
          ['01/03/1900'],
          ['=A1']
        ],
        formulas: {
          engine: hfInstance,
          sheetName: 'Sheet1'
        },
        columns: [{
          type: 'date',
          dateFormat: 'DD/MM/YYYY'
        }],
      });

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should show warn for overwritten HF\'s configuration option such as `leapYear1900`', async() => {
      // Create an external HyperFormula instance
      const hfInstance = HyperFormula.buildEmpty({
        leapYear1900: true,
      });
      const warnSpy = spyOn(console, 'warn');

      handsontable({
        data: [
          ['01/03/1900'],
          ['=A1']
        ],
        formulas: {
          engine: hfInstance,
          sheetName: 'Sheet1'
        },
        columns: [{
          type: 'date',
          dateFormat: 'DD/MM/YYYY'
        }],
      });

      expect(warnSpy).toHaveBeenCalled();
    });

    it('should show warn for overwritten HF\'s configuration option such as `nullDate`', async() => {
      // Create an external HyperFormula instance
      const hfInstance = HyperFormula.buildEmpty({
        nullDate: {
          year: 1970,
          month: 0,
          day: 0,
        },
      });
      const warnSpy = spyOn(console, 'warn');

      handsontable({
        data: [
          ['01/03/1900'],
          ['=A1']
        ],
        formulas: {
          engine: hfInstance,
          sheetName: 'Sheet1'
        },
        columns: [{
          type: 'date',
          dateFormat: 'DD/MM/YYYY'
        }],
      });

      expect(warnSpy).toHaveBeenCalled();
    });
  });
});

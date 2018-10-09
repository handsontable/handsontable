describe('Formulas general', () => {
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

  it('should calculate table (simple example)', () => {
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
    expect(hot.getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, '\'=SUM(E5)']);
  });

  it('should calculate table (advanced example)', () => {
    const hot = handsontable({
      data: getDataAdvancedExampleFormulas(),
      formulas: true,
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

  it('should not treat single equality sign (=) as a formula expression', () => {
    const hot = handsontable({
      data: [['=', '=3']],
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 0)).toBe('=');
    expect(hot.getDataAtCell(0, 1)).toBe(3);

    hot.setDataAtCell(0, 1, '=');

    expect(hot.getDataAtCell(0, 0)).toBe('=');
    expect(hot.getDataAtCell(0, 1)).toBe('=');
  });

  it('should calculate table with semicolon as separator of formula arguments', () => {
    const data = getDataSimpleExampleFormulas();

    data[2][4] = '=SUM(A4;2;3)';
    data[4][2] = '=SUM(B5;E3)';

    const hot = handsontable({
      data,
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
    expect(hot.getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, '\'=SUM(E5)']);
  });

  it('should recalculate table with formulas defined where the next cell is depend on the previous cell', () => {
    const afterChange = jasmine.createSpy();
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: true,
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

  it('should throw error while parsing invalid cell coordinates syntax', () => {
    const data = getDataSimpleExampleFormulas();

    data[0][0] = '=SUM($$A4;2;3)';
    data[0][1] = '=A$$$$$1';
    data[0][2] = '=A1$';
    data[0][3] = '=SUM(A2:D2$)';

    const hot = handsontable({
      data,
      formulas: true,
      width: 500,
      height: 300
    });

    hot.setDataAtCell(2, 0, '=A1$');
    hot.setDataAtCell(3, 0, '=$A$$1');

    expect(hot.getDataAtRow(0)).toEqual(['#ERROR!', '#ERROR!', '#ERROR!', '#ERROR!', 'Mini', '#ERROR!']);
    expect(hot.getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual(['#ERROR!', 5, 2905, 2867, '#ERROR!', '#ERROR!']);
    expect(hot.getDataAtRow(3)).toEqual(['#ERROR!', 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, '#ERROR!', '#ERROR!', '#DIV/0!', 12, '\'=SUM(E5)']);
  });

  it('should return correct values according to plugin state updated by updateSettings()', () => {
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    hot.updateSettings({ formulas: false });

    expect(hot.getDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
    expect(hot.getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, '=Sum(a2:a5)', '=SUM(B5,E3)', '=A2/B2', 12, '\'=SUM(E5)']);

    hot.updateSettings({ formulas: true });

    expect(hot.getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
    expect(hot.getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, '\'=SUM(E5)']);
  });

  it('should return correct values according to plugin state updated by disablePlugin/enablePlugin methods', () => {
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: true,
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
    expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, '\'=SUM(E5)']);
  });

  it('should recalculate table after changing cell value (setDataAtCell)', () => {
    const afterChange = jasmine.createSpy();
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: true,
      width: 500,
      height: 300,
      afterChange,
    });

    hot.setDataAtCell(1, 1, 20);

    expect(hot.getDataAtRow(0)).toEqual([20, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 20]);
    expect(hot.getDataAtRow(1)).toEqual([2009, 20, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, 100.45, 12, '\'=SUM(E5)']);
    expect(afterChange.calls.argsFor(1)).toEqual([[[1, 1, 0, 20]], 'edit', void 0, void 0, void 0, void 0]);
  });

  it('should recalculate table after changing cell value (by reference)', () => {
    const afterChange = jasmine.createSpy();
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: true,
      width: 500,
      height: 300,
      afterChange,
    });

    hot.getSourceData()[1][1] = 20;
    hot.getPlugin('formulas').recalculateFull();
    hot.render();

    expect(hot.getDataAtRow(0)).toEqual([20, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 20]);
    expect(hot.getDataAtRow(1)).toEqual([2009, 20, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, 100.45, 12, '\'=SUM(E5)']);
  });

  it('should recalculate table after changing cell value into formula expression written in lower case', () => {
    const afterChange = jasmine.createSpy();
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: true,
      width: 500,
      height: 300,
      afterChange,
    });

    hot.setDataAtCell(1, 1, '=Sum(a2:A4)');

    expect(hot.getDataAtRow(0)).toEqual([6030, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 6030]);
    expect(hot.getDataAtRow(1)).toEqual([2009, 6030, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, 0.333167495854063, 12, '\'=SUM(E5)']);
    expect(afterChange.calls.argsFor(1)).toEqual([[[1, 1, 0, '=Sum(a2:A4)']], 'edit', void 0, void 0, void 0, void 0]);
  });

  it('should prevent recalculate table after changing cell value into escaped formula expression', () => {
    const afterChange = jasmine.createSpy();
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: true,
      width: 500,
      height: 300,
      afterChange,
    });

    hot.setDataAtCell(1, 1, '\'=SUM(A2:A4)');

    expect(hot.getDataAtRow(0)).toEqual(['\'=SUM(A2:A4)', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '\'=SUM(A2:A4)']);
    expect(hot.getDataAtRow(1)).toEqual([2009, '\'=SUM(A2:A4)', 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, '#VALUE!', 12, '\'=SUM(E5)']);
    expect(afterChange.calls.argsFor(1)).toEqual([[[1, 1, 0, '\'=SUM(A2:A4)']], 'edit', void 0, void 0, void 0, void 0]);
  });

  it('should recalculate table after changing cell value from escaped formula expression into valid formula expression', () => {
    const afterChange = jasmine.createSpy();
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: true,
      width: 500,
      height: 300,
      afterChange,
    });

    hot.setDataAtCell(4, 5, hot.getDataAtCell(4, 5).substr(1));

    expect(hot.getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
    expect(hot.getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, 12]);
    expect(afterChange.calls.argsFor(1)).toEqual([[[4, 5, '\'=SUM(E5)', '=SUM(E5)']], 'edit', void 0, void 0, void 0, void 0]);
  });

  it('should recalculate table after changing cell value from primitive value into formula expression', () => {
    const afterChange = jasmine.createSpy();
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: true,
      width: 500,
      height: 300,
      afterChange,
    });

    hot.setDataAtCell(1, 1, '=SUM(A2:A4)');

    expect(hot.getDataAtRow(0)).toEqual([6030, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 6030]);
    expect(hot.getDataAtRow(1)).toEqual([2009, 6030, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 8042, 10058, 0.333167495854063, 12, '\'=SUM(E5)']);
    expect(afterChange.calls.argsFor(1)).toEqual([[[1, 1, 0, '=SUM(A2:A4)']], 'edit', void 0, void 0, void 0, void 0]);
  });

  it('should recalculate table after changing cell value from formula expression into primitive value', () => {
    const afterChange = jasmine.createSpy();
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: true,
      width: 500,
      height: 300,
      afterChange,
    });

    hot.setDataAtCell(4, 1, 15);

    expect(hot.getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
    expect(hot.getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 15, 2031, '#DIV/0!', 12, '\'=SUM(E5)']);
    expect(afterChange.calls.argsFor(1)).toEqual([[[4, 1, '=Sum(a2:a5)', 15]], 'edit', void 0, void 0, void 0, void 0]);
  });

  it('should recalculate table after changing cell value from formula expression into another formula expression', () => {
    const afterChange = jasmine.createSpy();
    const hot = handsontable({
      data: getDataSimpleExampleFormulas(),
      formulas: true,
      width: 500,
      height: 300,
      afterChange,
    });

    hot.setDataAtCell(4, 1, '=SUM(A2:A4)');

    expect(hot.getDataAtRow(0)).toEqual([0, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
    expect(hot.getDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
    expect(hot.getDataAtRow(2)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
    expect(hot.getDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
    expect(hot.getDataAtRow(4)).toEqual([2012, 6030, 8046, '#DIV/0!', 12, '\'=SUM(E5)']);
    expect(afterChange.calls.argsFor(1)).toEqual([[[4, 1, '=Sum(a2:a5)', '=SUM(A2:A4)']], 'edit', void 0, void 0, void 0, void 0]);
  });

  it('should correctly recalculate formulas when precedents cells are located out of table viewport', () => {
    const hot = handsontable({
      data: getDataForFormulas(0, 'name', ['=B39']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 200
    });

    hot.setDataAtCell(38, 1, 'foo bar');

    expect(hot.getDataAtCell(0, 1)).toBe('foo bar');
  });

  it('should mark cell as #REF! (circular dependency)', () => {
    const hot = handsontable({
      data: getDataForFormulas(0, 'name', ['=B1']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#REF!');
  });

  it('should mark cell as #REF! (out of data table range for columns)', () => {
    const hot = handsontable({
      data: getDataForFormulas(0, 'name', ['=K1']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#REF!');
  });

  it('should mark cell as #REF! (out of data table range for rows)', () => {
    const hot = handsontable({
      data: getDataForFormulas(0, 'name', ['=A1000']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#REF!');
  });

  it('should recalculate external variables', () => {
    const hot = handsontable({
      data: getDataForFormulas(0, 'name', ['=TEST_1', '=TEST_1&TEST_2', '=SUM(999, TEST_2)', '=TEST_3']),
      columns: getColumnsForFormulas(),
      formulas: {
        variables: {
          TEST_1: 'foo',
          TEST_2: 12345,
        }
      },
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('foo');
    expect(hot.getDataAtCell(1, 1)).toBe('foo12345');
    expect(hot.getDataAtCell(2, 1)).toBe(13344);
    expect(hot.getDataAtCell(3, 1)).toBe('#NAME?');
  });

  it('should recalculate external variables (via constructor)', () => {
    const hot = handsontable({
      data: getDataForFormulas(0, 'name', ['=TEST_1', '=TEST_1&TEST_2', '=SUM(999, TEST_2)', '=TEST_3']),
      columns: getColumnsForFormulas(),
      formulas: {
        variables: {
          TEST_1: 'foo',
          TEST_2: 12345,
        }
      },
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('foo');
    expect(hot.getDataAtCell(1, 1)).toBe('foo12345');
    expect(hot.getDataAtCell(2, 1)).toBe(13344);
    expect(hot.getDataAtCell(3, 1)).toBe('#NAME?');
  });

  it('should recalculate external variables (via setVariable method)', () => {
    const hot = handsontable({
      data: getDataForFormulas(0, 'name', ['=TEST_1', '=TEST_1&TEST_2', '=SUM(999, TEST_2)', '=TEST_3']),
      columns: getColumnsForFormulas(),
      formulas: {
        variables: {
          TEST_1: 'foo'
        }
      },
      width: 500,
      height: 300
    });
    hot.getPlugin('formulas').setVariable('TEST_2', 12345);
    hot.getPlugin('formulas').recalculateFull();

    expect(hot.getDataAtCell(0, 1)).toBe('foo');
    expect(hot.getDataAtCell(1, 1)).toBe('foo12345');
    expect(hot.getDataAtCell(2, 1)).toBe(13344);
    expect(hot.getDataAtCell(3, 1)).toBe('#NAME?');
  });

  describe('alter table (insert row)', () => {
    it('should recalculate table after added new empty rows', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
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
      expect(hot.getDataAtRow(6)).toEqual([2012, 8042, 10058, '#DIV/0!', 12, '\'=SUM(E5)']);
    });

    it('should recalculate table after changing values into newly added row', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
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
      expect(hot.getDataAtRow(7)).toEqual([2012, 10276, 12292, '#DIV/0!', 12, '\'=SUM(E5)']);
    });
  });

  describe('alter table (insert column)', () => {
    it('should recalculate table after added new empty columns', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
        width: 500,
        height: 300,
        contextMenu: true,
      });

      hot.alter('insert_col', 1, 2);

      expect(hot.getDataAtRow(0)).toEqual([0, null, null, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 0]);
      expect(hot.getDataAtRow(1)).toEqual([2009, null, null, 0, 2941, 4303, 354, 5814]);
      expect(hot.getDataAtRow(2)).toEqual([2010, null, null, 5, 2905, 2867, 2016, 'Maserati']);
      expect(hot.getDataAtRow(3)).toEqual([2011, null, null, 4, 2517, 4822, 552, 6127]);
      expect(hot.getDataAtRow(4)).toEqual([2012, null, null, 8042, 10058, '#DIV/0!', 12, '\'=SUM(E5)']);
    });

    it('should recalculate table after changing values into newly added column', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
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
      expect(hot.getDataAtRow(4)).toEqual([2012, null, null, 8042, 10058, 1004.5, 12, '\'=SUM(E5)']);
    });
  });

  describe('alter table (remove row)', () => {
    it('should recalculate table after removed rows', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
        width: 500,
        height: 300
      });

      hot.alter('remove_row', 1, 1);

      expect(hot.getDataAtRow(0)).toEqual(['#REF!', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '#REF!']);
      expect(hot.getDataAtRow(1)).toEqual([2010, 5, 2905, 2867, 2016, 'Maserati']);
      expect(hot.getDataAtRow(2)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getDataAtRow(3)).toEqual([2012, 6033, 8049, '#REF!', 12, '\'=SUM(E5)']);
    });

    it('should recalculate table and replace coordinates in formula expressions into #REF! value (removing 2 rows)', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
        width: 500,
        height: 300
      });

      hot.alter('remove_row', 1, 2);

      expect(hot.getSourceDataAtRow(0)).toEqual(['=#REF!', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(2)).toEqual([2012, '=SUM(A2:A3)', '=SUM(B3,#REF!)', '=#REF!/#REF!', 12, '\'=SUM(E5)']);
      expect(hot.getDataAtRow(0)).toEqual(['#REF!', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '#REF!']);
      expect(hot.getDataAtRow(1)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getDataAtRow(2)).toEqual([2012, 4023, '#REF!', '#REF!', 12, '\'=SUM(E5)']);
    });

    it('should recalculate table and replace coordinates in formula expressions into #REF! value (removing first 4 rows)', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
        width: 500,
        height: 300
      });

      hot.alter('remove_row', 0, 4);

      expect(hot.getSourceDataAtRow(0)).toEqual([2012, '=SUM(A1:A1)', '=SUM(B1,#REF!)', '=#REF!/#REF!', 12, '\'=SUM(E5)']);
      expect(hot.getDataAtRow(0)).toEqual([2012, 2012, '#REF!', '#REF!', 12, '\'=SUM(E5)']);
    });

    it('should recalculate table and update formula expression after removing rows intersected on the bottom of cell range', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
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
      expect(hot.getDataAtRow(3)).toEqual([2012, 2009, '#REF!', '#DIV/0!', 12, '\'=SUM(E5)']);
    });

    it('should recalculate table and update formula expression after removing rows intersected on the top of cell range', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
        width: 500,
        height: 300
      });

      hot.setDataAtCell(4, 1, '=SUM(A2:A4)');

      hot.alter('remove_row', 0, 2);

      expect(hot.getSourceDataAtRow(0)).toEqual([2010, 5, 2905, 2867, '=SUM(A2,2,3)', '=#REF!']);
      expect(hot.getSourceDataAtRow(1)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(2)).toEqual([2012, '=SUM(A1:A2)', '=SUM(B3,E1)', '=#REF!/#REF!', 12, '\'=SUM(E5)']);
      expect(hot.getDataAtRow(0)).toEqual([2010, 5, 2905, 2867, 2016, '#REF!']);
      expect(hot.getDataAtRow(1)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getDataAtRow(2)).toEqual([2012, 4021, 6037, '#REF!', 12, '\'=SUM(E5)']);
    });

    it('should recalculate table and update formula expression after removing rows contains whole cell range', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
        width: 500,
        height: 300
      });

      hot.alter('insert_row', 3, 2);
      hot.setDataAtCell(6, 1, '=SUM(A2:A4)');

      hot.alter('remove_row', 0, 4);

      expect(hot.getSourceDataAtRow(0)).toEqual([null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(1)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(2)).toEqual([2012, '=SUM(#REF!)', '=SUM(B3,#REF!)', '=#REF!/#REF!', 12, '\'=SUM(E5)']);
      expect(hot.getDataAtRow(0)).toEqual([null, null, null, null, null, null]);
      expect(hot.getDataAtRow(1)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getDataAtRow(2)).toEqual([2012, '#REF!', '#REF!', '#REF!', 12, '\'=SUM(E5)']);
    });
  });

  describe('alter table (remove column)', () => {
    it('should recalculate table after removed columns', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
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
      expect(hot.getDataAtRow(4)).toEqual([2012, '#REF!', '#REF!', 12, '\'=SUM(E5)']);
    });

    it('should recalculate table and replace coordinates in formula expressions into #REF! value (removing 2 columns)', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
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
      expect(hot.getDataAtRow(4)).toEqual([2012, '#REF!', 12, '\'=SUM(E5)']);
    });

    it('should recalculate table and replace coordinates in formula expressions into #REF! value (removing first 4 columns)', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
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
      expect(hot.getDataAtRow(4)).toEqual([12, '\'=SUM(E5)']);
    });

    it('should recalculate table and update formula expression after removing columns intersected on the right of cell range', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
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
      expect(hot.getDataAtRow(4)).toEqual([2012, 8042, '\'=SUM(E5)']);
    });

    it('should recalculate table and update formula expression after removing columns intersected on the left of cell range', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
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
      expect(hot.getDataAtRow(4)).toEqual(['#REF!', 12, '\'=SUM(E5)']);
    });

    it('should recalculate table and update formula expression after removing columns contains whole cell range', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
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
      expect(hot.getDataAtRow(4)).toEqual([12, '\'=SUM(E5)']);
    });
  });

  describe('alter table (mixed operations)', () => {
    it('should recalculate table and replace coordinates in formula expressions', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
        width: 500,
        height: 300
      });

      hot.alter('remove_col', 3);
      hot.alter('remove_row', 2);
      hot.alter('remove_row', 2);
      hot.alter('insert_row', 0);
      hot.alter('remove_col', 3);
      hot.alter('insert_col', 3);

      // Make sure that formulas are shifted correctly by recalculate whole table from scratch (after sheet altering)
      hot.getPlugin('formulas').recalculateFull();
      hot.render();

      expect(hot.getSourceDataAtRow(0)).toEqual([null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(1)).toEqual(['=$B$3', 'Maserati', 'Mazda', null, '=A$2']);
      expect(hot.getSourceDataAtRow(2)).toEqual([2009, 0, 2941, null, 5814]);
      expect(hot.getSourceDataAtRow(3)).toEqual([2012, '=SUM(A3:A4)', '=SUM(B4,#REF!)', null, '\'=SUM(E5)']);
      expect(hot.getDataAtRow(0)).toEqual([null, null, null, null, null]);
      expect(hot.getDataAtRow(1)).toEqual([0, 'Maserati', 'Mazda', null, 0]);
      expect(hot.getDataAtRow(2)).toEqual([2009, 0, 2941, null, 5814]);
      expect(hot.getDataAtRow(3)).toEqual([2012, 4021, '#REF!', null, '\'=SUM(E5)']);
    });
  });

  describe('undo/redo', () => {
    it('should restore previous edited formula expression and recalculate table after that', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
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
        formulas: true,
        width: 500,
        height: 300,
        contextMenu: true,
      });

      hot.alter('insert_row', 1, 3);
      hot.alter('insert_col', 1);
      hot.alter('insert_col', 4, 2);
      hot.alter('insert_row', 5);
      hot.undo();

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$C$5', null, 'Maserati', 'Mazda', null, null, 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([null, null, null, null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(2)).toEqual([null, null, null, null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(3)).toEqual([null, null, null, null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(4)).toEqual([2009, null, 0, 2941, null, null, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(5)).toEqual([2010, null, 5, 2905, null, null, 2867, '=SUM(A7,2,3)', '=$C1']);
      expect(hot.getSourceDataAtRow(6)).toEqual([2011, null, 4, 2517, null, null, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(7)).toEqual([2012, null, '=SUM(A5:A8)', '=SUM(C8,H6)', null, null, '=A5/C5', 12, '\'=SUM(E5)']);

      hot.undo();

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$C$5', null, 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([null, null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(2)).toEqual([null, null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(3)).toEqual([null, null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(4)).toEqual([2009, null, 0, 2941, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(5)).toEqual([2010, null, 5, 2905, 2867, '=SUM(A7,2,3)', '=$C1']);
      expect(hot.getSourceDataAtRow(6)).toEqual([2011, null, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(7)).toEqual([2012, null, '=SUM(A5:A8)', '=SUM(C8,F6)', '=A5/C5', 12, '\'=SUM(E5)']);

      hot.undo();

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$B$5', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(2)).toEqual([null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(3)).toEqual([null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(4)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(5)).toEqual([2010, 5, 2905, 2867, '=SUM(A7,2,3)', '=$B1']);
      expect(hot.getSourceDataAtRow(6)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(7)).toEqual([2012, '=SUM(A5:A8)', '=SUM(B8,E6)', '=A5/B5', 12, '\'=SUM(E5)']);

      hot.undo();

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(2)).toEqual([2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1']);
      expect(hot.getSourceDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(4)).toEqual([2012, '=SUM(A2:A5)', '=SUM(B5,E3)', '=A2/B2', 12, '\'=SUM(E5)']);
    });

    it('should redo into the next state after alter table (mixed insert operations)', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
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

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$C$5', null, 'Maserati', 'Mazda', null, null, 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([null, null, null, null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(2)).toEqual([null, null, null, null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(3)).toEqual([null, null, null, null, null, null, null, null, null]);
      expect(hot.getSourceDataAtRow(4)).toEqual([2009, null, 0, 2941, null, null, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(5)).toEqual([2010, null, 5, 2905, null, null, 2867, '=SUM(A7,2,3)', '=$C1']);
      expect(hot.getSourceDataAtRow(6)).toEqual([2011, null, 4, 2517, null, null, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(7)).toEqual([2012, null, '=SUM(A5:A8)', '=SUM(C8,H6)', null, null, '=A5/C5', 12, '\'=SUM(E5)']);
    });

    it('should restore previous state after alter table (mixed remove operations)', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
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
      expect(hot.getSourceDataAtRow(1)).toEqual([2012, '=SUM(A1:A2)', 12, '\'=SUM(E5)']);

      hot.undo();

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([2009, 0, 354, 5814]);
      expect(hot.getSourceDataAtRow(2)).toEqual([2011, 4, 552, 6127]);
      expect(hot.getSourceDataAtRow(3)).toEqual([2012, '=SUM(A2:A4)', 12, '\'=SUM(E5)']);

      hot.undo();

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(2)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(3)).toEqual([2012, '=SUM(A2:A4)', '=SUM(B4,#REF!)', '=A2/B2', 12, '\'=SUM(E5)']);

      hot.undo();

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(2)).toEqual([2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1']);
      expect(hot.getSourceDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(4)).toEqual([2012, '=Sum(a2:a5)', '=SUM(B5,E3)', '=A2/B2', 12, '\'=SUM(E5)']);
    });

    it('should redo into the next state after alter table (mixed remove operations)', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
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
      expect(hot.getSourceDataAtRow(4)).toEqual([2012, '=Sum(a2:a5)', '=SUM(B5,E3)', '=A2/B2', 12, '\'=SUM(E5)']);

      hot.redo();

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(2)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(3)).toEqual([2012, '=SUM(A2:A4)', '=SUM(B4,#REF!)', '=A2/B2', 12, '\'=SUM(E5)']);

      hot.redo();

      expect(hot.getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([2009, 0, 354, 5814]);
      expect(hot.getSourceDataAtRow(2)).toEqual([2011, 4, 552, 6127]);
      expect(hot.getSourceDataAtRow(3)).toEqual([2012, '=SUM(A2:A4)', 12, '\'=SUM(E5)']);

      hot.redo();

      expect(hot.getSourceDataAtRow(0)).toEqual([2011, 4, 552, 6127]);
      expect(hot.getSourceDataAtRow(1)).toEqual([2012, '=SUM(A1:A2)', 12, '\'=SUM(E5)']);
    });
  });

  describe('column sorting', () => {
    it('should recalculate all formulas and update theirs cell coordinates if needed', () => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
        columnSorting: true,
        width: 500,
        height: 300
      });

      hot.updateSettings({ columnSorting: { initialConfig: { column: 2, sortOrder: 'asc' } } });

      // source data is not involved in the translation process
      expect(hot.getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(2)).toEqual([2010, 5, 2905, 2867, '=SUM(A3,2,3)', '=#REF!']);
      expect(hot.getSourceDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(4)).toEqual([2012, '=SUM(A1:A4)', '=SUM(B4,E2)', '=A1/B1', 12, '\'=SUM(E5)']);

      expect(hot.getDataAtRow(0)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getDataAtRow(1)).toEqual([2010, 5, 2905, 2867, 2014, '#REF!']);
      expect(hot.getDataAtRow(2)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(hot.getDataAtRow(3)).toEqual([2012, 8042, 10056, 502.75, 12, '\'=SUM(E5)']);
      expect(hot.getDataAtRow(4)).toEqual([5, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 2011]);

      hot.updateSettings({ columnSorting: { initialConfig: { column: 5, sortOrder: 'desc' } } });

      // source data is not involved in the translation process
      expect(hot.getSourceDataAtRow(0)).toEqual(['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1']);
      expect(hot.getSourceDataAtRow(1)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(hot.getSourceDataAtRow(2)).toEqual([2010, 5, 2905, 2867, '=SUM(A3,2,3)', '=#REF!']);
      expect(hot.getSourceDataAtRow(3)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getSourceDataAtRow(4)).toEqual([2012, '=SUM(#REF!)', '=SUM(B1,#REF!)', '=#REF!/#REF!', 12, '\'=SUM(E5)']);

      expect(hot.getDataAtRow(0)).toEqual([2012, '#REF!', '#REF!', '#REF!', 12, '\'=SUM(E5)']);
      expect(hot.getDataAtRow(1)).toEqual([2010, 5, 2905, 2867, 2016, '#REF!']);
      expect(hot.getDataAtRow(2)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
      expect(hot.getDataAtRow(3)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
      expect(hot.getDataAtRow(4)).toEqual([5, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 2012]);
    });

    it('should recalculate formula after precedent cells value was changed', (done) => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
        columnSorting: true,
        width: 500,
        height: 300
      });

      hot.updateSettings({ columnSorting: { initialConfig: { column: 2, sortOrder: 'asc' } } });

      setTimeout(() => {
        hot.setDataAtCell(4, 0, '');

        expect(hot.getDataAtRow(0)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
        expect(hot.getDataAtRow(1)).toEqual([2010, 5, 2905, 2867, 2014, '#REF!']);
        expect(hot.getDataAtRow(2)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
        expect(hot.getDataAtRow(3)).toEqual([2012, 8042, 10056, 502.75, 12, '\'=SUM(E5)']);
        expect(hot.getDataAtRow(4)).toEqual(['', 'Maserati', 'Mazda', 'Mercedes', 'Mini', 2011]);

        hot.setDataAtCell(0, 0, 1);

        expect(hot.getDataAtRow(0)).toEqual([1, 4, 2517, 4822, 552, 6127]);
        expect(hot.getDataAtRow(1)).toEqual([2010, 5, 2905, 2867, 2014, '#REF!']);
        expect(hot.getDataAtRow(2)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
        expect(hot.getDataAtRow(3)).toEqual([2012, 6032, 8046, 0.25, 12, '\'=SUM(E5)']);
        expect(hot.getDataAtRow(4)).toEqual(['', 'Maserati', 'Mazda', 'Mercedes', 'Mini', 1]);

        hot.setDataAtCell(1, 0, 2);

        expect(hot.getDataAtRow(0)).toEqual([1, 4, 2517, 4822, 552, 6127]);
        expect(hot.getDataAtRow(1)).toEqual([2, 5, 2905, 2867, 2014, '#REF!']);
        expect(hot.getDataAtRow(2)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
        expect(hot.getDataAtRow(3)).toEqual([2012, 4024, 6038, 0.25, 12, '\'=SUM(E5)']);
        expect(hot.getDataAtRow(4)).toEqual(['', 'Maserati', 'Mazda', 'Mercedes', 'Mini', 1]);

        hot.setDataAtCell(2, 0, 3);

        expect(hot.getDataAtRow(0)).toEqual([1, 4, 2517, 4822, 552, 6127]);
        expect(hot.getDataAtRow(1)).toEqual([2, 5, 2905, 2867, 8, '#REF!']);
        expect(hot.getDataAtRow(2)).toEqual([3, 0, 2941, 4303, 354, 5814]);
        expect(hot.getDataAtRow(3)).toEqual([2012, 2018, 2026, 0.25, 12, '\'=SUM(E5)']);
        expect(hot.getDataAtRow(4)).toEqual(['', 'Maserati', 'Mazda', 'Mercedes', 'Mini', 1]);

        hot.setDataAtCell(3, 0, 4);

        expect(hot.getDataAtRow(0)).toEqual([1, 4, 2517, 4822, 552, 6127]);
        expect(hot.getDataAtRow(1)).toEqual([2, 5, 2905, 2867, 8, '#REF!']);
        expect(hot.getDataAtRow(2)).toEqual([3, 0, 2941, 4303, 354, 5814]);
        expect(hot.getDataAtRow(3)).toEqual([4, 10, 18, 0.25, 12, '\'=SUM(E5)']);
        expect(hot.getDataAtRow(4)).toEqual(['', 'Maserati', 'Mazda', 'Mercedes', 'Mini', 1]);
        done();
      }, 200);
    });

    it('should corectly recalculate formulas after changing formula expression in sorted cell', (done) => {
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: true,
        columnSorting: true,
        width: 500,
        height: 300
      });

      hot.updateSettings({ columnSorting: { initialConfig: { column: 2, sortOrder: 'asc' } } });

      setTimeout(() => {
        hot.setDataAtCell(3, 1, '=SUM(B1:B3)');

        expect(hot.getDataAtRow(0)).toEqual([2011, 4, 2517, 4822, 552, 6127]);
        expect(hot.getDataAtRow(1)).toEqual([2010, 5, 2905, 2867, 2014, '#REF!']);
        expect(hot.getDataAtRow(2)).toEqual([2009, 0, 2941, 4303, 354, 5814]);
        expect(hot.getDataAtRow(3)).toEqual([2012, 9, 2023, 502.75, 12, '\'=SUM(E5)']);
        expect(hot.getDataAtRow(4)).toEqual([5, 'Maserati', 'Mazda', 'Mercedes', 'Mini', 2011]);
        done();
      }, 200);
    });
  });
});

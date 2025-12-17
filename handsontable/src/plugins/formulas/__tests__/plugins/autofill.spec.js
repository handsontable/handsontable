import HyperFormula from 'hyperformula';

describe('Formulas with Autofill integration', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should allow dragging the fill handle outside of the table, adding new rows and performing autofill', async() => {
    handsontable({
      data: [
        ['test', 2, '=UPPER($A$1)', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      formulas: {
        engine: HyperFormula,
        sheetName: 'Sheet1'
      },
      fillHandle: true
    });

    await selectCell(0, 2);

    simulateFillHandleDrag(getCell(2, 2), { finish: false });

    expect(countRows()).toBe(4);

    await sleep(300);

    simulateFillHandleDragMove(getCell(3, 2));

    await sleep(300);

    expect(countRows()).toBe(5);

    simulateFillHandleDragMove(getCell(4, 2));

    await sleep(300);

    simulateFillHandleDragFinish(getCell(5, 2));

    await sleep(300);

    expect(getData()).toEqual([
      ['test', 2, 'TEST', 4, 5, 6],
      [1, 2, 'TEST', 4, 5, 6],
      [1, 2, 'TEST', 4, 5, 6],
      [1, 2, 'TEST', 4, 5, 6],
      [null, null, 'TEST', null, null, null],
      [null, null, null, null, null, null]
    ]);

    expect(getSourceData()).toEqual([
      ['test', 2, '=UPPER($A$1)', 4, 5, 6],
      [1, 2, '=UPPER($A$1)', 4, 5, 6],
      [1, 2, '=UPPER($A$1)', 4, 5, 6],
      [1, 2, '=UPPER($A$1)', 4, 5, 6],
      [null, null, '=UPPER($A$1)', null, null, null],
      [null, null, null, null, null, null]
    ]);
  });

  it('should cooperate properly with trimmed rows (populating not trimmed elements)', async() => {
    handsontable({
      data: [
        ['=B1+10', 1, 2, 3, 4, 5, 6],
        ['=B2+20', 7, 8, 9, 0, 1, 2],
        ['=B3+30', 3, 4, 5, 6, 7, 8],
        ['=B4+40', 9, 0, 1, 2, 3, 4],
        ['=B5+50', 5, 6, 7, 8, 9, 0],
      ],
      formulas: {
        engine: HyperFormula,
        sheetName: 'Sheet1'
      },
      trimRows: [0, 1],
      fillHandle: true
    });

    await selectRows(0);

    simulateFillHandleDrag(getCell(2, 0));

    await sleep(300);

    expect(getData()).toEqual([
      [33, 3, 4, 5, 6, 7, 8],
      [33, 3, 4, 5, 6, 7, 8],
      [33, 3, 4, 5, 6, 7, 8],
      [null, null, null, null, null, null, null],
    ]);
  });

  xit('should cooperate properly with trimmed rows (populating two elements placed next to trimmed element)', async() => {
    handsontable({
      data: [
        ['=B1+10', 1, 2, 3, 4, 5, 6],
        ['=B2+20', 7, 8, 9, 0, 1, 2],
        ['=B3+30', 3, 4, 5, 6, 7, 8],
        ['=B4+40', 9, 0, 1, 2, 3, 4],
        ['=B5+50', 5, 6, 7, 8, 9, 0],
      ],
      formulas: {
        engine: HyperFormula,
        sheetName: 'Sheet1'
      },
      trimRows: [1],
      fillHandle: true
    });

    await selectRows(0, 1);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tr:last-child td:eq(0)').simulate('mouseover');

    await sleep(300);

    spec().$container.find('tr:last-child td:eq(0)').simulate('mouseup');

    expect(getData()).toEqual([
      [11, 1, 2, 3, 4, 5, 6],
      [33, 3, 4, 5, 6, 7, 8],
      [11, 1, 2, 3, 4, 5, 6],
      [33, 3, 4, 5, 6, 7, 8],
      [null, null, null, null, null, null, null],
    ]);
  });

  it('should populate dates and formulas referencing to them properly', async() => {
    handsontable({
      data: [
        [null, null, null, null, null],
        [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
        [null, null, '=C2', '=D2', '=E2'],
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, null, null, null, null],
      ],
      formulas: {
        engine: HyperFormula,
        sheetName: 'Sheet1'
      },
      columns: [{}, {}, {
        type: 'date',
        dateFormat: 'MM/DD/YYYY'
      }, {
        type: 'date',
        dateFormat: 'DD/MM/YYYY'
      }, {
        type: 'date',
        dateFormat: 'MM/DD/YYYY'
      }],
      fillHandle: true,
    });

    await selectCells([[1, 2, 2, 4]]);

    simulateFillHandleDrag(getCell(6, 2));

    const formulasPlugin = getPlugin('formulas');

    await sleep(300);

    expect(getData()).toEqual([
      [null, null, null, null, null],
      [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
      [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
      [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
      [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
      [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
      [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
      [null, null, null, null, null]
    ]);

    expect(getSourceData()).toEqual([
      [null, null, null, null, null],
      [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
      [null, null, '=C2', '=D2', '=E2'],
      [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
      [null, null, '=C4', '=D4', '=E4'],
      [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
      [null, null, '=C6', '=D6', '=E6'],
      [null, null, null, null, null]
    ]);

    expect(formulasPlugin.engine.getSheetValues(0)).toEqual([
      [],
      [null, null, '28/02/1900', 60, '28/02/1900'],
      [null, null, '28/02/1900', 60, '28/02/1900'],
      [null, null, '28/02/1900', 60, '28/02/1900'],
      [null, null, '28/02/1900', 60, '28/02/1900'],
      [null, null, '28/02/1900', 60, '28/02/1900'],
      [null, null, '28/02/1900', 60, '28/02/1900'],
    ]);

    expect(formulasPlugin.engine.getSheetSerialized(0)).toEqual([
      [],
      [null, null, '\'28/02/1900', '28/02/1900', '\'28/02/1900'],
      [null, null, '=C2', '=D2', '=E2'],
      [null, null, '\'28/02/1900', '28/02/1900', '\'28/02/1900'],
      [null, null, '=C4', '=D4', '=E4'],
      [null, null, '\'28/02/1900', '28/02/1900', '\'28/02/1900'],
      [null, null, '=C6', '=D6', '=E6'],
    ]);

    expect(getCellMeta(3, 2).valid).toBe(false);
    expect(getCellMeta(3, 3).valid).toBe(true);
    expect(getCellMeta(3, 4).valid).toBe(false);

    expect(getCellMeta(4, 2).valid).toBe(false);
    expect(getCellMeta(4, 3).valid).toBe(true);
    expect(getCellMeta(4, 4).valid).toBe(false);

    expect(getCellMeta(5, 2).valid).toBe(false);
    expect(getCellMeta(5, 3).valid).toBe(true);
    expect(getCellMeta(5, 4).valid).toBe(false);

    expect(getCellMeta(6, 2).valid).toBe(false);
    expect(getCellMeta(6, 3).valid).toBe(true);
    expect(getCellMeta(6, 4).valid).toBe(false);
  });

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

    simulateFillHandleDrag(getCell(0, 1));

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

    simulateFillHandleDrag(getCell(6, 4));

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

    simulateFillHandleDrag(getCell(0, 2));

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

    simulateFillHandleDrag(getCell(0, 2));

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

    simulateFillHandleDrag(getCell(4, 2));

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

    simulateFillHandleDrag(getCell(2, 0));

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

    simulateFillHandleDrag(getCell(0, 2));

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

    simulateFillHandleDrag(getCell(4, 1));

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

    simulateFillHandleDrag(getCell(8, 1));

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

    simulateFillHandleDrag(getCell(2, 2));

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

    simulateFillHandleDrag(getCell(2, 4));

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

    simulateFillHandleDrag(getCell(2, 1));

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

    simulateFillHandleDrag(getCell(2, 1));

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

    simulateFillHandleDrag(getCell(0, 1));

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

    simulateFillHandleDrag(getCell(0, 1));

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

    simulateFillHandleDrag(getCell(1, 1));

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

    simulateFillHandleDrag(getCell(1, 0));

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

    simulateFillHandleDrag(getCell(0, 2));

    expect(getData()).toEqual([['2016', 1, '2016', 2, 3]]);
  });
});

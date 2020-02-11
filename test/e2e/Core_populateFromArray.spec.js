describe('Core_populateFromArray', () => {
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

  const arrayOfArrays = function() {
    return [
      ['', 'Kia', 'Nissan', 'Toyota', 'Honda', 'Mix'],
      ['2008', 10, 11, 12, 13, { a: 1, b: 2 }],
      ['2009', 20, 11, 14, 13, { a: 1, b: 2 }],
      ['2010', 30, 15, 12, 13, { a: 1, b: 2 }]
    ];
  };

  it('should call onChange callback', () => {
    let output = null;

    handsontable({
      data: arrayOfArrays(),
      afterChange(changes) {
        output = changes;
      }
    });
    populateFromArray(0, 0, [['test', 'test'], ['test', 'test']], 1, 1);

    expect(output).toEqual([[0, 0, '', 'test'], [0, 1, 'Kia', 'test'], [1, 0, '2008', 'test'], [1, 1, 10, 'test']]);
  });

  it('should populate single value for whole selection', () => {
    let output = null;

    handsontable({
      data: arrayOfArrays(),
      afterChange(changes) {
        output = changes;
      }
    });
    populateFromArray(0, 0, [['test']], 3, 0);

    expect(output).toEqual([[0, 0, '', 'test'], [1, 0, '2008', 'test'], [2, 0, '2009', 'test'], [3, 0, '2010', 'test']]);
  });

  it('should populate value for whole selection only if populated data isn\'t an array', () => {
    let output = null;

    handsontable({
      data: arrayOfArrays(),
      afterChange(changes) {
        output = changes;
      }
    });
    populateFromArray(0, 0, [['test'], [[1, 2, 3]]], 3, 0);

    expect(output).toEqual([[0, 0, '', 'test'], [2, 0, '2009', 'test']]);
  });

  it('should populate value for whole selection only if populated data isn\'t an object', () => {
    let output = null;

    handsontable({
      data: arrayOfArrays(),
      afterChange(changes) {
        output = changes;
      }
    });
    populateFromArray(0, 0, [['test'], [{ test: 1 }]], 3, 0);

    expect(output).toEqual([[0, 0, '', 'test'], [2, 0, '2009', 'test']]);
  });

  it('shouldn\'t populate value if original value doesn\'t have the same data structure', () => {
    let output = null;

    handsontable({
      data: arrayOfArrays(),
      afterChange(changes) {
        output = changes;
      }
    });
    populateFromArray(1, 3, [['test']], 1, 5);

    expect(output).toEqual([[1, 3, 12, 'test'], [1, 4, 13, 'test']]);
  });

  it('should populate value for array data when array selection is changed to empty', () => {
    // Resolving issue #5675: https://github.com/handsontable/handsontable/issues/5675
    let output = null;
    const dataArray = arrayOfArrays();
    dataArray[0][0] = ['2011'];

    handsontable({
      data: dataArray,
      afterChange(changes) {
        output = changes;
      }
    });
    populateFromArray(0, 0, [[[]]], 0, 0);

    expect(output).toEqual([[0, 0, ['2011'], []]]);
  });

  it('should populate value for array data when bound data begins as empty with new row', () => {
    // Resolving issue #5675: https://github.com/handsontable/handsontable/issues/5675
    let output = null;
    const dataArray = [];

    handsontable({
      data: dataArray,
      afterChange(changes) {
        output = changes;
      },
      minSpareRows: 1
    });
    populateFromArray(0, 0, [[['2011']]], 0, 0);

    expect(output).toEqual([[0, 0, undefined, ['2011']]]);
  });

  it('should shift values down', () => {
    handsontable({
      data: arrayOfArrays(),
      minSpareRows: 1
    });
    populateFromArray(0, 0, [['test', 'test2'], ['test3', 'test4']], 2, 2, null, 'shift_down');

    expect(getData()).toEqual([
      ['test', 'test2', 'test', 'Toyota', 'Honda', 'Mix'],
      ['test3', 'test4', 'test3', 12, 13, { a: 1, b: 2 }],
      ['test', 'test2', 'test', 14, 13, { a: 1, b: 2 }],
      ['', 'Kia', 'Nissan', 12, 13, { a: 1, b: 2 }],
      ['2008', 10, 11, null, null, null],
      ['2009', 20, 11, null, null, null],
      ['2010', 30, 15, null, null, null],
      [null, null, null, null, null, null]
    ]);
  });

  it('should shift values right', () => {
    handsontable({
      data: arrayOfArrays(),
      minSpareCols: 1
    });
    populateFromArray(0, 0, [['test', 'test2'], ['test3', 'test4']], 2, 2, null, 'shift_right');

    expect(getData()).toEqual([
      ['test', 'test2', 'test', '', 'Kia', 'Nissan', 'Toyota', 'Honda', 'Mix', null],
      ['test3', 'test4', 'test3', '2008', 10, { a: 1, b: 2 }, 12, 13, null, null],
      ['test', 'test2', 'test', '2009', 20, { a: 1, b: 2 }, 14, 13, null, null],
      ['2010', 30, 15, 12, 13, { a: 1, b: 2 }, null, null, null, null]
    ]);
  });

  it('should run beforeAutofillInsidePopulate hook for each inserted value', () => {
    const hot = handsontable({
      data: arrayOfArrays()
    });
    let called = 0;

    hot.addHook('beforeAutofillInsidePopulate', () => {
      called += 1;
    });

    populateFromArray(0, 0, [['test', 'test2'], ['test3', 'test4']], 1, 1, 'Autofill.fill', 'overwrite');

    expect(called).toEqual(4);
  });

  it('should run beforeAutofillInsidePopulate hook and could change cell data before insert if returned object with value property', () => {

    const hot = handsontable({
      data: arrayOfArrays()
    });

    hot.addHook('beforeAutofillInsidePopulate', () => ({
      value: 'my_test'
    }));

    populateFromArray(0, 0, [['test', 'test2'], ['test3', 'test4']], 1, 1, 'Autofill.fill', 'overwrite');

    expect(getDataAtCell(0, 0)).toEqual('my_test');
  });

  it('should populate 1 row from 2 selected rows', () => {
    handsontable({
      data: arrayOfArrays()
    });

    populateFromArray(2, 0, [['A1'], ['A2']], 2, 0, 'autofill', null, 'down', [[0]]);

    expect(getDataAtCell(2, 0)).toEqual('A1');
    expect(getDataAtCell(3, 0)).toEqual('2010');
  });

  it('should populate 1 column from 2 selected columns`', () => {
    handsontable({
      data: arrayOfArrays()
    });

    populateFromArray(0, 2, [['A1', 'A2']], 0, 2, 'autofill', null, 'right', [[0]]);

    expect(getDataAtCell(0, 2)).toEqual('A1');
    expect(getDataAtCell(0, 3)).toEqual('Toyota');
  });
});

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

    expect(output).toEqual([
      [0, 0, '', 'test'],
      [1, 0, '2008', 'test'],
      [2, 0, '2009', 'test'],
      [3, 0, '2010', 'test']
    ]);
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

  describe('should shift values down', () => {
    it('populating from the start of the table', () => {
      const hot = handsontable({
        data: [
          ['', 'Kia', 'Nissan', 'Toyota', 'Honda'],
          ['2008', 10, 11, 12, 13],
          ['2009', 20, 11, 14, 13],
          ['2010', 30, 15, 12, 13]
        ],
        minSpareRows: 1,
        minSpareCols: 1,
      });

      const afterChange = jasmine.createSpy('afterChange');

      hot.addHook('afterChange', afterChange);

      populateFromArray(0, 0, [['test', 'test2'], ['test3', 'test4']], 2, 2, null, 'shift_down');

      expect(getData()).toEqual([
        ['test', 'test2', 'test', 'Toyota', 'Honda', null],
        ['test3', 'test4', 'test3', 12, 13, null],
        ['test', 'test2', 'test', 14, 13, null],
        ['', 'Kia', 'Nissan', 12, 13, null],
        ['2008', 10, 11, null, null, null],
        ['2009', 20, 11, null, null, null],
        ['2010', 30, 15, null, null, null],
        [null, null, null, null, null, null],
      ]);

      expect(afterChange).toHaveBeenCalledTimes(1);
      expect(afterChange).toHaveBeenCalledWith([
        [0, 0, '', 'test'], [0, 1, 'Kia', 'test2'], [0, 2, 'Nissan', 'test'],
        [1, 0, '2008', 'test3'], [1, 1, 10, 'test4'], [1, 2, 11, 'test3'],
        [2, 0, '2009', 'test'], [2, 1, 20, 'test2'], [2, 2, 11, 'test'],
        [3, 0, '2010', ''], [3, 1, 30, 'Kia'], [3, 2, 15, 'Nissan'],
        [4, 0, null, '2008'], [4, 1, null, 10], [4, 2, null, 11],
        [5, 0, null, '2009'], [5, 1, null, 20], [5, 2, null, 11],
        [6, 0, null, '2010'], [6, 1, null, 30], [6, 2, null, 15],
        [7, 0, null, null], [7, 1, null, null], [7, 2, null, null],
      ], 'populateFromArray');
    });

    it('populating from the end of the table', () => {
      const hot = handsontable({
        data: [
          ['', 'Kia', 'Nissan', 'Toyota', 'Honda'],
          ['2008', 10, 11, 12, 13],
          ['2009', 20, 11, 14, 13],
          ['2010', 30, 15, 12, 13],
        ],
        minSpareRows: 1,
        minSpareCols: 1,
      });

      const afterChange = jasmine.createSpy('afterChange');

      hot.addHook('afterChange', afterChange);

      populateFromArray(1, 3, [
        ['test', 'test2', 'test3'],
        ['test4', 'test5', 'test6']
      ], null, null, null, 'shift_down');

      expect(getData()).toEqual([
        ['', 'Kia', 'Nissan', 'Toyota', 'Honda', null, null],
        ['2008', 10, 11, 'test', 'test2', 'test3', null],
        ['2009', 20, 11, 'test4', 'test5', 'test6', null],
        ['2010', 30, 15, 12, 13, null, null],
        [null, null, null, 14, 13, null, null],
        [null, null, null, 12, 13, null, null],
        [null, null, null, null, null, null, null],
      ]);

      expect(afterChange).toHaveBeenCalledTimes(1);
      expect(afterChange).toHaveBeenCalledWith([
        [1, 3, 12, 'test'], [1, 4, 13, 'test2'], [1, 5, null, 'test3'],
        [2, 3, 14, 'test4'], [2, 4, 13, 'test5'], [2, 5, null, 'test6'],
        [3, 3, 12, 12], [3, 4, 13, 13], [3, 5, null, null],
        [4, 3, null, 14], [4, 4, null, 13], [4, 5, null, null],
        [5, 3, null, 12], [5, 4, null, 13], [5, 5, null, null],
        [6, 3, null, null], [6, 4, null, null], [6, 5, null, null],
      ], 'populateFromArray');
    });

    it('populating full data of current table', () => {
      const hot = handsontable({
        data: [
          ['', 'Kia', 'Nissan', 'Toyota', 'Honda'],
          ['2008', 10, 11, 12, 13],
          ['2009', 20, 11, 14, 13],
          ['2010', 30, 15, 12, 13]
        ],
        minSpareRows: 1,
        minSpareCols: 1,
      });

      const afterChange = jasmine.createSpy('afterChange');

      hot.addHook('afterChange', afterChange);

      const data = getData();

      populateFromArray(0, 0, data, null, null, null, 'shift_down');

      expect(getData()).toEqual(data.concat(data));

      expect(afterChange).toHaveBeenCalledTimes(1);
      expect(afterChange).toHaveBeenCalledWith([
        // eslint-disable-next-line max-len
        [0, 0, '', ''], [0, 1, 'Kia', 'Kia'], [0, 2, 'Nissan', 'Nissan'], [0, 3, 'Toyota', 'Toyota'], [0, 4, 'Honda', 'Honda'], [0, 5, null, null],
        [1, 0, '2008', '2008'], [1, 1, 10, 10], [1, 2, 11, 11], [1, 3, 12, 12], [1, 4, 13, 13], [1, 5, null, null],
        [2, 0, '2009', '2009'], [2, 1, 20, 20], [2, 2, 11, 11], [2, 3, 14, 14], [2, 4, 13, 13], [2, 5, null, null],
        [3, 0, '2010', '2010'], [3, 1, 30, 30], [3, 2, 15, 15], [3, 3, 12, 12], [3, 4, 13, 13], [3, 5, null, null],
        // eslint-disable-next-line max-len
        [4, 0, null, null], [4, 1, null, null], [4, 2, null, null], [4, 3, null, null], [4, 4, null, null], [4, 5, null, null],

        // eslint-disable-next-line max-len
        [5, 0, null, ''], [5, 1, null, 'Kia'], [5, 2, null, 'Nissan'], [5, 3, null, 'Toyota'], [5, 4, null, 'Honda'], [5, 5, null, null],
        // eslint-disable-next-line max-len
        [6, 0, null, '2008'], [6, 1, null, 10], [6, 2, null, 11], [6, 3, null, 12], [6, 4, null, 13], [6, 5, null, null],
        // eslint-disable-next-line max-len
        [7, 0, null, '2009'], [7, 1, null, 20], [7, 2, null, 11], [7, 3, null, 14], [7, 4, null, 13], [7, 5, null, null],
        // eslint-disable-next-line max-len
        [8, 0, null, '2010'], [8, 1, null, 30], [8, 2, null, 15], [8, 3, null, 12], [8, 4, null, 13], [8, 5, null, null],
        // eslint-disable-next-line max-len
        [9, 0, null, null], [9, 1, null, null], [9, 2, null, null], [9, 3, null, null], [9, 4, null, null], [9, 5, null, null],
      ], 'populateFromArray');
    });
  });

  describe('should shift values right', () => {
    it('populating from the start of the table', () => {
      const hot = handsontable({
        data: [
          ['', 'Kia', 'Nissan', 'Toyota', 'Honda'],
          ['2008', 10, 11, 12, 13],
          ['2009', 20, 11, 14, 13],
          ['2010', 30, 15, 12, 13]
        ],
        minSpareRows: 1,
        minSpareCols: 1,
      });

      const afterChange = jasmine.createSpy('afterChange');

      hot.addHook('afterChange', afterChange);

      populateFromArray(0, 0, [['test', 'test2'], ['test3', 'test4']], 2, 2, null, 'shift_right');

      expect(getData()).toEqual([
        ['test', 'test2', 'test', '', 'Kia', 'Nissan', 'Toyota', 'Honda', null],
        ['test3', 'test4', 'test3', '2008', 10, 11, 12, 13, null],
        ['test', 'test2', 'test', '2009', 20, 11, 14, 13, null],
        ['2010', 30, 15, 12, 13, null, null, null, null],
        [null, null, null, null, null, null, null, null, null]
      ]);

      expect(afterChange).toHaveBeenCalledTimes(1);
      expect(afterChange).toHaveBeenCalledWith([
        // eslint-disable-next-line max-len
        [0, 0, '', 'test'], [0, 1, 'Kia', 'test2'], [0, 2, 'Nissan', 'test'], [0, 3, 'Toyota', ''], [0, 4, 'Honda', 'Kia'],
        // TODO: Shouldn't the `undefined` be `null`?
        [0, 5, null, 'Nissan'], [0, 6, undefined, 'Toyota'], [0, 7, undefined, 'Honda'], [0, 8, undefined, null],
        [1, 0, '2008', 'test3'], [1, 1, 10, 'test4'], [1, 2, 11, 'test3'], [1, 3, 12, '2008'],
        // TODO: Shouldn't the `undefined` be `null`?
        [1, 4, 13, 10], [1, 5, null, 11], [1, 6, undefined, 12], [1, 7, undefined, 13], [1, 8, undefined, null],
        [2, 0, '2009', 'test'], [2, 1, 20, 'test2'], [2, 2, 11, 'test'], [2, 3, 14, '2009'], [2, 4, 13, 20],
        // TODO: Shouldn't the `undefined` be `null`?
        [2, 5, null, 11], [2, 6, undefined, 14], [2, 7, undefined, 13], [2, 8, undefined, null],
      ], 'populateFromArray');
    });

    it('populating from the end of the table', () => {
      const hot = handsontable({
        data: [
          ['', 'Kia', 'Nissan', 'Toyota', 'Honda'],
          ['2008', 10, 11, 12, 13],
          ['2009', 20, 11, 14, 13],
          ['2010', 30, 15, 12, 13]
        ],
        minSpareRows: 1,
        minSpareCols: 1,
      });

      const afterChange = jasmine.createSpy('afterChange');

      hot.addHook('afterChange', afterChange);

      populateFromArray(4, 2, [['test', 'test2'], ['test3', 'test4']], null, null, null, 'shift_right');

      expect(getData()).toEqual([
        ['', 'Kia', 'Nissan', 'Toyota', 'Honda', null], // TODO: Should be ['', 'Kia', 'Nissan', 'Toyota', 'Honda', null, null, null]
        ['2008', 10, 11, 12, 13, null], // TODO: Should be ['2008', 10, 11, 12, 13, null, null, null]
        ['2009', 20, 11, 14, 13, null], // TODO: Should be ['2009', 20, 11, 14, 13, null, null, null]
        ['2010', 30, 15, 12, 13, null], // TODO: Should be ['2010', 30, 15, 12, 13, null, null, null],
        [null, null, 'test', 'test2', null, null], // TODO: Should be [null, null, 'test', 'test2', null, null, null, null],
        [null, null, 'test3', 'test4', null, null], // TODO: Should be [null, null, 'test3', 'test4', null, null, null, null],
        [null, null, null, null, null, null], // TODO: Should be [null, null, null, null, null, null, null, null],
      ]);

      expect(afterChange).toHaveBeenCalledTimes(1);
      expect(afterChange).toHaveBeenCalledWith([
        [4, 2, null, 'test'], [4, 3, null, 'test2'], [4, 4, null, null], [4, 5, null, null],
        // TODO: Shouldn't the `undefined` be `null`?
        [4, 6, undefined, null],
        // TODO: Shouldn't the `undefined` be `null`?
        [4, 7, undefined, null],
        [5, 2, null, 'test3'], [5, 3, null, 'test4'], [5, 4, null, null], [5, 5, null, null], [5, 6, null, null],
        [5, 7, null, null],
      ], 'populateFromArray');
    });

    it('populating full data of current table', () => {
      const hot = handsontable({
        data: [
          ['', 'Kia', 'Nissan', 'Toyota', 'Honda'],
          ['2008', 10, 11, 12, 13],
          ['2009', 20, 11, 14, 13],
          ['2010', 30, 15, 12, 13]
        ],
        minSpareRows: 1,
        minSpareCols: 1,
      });

      const afterChange = jasmine.createSpy('afterChange');

      hot.addHook('afterChange', afterChange);

      const data = getData();

      populateFromArray(0, 0, data, null, null, null, 'shift_right');

      expect(getData()).toEqual([
        ['', 'Kia', 'Nissan', 'Toyota', 'Honda', null, '', 'Kia', 'Nissan', 'Toyota', 'Honda', null],
        ['2008', 10, 11, 12, 13, null, '2008', 10, 11, 12, 13, null],
        ['2009', 20, 11, 14, 13, null, '2009', 20, 11, 14, 13, null],
        ['2010', 30, 15, 12, 13, null, '2010', 30, 15, 12, 13, null],
        [null, null, null, null, null, null, null, null, null, null, null, null],
      ]);

      expect(afterChange).toHaveBeenCalledTimes(1);
      expect(afterChange).toHaveBeenCalledWith([
        [0, 0, '', ''], [0, 1, 'Kia', 'Kia'], [0, 2, 'Nissan', 'Nissan'], [0, 3, 'Toyota', 'Toyota'],
        // TODO: Shouldn't the `undefined` be `null`?
        [0, 4, 'Honda', 'Honda'], [0, 5, null, null], [0, 6, undefined, ''], [0, 7, undefined, 'Kia'],
        // TODO: Shouldn't the `undefined` be `null`?
        [0, 8, undefined, 'Nissan'], [0, 9, undefined, 'Toyota'], [0, 10, undefined, 'Honda'], [0, 11, undefined, null],
        [1, 0, '2008', '2008'], [1, 1, 10, 10], [1, 2, 11, 11], [1, 3, 12, 12], [1, 4, 13, 13], [1, 5, null, null],
        // TODO: Shouldn't the `undefined` be `null`?
        [1, 6, undefined, '2008'], [1, 7, undefined, 10], [1, 8, undefined, 11], [1, 9, undefined, 12],
        // TODO: Shouldn't the `undefined` be `null`?
        [1, 10, undefined, 13], [1, 11, undefined, null], [2, 0, '2009', '2009'], [2, 1, 20, 20], [2, 2, 11, 11],
        // TODO: Shouldn't the `undefined` be `null`?
        [2, 3, 14, 14], [2, 4, 13, 13], [2, 5, null, null], [2, 6, undefined, '2009'], [2, 7, undefined, 20],
        // TODO: Shouldn't the `undefined` be `null`?
        [2, 8, undefined, 11], [2, 9, undefined, 14], [2, 10, undefined, 13], [2, 11, undefined, null],
        [3, 0, '2010', '2010'], [3, 1, 30, 30], [3, 2, 15, 15], [3, 3, 12, 12], [3, 4, 13, 13], [3, 5, null, null],
        // TODO: Shouldn't the `undefined` be `null`?
        [3, 6, undefined, '2010'], [3, 7, undefined, 30], [3, 8, undefined, 15], [3, 9, undefined, 12],
        // TODO: Shouldn't the `undefined` be `null`?
        [3, 10, undefined, 13], [3, 11, undefined, null],
        [4, 0, null, null], [4, 1, null, null], [4, 2, null, null], [4, 3, null, null], [4, 4, null, null],
        // TODO: Shouldn't the `undefined` be `null`?
        [4, 5, null, null], [4, 6, undefined, null], [4, 7, undefined, null], [4, 8, undefined, null],
        // TODO: Shouldn't the `undefined` be `null`?
        [4, 9, undefined, null], [4, 10, undefined, null], [4, 11, undefined, null],
      ], 'populateFromArray');
    });

    it('should expand the dataset properly #6929', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
      });

      const afterChange = jasmine.createSpy('afterChange');

      hot.addHook('afterChange', afterChange);

      hot.populateFromArray(0, 0, [
        ['test', 'test2'],
        ['test3', 'test4']
      ], 3, 3, null, 'shift_right');

      expect(getData()).toEqual([
        ['test', 'test2', 'test', 'test2', 'A1', 'B1', 'C1', 'D1', 'E1'],
        ['test3', 'test4', 'test3', 'test4', null, null, null, null, null],
        ['test', 'test2', 'test', 'test2', null, null, null, null, null],
        ['test3', 'test4', 'test3', 'test4', null, null, null, null, null],
      ]);

      expect(afterChange).toHaveBeenCalledTimes(1);
      expect(afterChange).toHaveBeenCalledWith([
        [0, 0, 'A1', 'test'], [0, 1, 'B1', 'test2'], [0, 2, 'C1', 'test'], [0, 3, 'D1', 'test2'], [0, 4, 'E1', 'A1'],
        // TODO: Shouldn't the `undefined` be `null`?
        [0, 5, undefined, 'B1'], [0, 6, undefined, 'C1'], [0, 7, undefined, 'D1'], [0, 8, undefined, 'E1'],
        [1, 0, null, 'test3'], [1, 1, null, 'test4'], [1, 2, null, 'test3'], [1, 3, null, 'test4'], [1, 4, null, null],
        [1, 5, null, null], [1, 6, null, null], [1, 7, null, null], [1, 8, null, null],
        [2, 0, null, 'test'], [2, 1, null, 'test2'], [2, 2, null, 'test'], [2, 3, null, 'test2'],
        // TODO: Shouldn't the `undefined` be `null`?
        [2, 4, null, undefined],
        [3, 0, null, 'test3'], [3, 1, null, 'test4'], [3, 2, null, 'test3'], [3, 3, null, 'test4'],
        // TODO: Shouldn't the `undefined` be `null`?
        [3, 4, null, undefined],
      ], 'populateFromArray');
    });
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

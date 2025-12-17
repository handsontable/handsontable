describe('AutoFill beforeAutofill hook', () => {
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

  it('should use a custom value when mutating the selection data array', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      beforeAutofill(selectionData) {
        selectionData[0][0] = 'test';
      }
    });
    await selectCell(0, 0);

    simulateFillHandleDrag(getCell(2, 0));

    expect(getSelected()).toEqual([[0, 0, 2, 0]]);
    expect(getDataAtCell(1, 0)).toEqual('test');
  });

  it('should pass correct arguments to `beforeAutofill`', async() => {
    const beforeAutofill = jasmine.createSpy();

    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        ['x', 'x', 3, 4, 5, 6],
        ['x', 'x', 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      beforeAutofill
    });

    await selectCell(0, 0, 0, 1);

    simulateFillHandleDrag(getCell(2, 1));

    expect(beforeAutofill).toHaveBeenCalledWith(
      [[1, 2]],
      cellRange(0, 0, 0, 1),
      cellRange(1, 0, 2, 1),
      'down',
    );
  });

  it('should clear the whole target range if `beforeAutofill` returns an empty array of arrays', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      beforeAutofill() {
        return [[]];
      }
    });

    await selectCell(0, 0, 0, 3);

    simulateFillHandleDrag(getCell(3, 3));

    expect(getData()).toEqual([
      [1, 2, 3, 4, 5, 6],
      [undefined, undefined, undefined, undefined, 5, 6],
      [undefined, undefined, undefined, undefined, 5, 6],
      [undefined, undefined, undefined, undefined, 5, 6]
    ]);
  });

  it('should use input from `beforeAutofill` if data is returned', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      beforeAutofill() {
        return [[7, 8], [9, 10]];
      }
    });

    await selectCell(0, 0, 0, 3);

    simulateFillHandleDrag(getCell(3, 3));

    expect(getData()).toEqual([
      [1, 2, 3, 4, 5, 6],
      [7, 8, 7, 8, 5, 6],
      [9, 10, 9, 10, 5, 6],
      [7, 8, 7, 8, 5, 6]
    ]);
  });

  it('should use input from `beforeAutofill` if data is returned, in the correct order, upwards', async() => {
    handsontable({
      data: [
        ['x'],
        ['x'],
        ['x'],
        ['x'],
        ['x'],
        [1],
        [1]
      ],
      beforeAutofill() {
        return [
          ['a'],
          ['b'],
        ];
      }
    });

    await selectCell(5, 0, 6, 0);

    simulateFillHandleDrag(getCell(0, 0));

    expect(getData()).toEqual([
      ['b'],
      ['a'],
      ['b'],
      ['a'],
      ['b'],
      [1],
      [1]
    ]);
  });

  it('should cancel autofill if beforeAutofill returns false', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      beforeAutofill() {
        return false;
      }
    });

    await selectCell(0, 0);

    simulateFillHandleDrag(getCell(2, 0));

    expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    expect(getDataAtCell(1, 0)).toEqual(1);
  });

  it('should detect custom input from `beforeAutofill` in `afterAutofill` arguments', async() => {
    const afterAutofill = jasmine.createSpy();

    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      beforeAutofill() {
        return [['a']];
      },
      afterAutofill
    });

    await selectCell(0, 0, 0, 1);

    simulateFillHandleDrag(getCell(2, 1));

    expect(afterAutofill).toHaveBeenCalledWith(
      [['a']],
      cellRange(0, 0, 0, 1),
      cellRange(1, 0, 2, 1),
      'down',
    );
  });

  it('should not call beforeAutofill if we return to the cell from where we start', async() => {
    const beforeAutofill = jasmine.createSpy('beforeAutofill');

    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      beforeAutofill,
      fillHandle: {
        direction: 'vertical'
      }
    });

    await selectCell(0, 0);

    simulateFillHandleDrag(getCell(0, 0));

    expect(beforeAutofill).toHaveBeenCalledTimes(0);
  });
});

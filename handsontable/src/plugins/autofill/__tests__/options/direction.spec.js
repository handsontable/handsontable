describe('AutoFill direction option', () => {
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

  it('should not change cell value (drag vertically when fillHandle option is set to `horizontal`)', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: 'horizontal'
    });

    await selectCell(0, 0);

    simulateFillHandleDrag(getCell(1, 0));

    expect(getDataAtCell(1, 0)).toEqual(7);
  });

  it('should not change cell value (drag horizontally when fillHandle option is set to `vertical`)', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: 'vertical'
    });

    await selectCell(0, 0);

    simulateFillHandleDrag(getCell(0, 1));

    expect(getDataAtCell(0, 1)).toEqual(2);
  });

  it('should work properly when fillHandle option is set to object with property `direction` set to `vertical`)', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        direction: 'vertical'
      }
    });

    await selectCell(0, 0);

    simulateFillHandleDrag(getCell(0, 1));

    expect(getDataAtCell(0, 1)).toEqual(2);

    await selectCell(0, 0);

    simulateFillHandleDrag(getCell(1, 0));

    expect(getDataAtCell(1, 0)).toEqual(1);
  });

  it('should work properly when fillHandle option is set to object with property `direction` set to `horizontal`)', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        direction: 'horizontal'
      }
    });

    await selectCell(0, 0);

    simulateFillHandleDrag(getCell(0, 1));

    expect(getDataAtCell(0, 1)).toEqual(1);

    await selectCell(0, 0);

    simulateFillHandleDrag(getCell(1, 0));

    expect(getDataAtCell(1, 0)).toEqual(7);
  });

  it('should work properly when using updateSettings (vertical -> horizontal)', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: 'horizontal'
    });

    await updateSettings({ fillHandle: 'vertical' });
    await selectCell(0, 0);

    simulateFillHandleDrag(getCell(0, 1));

    expect(getDataAtCell(0, 1)).toEqual(2);

    await updateSettings({ fillHandle: false });
    await selectCell(0, 1);

    simulateFillHandleDrag(getCell(1, 1));

    expect(getDataAtCell(1, 1)).toEqual(8);

    await selectCell(0, 1);

    simulateFillHandleDrag(getCell(0, 2));

    expect(getDataAtCell(0, 2)).toEqual(3);
  });

  it('should work properly when using updateSettings (horizontal -> vertical)', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: 'vertical'
    });

    await updateSettings({ fillHandle: 'horizontal' });
    await selectCell(0, 0);

    simulateFillHandleDrag(getCell(1, 0));

    expect(getDataAtCell(1, 0)).toEqual(7);

    await updateSettings({ fillHandle: false });
    await selectCell(0, 1);

    simulateFillHandleDrag(getCell(1, 1));

    expect(getDataAtCell(1, 1)).toEqual(8);

    await selectCell(0, 1);

    simulateFillHandleDrag(getCell(0, 2));

    expect(getDataAtCell(0, 2)).toEqual(3);
  });

  it('should not change cell value if we return to the cell from where we start (when fillHandle option is set to `vertical`)', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: 'vertical'
    });

    await selectCell(0, 0);

    simulateFillHandleDrag(getCell(1, 0), { finish: false });
    simulateFillHandleDrag(getCell(0, 0), { finish: true });

    expect(getDataAtCell(0, 0)).toEqual(1);
    expect(getDataAtCell(1, 0)).toEqual(7);
  });
});

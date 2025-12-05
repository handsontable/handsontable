describe('AutoFill autoInsertRow option', () => {
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

  it('should add new row after dragging the handle to the last table row', async() => {
    handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: true
    });

    await selectCell(0, 2);

    simulateFillHandleDrag(getCell(3, 2), { finish: false });

    expect(countRows()).toBe(4);

    await sleep(300);

    expect(countRows()).toBe(5);

    simulateFillHandleDrag(getCell(4, 2), { finish: false });

    await sleep(300);

    expect(countRows()).toBe(6);
    expect(getData()).toEqual([
      [1, 2, 'test', 4, 5, 6],
      [1, 2, 3, 4, 5, 6],
      [1, 2, 3, 4, 5, 6],
      [1, 2, 3, 4, 5, 6],
      [null, null, null, null, null, null],
      [null, null, null, null, null, null],
    ]);
  });

  it('should add new row after dragging the handle to the last table row (autoInsertRow as true)', async() => {
    handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        autoInsertRow: true,
      }
    });

    await selectCell(0, 2);

    simulateFillHandleDrag(getCell(3, 2), { finish: false });

    expect(countRows()).toBe(4);

    await sleep(300);

    expect(countRows()).toBe(5);

    simulateFillHandleDrag(getCell(4, 2), { finish: false });

    await sleep(300);

    expect(countRows()).toBe(6);

    expect(getData()).toEqual([
      [1, 2, 'test', 4, 5, 6],
      [1, 2, 3, 4, 5, 6],
      [1, 2, 3, 4, 5, 6],
      [1, 2, 3, 4, 5, 6],
      [null, null, null, null, null, null],
      [null, null, null, null, null, null],
    ]);
  });

  it('should add new row after dragging the handle to the last table row (autoInsertRow as true, vertical)', async() => {
    handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        direction: 'vertical',
        autoInsertRow: true,
      }
    });

    await selectCell(0, 2);

    simulateFillHandleDrag(getCell(3, 2), { finish: false });

    expect(countRows()).toBe(4);

    await sleep(300);

    expect(countRows()).toBe(5);

    simulateFillHandleDrag(getCell(4, 2), { finish: false });

    await sleep(300);

    expect(countRows()).toBe(6);
  });

  it('should not add new row after dragging the handle to the last table row (autoInsertRow as true, horizontal)', async() => {
    handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        direction: 'horizontal',
        autoInsertRow: true,
      }
    });

    await selectCell(0, 2);

    simulateFillHandleDrag(getCell(3, 2), { finish: false });

    expect(countRows()).toBe(4);

    await sleep(300);

    expect(countRows()).toBe(4);
  });

  it('should not add new rows if the current number of rows reaches the maxRows setting', async() => {
    handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        autoInsertRow: true
      },
      maxRows: 5
    });

    await selectCell(0, 2);

    simulateFillHandleDrag(getCell(3, 2), { finish: false });

    expect(countRows()).toBe(4);

    await sleep(200);

    expect(countRows()).toBe(5);

    simulateFillHandleDrag(getCell(4, 2), { finish: false });

    await sleep(200);

    expect(countRows()).toBe(5);
  });

  it('should add new row after dragging the handle below the viewport', async() => {
    handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        autoInsertRow: true
      },
    });

    await selectCell(0, 2);

    simulateFillHandleDrag(getCell(3, 2), { offsetY: 150 });

    expect(countRows()).toBe(4);
  });

  it('should not add a new row if dragging from the last row upwards or sideways', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
    });

    await selectCell(3, 2);

    simulateFillHandleDrag(getCell(3, 2));

    await sleep(300);

    expect(countRows()).toBe(4);

    await selectCell(3, 2);

    simulateFillHandleDrag(getCell(2, 3));

    await sleep(200);

    expect(countRows()).toBe(4);

    await selectCell(3, 2);

    simulateFillHandleDrag(getCell(3, 1));

    await sleep(200);

    expect(countRows()).toBe(4);
  });
});

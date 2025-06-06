describe('Selection', () => {
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

  it('should call `afterSelectionEnd` when user finishes selection by releasing SHIFT key (3 times)', async() => {
    let tick = 0;

    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5,
      afterSelectionEnd() {
        tick += 1;
      }
    });
    await selectCell(3, 0); // makes tick++
    await keyDownUp(['shift', 'arrowdown']); // makes tick++
    await keyDownUp(['shift', 'arrowdown']); // makes tick++
    await keyDownUp(['shift', 'arrowdown']); // makes tick++

    expect(getSelected()).toEqual([[3, 0, 4, 0]]);
    expect(`
    |   ║ - :   :   :   :   |
    |===:===:===:===:===:===|
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    | - ║ A :   :   :   :   |
    | - ║ 0 :   :   :   :   |
    `).toBeMatchToSelectionPattern();
    expect(tick).toEqual(4);
  });

  it('should call `afterSelectionEnd` when user finishes selection by releasing SHIFT key (1 time)', async() => {
    let tick = 0;

    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5,
      afterSelectionEnd() {
        tick += 1;
      }
    });
    await selectCell(3, 0); // makes tick++
    await keyDown(['shift', 'arrowdown']);
    await keyDown(['shift', 'arrowdown']);
    await keyDownUp(['shift', 'arrowdown']); // makes tick++

    expect(getSelected()).toEqual([[3, 0, 4, 0]]);
    expect(`
    |   ║ - :   :   :   :   |
    |===:===:===:===:===:===|
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    | - ║ A :   :   :   :   |
    | - ║ 0 :   :   :   :   |
    `).toBeMatchToSelectionPattern();
    expect(tick).toEqual(2);
  });

  it('should move focus to selected cell', async() => {
    const $input = $('<input>').appendTo(document.body);

    handsontable({
      startRows: 5,
      startCols: 5
    });
    $input[0].focus();
    await selectCell(0, 0);

    await keyDownUp('enter');
    expect(isEditorVisible()).toEqual(true);
    $input.remove();
  });

  it('should not overwrite background color of the cells with custom CSS classes', async() => {
    handsontable({
      width: 300,
      height: 150,
      startRows: 5,
      startCols: 5,
      cells: (row, col) => (row === 1 && col === 1 ? { className: 'red-background' } : undefined)
    });

    await mouseDown(getCell(0, 0));
    await mouseOver(getCell(4, 4));
    await mouseUp(getCell(4, 4));

    expect(window.getComputedStyle(getCell(1, 1))['background-color']).toBe('rgb(255, 0, 0)');
  });

  it('should scroll viewport after partially visible column\'s header is clicked, without vertical scroll manipulation', async() => {
    handsontable({
      width: 200,
      height: 100,
      startRows: 40,
      startCols: 40,
      colWidths: 73,
      colHeaders: true,
      rowHeaders: true,
    });

    const mainHolder = tableView()._wt.wtTable.holder;

    mainHolder.scrollTop = 200;

    const lastVisibleColumn = tableView()._wt.wtTable.getLastVisibleColumn();
    const headerElement = tableView()._wt.wtTable.getColumnHeader(lastVisibleColumn + 1);

    $(headerElement).simulate('mousedown');

    expect(tableView()._wt.wtTable.getLastVisibleColumn()).toBe(lastVisibleColumn + 1);
    expect(mainHolder.scrollTop).toBe(200);
  });

  it('should render selection borders with set proper z-indexes', async() => {
    const hot = handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
      colHeaders: true,
      rowHeaders: true
    });

    await selectCell(1, 1, 2, 2);

    expect(getComputedStyle(hot.rootElement.querySelector('.ht_master .htBorders .current')).zIndex)
      .toBe('10');
    expect(getComputedStyle(hot.rootElement.querySelector('.ht_master .htBorders .area')).zIndex)
      .toBe('8');
  });

  it('should allow to scroll the table when a whole column is selected and table is longer than it\'s container', async() => {
    let errCount = 0;

    $(window).on('error.selectionTest', async() => {
      errCount += 1;
    });

    const onAfterScrollVertically = jasmine.createSpy('onAfterScrollVertically');

    handsontable({
      height: 100,
      width: 300,
      startRows: 100,
      startCols: 5,
      colHeaders: true,
      rowHeaders: true,
      afterScrollVertically: onAfterScrollVertically
    });

    const mainHolder = tableView()._wt.wtTable.holder;

    mainHolder.scrollTop = 0;

    spec().$container.find('thead tr:eq(0) th:eq(2)').simulate('mousedown');
    spec().$container.find('thead tr:eq(0) th:eq(2)').simulate('mouseup');

    mainHolder.scrollTop = 120;

    await sleep(100);

    expect(errCount).toEqual(0); // expect no errors to be thrown

    $(window).off('error.selectionTest');
  });

  it('should scroll to the end of the selection, when selecting cells using the keyboard', async() => {
    handsontable({
      height: 300,
      width: 300,
      startRows: 50,
      startCols: 50,
      colHeaders: true,
      rowHeaders: true,
      fixedRowsTop: 2,
      fixedColumnsStart: 2
    });

    const mainHolder = tableView()._wt.wtTable.holder;

    mainHolder.scrollTop = 100;

    await sleep(20);
    await selectCell(1, 3);
    await keyDownUp('arrowdown');

    expect(mainHolder.scrollTop).toEqual(0);

    mainHolder.scrollTop = 100;

    await sleep(20);
    await selectCell(1, 3);
    await keyDownUp(['shift', 'arrowdown']);

    expect(mainHolder.scrollTop).toEqual(0);

    await scrollViewportHorizontally(100);

    await selectCell(3, 1);
    await keyDownUp('arrowright');

    expect(mainHolder.scrollLeft).toEqual(0);

    await scrollViewportHorizontally(100);

    await selectCell(3, 1);
    await keyDownUp(['shift', 'arrowright']);

    expect(mainHolder.scrollLeft).toEqual(0);

    const lastVisibleColumn = tableView()._wt.wtTable.getLastVisibleColumn();

    await selectCell(3, lastVisibleColumn);
    await keyDownUp('arrowright');

    expect(tableView()._wt.wtTable.getLastVisibleColumn()).toEqual(lastVisibleColumn + 1);

    await keyDownUp('arrowright');

    expect(tableView()._wt.wtTable.getLastVisibleColumn()).toEqual(lastVisibleColumn + 2);

    await keyDownUp(['shift', 'arrowright']);

    expect(tableView()._wt.wtTable.getLastVisibleColumn()).toEqual(lastVisibleColumn + 3);

    const lastVisibleRow = tableView()._wt.wtTable.getLastVisibleRow();

    await selectCell(lastVisibleRow, 3);
    await keyDownUp('arrowdown');

    expect(tableView()._wt.wtTable.getLastVisibleRow()).toEqual(lastVisibleRow + 1);

    await keyDownUp('arrowdown');

    expect(tableView()._wt.wtTable.getLastVisibleRow()).toEqual(lastVisibleRow + 2);

    await keyDownUp(['shift', 'arrowdown']);

    expect(tableView()._wt.wtTable.getLastVisibleRow()).toEqual(lastVisibleRow + 3);
  });

  it('should scroll to the last selected row or column of the selection, when user uses the keyboard', async() => {
    handsontable({
      height: 300,
      width: 300,
      startRows: 50,
      startCols: 50,
      colHeaders: true,
      rowHeaders: true,
      fixedRowsTop: 2,
      fixedColumnsStart: 2
    });

    const mainHolder = tableView()._wt.wtTable.holder;
    const lastVisibleColumn = tableView()._wt.wtTable.getLastVisibleColumn();
    const lastVisibleRow = tableView()._wt.wtTable.getLastVisibleRow();
    const rowHeader = tableView()._wt.wtTable.getRowHeader(lastVisibleRow);
    const columnHeader = tableView()._wt.wtTable.getColumnHeader(lastVisibleColumn);

    $(columnHeader).simulate('mousedown');
    $(columnHeader).simulate('mouseup');
    await keyDownUp(['shift', 'arrowright']);
    expect(tableView()._wt.wtTable.getLastVisibleColumn()).toEqual(lastVisibleColumn + 1);

    await keyDownUp(['shift', 'arrowright']);
    expect(tableView()._wt.wtTable.getLastVisibleColumn()).toEqual(lastVisibleColumn + 2);

    await keyDownUp(['shift', 'arrowright']);
    expect(tableView()._wt.wtTable.getLastVisibleColumn()).toEqual(lastVisibleColumn + 3);

    const scrollLeft = mainHolder.scrollLeft;

    expect(scrollLeft).toBeGreaterThan(0);
    expect(mainHolder.scrollTop).toBe(0);

    $(rowHeader).simulate('mousedown');
    $(rowHeader).simulate('mouseup');
    await keyDownUp(['shift', 'arrowdown']);
    expect(tableView()._wt.wtTable.getLastVisibleRow()).toEqual(lastVisibleRow + 1);

    await keyDownUp(['shift', 'arrowdown']);
    expect(tableView()._wt.wtTable.getLastVisibleRow()).toEqual(lastVisibleRow + 2);

    await keyDownUp(['shift', 'arrowdown']);
    expect(tableView()._wt.wtTable.getLastVisibleRow()).toEqual(lastVisibleRow + 3);
    expect(mainHolder.scrollLeft).toBe(scrollLeft);
    expect(mainHolder.scrollTop).toBeGreaterThan(0);
  });

  it('should scroll viewport after partially visible row\'s header is clicked, without horizontal scroll manipulation', async() => {
    handsontable({
      width: 200,
      height: 100,
      startRows: 40,
      startCols: 40,
      rowHeights: 27,
      colHeaders: true,
      rowHeaders: true,
    });

    const mainHolder = tableView()._wt.wtTable.holder;

    await scrollViewportHorizontally(200);

    const firstLastVisibleRow = tableView()._wt.wtTable.getLastVisibleRow();
    const headerElement = getCell(firstLastVisibleRow + 1, -1, true);

    await simulateClick(headerElement);

    expect(tableView()._wt.wtTable.getLastVisibleRow()).toBe(firstLastVisibleRow + 1);
    expect(mainHolder.scrollLeft).toBe(200);
  });

  it('should select the entire row of a partially fixed table after row header is clicked', async() => {
    handsontable({
      startRows: 5,
      startCols: 5,
      colHeaders: true,
      rowHeaders: true,
      fixedRowsTop: 2,
      fixedColumnsStart: 2
    });

    spec().$container.find('tr:eq(2) th:eq(0)').simulate('mousedown');
    expect(getSelected()).toEqual([[1, -1, 1, 4]]);
    expect(`
    |   ║ - : - | - : - : - |
    |===:===:===:===:===:===|
    |   ║   :   |   :   :   |
    | * ║ A : 0 | 0 : 0 : 0 |
    |---:---:---:---:---:---|
    |   ║   :   |   :   :   |
    |   ║   :   |   :   :   |
    |   ║   :   |   :   :   |
    `).toBeMatchToSelectionPattern();

    spec().$container.find('tr:eq(3) th:eq(0)').simulate('mousedown');
    expect(getSelected()).toEqual([[2, -1, 2, 4]]);
    expect(`
    |   ║ - : - | - : - : - |
    |===:===:===:===:===:===|
    |   ║   :   |   :   :   |
    |   ║   :   |   :   :   |
    |---:---:---:---:---:---|
    | * ║ A : 0 | 0 : 0 : 0 |
    |   ║   :   |   :   :   |
    |   ║   :   |   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should select a cell in a newly added row after automatic row adding, triggered by editing a cell in the last row with minSpareRows > 0, ' +
    'unless editing happened within the fixed bottom rows', async() => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 2,
      minSpareRows: 1
    });

    await sleep(10);
    await selectCell(4, 0);
    await keyDownUp('enter');

    await sleep(90);
    await keyDownUp('enter');

    await sleep(100);
    expect(countRows()).toEqual(6);
    expect(getSelected()).toEqual([[5, 0, 5, 0]]);
    expect(`
    |   ║ - :   |
    |===:===:===|
    |   ║   :   |
    |   ║   :   |
    |   ║   :   |
    |   ║   :   |
    |   ║   :   |
    | - ║ # :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should change selected coords by modifying coords object via `modifyTransformStart` hook', async() => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5
    });

    await selectCell(0, 0);

    addHook('modifyTransformStart', (coords) => {
      coords.col += 1;
      coords.row += 1;
    });
    await keyDownUp('arrowdown');

    expect(getSelected()).toEqual([[2, 1, 2, 1]]);
    expect(`
    |   ║   : - :   :   :   |
    |===:===:===:===:===:===|
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    | - ║   : # :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should change selected coords by modifying coords object via `modifyTransformEnd` hook', async() => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5
    });

    await selectCell(0, 0);

    addHook('modifyTransformEnd', (delta) => {
      delta.col += 2;
      delta.row += 1;
    });
    await keyDownUp(['shift', 'arrowdown']);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(`
    |   ║ - : - : - :   :   |
    |===:===:===:===:===:===|
    | - ║ A : 0 : 0 :   :   |
    | - ║ 0 : 0 : 0 :   :   |
    | - ║ 0 : 0 : 0 :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should indicate is coords is out of bounds via `afterModifyTransformStart` hook', async() => {
    const spy = jasmine.createSpy();

    handsontable({
      startRows: 5,
      startCols: 5,
      autoWrapCol: false,
      autoWrapRow: false
    });

    addHook('afterModifyTransformStart', spy);

    await selectCell(2, 0);
    await keyDownUp('arrowleft');

    expect(spy.calls.mostRecent().args[1]).toBe(0);
    expect(spy.calls.mostRecent().args[2]).toBe(-1);

    spy.calls.reset();
    await selectCell(2, 4);
    await keyDownUp('arrowright');

    expect(spy.calls.mostRecent().args[1]).toBe(0);
    expect(spy.calls.mostRecent().args[2]).toBe(1);

    spy.calls.reset();
    await selectCell(4, 2);
    await keyDownUp('arrowdown');

    expect(spy.calls.mostRecent().args[1]).toBe(1);
    expect(spy.calls.mostRecent().args[2]).toBe(0);

    spy.calls.reset();
    await selectCell(0, 2);
    await keyDownUp('arrowup');

    expect(spy.calls.mostRecent().args[1]).toBe(-1);
    expect(spy.calls.mostRecent().args[2]).toBe(0);
  });

  it('should indicate is coords is out of bounds via `afterModifyTransformEnd` hook', async() => {
    const spy = jasmine.createSpy();

    handsontable({
      startRows: 5,
      startCols: 5
    });

    addHook('afterModifyTransformEnd', spy);
    await selectCell(2, 0);
    await keyDownUp(['shift', 'arrowleft']);

    expect(spy.calls.mostRecent().args[1]).toBe(0);
    expect(spy.calls.mostRecent().args[2]).toBe(-1);

    spy.calls.reset();
    await selectCell(2, 4);
    await keyDownUp(['shift', 'arrowright']);

    expect(spy.calls.mostRecent().args[1]).toBe(0);
    expect(spy.calls.mostRecent().args[2]).toBe(1);

    spy.calls.reset();
    await selectCell(4, 2);
    await keyDownUp(['shift', 'arrowdown']);

    expect(spy.calls.mostRecent().args[1]).toBe(1);
    expect(spy.calls.mostRecent().args[2]).toBe(0);

    spy.calls.reset();
    await selectCell(0, 2);
    await keyDownUp(['shift', 'arrowup']);

    expect(spy.calls.mostRecent().args[1]).toBe(-1);
    expect(spy.calls.mostRecent().args[2]).toBe(0);
  });

  it('should not scroll the table after clicking the corner header', async() => {
    const onAfterScrollVertically = jasmine.createSpy('onAfterScrollVertically');
    const onAfterScrollHorizontally = jasmine.createSpy('onAfterScrollHorizontally');

    handsontable({
      startRows: 50,
      startCols: 50,
      width: 100,
      height: 100,
      colHeaders: true,
      rowHeaders: true,
      afterScrollHorizontally: onAfterScrollHorizontally,
      afterScrollVertically: onAfterScrollVertically
    });

    spec().$container.find('.ht_clone_top thead').find('th').eq(0).simulate('mousedown');

    await sleep(100);

    expect(onAfterScrollVertically).toHaveBeenCalledTimes(0);
    expect(onAfterScrollHorizontally).toHaveBeenCalledTimes(0);
  });

  it('should redraw selection when option `colHeaders` is set and user scrolled', async() => {
    handsontable({
      startRows: 20,
      startCols: 20,
      colHeaders: true,
      rowHeaders: true,
      width: 400,
      height: 200
    });
    let cellVerticalPosition;
    const borderOffsetInPixels = 1;
    let topBorder;

    await selectCell(5, 5);
    await scrollViewportVertically(2);

    cellVerticalPosition = getCell(5, 5).offsetTop;
    topBorder = $('.wtBorder.current')[0];

    expect(topBorder.offsetTop).toEqual(cellVerticalPosition - borderOffsetInPixels);

    await scrollViewportVertically(0);

    cellVerticalPosition = getCell(5, 5).offsetTop;
    topBorder = $('.wtBorder.current')[0];

    expect(topBorder.offsetTop).toEqual(cellVerticalPosition - borderOffsetInPixels);
  });

  it('should redraw selection on `inlineStartOverlay` when options `colHeaders` and `fixedColumnsStart` are set, and user scrolled', async() => {
    handsontable({
      fixedColumnsStart: 2,
      startRows: 20,
      startCols: 20,
      colHeaders: true,
      rowHeaders: true,
      width: 400,
      height: 200
    });
    let cellVerticalPosition;
    const borderOffsetInPixels = 1;
    let topBorder;

    await selectCell(1, 0);
    await scrollViewportVertically(5);

    cellVerticalPosition = getCell(1, 0).offsetTop;
    topBorder = $('.wtBorder.current')[0];

    expect(topBorder.offsetTop).toEqual(cellVerticalPosition - borderOffsetInPixels);

    await scrollViewportVertically(0);

    cellVerticalPosition = getCell(1, 0).offsetTop;
    topBorder = $('.wtBorder.current')[0];

    expect(topBorder.offsetTop).toEqual(cellVerticalPosition - borderOffsetInPixels);
  });

  it('should keep viewport when removing last column', async() => {
    handsontable({
      data: createSpreadsheetData(20, 2),
      width: 300,
      height: 200,
      colHeaders: true,
    });

    await selectColumns(1);
    const $masterHolder = spec().$container.find('.ht_master .wtHolder');
    const scrollTopBefore = $masterHolder.scrollTop();

    await alter('remove_col', 1); // remove last column
    expect($masterHolder.scrollTop()).toEqual(scrollTopBefore);
  });

  describe('multiple selection mode', () => {
    it('should select cells by using two layers when CTRL key is pressed (default mode of the selectionMode option)', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 8,
        startCols: 10
      });

      await mouseDown(getCell(1, 1));
      await mouseOver(getCell(4, 4));
      await mouseUp(getCell(4, 4));

      expect(getSelected()).toEqual([[1, 1, 4, 4]]);
      expect(`
      |   ║   : - : - : - : - :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   :   :   |
      | - ║   : A : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await keyDown('control/meta');

      await mouseDown(getCell(3, 3));
      await mouseOver(getCell(5, 6));
      await mouseUp(getCell(5, 6));

      await keyUp('control/meta');

      expect(getSelected()).toEqual([[1, 1, 4, 4], [3, 3, 5, 6]]);
      expect(`
      |   ║   : - : - : - : - : - : - :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : B : 1 : 0 : 0 :   :   :   |
      | - ║   : 0 : 0 : 1 : 1 : 0 : 0 :   :   :   |
      | - ║   :   :   : 0 : 0 : 0 : 0 :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should be disallowed to select non-consecutive cells when selectionMode is set as `single`', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 8,
        startCols: 10,
        selectionMode: 'single',
      });

      await mouseDown(getCell(1, 1));
      await mouseOver(getCell(4, 4));
      await mouseUp(getCell(4, 4));

      expect(getSelected()).toEqual([[1, 1, 1, 1]]);
      expect(`
      |   ║   : - :   :   :   :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   :   :   |
      | - ║   : # :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await keyDown('control/meta');

      await mouseDown(getCell(3, 3));
      await mouseOver(getCell(5, 6));
      await mouseUp(getCell(5, 6));

      await keyUp('control/meta');

      expect(getSelected()).toEqual([[3, 3, 3, 3]]);
      expect(`
      |   ║   :   :   : - :   :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      | - ║   :   :   : # :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should be allowed to select consecutive cells when selectionMode is set as `range`', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 8,
        startCols: 10,
        selectionMode: 'range',
      });

      await mouseDown(getCell(1, 1));
      await mouseOver(getCell(4, 4));
      await mouseUp(getCell(4, 4));

      expect(getSelected()).toEqual([[1, 1, 4, 4]]);
      expect(`
      |   ║   : - : - : - : - :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   :   :   |
      | - ║   : A : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await mouseDown(getCell(3, 3));
      await mouseOver(getCell(5, 6));
      await mouseUp(getCell(5, 6));

      expect(getSelected()).toEqual([[3, 3, 5, 6]]);
      expect(`
      |   ║   :   :   : - : - : - : - :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      | - ║   :   :   : A : 0 : 0 : 0 :   :   :   |
      | - ║   :   :   : 0 : 0 : 0 : 0 :   :   :   |
      | - ║   :   :   : 0 : 0 : 0 : 0 :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should be disallowed to select non-consecutive cells when selectionMode is set as `range`', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 8,
        startCols: 10,
        selectionMode: 'range',
      });

      await mouseDown(getCell(1, 1));
      await mouseOver(getCell(4, 4));
      await mouseUp(getCell(4, 4));

      expect(getSelected()).toEqual([[1, 1, 4, 4]]);
      expect(`
      |   ║   : - : - : - : - :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   :   :   |
      | - ║   : A : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await keyDown('control/meta');

      await mouseDown(getCell(3, 3));
      await mouseOver(getCell(5, 6));
      await mouseUp(getCell(5, 6));

      await keyUp('control/meta');

      expect(getSelected()).toEqual([[3, 3, 5, 6]]);
      expect(`
      |   ║   :   :   : - : - : - : - :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      | - ║   :   :   : A : 0 : 0 : 0 :   :   :   |
      | - ║   :   :   : 0 : 0 : 0 : 0 :   :   :   |
      | - ║   :   :   : 0 : 0 : 0 : 0 :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should properly colorize selection layers including layer intersections', async() => {
      handsontable({
        startRows: 21,
        startCols: 30,
        selectionMode: 'multiple',
        colHeaders: true,
        rowHeaders: true,
      });

      await mouseDown(getCell(0, 0));
      await mouseOver(getCell(20, 15));
      await mouseUp(getCell(20, 15));

      await keyDown('control/meta');

      await mouseDown(getCell(1, 1));
      await mouseOver(getCell(19, 16));
      await mouseUp(getCell(19, 16));

      await mouseDown(getCell(2, 2));
      await mouseOver(getCell(18, 17));
      await mouseUp(getCell(18, 17));

      await mouseDown(getCell(3, 3));
      await mouseOver(getCell(17, 18));
      await mouseUp(getCell(17, 18));

      await mouseDown(getCell(4, 4));
      await mouseOver(getCell(16, 19));
      await mouseUp(getCell(16, 19));

      await mouseDown(getCell(5, 5));
      await mouseOver(getCell(15, 20));
      await mouseUp(getCell(15, 20));

      await mouseDown(getCell(6, 6));
      await mouseOver(getCell(14, 21));
      await mouseUp(getCell(14, 21));

      await mouseDown(getCell(7, 7));
      await mouseOver(getCell(13, 22));
      await mouseUp(getCell(13, 22));

      await mouseDown(getCell(8, 8));
      await mouseOver(getCell(12, 23));
      await mouseUp(getCell(12, 23));

      await mouseDown(getCell(9, 9));
      await mouseOver(getCell(11, 24));
      await mouseUp(getCell(11, 24));

      await mouseDown(getCell(10, 10));
      await mouseOver(getCell(10, 25));
      await mouseUp(getCell(10, 25));

      await keyUp('control/meta');

      /* eslint-disable max-len */
      expect(`
        |   ║ - : - : - : - : - : - : - : - : - : - : - : - : - : - : - : - : - : - : - : - : - : - : - : - : - : - :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===|
        | - ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   :   :   :   :   :   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 0 :   :   :   :   :   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 1 : 0 :   :   :   :   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 2 : 1 : 0 :   :   :   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 5 : 5 : 5 : 5 : 5 : 5 : 5 : 5 : 5 : 5 : 5 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 5 : 6 : 6 : 6 : 6 : 6 : 6 : 6 : 6 : 6 : 6 : 5 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 5 : 6 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 6 : 5 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 5 : 6 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 6 : 5 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 5 : 6 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 6 : 5 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 5 : 6 : 7 : 7 : 7 : H : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 6 : 5 : 4 : 3 : 2 : 1 : 0 :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 5 : 6 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 6 : 5 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 5 : 6 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 6 : 5 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 5 : 6 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 6 : 5 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 5 : 6 : 6 : 6 : 6 : 6 : 6 : 6 : 6 : 6 : 6 : 5 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 5 : 5 : 5 : 5 : 5 : 5 : 5 : 5 : 5 : 5 : 5 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 2 : 1 : 0 :   :   :   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 1 : 0 :   :   :   :   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 0 :   :   :   :   :   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   :   :   :   :   :   :   :   :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      /* eslint-enable max-len */
    });

    it('should call afterSelection and afterSelectionEnd hooks with proper arguments', async() => {
      const hooks = jasmine.createSpyObj('hooks', ['afterSelection', 'afterSelectionEnd']);

      handsontable({
        startRows: 21,
        startCols: 30,
        selectionMode: 'multiple',
        afterSelection: hooks.afterSelection,
        afterSelectionEnd: hooks.afterSelectionEnd,
      });

      await mouseDown(getCell(0, 0));
      await mouseOver(getCell(20, 15));
      await mouseUp(getCell(20, 15));

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([0, 0, 0, 0, jasmine.any(Object), 0]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([0, 0, 20, 15, jasmine.any(Object), 0]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([0, 0, 20, 15, 0]);

      await keyDown('control/meta');
      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      await mouseDown(getCell(1, 1));
      await mouseOver(getCell(19, 16));
      await mouseUp(getCell(19, 16));

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([1, 1, 1, 1, jasmine.any(Object), 1]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([1, 1, 19, 16, jasmine.any(Object), 1]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([1, 1, 19, 16, 1]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      await mouseDown(getCell(2, 2));
      await mouseOver(getCell(18, 17));
      await mouseUp(getCell(18, 17));

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([2, 2, 2, 2, jasmine.any(Object), 2]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([2, 2, 18, 17, jasmine.any(Object), 2]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([2, 2, 18, 17, 2]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      await mouseDown(getCell(3, 3));
      await mouseOver(getCell(17, 18));
      await mouseUp(getCell(17, 18));

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([3, 3, 3, 3, jasmine.any(Object), 3]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([3, 3, 17, 18, jasmine.any(Object), 3]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([3, 3, 17, 18, 3]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      await mouseDown(getCell(4, 4));
      await mouseOver(getCell(16, 19));
      await mouseUp(getCell(16, 19));

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([4, 4, 4, 4, jasmine.any(Object), 4]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([4, 4, 16, 19, jasmine.any(Object), 4]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([4, 4, 16, 19, 4]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      await mouseDown(getCell(5, 5));
      await mouseOver(getCell(15, 20));
      await mouseUp(getCell(15, 20));

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([5, 5, 5, 5, jasmine.any(Object), 5]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([5, 5, 15, 20, jasmine.any(Object), 5]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([5, 5, 15, 20, 5]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      await mouseDown(getCell(6, 6));
      await mouseOver(getCell(14, 21));
      await mouseUp(getCell(14, 21));

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([6, 6, 6, 6, jasmine.any(Object), 6]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([6, 6, 14, 21, jasmine.any(Object), 6]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([6, 6, 14, 21, 6]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      await mouseDown(getCell(7, 7));
      await mouseOver(getCell(13, 22));
      await mouseUp(getCell(13, 22));

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([7, 7, 7, 7, jasmine.any(Object), 7]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([7, 7, 13, 22, jasmine.any(Object), 7]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([7, 7, 13, 22, 7]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      await mouseDown(getCell(8, 8));
      await mouseOver(getCell(12, 23));
      await mouseUp(getCell(12, 23));

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([8, 8, 8, 8, jasmine.any(Object), 8]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([8, 8, 12, 23, jasmine.any(Object), 8]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([8, 8, 12, 23, 8]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      await mouseDown(getCell(9, 9));
      await mouseOver(getCell(11, 24));
      await mouseUp(getCell(11, 24));

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([9, 9, 9, 9, jasmine.any(Object), 9]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([9, 9, 11, 24, jasmine.any(Object), 9]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([9, 9, 11, 24, 9]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      await mouseDown(getCell(10, 10));
      await mouseOver(getCell(10, 25));
      await mouseUp(getCell(10, 25));

      await keyUp('control/meta');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([10, 10, 10, 10, jasmine.any(Object), 10]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([10, 10, 10, 25, jasmine.any(Object), 10]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([10, 10, 10, 25, 10]);
    });

    it('should call afterSelectionByProp and afterSelectionEndByProp hooks with proper arguments', async() => {
      const hooks = jasmine.createSpyObj('hooks', ['afterSelection', 'afterSelectionEnd']);

      handsontable({
        data: createSpreadsheetObjectData(21, 30),
        selectionMode: 'multiple',
        afterSelectionByProp: hooks.afterSelection,
        afterSelectionEndByProp: hooks.afterSelectionEnd,
      });

      await mouseDown(getCell(0, 0));
      await mouseOver(getCell(20, 15));
      await mouseUp(getCell(20, 15));

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([0, 'prop0', 0, 'prop0', jasmine.any(Object), 0]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([0, 'prop0', 20, 'prop15', jasmine.any(Object), 0]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([0, 'prop0', 20, 'prop15', 0]);

      await keyDown('control/meta');
      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      await mouseDown(getCell(1, 1));
      await mouseOver(getCell(19, 16));
      await mouseUp(getCell(19, 16));

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([1, 'prop1', 1, 'prop1', jasmine.any(Object), 1]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([1, 'prop1', 19, 'prop16', jasmine.any(Object), 1]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([1, 'prop1', 19, 'prop16', 1]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      await mouseDown(getCell(2, 2));
      await mouseOver(getCell(18, 17));
      await mouseUp(getCell(18, 17));

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([2, 'prop2', 2, 'prop2', jasmine.any(Object), 2]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([2, 'prop2', 18, 'prop17', jasmine.any(Object), 2]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([2, 'prop2', 18, 'prop17', 2]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      await mouseDown(getCell(3, 3));
      await mouseOver(getCell(17, 18));
      await mouseUp(getCell(17, 18));

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([3, 'prop3', 3, 'prop3', jasmine.any(Object), 3]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([3, 'prop3', 17, 'prop18', jasmine.any(Object), 3]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([3, 'prop3', 17, 'prop18', 3]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      await mouseDown(getCell(4, 4));
      await mouseOver(getCell(16, 19));
      await mouseUp(getCell(16, 19));

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([4, 'prop4', 4, 'prop4', jasmine.any(Object), 4]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([4, 'prop4', 16, 'prop19', jasmine.any(Object), 4]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([4, 'prop4', 16, 'prop19', 4]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      await mouseDown(getCell(5, 5));
      await mouseOver(getCell(15, 20));
      await mouseUp(getCell(15, 20));

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([5, 'prop5', 5, 'prop5', jasmine.any(Object), 5]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([5, 'prop5', 15, 'prop20', jasmine.any(Object), 5]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([5, 'prop5', 15, 'prop20', 5]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      await mouseDown(getCell(6, 6));
      await mouseOver(getCell(14, 21));
      await mouseUp(getCell(14, 21));

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([6, 'prop6', 6, 'prop6', jasmine.any(Object), 6]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([6, 'prop6', 14, 'prop21', jasmine.any(Object), 6]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([6, 'prop6', 14, 'prop21', 6]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      await mouseDown(getCell(7, 7));
      await mouseOver(getCell(13, 22));
      await mouseUp(getCell(13, 22));

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([7, 'prop7', 7, 'prop7', jasmine.any(Object), 7]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([7, 'prop7', 13, 'prop22', jasmine.any(Object), 7]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([7, 'prop7', 13, 'prop22', 7]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      await mouseDown(getCell(8, 8));
      await mouseOver(getCell(12, 23));
      await mouseUp(getCell(12, 23));

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([8, 'prop8', 8, 'prop8', jasmine.any(Object), 8]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([8, 'prop8', 12, 'prop23', jasmine.any(Object), 8]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([8, 'prop8', 12, 'prop23', 8]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      await mouseDown(getCell(9, 9));
      await mouseOver(getCell(11, 24));
      await mouseUp(getCell(11, 24));

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([9, 'prop9', 9, 'prop9', jasmine.any(Object), 9]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([9, 'prop9', 11, 'prop24', jasmine.any(Object), 9]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([9, 'prop9', 11, 'prop24', 9]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      await mouseDown(getCell(10, 10));
      await mouseOver(getCell(10, 25));
      await mouseUp(getCell(10, 25));

      await keyUp('control/meta');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([10, 'prop10', 10, 'prop10', jasmine.any(Object), 10]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([10, 'prop10', 10, 'prop25', jasmine.any(Object), 10]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([10, 'prop10', 10, 'prop25', 10]);
    });
  });

  describe('alter the table', () => {
    it('should transform the selection down by amount of added rows when they added before the last selection', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 10,
        startCols: 10
      });

      await selectCells([[2, 2, 5, 5], [6, 1], [3, 3, 6, 6], [8, 0]]);
      await alter('insert_row_above', 1, 3);

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 2,2 from: 2,2 to: 5,5',
        'highlight: 6,1 from: 6,1 to: 6,1',
        'highlight: 3,3 from: 3,3 to: 6,6',
        'highlight: 11,0 from: 11,0 to: 11,0',
      ]);
      // By design only last selection is interactive.
      expect(`
        |   ║ - : - : - : - : - : - : - :   :   :   |
        |===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        | - ║   :   : 0 : 0 : 0 : 0 :   :   :   :   |
        | - ║   :   : 0 : 1 : 1 : 1 : 0 :   :   :   |
        | - ║   :   : 0 : 1 : 1 : 1 : 0 :   :   :   |
        | - ║   :   : 0 : 1 : 1 : 1 : 0 :   :   :   |
        | - ║   : 0 :   : 0 : 0 : 0 : 0 :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        | - ║ A :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should transform the selection down without changing the selection origin direction', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 7,
        startCols: 7
      });

      await selectCells([[5, 3, 4, 1]]);
      await alter('insert_row_above', 1, 2);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 7,3 from: 7,3 to: 6,1']);
      expect(`
        |   ║   : - : - : - :   :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   |
        | - ║   : 0 : 0 : 0 :   :   :   |
        | - ║   : 0 : 0 : A :   :   :   |
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should transform the selection down without changing the origin focus position', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 7,
        startCols: 7
      });

      await selectCells([[5, 3, 3, 1]]);
      selection().setRangeFocus(cellCoords(4, 2));
      await alter('insert_row_above', 1, 2);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 6,2 from: 7,3 to: 5,1']);
      expect(`
        |   ║   : - : - : - :   :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   |
        | - ║   : 0 : 0 : 0 :   :   :   |
        | - ║   : 0 : A : 0 :   :   :   |
        | - ║   : 0 : 0 : 0 :   :   :   |
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should transform the header selection down by amount of added rows when they added before the selection', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 7,
        startCols: 10
      });

      await selectRows(3, 5);
      await alter('insert_row_above', 1, 3);

      expect(selection().isSelectedByRowHeader()).toBe(true);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 6,0 from: 6,-1 to: 8,9']);
      expect(`
        |   ║ - : - : - : - : - : - : - : - : - : - |
        |===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        | * ║ A : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should not transform the selection down by amount of added rows when they added after the last selection', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 10,
        startCols: 10
      });

      await selectCells([[2, 2, 5, 5], [6, 1], [3, 3, 6, 6], [8, 0]]);
      await alter('insert_row_above', 9, 3);

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 2,2 from: 2,2 to: 5,5',
        'highlight: 6,1 from: 6,1 to: 6,1',
        'highlight: 3,3 from: 3,3 to: 6,6',
        'highlight: 8,0 from: 8,0 to: 8,0',
      ]);
      expect(`
        |   ║ - : - : - : - : - : - : - :   :   :   |
        |===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        | - ║   :   : 0 : 0 : 0 : 0 :   :   :   :   |
        | - ║   :   : 0 : 1 : 1 : 1 : 0 :   :   :   |
        | - ║   :   : 0 : 1 : 1 : 1 : 0 :   :   :   |
        | - ║   :   : 0 : 1 : 1 : 1 : 0 :   :   :   |
        | - ║   : 0 :   : 0 : 0 : 0 : 0 :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        | - ║ A :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should not transform the header selection down by amount of added rows when they added after the selection', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 10,
        startCols: 10
      });

      await selectRows(3, 5);
      await alter('insert_row_above', 5, 3);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,-1 to: 5,9']);
      expect(`
        |   ║ - : - : - : - : - : - : - : - : - : - |
        |===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        | * ║ A : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should transform the selection right by amount of added columns when they added before the last selection', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 10,
        startCols: 10
      });

      await selectCells([[2, 2, 5, 5], [6, 1], [3, 3, 6, 6], [8, 5]]);
      await alter('insert_col_start', 1, 3);

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 2,2 from: 2,2 to: 5,5',
        'highlight: 6,1 from: 6,1 to: 6,1',
        'highlight: 3,3 from: 3,3 to: 6,6',
        'highlight: 8,8 from: 8,8 to: 8,8',
      ]);
      // By design only last selection is interactive.
      expect(`
        |   ║   : - : - : - : - : - : - :   : - :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   :   :   :   |
        | - ║   :   : 0 : 0 : 0 : 0 :   :   :   :   :   :   :   |
        | - ║   :   : 0 : 1 : 1 : 1 : 0 :   :   :   :   :   :   |
        | - ║   :   : 0 : 1 : 1 : 1 : 0 :   :   :   :   :   :   |
        | - ║   :   : 0 : 1 : 1 : 1 : 0 :   :   :   :   :   :   |
        | - ║   : 0 :   : 0 : 0 : 0 : 0 :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   :   :   :   |
        | - ║   :   :   :   :   :   :   :   : A :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should transform the selection right without changing the selection origin direction', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 7,
        startCols: 7
      });

      await selectCells([[1, 5, 5, 4]]);
      await alter('insert_col_start', 1, 2);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,7 from: 1,7 to: 5,6']);
      expect(`
        |   ║   :   :   :   :   :   : - : - :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   |
        | - ║   :   :   :   :   :   : 0 : A :   |
        | - ║   :   :   :   :   :   : 0 : 0 :   |
        | - ║   :   :   :   :   :   : 0 : 0 :   |
        | - ║   :   :   :   :   :   : 0 : 0 :   |
        | - ║   :   :   :   :   :   : 0 : 0 :   |
        |   ║   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should transform the selection down without changing the origin focus position', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 7,
        startCols: 7
      });

      await selectCells([[1, 5, 5, 4]]);
      selection().setRangeFocus(cellCoords(3, 5));
      await alter('insert_col_start', 1, 2);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,7 from: 1,7 to: 5,6']);
      expect(`
        |   ║   :   :   :   :   :   : - : - :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   |
        | - ║   :   :   :   :   :   : 0 : 0 :   |
        | - ║   :   :   :   :   :   : 0 : 0 :   |
        | - ║   :   :   :   :   :   : 0 : A :   |
        | - ║   :   :   :   :   :   : 0 : 0 :   |
        | - ║   :   :   :   :   :   : 0 : 0 :   |
        |   ║   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should transform the header selection right by amount of added columns when they added before the selection', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 10,
        startCols: 10
      });

      await selectColumns(3, 5);
      await alter('insert_col_start', 1, 3);

      expect(selection().isSelectedByColumnHeader()).toBe(true);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,6 from: -1,6 to: 9,8']);
      expect(`
        |   ║   :   :   :   :   :   : * : * : * :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===:===:===:===:===|
        | - ║   :   :   :   :   :   : A : 0 : 0 :   :   :   :   |
        | - ║   :   :   :   :   :   : 0 : 0 : 0 :   :   :   :   |
        | - ║   :   :   :   :   :   : 0 : 0 : 0 :   :   :   :   |
        | - ║   :   :   :   :   :   : 0 : 0 : 0 :   :   :   :   |
        | - ║   :   :   :   :   :   : 0 : 0 : 0 :   :   :   :   |
        | - ║   :   :   :   :   :   : 0 : 0 : 0 :   :   :   :   |
        | - ║   :   :   :   :   :   : 0 : 0 : 0 :   :   :   :   |
        | - ║   :   :   :   :   :   : 0 : 0 : 0 :   :   :   :   |
        | - ║   :   :   :   :   :   : 0 : 0 : 0 :   :   :   :   |
        | - ║   :   :   :   :   :   : 0 : 0 : 0 :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should not transform the selection right by amount of added columns when they added after the last selection', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 10,
        startCols: 10
      });

      await selectCells([[2, 2, 5, 5], [6, 1], [3, 3, 6, 6], [8, 5]]);
      await alter('insert_col_start', 6, 3);

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 2,2 from: 2,2 to: 5,5',
        'highlight: 6,1 from: 6,1 to: 6,1',
        'highlight: 3,3 from: 3,3 to: 6,6',
        'highlight: 8,5 from: 8,5 to: 8,5',
      ]);
      expect(`
        |   ║   : - : - : - : - : - : - :   :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   :   :   :   |
        | - ║   :   : 0 : 0 : 0 : 0 :   :   :   :   :   :   :   |
        | - ║   :   : 0 : 1 : 1 : 1 : 0 :   :   :   :   :   :   |
        | - ║   :   : 0 : 1 : 1 : 1 : 0 :   :   :   :   :   :   |
        | - ║   :   : 0 : 1 : 1 : 1 : 0 :   :   :   :   :   :   |
        | - ║   : 0 :   : 0 : 0 : 0 : 0 :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   :   :   :   |
        | - ║   :   :   :   :   : A :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should not transform the header selection right by amount of added columns when they added after the selection', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 10,
        startCols: 10
      });

      await selectColumns(3, 5);
      await alter('insert_col_start', 5, 3);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: -1,3 to: 9,5']);
      expect(`
        |   ║   :   :   : * : * : * :   :   :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===:===:===:===:===|
        | - ║   :   :   : A : 0 : 0 :   :   :   :   :   :   :   |
        | - ║   :   :   : 0 : 0 : 0 :   :   :   :   :   :   :   |
        | - ║   :   :   : 0 : 0 : 0 :   :   :   :   :   :   :   |
        | - ║   :   :   : 0 : 0 : 0 :   :   :   :   :   :   :   |
        | - ║   :   :   : 0 : 0 : 0 :   :   :   :   :   :   :   |
        | - ║   :   :   : 0 : 0 : 0 :   :   :   :   :   :   :   |
        | - ║   :   :   : 0 : 0 : 0 :   :   :   :   :   :   :   |
        | - ║   :   :   : 0 : 0 : 0 :   :   :   :   :   :   :   |
        | - ║   :   :   : 0 : 0 : 0 :   :   :   :   :   :   :   |
        | - ║   :   :   : 0 : 0 : 0 :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should transform removed last column header selection to the last visible column', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 3,
        startCols: 5,
      });

      await selectColumns(4, 4);
      await alter('remove_col', 4);

      expect(selection().isSelectedByColumnHeader()).toBe(true);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: -1,3 to: 2,3']);
      expect(`
        |   ║   :   :   : * |
        |===:===:===:===:===|
        | - ║   :   :   : A |
        | - ║   :   :   : 0 |
        | - ║   :   :   : 0 |
      `).toBeMatchToSelectionPattern();

      await loadData([[1, 2, 3], [1, 2, 3], [1, 2, 3]]);

      expect(selection().isSelectedByColumnHeader()).toBe(true);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 2,2']);
      expect(`
        |   ║   :   : * |
        |===:===:===:===|
        | - ║   :   : A |
        | - ║   :   : 0 |
        | - ║   :   : 0 |
      `).toBeMatchToSelectionPattern();
    });

    it('should transform removed last column selection to the last visible column', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 3,
        startCols: 5,
      });

      await selectCells([[1, 4, 0, 4]]);
      await alter('remove_col', 4);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 0,3']);
      expect(`
        |   ║   :   :   : - |
        |===:===:===:===:===|
        | - ║   :   :   : 0 |
        | - ║   :   :   : A |
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await loadData([[1, 2, 3], [1, 2, 3], [1, 2, 3]]);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 0,2']);
      expect(`
        |   ║   :   : - |
        |===:===:===:===|
        | - ║   :   : 0 |
        | - ║   :   : A |
        |   ║   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should transform removed last row header selection to the last visible row', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 3,
      });

      await selectRows(4, 4);
      await alter('remove_row', 4);

      expect(selection().isSelectedByRowHeader()).toBe(true);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,-1 to: 3,2']);
      expect(`
        |   ║ - : - : - |
        |===:===:===:===|
        |   ║   :   :   |
        |   ║   :   :   |
        |   ║   :   :   |
        | * ║ A : 0 : 0 |
      `).toBeMatchToSelectionPattern();

      await loadData([[1, 2, 3], [1, 2, 3], [1, 2, 3]]);

      expect(selection().isSelectedByRowHeader()).toBe(true);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,-1 to: 2,2']);
      expect(`
        |   ║ - : - : - |
        |===:===:===:===|
        |   ║   :   :   |
        |   ║   :   :   |
        | * ║ A : 0 : 0 |
      `).toBeMatchToSelectionPattern();
    });

    it('should transform removed last row selection to the last visible row', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 3,
      });

      await selectCells([[4, 1, 4, 0]]);
      await alter('remove_row', 4);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,1 from: 3,1 to: 3,0']);
      expect(`
        |   ║ - : - :   |
        |===:===:===:===|
        |   ║   :   :   |
        |   ║   :   :   |
        |   ║   :   :   |
        | - ║ 0 : A :   |
      `).toBeMatchToSelectionPattern();

      await loadData([[1, 2, 3], [1, 2, 3], [1, 2, 3]]);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 2,1 to: 2,0']);
      expect(`
        |   ║ - : - :   |
        |===:===:===:===|
        |   ║   :   :   |
        |   ║   :   :   |
        | - ║ 0 : A :   |
      `).toBeMatchToSelectionPattern();
    });
  });

  it('should select cells properly while using non-consecutive selection for two instances', async() => {
    const hot1 = handsontable({});
    const container2 = $(`<div id="${id}2" style="width: 300px; height: 200px; overflow: auto"></div>`)
      .appendTo('body');
    const hot2 = container2.handsontable().handsontable('getInstance');

    hot1.selectCell(0, 0);

    await keyDown('control/meta');

    await mouseDown(hot1.getCell(0, 1));
    await mouseOver(hot1.getCell(0, 1));
    await mouseUp(hot1.getCell(0, 1));

    await mouseDown(hot1.getCell(0, 2));
    await mouseOver(hot1.getCell(0, 2));
    await mouseUp(hot1.getCell(0, 2));

    await mouseDown(hot2.getCell(0, 0));
    await mouseOver(hot2.getCell(0, 0));
    await mouseUp(hot2.getCell(0, 0));

    await mouseDown(hot2.getCell(0, 1));
    await mouseOver(hot2.getCell(0, 1));
    await mouseUp(hot2.getCell(0, 1));

    await keyUp('control/meta');

    expect(hot1.getSelected()).toBe(undefined);
    expect(hot2.getSelected()).toEqual([[0, 0, 0, 0], [0, 1, 0, 1]]);

    await keyDown('control/meta');

    await mouseDown(hot1.getCell(0, 0));
    await mouseOver(hot1.getCell(0, 0));
    await mouseUp(hot1.getCell(0, 0));

    await mouseDown(hot1.getCell(0, 1));
    await mouseOver(hot1.getCell(0, 1));
    await mouseUp(hot1.getCell(0, 1));

    expect(hot1.getSelected()).toEqual([[0, 0, 0, 0], [0, 1, 0, 1]]);
    expect(hot2.getSelected()).toBe(undefined);

    await keyUp('control/meta');

    hot2.destroy();
    container2.remove();
  });

  describe('running in iframe', () => {
    beforeEach(function() {
      this.$iframe = $('<iframe width="300px" height="300px"/>').appendTo(this.$container);

      const doc = this.$iframe[0].contentDocument;

      doc.open('text/html', 'replace');
      doc.write(`
        <!doctype html>
        <head>
          <link type="text/css" rel="stylesheet" href="../dist/handsontable.css">
        </head>`);
      doc.close();

      this.$iframeContainer = $('<div/>').appendTo(doc.body);
    });

    afterEach(function() {
      this.$iframeContainer.handsontable('destroy');
      this.$iframe.remove();
    });

    it('should add `current` css class to selected cell', async() => {
      const iframeHot = spec().$iframeContainer.handsontable().handsontable('getInstance');

      iframeHot.selectCell(1, 1);

      expect(iframeHot.getCell(1, 1).classList.contains('current')).toBeTrue();
    });

    it('should set correct `wtBorder` top position of selected cell', async() => {
      const iframeHot = spec().$iframeContainer.handsontable().handsontable('getInstance');

      iframeHot.selectCell(1, 1);

      await sleep(100);

      expect(spec().$iframeContainer.find('.wtBorder.current')[0].style.top).toEqual('23px');
    });
  });
});

describe('Core_view', () => {
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

  it('should focus cell after viewport is scrolled using down arrow', async() => {
    spec().$container[0].style.width = '400px';
    spec().$container[0].style.height = '60px';

    handsontable({
      startRows: 20
    });

    await selectCell(0, 0);
    await keyDownUp('arrowdown');
    await keyDownUp('arrowdown');
    await keyDownUp('arrowdown');
    await keyDownUp('arrowdown');

    expect(getSelected()).toEqual([[4, 0, 4, 0]]);

    await keyDownUp('enter');

    expect(isEditorVisible()).toEqual(true);
  });

  it('should scroll viewport if selected cell is out of the viewport and renderAllRows is enabled', async() => {
    spec().$container[0].style.width = '400px';
    spec().$container[0].style.height = '50px';
    spec().$container[0].style.overflow = 'hidden';

    handsontable({
      startRows: 20,
      renderAllRows: true,
    });

    await selectCell(0, 0);

    const scrollableElement = tableView()._wt.wtOverlays.topOverlay.mainTableScrollableElement;
    const initialScrollTop = scrollableElement.scrollTop;

    await keyDownUp('arrowdown');
    await keyDownUp('arrowdown');
    await keyDownUp('arrowdown');
    await keyDownUp('arrowdown');

    expect(scrollableElement.scrollTop).toBeGreaterThan(initialScrollTop);
  });

  it('should not render "undefined" class name', async() => {
    spec().$container[0].style.width = '501px';
    spec().$container[0].style.height = '100px';
    spec().$container[0].style.overflow = 'hidden';

    handsontable({
      startRows: 10,
      startCols: 5,
      colWidths: [47, 47, 47, 47, 47],
      rowHeaders: true,
      colHeaders: true,
    });

    await selectCell(0, 0);

    expect(spec().$container.find('.undefined').length).toBe(0);
  });

  it('should properly calculate dimensions of the table if a container has border', async() => {
    spec().$container[0].style.width = '250px';
    spec().$container[0].style.height = '200px';
    spec().$container[0].style.overflow = 'hidden';
    spec().$container[0].style.border = '10px solid #000';

    handsontable({
      startRows: 10,
      startCols: 10,
      colWidths: 50,
      rowHeights: 50,
      rowHeaders: true,
      colHeaders: true,
    });

    const scrollbarSize = tableView()._wt.wtOverlays.scrollbarSize;
    const {
      scrollWidth: masterScrollWidth,
      scrollHeight: masterScrollHeight
    } = spec().$container.find('.ht_master')[0];
    const topScrollWidth = spec().$container.find('.ht_clone_top')[0].scrollWidth;
    const leftScrollHeight = spec().$container.find('.ht_clone_inline_start')[0].scrollHeight;

    expect(masterScrollWidth).toBe(250);
    expect(masterScrollHeight).toBe(200);
    expect(masterScrollWidth - scrollbarSize).toBe(topScrollWidth);
    expect(masterScrollHeight - scrollbarSize).toBe(leftScrollHeight);
  });

  it('should scroll viewport when partially visible cell is clicked', async() => {
    spec().$container[0].style.width = '400px';
    spec().$container[0].style.height = '60px';

    const hot = handsontable({
      data: createSpreadsheetData(10, 3),
      height: 60
    });

    const htCore = getHtCore();
    const scrollTop = hot.rootElement.querySelector('.wtHolder').scrollTop;

    expect(scrollTop).toBe(0);
    expect(spec().$container.height()).toEqual(60);
    expect(spec().$container.find('.wtHolder .wtHider').height()).toBeGreaterThan(60);

    expect(htCore.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');
    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A2');
    expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');

    htCore.find('tr:eq(3) td:eq(0)').simulate('mousedown');

    expect(hot.rootElement.querySelector('.wtHolder').scrollTop).toBeGreaterThan(scrollTop);
    expect(getSelected()).toEqual([[3, 0, 3, 0]]);
  });

  it('should scroll viewport, respecting fixed rows', async() => {
    spec().$container[0].style.width = '400px';
    spec().$container[0].style.height = '60px';

    const hot = handsontable({
      data: createSpreadsheetData(10, 9),
      fixedRowsTop: 1,
      height: 60
    });

    const htCore = getHtCore();
    const scrollTop = hot.rootElement.querySelector('.wtHolder').scrollTop;

    expect(scrollTop).toBe(0);
    expect(htCore.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');
    expect(htCore.find('tr:eq(0) td:eq(1)').html()).toEqual('B1');
    expect(htCore.find('tr:eq(0) td:eq(2)').html()).toEqual('C1');

    await selectCell(0, 0);
    await keyDownUp('arrowdown');
    await keyDownUp('arrowdown');
    await keyDownUp('arrowdown');
    await keyDownUp('arrowdown');

    expect(hot.rootElement.querySelector('.wtHolder').scrollTop).toBeGreaterThan(scrollTop);
  });

  it('should enable to change fixedRowsTop with updateSettings', async() => {
    spec().$container[0].style.width = '400px';
    spec().$container[0].style.height = '60px';

    handsontable({
      data: createSpreadsheetData(10, 9),
      fixedRowsTop: 1,
      width: 200,
      height: 100
    });

    await selectCell(0, 0);

    const htCore = getHtCore();
    const topClone = getTopClone();

    expect(topClone.find('tr').length).toEqual(1);
    expect(topClone.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');

    expect(htCore.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');
    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A2');
    expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');
    expect(htCore.find('tr:eq(3) td:eq(0)').html()).toEqual('A4');

    await keyDownUp('arrowdown');
    await keyDownUp('arrowdown');
    await keyDownUp('arrowdown');
    await keyDownUp('arrowdown');

    expect(topClone.find('tr').length).toEqual(1);
    expect(topClone.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');

    await updateSettings({
      fixedRowsTop: 2
    });

    expect(topClone.find('tr').length).toEqual(2);
    expect(topClone.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');
    expect(topClone.find('tr:eq(1) td:eq(0)').html()).toEqual('A2');

    expect(htCore.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');
    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A2');
    expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');
    expect(htCore.find('tr:eq(3) td:eq(0)').html()).toEqual('A4');
  });

  it('should scroll viewport, respecting fixed columns', async() => {
    spec().$container[0].style.width = '200px';
    spec().$container[0].style.height = '100px';

    handsontable({
      data: createSpreadsheetData(10, 9),
      fixedColumnsStart: 1
    });

    const htCore = getHtCore();
    const leftClone = spec().$container.find('.ht_clone_inline_start');

    expect(leftClone.find('tr:eq(0) td').length).toEqual(1);
    expect(leftClone.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');
    expect(leftClone.find('tr:eq(1) td:eq(0)').html()).toEqual('A2');
    expect(leftClone.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');

    expect(htCore.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');
    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A2');
    expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');

    await selectCell(0, 3);
    await keyDownUp('arrowright');
    await keyDownUp('arrowright');
    await keyDownUp('arrowright');
    await keyDownUp('arrowright');

    expect(leftClone.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');
    expect(leftClone.find('tr:eq(1) td:eq(0)').html()).toEqual('A2');
    expect(leftClone.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');
  });

  it('should enable to change fixedColumnsStart with updateSettings', async() => {
    spec().$container[0].style.width = '200px';
    spec().$container[0].style.height = '100px';

    handsontable({
      data: createSpreadsheetData(10, 9),
      fixedColumnsStart: 1
    });

    await selectCell(0, 0);

    const leftClone = spec().$container.find('.ht_clone_inline_start');

    expect(leftClone.find('tr:eq(0) td').length).toEqual(1);
    expect(leftClone.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');
    expect(leftClone.find('tr:eq(1) td:eq(0)').html()).toEqual('A2');
    expect(leftClone.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');

    await keyDownUp('arrowright');
    await keyDownUp('arrowright');
    await keyDownUp('arrowright');
    await keyDownUp('arrowright');

    expect(leftClone.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');
    expect(leftClone.find('tr:eq(1) td:eq(0)').html()).toEqual('A2');
    expect(leftClone.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');

    await selectCell(0, 0);

    await updateSettings({
      fixedColumnsStart: 2
    });

    expect(leftClone.find('tr:eq(0) td').length).toEqual(2);
    expect(leftClone.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');
    expect(leftClone.find('tr:eq(0) td:eq(1)').html()).toEqual('B1');
    expect(leftClone.find('tr:eq(1) td:eq(0)').html()).toEqual('A2');
    expect(leftClone.find('tr:eq(1) td:eq(1)').html()).toEqual('B2');
    expect(leftClone.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');
    expect(leftClone.find('tr:eq(2) td:eq(1)').html()).toEqual('B3');
  });

  it('should scroll the viewport horizontally from the column header navigation', async() => {
    handsontable({
      data: createSpreadsheetData(10, 50),
      width: 200,
      height: 200,
      colHeaders: true,
      rowHeaders: true,
      navigableHeaders: true,
    });

    const htCore = getHtCore();

    await selectCell(-1, 10);
    await keyDownUp('arrowleft');
    await keyDownUp('arrowleft');
    await keyDownUp('arrowleft');
    await keyDownUp('arrowleft');
    await keyDownUp('arrowleft');
    await keyDownUp('arrowleft');

    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('D1');
    expect(htCore.find('tr:eq(1) td:eq(1)').html()).toEqual('E1');
    expect(htCore.find('tr:eq(1) td:eq(2)').html()).toEqual('F1');
  });

  it('should scroll the viewport to the first column when the highlight moves to cell from the row header', async() => {
    handsontable({
      data: createSpreadsheetData(10, 50),
      width: 200,
      height: 200,
      colHeaders: true,
      rowHeaders: true,
      navigableHeaders: true,
    });

    const htCore = getHtCore();

    await selectCell(1, 40);
    await selectCell(1, -1);

    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('AH1');

    await keyDownUp('arrowright');

    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A1');
  });

  it('should scroll the viewport to the first column when the highlight moves to column header from the corner', async() => {
    handsontable({
      data: createSpreadsheetData(10, 50),
      width: 200,
      height: 200,
      colHeaders: true,
      rowHeaders: true,
      navigableHeaders: true,
    });

    const htCore = getHtCore();

    await selectCell(1, 40);
    await selectCell(-1, -1);

    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('AH1');

    await keyDownUp('arrowright');

    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A1');
  });

  it.forTheme('classic')('should scroll the viewport vertically from the row header navigation', async() => {
    handsontable({
      data: createSpreadsheetData(50, 10),
      width: 200,
      height: 200,
      colHeaders: true,
      rowHeaders: true,
      navigableHeaders: true,
    });

    const htCore = getHtCore();

    await selectCell(10, -1);
    await keyDownUp('arrowup');
    await keyDownUp('arrowup');
    await keyDownUp('arrowup');
    await keyDownUp('arrowup');
    await keyDownUp('arrowup');
    await keyDownUp('arrowup');
    await keyDownUp('arrowup');
    await keyDownUp('arrowup');

    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A2');
    expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');
    expect(htCore.find('tr:eq(3) td:eq(0)').html()).toEqual('A4');
  });

  it.forTheme('main')('should scroll the viewport vertically from the row header navigation', async() => {
    handsontable({
      data: createSpreadsheetData(50, 10),
      width: 200,
      height: 240,
      colHeaders: true,
      rowHeaders: true,
      navigableHeaders: true,
    });

    const htCore = getHtCore();

    await selectCell(10, -1);
    await keyDownUp('arrowup');
    await keyDownUp('arrowup');
    await keyDownUp('arrowup');
    await keyDownUp('arrowup');
    await keyDownUp('arrowup');
    await keyDownUp('arrowup');
    await keyDownUp('arrowup');
    await keyDownUp('arrowup');

    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A2');
    expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');
    expect(htCore.find('tr:eq(3) td:eq(0)').html()).toEqual('A4');
  });

  it.forTheme('horizon')('should scroll the viewport vertically from the row header navigation', async() => {
    handsontable({
      data: createSpreadsheetData(50, 10),
      width: 200,
      height: 306,
      colHeaders: true,
      rowHeaders: true,
      navigableHeaders: true,
    });

    const htCore = getHtCore();

    await selectCell(10, -1);
    await keyDownUp('arrowup');
    await keyDownUp('arrowup');
    await keyDownUp('arrowup');
    await keyDownUp('arrowup');
    await keyDownUp('arrowup');
    await keyDownUp('arrowup');
    await keyDownUp('arrowup');
    await keyDownUp('arrowup');

    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A2');
    expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');
    expect(htCore.find('tr:eq(3) td:eq(0)').html()).toEqual('A4');
  });

  it.forTheme('classic')('should scroll the viewport to the first row when the highlight moves ' +
    'down to the cell from the column header', async() => {
    handsontable({
      data: createSpreadsheetData(50, 10),
      width: 200,
      height: 200,
      colHeaders: true,
      rowHeaders: true,
      navigableHeaders: true,
    });

    const htCore = getHtCore();

    await selectCell(40, 1);
    await selectCell(-1, 1);

    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A25');

    await keyDownUp('arrowdown');

    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A1');
  });

  it.forTheme('main')('should scroll the viewport to the first row when the highlight moves ' +
    'down to the cell from the column header', async() => {
    handsontable({
      data: createSpreadsheetData(50, 10),
      width: 200,
      height: 240,
      colHeaders: true,
      rowHeaders: true,
      navigableHeaders: true,
    });

    const htCore = getHtCore();

    await selectCell(40, 1);
    await selectCell(-1, 1);

    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A25');

    await keyDownUp('arrowdown');

    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A1');
  });

  it.forTheme('horizon')('should scroll the viewport to the first row when the highlight moves ' +
    'down to the cell from the column header', async() => {
    handsontable({
      data: createSpreadsheetData(50, 10),
      width: 200,
      height: 306,
      colHeaders: true,
      rowHeaders: true,
      navigableHeaders: true,
    });

    const htCore = getHtCore();

    await selectCell(40, 1);
    await selectCell(-1, 1);

    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A25');

    await keyDownUp('arrowdown');

    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A1');
  });

  it.forTheme('classic')('should scroll the viewport to the first row when the highlight moves ' +
    'down to the row header from the corner', async() => {
    handsontable({
      data: createSpreadsheetData(50, 10),
      width: 200,
      height: 200,
      colHeaders: true,
      rowHeaders: true,
      navigableHeaders: true,
    });

    const htCore = getHtCore();

    await selectCell(40, 1);
    await selectCell(-1, -1);

    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A25');

    await keyDownUp('arrowdown');

    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A1');
  });

  it.forTheme('main')('should scroll the viewport to the first row when the highlight moves ' +
    'down to the row header from the corner', async() => {
    handsontable({
      data: createSpreadsheetData(50, 10),
      width: 200,
      height: 240,
      colHeaders: true,
      rowHeaders: true,
      navigableHeaders: true,
    });

    const htCore = getHtCore();

    await selectCell(40, 1);
    await selectCell(-1, -1);

    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A25');

    await keyDownUp('arrowdown');

    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A1');
  });

  it.forTheme('horizon')('should scroll the viewport to the first row when the highlight moves ' +
    'down to the row header from the corner', async() => {
    handsontable({
      data: createSpreadsheetData(50, 10),
      width: 200,
      height: 306,
      colHeaders: true,
      rowHeaders: true,
      navigableHeaders: true,
    });

    const htCore = getHtCore();

    await selectCell(40, 1);
    await selectCell(-1, -1);

    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A25');

    await keyDownUp('arrowdown');

    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A1');
  });

  it('should not scroll viewport when last cell is clicked', async() => {
    handsontable({
      startRows: 40
    });

    await scrollViewportVertically(10000);

    const lastScroll = $(window).scrollTop();

    await render(); // renders synchronously so we don't have to put stuff in waits/runs

    await selectCell(39, 0);

    expect($(window).scrollTop()).toEqual(lastScroll);

    await keyDownUp('arrowright');

    expect(getSelected()).toEqual([[39, 1, 39, 1]]);
    expect($(window).scrollTop()).toEqual(lastScroll);
  });

  it('should not shrink table when width and height is not specified for container', async() => {
    spec().$container[0].style.overflow = 'hidden';
    spec().$container.wrap('<div style="width: 50px;"></div>');
    handsontable({
      startRows: 10,
      startCols: 10
    });

    await sleep(250);

    const initHeight = spec().$container.height();

    await sleep(250);

    expect(spec().$container.height()).toEqual(initHeight);

    spec().$container.unwrap();
  });

  it.forTheme('classic')('should fire beforeViewRender event after table has been scrolled', async() => {
    spec().$container[0].style.width = '400px';
    spec().$container[0].style.height = '60px';
    spec().$container[0].style.overflow = 'hidden';

    handsontable({
      data: createSpreadsheetData(100, 3)
    });

    const beforeRenderCallback = jasmine.createSpy('beforeRenderCallback');

    await addHook('beforeViewRender', beforeRenderCallback);

    await scrollViewportVertically(1000);

    expect(beforeRenderCallback.calls.count()).toBe(1);
  });

  it.forTheme('main')('should fire beforeViewRender event after table has been scrolled', async() => {
    spec().$container[0].style.width = '400px';
    spec().$container[0].style.height = '60px';
    spec().$container[0].style.overflow = 'hidden';

    handsontable({
      data: createSpreadsheetData(100, 3)
    });

    const beforeRenderCallback = jasmine.createSpy('beforeRenderCallback');

    await addHook('beforeViewRender', beforeRenderCallback);

    await scrollViewportVertically(1000);

    expect(beforeRenderCallback.calls.count()).toBe(1);
  });

  it.forTheme('horizon')('should fire beforeViewRender event after table has been scrolled', async() => {
    spec().$container[0].style.width = '400px';
    spec().$container[0].style.height = '97px';
    spec().$container[0].style.overflow = 'hidden';

    handsontable({
      data: createSpreadsheetData(100, 3)
    });

    const beforeRenderCallback = jasmine.createSpy('beforeRenderCallback');

    await addHook('beforeViewRender', beforeRenderCallback);

    await scrollViewportVertically(1000);

    expect(beforeRenderCallback.calls.count()).toBe(1);
  });

  it('should fire afterViewRender event after table has been scrolled', async() => {
    spec().$container[0].style.width = '400px';
    spec().$container[0].style.height = '60px';
    spec().$container[0].style.overflow = 'hidden';

    handsontable({
      data: createSpreadsheetData(20, 3)
    });

    const afterRenderCallback = jasmine.createSpy('afterRenderCallback');

    await addHook('afterViewRender', afterRenderCallback);

    await scrollViewportVertically(1000);

    expect(afterRenderCallback.calls.count()).toBe(1);
  });

  it('should fire afterViewRender event after table physically rendered', async() => {
    spec().$container[0].style.width = '400px';
    spec().$container[0].style.height = '60px';
    spec().$container[0].style.overflow = 'hidden';

    handsontable({
      data: createSpreadsheetData(20, 3)
    });

    await addHook('afterViewRender', async() => {
      tableView()._wt.wtTable.holder.style.overflow = 'scroll';
      tableView()._wt.wtTable.holder.style.width = '220px';
    });

    await scrollViewportVertically(1000);

    // after afterViewRender hook triggered element style shouldn't changed
    expect(tableView()._wt.wtTable.holder.style.overflow).toBe('scroll');
    expect(tableView()._wt.wtTable.holder.style.width).toBe('220px');
  });

  it('should correctly calculate the width of the top overlay after the vertical scrollbar disappears (#dev-954)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      colHeaders: true,
      width: 200,
      height: 200,
    });

    await selectColumns(1);

    const rowMapper = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'trimming');

    rowMapper.setValueAtIndex(0, true);
    rowMapper.setValueAtIndex(1, true);
    rowMapper.setValueAtIndex(2, true);
    rowMapper.setValueAtIndex(3, true);
    await render();

    expect(getTopClone().width()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(200);
      main.toBe(185);
      horizon.toBe(185);
    });
  });

  it.forTheme('classic')('should not extend the selection to the cell under the mouse pointer ' +
    'after the viewport is moved (#dev-1479)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    await simulateClick(getCell(0, 0));
    await keyDownUp('enter');
    getActiveEditor().TEXTAREA.value = 'AVeryLongStringThatWillBePastedInASingleCell';

    // emulates behavior that is similar to the one that is caused by the bug
    $(getCell(1, 2))
      .simulate('mousedown');
    $(getCell(1, 0))
      .simulate('mouseover', {
        clientX: 100, // coordinates of the cell 1, 2 before the column is resized
        clientY: 24, // coordinates of the cell 1, 2 before the column is resized
      })
      .simulate('mouseup')
      .simulate('click');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 1,2']);
  });

  it.forTheme('main')('should not extend the selection to the cell under the mouse pointer after ' +
    'the viewport is moved (#dev-1479)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    await simulateClick(getCell(0, 0));
    await keyDownUp('enter');
    getActiveEditor().TEXTAREA.value = 'AVeryLongStringThatWillBePastedInASingleCell';

    // emulates behavior that is similar to the one that is caused by the bug
    $(getCell(1, 2))
      .simulate('mousedown');
    $(getCell(1, 0))
      .simulate('mouseover', {
        clientX: 100, // coordinates of the cell 1, 2 before the column is resized
        clientY: 30, // coordinates of the cell 1, 2 before the column is resized
      })
      .simulate('mouseup')
      .simulate('click');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 1,2']);
  });

  it.forTheme('horizon')('should not extend the selection to the cell under the mouse pointer after ' +
    'the viewport is moved (#dev-1479)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    await simulateClick(getCell(0, 0));
    await keyDownUp('enter');
    getActiveEditor().TEXTAREA.value = 'AVeryLongStringThatWillBePastedInASingleCell';

    // emulates behavior that is similar to the one that is caused by the bug
    $(getCell(1, 2))
      .simulate('mousedown');
    $(getCell(1, 0))
      .simulate('mouseover', {
        clientX: 100, // coordinates of the cell 1, 2 before the column is resized
        clientY: 38, // coordinates of the cell 1, 2 before the column is resized
      })
      .simulate('mouseup')
      .simulate('click');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 1,2']);
  });

  it('should update the `scrollableElement` value of the Overlays after changing the table view size settings', async() => {
    const hot = handsontable({
      rowHeaders: true,
      colHeaders: true,
    });

    expect(tableView()._wt.wtOverlays.scrollableElement).toBe(window);

    await updateSettings({
      width: 200,
      height: 200,
    });

    expect(tableView()._wt.wtOverlays.scrollableElement).toBe(hot.rootElement.querySelector('.wtHolder'));
  });

  describe('scroll', () => {
    it('should call preventDefault in a wheel event on fixed overlay\'s element', async() => {
      spec().$container.css({
        width: '200px',
        height: '200px',
        overflow: 'hidden',
      });

      handsontable({
        data: createSpreadsheetData(50, 50),
        colHeaders: true,
        rowHeaders: true,
      });

      const eventManager = new Handsontable.EventManager(hot);
      const spy = jasmine.createSpy();

      eventManager.addEventListener(window, 'wheel', spy);

      const wheelEvt = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        view: window,
        deltaMode: 0,
        deltaX: 800,
        deltaY: 400,
      });

      // If run on a browser different than Chrome or a higher density display, the event is listened on a different element (https://github.com/handsontable/handsontable/pull/5921)
      if (!(/Chrome/.test(navigator.userAgent) && /Google/.test(navigator.vendor))
        || tableView()._wt.rootWindow.devicePixelRatio && tableView()._wt.rootWindow.devicePixelRatio > 1) {
        tableView()._wt.wtTable.wtRootElement.dispatchEvent(wheelEvt);

      } else {
        spec().$container.find('.ht_clone_top_inline_start_corner .wtHolder')[0].dispatchEvent(wheelEvt);
      }

      await sleep(100);

      expect(spy.calls.argsFor(0)[0].defaultPrevented).toBe(true);
      eventManager.destroy();
    });

    it('should not scroll window when a wheel event occurs on fixed overlay', async() => {
      spec().$container.css({
        width: '200px',
        height: '200px',
        overflow: 'hidden',
        margin: '2000px',
      });

      handsontable({
        data: createSpreadsheetData(50, 50),
        colHeaders: true,
        rowHeaders: true,
      });

      const wheelEvt = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        view: window,
        deltaMode: 0,
        deltaX: 800,
        deltaY: 400,
      });

      // If run on a browser different than Chrome or a higher density display, the event is listened on a different element (https://github.com/handsontable/handsontable/pull/5921)
      if (!(/Chrome/.test(navigator.userAgent) && /Google/.test(navigator.vendor))
        || tableView()._wt.rootWindow.devicePixelRatio && tableView()._wt.rootWindow.devicePixelRatio > 1) {
        tableView()._wt.wtTable.wtRootElement.dispatchEvent(wheelEvt);

      } else {
        spec().$container.find('.ht_clone_top_inline_start_corner .wtHolder')[0].dispatchEvent(wheelEvt);
      }

      await sleep(100);
      const masterHolder = spec().$container.find('.ht_master .wtHolder')[0];

      expect(masterHolder.scrollLeft).toBe(800);
      expect(masterHolder.scrollTop).toBe(400);
      expect(window.scrollX).toBe(0);
      expect(window.scrollY).toBe(0);
    });
  });

  describe('fixed column row heights', () => {
    it('should be the same as the row heights in the main table', async() => {
      handsontable({
        data: [['A', 'B', 'C', 'D'], ['a', 'b', 'c\nc', 'd'], ['aa', 'bb', 'cc', 'dd']],
        startRows: 3,
        startCols: 4,
        fixedColumnsStart: 2,
      });

      expect(getCell(1, 2).clientHeight).toEqual(getCell(1, 1).clientHeight);

      await setDataAtCell(1, 2, 'c');

      expect(getCell(1, 2).clientHeight).toEqual(getCell(1, 1).clientHeight);
    });

    it('should be the same as the row heights in the main table (after scroll)', async() => {
      const myData = createSpreadsheetData(20, 4);

      myData[1][3] = 'very\nlong\ntext';
      myData[5][3] = 'very\nlong\ntext';
      myData[10][3] = 'very\nlong\ntext';
      myData[15][3] = 'very\nlong\ntext';

      handsontable({
        data: myData,
        startRows: 3,
        startCols: 4,
        fixedRowsTop: 2,
        fixedColumnsStart: 2,
        width: 200,
        height: 200
      });

      await scrollViewportVertically(200);
      await render();

      const masterTD = spec().$container.find('.ht_master tbody tr:eq(5) td:eq(1)')[0];
      const cloneTD = spec().$container.find('.ht_clone_inline_start tbody tr:eq(5) td:eq(1)')[0];

      expect(cloneTD.clientHeight).toEqual(masterTD.clientHeight);
    });

    it('should be the same as the row heights in the main table (after scroll, in corner)', async() => {
      const myData = createSpreadsheetData(20, 4);

      myData[1][3] = 'very\nlong\ntext';
      myData[5][3] = 'very\nlong\ntext';
      myData[10][3] = 'very\nlong\ntext';
      myData[15][3] = 'very\nlong\ntext';

      handsontable({
        data: myData,
        startRows: 3,
        startCols: 4,
        fixedRowsTop: 2,
        fixedColumnsStart: 2,
        width: 200,
        height: 200
      });

      const rowHeight = getCell(1, 3).clientHeight;

      expect(spec().$container.find('.ht_clone_top_inline_start_corner tbody tr:eq(1) td:eq(1)')[0].clientHeight)
        .toEqual(rowHeight);

      await scrollViewportVertically(200);
      await render();

      expect(spec().$container.find('.ht_clone_top_inline_start_corner tbody tr:eq(1) td:eq(1)')[0].clientHeight)
        .toEqual(rowHeight);
    });
  });
});

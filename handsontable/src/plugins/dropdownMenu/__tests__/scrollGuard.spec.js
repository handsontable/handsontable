describe('DropdownMenu', () => {
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

  it('should block delayed horizontal viewport scroll after opening menu from a partially visible header button', async() => {
    handsontable({
      data: createSpreadsheetData(10, 20),
      width: 300,
      height: 300,
      colWidths: 100,
      colHeaders: true,
      rowHeaders: true,
      dropdownMenu: true
    });

    await scrollViewportTo({ row: 0, col: 8 }); // make the column `G` partially visible

    const initialScrollPosition = inlineStartOverlay().getScrollPosition();

    await dropdownMenu(6);

    expect(getPlugin('dropdownMenu').menu.isOpened()).toBe(true);

    await scrollViewportTo({ row: 0, col: 6, horizontalSnap: 'start' });

    expect(inlineStartOverlay().getScrollPosition()).toBe(initialScrollPosition);

    getPlugin('dropdownMenu').close();

    await scrollViewportTo({ row: 0, col: 6, horizontalSnap: 'start' });

    expect(inlineStartOverlay().getScrollPosition()).not.toBe(initialScrollPosition);
  });

  it('should keep top overlay and master horizontally synchronized after diagonal wheel scroll and opening header menu', async() => {
    handsontable({
      data: createSpreadsheetData(50, 20),
      width: 300,
      height: 220,
      colWidths: 100,
      colHeaders: true,
      rowHeaders: true,
      dropdownMenu: true,
    });

    await scrollViewportTo({ row: 0, col: 8 });

    const wheelEvt = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      view: window,
      deltaMode: 0,
      deltaX: 120,
      deltaY: 120,
    });
    const isChromeLowDensity = /Chrome/.test(navigator.userAgent) &&
      /Google/.test(navigator.vendor) &&
      !(tableView()._wt.rootWindow.devicePixelRatio && tableView()._wt.rootWindow.devicePixelRatio > 1);

    if (isChromeLowDensity) {
      getTopInlineStartClone().find('.wtHolder')[0].dispatchEvent(wheelEvt);
    } else {
      tableView()._wt.wtTable.wtRootElement.dispatchEvent(wheelEvt);
    }

    const partiallyVisibleHeader = getMaster().find('thead th')[7];
    const button = partiallyVisibleHeader.querySelector('.changeType');

    button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    button.focus();
    button.click();

    const masterHolder = getMaster().find('.wtHolder')[0];
    const topHolder = getTopClone().find('.wtHolder')[0];

    expect(getPlugin('dropdownMenu').menu.isOpened()).toBe(true);
    expect(topHolder.scrollLeft).toBe(masterHolder.scrollLeft);
  });

  it('should block native wheel scrolling while menu is opened from header button', async() => {
    handsontable({
      data: createSpreadsheetData(50, 20),
      width: 300,
      height: 220,
      colWidths: 100,
      colHeaders: true,
      rowHeaders: true,
      dropdownMenu: true,
      filters: true,
    });

    await scrollViewportTo({ row: 0, col: 1 });

    const headerCell = getTopClone().find('thead th')[2];
    const button = headerCell.querySelector('.changeType');
    const masterHolder = getMaster().find('.wtHolder')[0];
    const topHolder = getTopClone().find('.wtHolder')[0];
    const initialMasterScrollLeft = masterHolder.scrollLeft;

    button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    button.click();

    const wheelEvt = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      view: window,
      deltaMode: 0,
      deltaX: 120,
      deltaY: 120,
    });

    tableView()._wt.wtTable.wtRootElement.dispatchEvent(wheelEvt);
    await sleep(100);

    expect(getPlugin('dropdownMenu').menu.isOpened()).toBe(true);
    expect(masterHolder.scrollLeft).toBe(initialMasterScrollLeft);
    expect(topHolder.scrollLeft).toBe(masterHolder.scrollLeft);
  });

  it('should keep first column header and body aligned after small diagonal scroll and opening first column menu button', async() => {
    handsontable({
      data: createSpreadsheetData(120, 12),
      width: 420,
      height: 260,
      colWidths: 120,
      colHeaders: true,
      rowHeaders: true,
      themeName: 'ht-theme-horizon',
      dropdownMenu: true,
      filters: true,
      hiddenColumns: {
        columns: [1],
        indicators: true,
      },
      multiColumnSorting: true,
      manualColumnMove: true,
      manualColumnResize: true,
      manualRowMove: true,
      manualRowResize: true,
    });

    const masterHolder = getMaster().find('.wtHolder')[0];
    const topHolder = getTopClone().find('.wtHolder')[0];
    const isChromeLowDensity = /Chrome/.test(navigator.userAgent) &&
      /Google/.test(navigator.vendor) &&
      !(tableView()._wt.rootWindow.devicePixelRatio && tableView()._wt.rootWindow.devicePixelRatio > 1);

    for (let wheelStep = 0; wheelStep < 4; wheelStep += 1) {
      const wheelEvt = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        view: window,
        deltaMode: 0,
        deltaX: 20,
        deltaY: 20,
      });

      if (isChromeLowDensity) {
        getTopInlineStartClone().find('.wtHolder')[0].dispatchEvent(wheelEvt);
      } else {
        tableView()._wt.wtTable.wtRootElement.dispatchEvent(wheelEvt);
      }
    }

    await sleep(100);

    const firstColumnHeader = getTopClone().find('thead th')[1];
    const button = firstColumnHeader.querySelector('.changeType');
    const firstHeaderLeft = firstColumnHeader.getBoundingClientRect().left;
    const firstBodyCellLeft = getMaster().find('tbody tr:first td:first')[0].getBoundingClientRect().left;
    const initialOffset = Math.round(firstHeaderLeft - firstBodyCellLeft);

    button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    button.focus();
    button.click();

    await sleep(100);

    const finalHeaderLeft = firstColumnHeader.getBoundingClientRect().left;
    const finalBodyCellLeft = getMaster().find('tbody tr:first td:first')[0].getBoundingClientRect().left;
    const finalOffset = Math.round(finalHeaderLeft - finalBodyCellLeft);

    expect(masterHolder.scrollLeft).toBeGreaterThan(0);
    expect(masterHolder.scrollTop).toBeGreaterThan(0);
    expect(getPlugin('dropdownMenu').menu.isOpened()).toBe(true);
    expect(topHolder.scrollLeft).toBe(masterHolder.scrollLeft);
    expect(finalOffset).toBe(initialOffset);
  });
});

describe('MultipleSelectionHandles', () => {
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

  it('should not stretch the container of the scrollable element (#9475)', () => {
    handsontable({
      data: createSpreadsheetData(5, 8),
      width: 400,
      height: 200
    });

    // try to scroll the viewport max to the right
    getMaster().find('.wtHolder').scrollLeft(9999);

    // there should be no scroll as the 8 columns fit to the table's width
    expect(getMaster().find('.wtHolder').scrollLeft()).toBe(0);
  });

  it('should not stretch the container of the scrollable element when the edge cells are selected (#9621)', () => {
    handsontable({
      data: createSpreadsheetData(5, 8),
      width: 400,
      height: 116
    });

    // select the top bottom-right cell
    selectCell(4, 7);

    // try to scroll the viewport max to the bottom-right position
    getMaster().find('.wtHolder').scrollLeft(999);
    getMaster().find('.wtHolder').scrollTop(999);

    expect(getMaster().find('.wtHolder').scrollLeft()).toBe(0);
    expect(getMaster().find('.wtHolder').scrollTop()).toBe(0);

    loadData([['X']]);

    // try to scroll the viewport max to the bottom-right position
    getMaster().find('.wtHolder').scrollLeft(999);
    getMaster().find('.wtHolder').scrollTop(999);

    expect(getMaster().find('.wtHolder').scrollLeft()).toBe(0);
    expect(getMaster().find('.wtHolder').scrollTop()).toBe(0);
  });

  it('should hide all selection handlers when the cell\'s selection disappears', () => {
    handsontable({
      data: createSpreadsheetData(5, 8),
    });

    selectCell(0, 0);

    const topSelectionHandle = spec().$container
      .find('.ht_master .htBorders div:first-child .topSelectionHandle');
    const topSelectionHandleHitArea = spec().$container
      .find('.ht_master .htBorders div:first-child .topSelectionHandle-HitArea');
    const bottomSelectionHandle = spec().$container
      .find('.ht_master .htBorders div:first-child .bottomSelectionHandle');
    const bottomSelectionHandleHitArea = spec().$container
      .find('.ht_master .htBorders div:first-child .bottomSelectionHandle-HitArea');

    expect(topSelectionHandle.is(':visible')).toBe(true);
    expect(topSelectionHandleHitArea.is(':visible')).toBe(true);
    expect(bottomSelectionHandle.is(':visible')).toBe(true);
    expect(bottomSelectionHandleHitArea.is(':visible')).toBe(true);

    deselectCell();

    expect(topSelectionHandle.is(':visible')).toBe(false);
    expect(topSelectionHandleHitArea.is(':visible')).toBe(false);
    expect(bottomSelectionHandle.is(':visible')).toBe(false);
    expect(bottomSelectionHandleHitArea.is(':visible')).toBe(false);
  });

  it('should not show the selection handlers on context menu', () => {
    handsontable({
      data: createSpreadsheetData(5, 8),
      contextMenu: true,
    });

    selectCell(0, 0);

    contextMenu();

    getPlugin('contextMenu').menu.hotMenu.selectCell(0, 0);

    const topSelectionHandle = $('.htContextMenu').eq(0)
      .find('.ht_master .htBorders div:first-child .topSelectionHandle');
    const topSelectionHandleHitArea = $('.htContextMenu').eq(0)
      .find('.ht_master .htBorders div:first-child .topSelectionHandle-HitArea');
    const bottomSelectionHandle = $('.htContextMenu').eq(0)
      .find('.ht_master .htBorders div:first-child .bottomSelectionHandle');
    const bottomSelectionHandleHitArea = $('.htContextMenu').eq(0)
      .find('.ht_master .htBorders div:first-child .bottomSelectionHandle-HitArea');

    expect(topSelectionHandle.size()).toBe(0);
    expect(topSelectionHandleHitArea.size()).toBe(0);
    expect(bottomSelectionHandle.size()).toBe(0);
    expect(bottomSelectionHandleHitArea.size()).toBe(0);
  });

  it('should not show the selection handlers on the autocomplete dropdown', async() => {
    handsontable({
      data: createSpreadsheetData(5, 1),
      columns: [
        {
          type: 'autocomplete',
          source: ['1', '2', '3'],
          filter: false,
          strict: true
        }
      ]
    });

    selectCell(0, 0);

    keyDownUp('enter');

    await sleep(50);

    getActiveEditor().htEditor.selectCell(0, 0);

    const topSelectionHandle = $('.autocompleteEditor').eq(0)
      .find('.ht_master .htBorders div:first-child .topSelectionHandle');
    const topSelectionHandleHitArea = $('.autocompleteEditor').eq(0)
      .find('.ht_master .htBorders div:first-child .topSelectionHandle-HitArea');
    const bottomSelectionHandle = $('.autocompleteEditor').eq(0)
      .find('.ht_master .htBorders div:first-child .bottomSelectionHandle');
    const bottomSelectionHandleHitArea = $('.autocompleteEditor').eq(0)
      .find('.ht_master .htBorders div:first-child .bottomSelectionHandle-HitArea');

    expect(topSelectionHandle.size()).toBe(0);
    expect(topSelectionHandleHitArea.size()).toBe(0);
    expect(bottomSelectionHandle.size()).toBe(0);
    expect(bottomSelectionHandleHitArea.size()).toBe(0);
  });

  it('should not show the selection handlers on the dropdown menu', async() => {
    handsontable({
      data: createSpreadsheetData(5, 1),
      colHeaders: true,
      dropdownMenu: true,
    });

    dropdownMenu(0);

    await sleep(50);

    const topSelectionHandle = $('.htDropdownMenu').eq(0)
      .find('.ht_master .htBorders div:first-child .topSelectionHandle');
    const topSelectionHandleHitArea = $('.htDropdownMenu').eq(0)
      .find('.ht_master .htBorders div:first-child .topSelectionHandle-HitArea');
    const bottomSelectionHandle = $('.htDropdownMenu').eq(0)
      .find('.ht_master .htBorders div:first-child .bottomSelectionHandle');
    const bottomSelectionHandleHitArea = $('.htDropdownMenu').eq(0)
      .find('.ht_master .htBorders div:first-child .bottomSelectionHandle-HitArea');

    expect(topSelectionHandle.size()).toBe(0);
    expect(topSelectionHandleHitArea.size()).toBe(0);
    expect(bottomSelectionHandle.size()).toBe(0);
    expect(bottomSelectionHandleHitArea.size()).toBe(0);
  });
});

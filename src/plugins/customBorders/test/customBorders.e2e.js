describe('CustomBorders', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    let wrapper = $('<div></div>').css({
      width: 400,
      height: 200,
      overflow: 'scroll'
    });

    this.$wrapper = this.$container.wrap(wrapper).parent();
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
    this.$wrapper.remove();
  });

  describe('enabling/disabling plugin', () => {
    it('should be disabled by default', () => {
      const hot = handsontable();

      expect(hot.getPlugin('customBorders').isEnabled()).toBe(false);
    });

    it('should disable plugin using updateSettings', () => {
      const hot = handsontable({
        customBorders: true
      });

      hot.updateSettings({
        customBorders: false
      });

      expect(hot.getPlugin('customBorders').isEnabled()).toBe(false);
    });

    it('should enable plugin using updateSettings', () => {
      const hot = handsontable({
        customBorders: false
      });

      hot.updateSettings({
        customBorders: true
      });

      expect(hot.getPlugin('customBorders')).toBeDefined();
    });
  });

  it('should draw top border from context menu options', async () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    const defaultBorder = {
        color: '#000',
        width: 1
      },
      empty = {
        hide: true
      };

    contextMenu();
    const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(12);
    item.simulate('mouseover');

    await sleep(300);

    const contextSubMenu = $(`.htContextMenuSub_${item.text()}`);
    const button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(0);

    button.simulate('mousedown');

    // expect(getCellMeta(0,0).borders.hasOwnProperty('top')).toBe(true);
    expect(getCellMeta(0, 0).borders.top).toEqual(defaultBorder);
    expect(getCellMeta(0, 0).borders.left).toEqual(empty);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(empty);
    expect(getCellMeta(0, 0).borders.right).toEqual(empty);
  });

  it('should draw left border from context menu options', async () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    const defaultBorder = {
        color: '#000',
        width: 1
      },
      empty = {
        hide: true
      };

    contextMenu();
    const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(12);
    item.simulate('mouseover');

    await sleep(300);

    const contextSubMenu = $(`.htContextMenuSub_${item.text()}`);
    const button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(3);

    button.simulate('mousedown');

    /* eslint-disable no-prototype-builtins */
    expect(getCellMeta(0, 0).borders.hasOwnProperty('left')).toBe(true);
    expect(getCellMeta(0, 0).borders.top).toEqual(empty);
    expect(getCellMeta(0, 0).borders.left).toEqual(defaultBorder);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(empty);
    expect(getCellMeta(0, 0).borders.right).toEqual(empty);
  });

  it('should draw right border from context menu options', async () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    const defaultBorder = {
        color: '#000',
        width: 1
      },
      empty = {
        hide: true
      };

    contextMenu();
    const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(12);
    item.simulate('mouseover');

    await sleep(300);

    const contextSubMenu = $(`.htContextMenuSub_${item.text()}`);
    const button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(1);

    button.simulate('mousedown');

    /* eslint-disable no-prototype-builtins */
    expect(getCellMeta(0, 0).borders.hasOwnProperty('right')).toBe(true);
    expect(getCellMeta(0, 0).borders.top).toEqual(empty);
    expect(getCellMeta(0, 0).borders.left).toEqual(empty);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(empty);
    expect(getCellMeta(0, 0).borders.right).toEqual(defaultBorder);
  });

  it('should draw bottom border from context menu options', async () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    const defaultBorder = {
        color: '#000',
        width: 1
      },
      empty = {
        hide: true
      };

    contextMenu();
    const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(12);
    item.simulate('mouseover');

    await sleep(300);

    const contextSubMenu = $(`.htContextMenuSub_${item.text()}`);
    const button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(2);

    button.simulate('mousedown');

    /* eslint-disable no-prototype-builtins */
    expect(getCellMeta(0, 0).borders.hasOwnProperty('right')).toBe(true);
    expect(getCellMeta(0, 0).borders.top).toEqual(empty);
    expect(getCellMeta(0, 0).borders.left).toEqual(empty);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(defaultBorder);
    expect(getCellMeta(0, 0).borders.right).toEqual(empty);
  });

  it('should remove all bottoms border from context menu options', async () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: [
        {
          row: 0,
          col: 0,
          left: {
            width: 2,
            color: 'red'
          },
          right: {
            width: 1,
            color: 'green'
          }
        }]
    });

    contextMenu();
    const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(12);
    item.simulate('mouseover');

    await sleep(300);

    const contextSubMenu = $(`.htContextMenuSub_${item.text()}`);
    const button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(4);

    button.simulate('mousedown');

    expect(getCellMeta(0, 0).borders).toBeUndefined();
  });

  it('should disable `Borders` context menu item when menu was triggered from corner header', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
      rowHeaders: true,
      colHeaders: true,
      contextMenu: true,
      customBorders: true,
    });

    $('.ht_clone_top_left_corner .htCore').find('thead').find('th').eq(0).simulate('mousedown', {which: 3});
    contextMenu();

    expect($('.htContextMenu tbody td.htDisabled').text()).toBe([
      'Insert column left',
      'Insert column right',
      'Remove row',
      'Remove column',
      'Undo',
      'Redo',
      'Read only',
      'Alignment',
      'Borders',
    ].join(''));
  });
});

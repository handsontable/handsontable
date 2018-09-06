describe('CustomBorders', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    const wrapper = $('<div></div>').css({
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

  it('should throw an exception `Unsupported selection ranges schema type was provided.` after calling setBorder method without parameter', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: true
    });

    const customBorders = hot.getPlugin('customBorders');
    let errors = 0;

    try {
      customBorders.setBorders();
    } catch (err) {
      errors += 1;
    }

    expect(errors).toEqual(1);
  });

  it('should draw borders by use setBorders method', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: true
    });

    const redBorder = { color: 'red', width: 2 };
    const empty = { hide: true };
    const customBorders = hot.getPlugin('customBorders');

    selectCells([[1, 1, 2, 2]]);

    customBorders.setBorders(getSelected(), {
      top: {
        width: 2,
        color: 'red'
      },
      bottom: {
        width: 2,
        color: 'red'
      }
    });

    expect(getCellMeta(1, 1).borders.top).toEqual(redBorder);
    expect(getCellMeta(1, 1).borders.left).toEqual(empty);
    expect(getCellMeta(1, 1).borders.bottom).toEqual(redBorder);
    expect(getCellMeta(1, 1).borders.right).toEqual(empty);

    expect(getCellMeta(1, 2).borders.top).toEqual(redBorder);
    expect(getCellMeta(1, 2).borders.left).toEqual(empty);
    expect(getCellMeta(1, 2).borders.bottom).toEqual(redBorder);
    expect(getCellMeta(1, 2).borders.right).toEqual(empty);

    expect(getCellMeta(2, 1).borders.top).toEqual(redBorder);
    expect(getCellMeta(2, 1).borders.left).toEqual(empty);
    expect(getCellMeta(2, 1).borders.bottom).toEqual(redBorder);
    expect(getCellMeta(2, 1).borders.right).toEqual(empty);

    expect(getCellMeta(2, 2).borders.top).toEqual(redBorder);
    expect(getCellMeta(2, 2).borders.left).toEqual(empty);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(redBorder);
    expect(getCellMeta(2, 2).borders.right).toEqual(empty);
  });

  it('should redraw borders by use setBorders method', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: {
          width: 2,
          color: 'red'
        },
        right: {
          width: 1,
          color: 'green'
        },
        top: {
          width: 2,
          color: 'green'
        }
      }]
    });

    const redBorder = { color: 'red', width: 2 };
    const greenBorder = { color: 'green', width: 1 };
    const customBorders = hot.getPlugin('customBorders');

    selectCell(2, 2);

    customBorders.setBorders(getSelectedRange(), {
      top: {
        width: 2,
        color: 'red'
      },
      bottom: {
        width: 2,
        color: 'red'
      }
    });

    expect(getCellMeta(2, 2).borders.top).toEqual(redBorder);
    expect(getCellMeta(2, 2).borders.left).toEqual(redBorder);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(redBorder);
    expect(getCellMeta(2, 2).borders.right).toEqual(greenBorder);
  });

  it('should hide only specific border by use setBorders method with {hide: true}', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: {
          width: 2,
          color: 'red'
        },
        right: {
          width: 2,
          color: 'red'
        },
        top: {
          width: 1,
          color: 'green'
        }
      }]
    });

    const greenBorder = { color: 'green', width: 1 };
    const redBorder = { color: 'red', width: 2 };
    const empty = { hide: true };
    const customBorders = hot.getPlugin('customBorders');

    expect(getCellMeta(2, 2).borders.top).toEqual(greenBorder);
    expect(getCellMeta(2, 2).borders.left).toEqual(redBorder);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(empty);
    expect(getCellMeta(2, 2).borders.right).toEqual(redBorder);

    selectCell(2, 2);

    customBorders.setBorders(getSelected(), {
      top: {
        hide: true
      }
    });

    expect(getCellMeta(2, 2).borders.top).toEqual(empty);
    expect(getCellMeta(2, 2).borders.left).toEqual(redBorder);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(empty);
    expect(getCellMeta(2, 2).borders.right).toEqual(redBorder);
  });

  it('should hide all border by use setBorders method with eg. {top: false}', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: {
          width: 2,
          color: 'red'
        },
        right: {
          width: 2,
          color: 'red'
        },
        top: {
          width: 1,
          color: 'green'
        }
      }]
    });

    const greenBorder = { color: 'green', width: 1 };
    const redBorder = { color: 'red', width: 2 };
    const empty = { hide: true };
    const customBorders = hot.getPlugin('customBorders');

    expect(getCellMeta(2, 2).borders.top).toEqual(greenBorder);
    expect(getCellMeta(2, 2).borders.left).toEqual(redBorder);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(empty);
    expect(getCellMeta(2, 2).borders.right).toEqual(redBorder);

    expect(getCellMeta(0, 0).borders).toBeUndefined();
    expect(getCellMeta(0, 1).borders).toBeUndefined();
    expect(getCellMeta(0, 2).borders).toBeUndefined();
    expect(getCellMeta(0, 3).borders).toBeUndefined();

    expect(getCellMeta(1, 0).borders).toBeUndefined();
    expect(getCellMeta(1, 1).borders).toBeUndefined();
    expect(getCellMeta(1, 2).borders).toBeUndefined();
    expect(getCellMeta(1, 3).borders).toBeUndefined();

    expect(getCellMeta(2, 0).borders).toBeUndefined();
    expect(getCellMeta(2, 1).borders).toBeUndefined();
    expect(getCellMeta(2, 3).borders).toBeUndefined();

    expect(getCellMeta(3, 0).borders).toBeUndefined();
    expect(getCellMeta(3, 1).borders).toBeUndefined();
    expect(getCellMeta(3, 2).borders).toBeUndefined();
    expect(getCellMeta(3, 3).borders).toBeUndefined();

    selectCell(2, 2);

    customBorders.setBorders(getSelected(), {
      top: false
    });

    expect(getCellMeta(2, 2).borders.top).toEqual(empty);
    expect(getCellMeta(2, 2).borders.left).toEqual(redBorder);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(empty);
    expect(getCellMeta(2, 2).borders.right).toEqual(redBorder);

    expect(getCellMeta(0, 0).borders).toBeUndefined();
    expect(getCellMeta(0, 1).borders).toBeUndefined();
    expect(getCellMeta(0, 2).borders).toBeUndefined();
    expect(getCellMeta(0, 3).borders).toBeUndefined();

    expect(getCellMeta(1, 0).borders).toBeUndefined();
    expect(getCellMeta(1, 1).borders).toBeUndefined();
    expect(getCellMeta(1, 2).borders).toBeUndefined();
    expect(getCellMeta(1, 3).borders).toBeUndefined();

    expect(getCellMeta(2, 0).borders).toBeUndefined();
    expect(getCellMeta(2, 1).borders).toBeUndefined();
    expect(getCellMeta(2, 3).borders).toBeUndefined();

    expect(getCellMeta(3, 0).borders).toBeUndefined();
    expect(getCellMeta(3, 1).borders).toBeUndefined();
    expect(getCellMeta(3, 2).borders).toBeUndefined();
    expect(getCellMeta(3, 3).borders).toBeUndefined();
  });

  it('should return borders from the selected area by use getBorders method', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: {
          width: 2,
          color: 'red'
        },
        right: {
          width: 1,
          color: 'green'
        },
        top: {
          width: 1,
          color: 'green'
        }
      }]
    });

    const redBorder = { color: 'red', width: 2 };
    const greenBorder = { color: 'green', width: 1 };
    const empty = { hide: true };
    const customBorders = hot.getPlugin('customBorders');

    hot.selectCells([[1, 1, 2, 2]]);

    const borders = customBorders.getBorders(getSelected());

    expect(borders.length).toEqual(1);
    expect(borders[0].top).toEqual(greenBorder);
    expect(borders[0].left).toEqual(redBorder);
    expect(borders[0].bottom).toEqual(empty);
    expect(borders[0].right).toEqual(greenBorder);
  });

  it('should return all borders by use getBorders method without parameter', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        range: {
          from: {
            row: 1,
            col: 1
          },
          to: {
            row: 3,
            col: 3
          }
        },
        top: {
          width: 2,
          color: 'blue'
        },
        left: {
          width: 2,
          color: 'orange'
        },
        bottom: {
          width: 2,
          color: 'red'
        },
        right: {
          width: 2,
          color: 'magenta'
        }
      },
      {
        row: 2,
        col: 2,
        left: {
          width: 2,
          color: 'red'
        },
        right: {
          width: 1,
          color: 'green'
        },
        top: {
          width: 2,
          color: 'green'
        }
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    const borders = customBorders.getBorders();

    expect(borders.length).toEqual(9);
  });

  it('should clear borders from the selected area by use clearBorders method', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        range: {
          from: {
            row: 1,
            col: 1
          },
          to: {
            row: 3,
            col: 3
          }
        },
        top: {
          width: 2,
          color: 'blue'
        },
        left: {
          width: 2,
          color: 'orange'
        },
        bottom: {
          width: 2,
          color: 'red'
        },
        right: {
          width: 2,
          color: 'magenta'
        }
      },
      {
        row: 2,
        col: 2,
        left: {
          width: 2,
          color: 'red'
        },
        right: {
          width: 1,
          color: 'green'
        },
        top: {
          width: 2,
          color: 'green'
        }
      }]
    });

    const magentaBorder = { color: 'magenta', width: 2 };
    const blueBorder = { color: 'blue', width: 2 };
    const orangeBorder = { color: 'orange', width: 2 };
    const redBorder = { color: 'red', width: 2 };
    const customBorders = hot.getPlugin('customBorders');

    selectCells([[0, 0, 2, 2]]);

    customBorders.clearBorders(getSelectedRange());

    expect(getCellMeta(1, 1).borders).toBeUndefined();
    expect(getCellMeta(1, 2).borders).toBeUndefined();
    expect(getCellMeta(2, 1).borders).toBeUndefined();
    expect(getCellMeta(2, 2).borders).toBeUndefined();

    expect(getCellMeta(1, 3).borders.top).toEqual(blueBorder);
    expect(getCellMeta(1, 3).borders.right).toEqual(magentaBorder);
    expect(getCellMeta(2, 3).borders.right).toEqual(magentaBorder);
    expect(getCellMeta(3, 1).borders.left).toEqual(orangeBorder);
    expect(getCellMeta(3, 1).borders.bottom).toEqual(redBorder);
    expect(getCellMeta(3, 2).borders.bottom).toEqual(redBorder);
    expect(getCellMeta(3, 3).borders.right).toEqual(magentaBorder);
    expect(getCellMeta(3, 3).borders.bottom).toEqual(redBorder);
  });

  it('should clear all borders by use clearBorders method without parameter', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        range: {
          from: {
            row: 1,
            col: 1
          },
          to: {
            row: 3,
            col: 3
          }
        },
        top: {
          width: 2,
          color: 'blue'
        },
        left: {
          width: 2,
          color: 'orange'
        },
        bottom: {
          width: 2,
          color: 'red'
        },
        right: {
          width: 2,
          color: 'magenta'
        }
      },
      {
        row: 2,
        col: 2,
        left: {
          width: 2,
          color: 'red'
        },
        right: {
          width: 1,
          color: 'green'
        },
        top: {
          width: 2,
          color: 'green'
        }
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    customBorders.clearBorders();

    expect(getCellMeta(1, 1).borders).toBeUndefined();
    expect(getCellMeta(1, 2).borders).toBeUndefined();
    expect(getCellMeta(2, 1).borders).toBeUndefined();
    expect(getCellMeta(2, 2).borders).toBeUndefined();

    expect(getCellMeta(1, 3).borders).toBeUndefined();
    expect(getCellMeta(2, 3).borders).toBeUndefined();
    expect(getCellMeta(3, 1).borders).toBeUndefined();
    expect(getCellMeta(3, 2).borders).toBeUndefined();
    expect(getCellMeta(3, 3).borders).toBeUndefined();
  });

  it('should draw borders from context menu options when was first cleared borders by the clearBorders method', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: [{
        row: 0,
        col: 0,
        left: {
          width: 2,
          color: 'red'
        },
        right: {
          width: 1,
          color: 'green'
        },
        top: {
          width: 2,
          color: 'green'
        }
      }]
    });

    const defaultBorder = { color: '#000', width: 1 };
    const empty = { hide: true };
    const customBorders = hot.getPlugin('customBorders');

    selectCell(0, 0);

    customBorders.clearBorders(getSelectedRange());

    expect(getCellMeta(0, 0).borders).toBeUndefined();

    contextMenu();
    const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(12);
    item.simulate('mouseover');

    await sleep(300);

    const contextSubMenu = $(`.htContextMenuSub_${item.text()}`);
    const button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(0);

    button.simulate('mousedown');

    expect(getCellMeta(0, 0).borders.top).toEqual(defaultBorder);
    expect(getCellMeta(0, 0).borders.left).toEqual(empty);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(empty);
    expect(getCellMeta(0, 0).borders.right).toEqual(empty);
  });

  it('should clear all borders when first was cleared borders by the clearBorders method with selections,' +
  'then draw borders from context menu options, and then was cleared borders by the clearBorders method without selections', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: [{
        row: 0,
        col: 0,
        left: {
          width: 2,
          color: 'red'
        },
        right: {
          width: 1,
          color: 'green'
        },
        top: {
          width: 2,
          color: 'green'
        }
      }]
    });

    const defaultBorder = { color: '#000', width: 1 };
    const empty = { hide: true };
    const customBorders = hot.getPlugin('customBorders');

    selectCell(0, 0);

    customBorders.clearBorders(getSelectedRange());

    expect(getCellMeta(0, 0).borders).toBeUndefined();

    contextMenu();
    const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(12);
    item.simulate('mouseover');

    await sleep(300);

    const contextSubMenu = $(`.htContextMenuSub_${item.text()}`);
    const button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(0);

    button.simulate('mousedown');

    expect(getCellMeta(0, 0).borders.top).toEqual(defaultBorder);
    expect(getCellMeta(0, 0).borders.left).toEqual(empty);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(empty);
    expect(getCellMeta(0, 0).borders.right).toEqual(empty);

    customBorders.clearBorders();
    expect(getCellMeta(0, 0).borders).toBeUndefined();
  });

  it('should draw top border from context menu options', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    const defaultBorder = { color: '#000', width: 1 };
    const empty = { hide: true };

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

  it('should draw left border from context menu options', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    const defaultBorder = { color: '#000', width: 1 };
    const empty = { hide: true };

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

  it('should draw right border from context menu options', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    const defaultBorder = { color: '#000', width: 1 };
    const empty = { hide: true };

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

  it('should draw bottom border from context menu options', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    const defaultBorder = { color: '#000', width: 1 };
    const empty = { hide: true };

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

  it('should remove all bottoms border from context menu options', async() => {
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

    $('.ht_clone_top_left_corner .htCore').find('thead').find('th').eq(0).simulate('mousedown', { which: 3 });
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

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

describe('CustomBorders', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
    var wrapper = $('<div></div>').css({
      width: 400,
      height: 200,
      overflow: 'scroll'
    });

    this.$wrapper = this.$container.wrap(wrapper).parent();
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
    this.$wrapper.remove();
  });

  describe('enabling/disabling plugin', function () {
    it('should be disabled by default', function () {
      var hot = handsontable();

      expect(hot.getPlugin('customBorders').isEnabled()).toBe(false);
    });

    it('should disable plugin using updateSettings', function () {
      var hot = handsontable({
        customBorders: true
      });

      hot.updateSettings({
        customBorders: false
      });

      expect(hot.getPlugin('customBorders').isEnabled()).toBe(false);
    });

    it('should enable plugin using updateSettings', function () {
      var hot = handsontable({
        customBorders: false
      });

      hot.updateSettings({
        customBorders: true
      });

      expect(hot.getPlugin('customBorders')).toBeDefined();
    });
  });

  it('should throw an exception `Unsupported selection ranges schema type was provided.` after calling setBorder method without parameter', function () {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: true
    });

    var customBorders = hot.getPlugin('customBorders');
    var errors = 0;

    try {
      customBorders.setBorders();
    } catch (err) {
      errors += 1;
    }

    expect(errors).toEqual(1);
  });

  it('should draw borders by use setBorders method', function () {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: true
    });

    var redBorder = { color: 'red', width: 2 };
    var empty = { hide: true };
    var customBorders = hot.getPlugin('customBorders');

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

  it('should redraw borders by use setBorders method', function () {
    var hot = handsontable({
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

    var redBorder = { color: 'red', width: 2 };
    var greenBorder = { color: 'green', width: 1 };
    var customBorders = hot.getPlugin('customBorders');

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

  it('should hide only specific border by use setBorders method with {hide: true}', function () {
    var hot = handsontable({
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

    var greenBorder = { color: 'green', width: 1 };
    var redBorder = { color: 'red', width: 2 };
    var empty = { hide: true };
    var customBorders = hot.getPlugin('customBorders');

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

  it('should hide all border by use setBorders method with eg. {top: false}', function () {
    var hot = handsontable({
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

    var greenBorder = { color: 'green', width: 1 };
    var redBorder = { color: 'red', width: 2 };
    var empty = { hide: true };
    var customBorders = hot.getPlugin('customBorders');

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

  it('should return borders from the selected area by use getBorders method', function () {
    var hot = handsontable({
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

    var redBorder = { color: 'red', width: 2 };
    var greenBorder = { color: 'green', width: 1 };
    var empty = { hide: true };
    var customBorders = hot.getPlugin('customBorders');

    hot.selectCells([[1, 1, 2, 2]]);

    var borders = customBorders.getBorders(getSelected());

    expect(borders.length).toEqual(1);
    expect(borders[0].top).toEqual(greenBorder);
    expect(borders[0].left).toEqual(redBorder);
    expect(borders[0].bottom).toEqual(empty);
    expect(borders[0].right).toEqual(greenBorder);
  });

  it('should return all borders by use getBorders method without parameter', function () {
    var hot = handsontable({
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
      }, {
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

    var customBorders = hot.getPlugin('customBorders');

    var borders = customBorders.getBorders();

    expect(borders.length).toEqual(9);
  });

  it('should clear borders from the selected area by use clearBorders method', function () {
    var hot = handsontable({
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
      }, {
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

    var magentaBorder = { color: 'magenta', width: 2 };
    var blueBorder = { color: 'blue', width: 2 };
    var orangeBorder = { color: 'orange', width: 2 };
    var redBorder = { color: 'red', width: 2 };
    var customBorders = hot.getPlugin('customBorders');

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

  it('should clear all borders by use clearBorders method without parameter', function () {
    var hot = handsontable({
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
      }, {
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

    var customBorders = hot.getPlugin('customBorders');

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

  it('should draw borders from context menu options when was first cleared borders by the clearBorders method', _asyncToGenerator(function* () {
    var hot = handsontable({
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

    var defaultBorder = { color: '#000', width: 1 };
    var empty = { hide: true };
    var customBorders = hot.getPlugin('customBorders');

    selectCell(0, 0);

    customBorders.clearBorders(getSelectedRange());

    expect(getCellMeta(0, 0).borders).toBeUndefined();

    contextMenu();
    var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(12);
    item.simulate('mouseover');

    yield sleep(300);

    var contextSubMenu = $('.htContextMenuSub_' + item.text());
    var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(0);

    button.simulate('mousedown');

    expect(getCellMeta(0, 0).borders.top).toEqual(defaultBorder);
    expect(getCellMeta(0, 0).borders.left).toEqual(empty);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(empty);
    expect(getCellMeta(0, 0).borders.right).toEqual(empty);
  }));

  it('should clear all borders when first was cleared borders by the clearBorders method with selections,' + 'then draw borders from context menu options, and then was cleared borders by the clearBorders method without selections', _asyncToGenerator(function* () {
    var hot = handsontable({
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

    var defaultBorder = { color: '#000', width: 1 };
    var empty = { hide: true };
    var customBorders = hot.getPlugin('customBorders');

    selectCell(0, 0);

    customBorders.clearBorders(getSelectedRange());

    expect(getCellMeta(0, 0).borders).toBeUndefined();

    contextMenu();
    var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(12);
    item.simulate('mouseover');

    yield sleep(300);

    var contextSubMenu = $('.htContextMenuSub_' + item.text());
    var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(0);

    button.simulate('mousedown');

    expect(getCellMeta(0, 0).borders.top).toEqual(defaultBorder);
    expect(getCellMeta(0, 0).borders.left).toEqual(empty);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(empty);
    expect(getCellMeta(0, 0).borders.right).toEqual(empty);

    customBorders.clearBorders();
    expect(getCellMeta(0, 0).borders).toBeUndefined();
  }));

  it('should draw top border from context menu options', _asyncToGenerator(function* () {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    var defaultBorder = { color: '#000', width: 1 };
    var empty = { hide: true };

    contextMenu();
    var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(12);
    item.simulate('mouseover');

    yield sleep(300);

    var contextSubMenu = $('.htContextMenuSub_' + item.text());
    var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(0);

    button.simulate('mousedown');

    // expect(getCellMeta(0,0).borders.hasOwnProperty('top')).toBe(true);
    expect(getCellMeta(0, 0).borders.top).toEqual(defaultBorder);
    expect(getCellMeta(0, 0).borders.left).toEqual(empty);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(empty);
    expect(getCellMeta(0, 0).borders.right).toEqual(empty);
  }));

  it('should draw left border from context menu options', _asyncToGenerator(function* () {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    var defaultBorder = { color: '#000', width: 1 };
    var empty = { hide: true };

    contextMenu();
    var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(12);
    item.simulate('mouseover');

    yield sleep(300);

    var contextSubMenu = $('.htContextMenuSub_' + item.text());
    var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(3);

    button.simulate('mousedown');

    /* eslint-disable no-prototype-builtins */
    expect(getCellMeta(0, 0).borders.hasOwnProperty('left')).toBe(true);
    expect(getCellMeta(0, 0).borders.top).toEqual(empty);
    expect(getCellMeta(0, 0).borders.left).toEqual(defaultBorder);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(empty);
    expect(getCellMeta(0, 0).borders.right).toEqual(empty);
  }));

  it('should draw right border from context menu options', _asyncToGenerator(function* () {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    var defaultBorder = { color: '#000', width: 1 };
    var empty = { hide: true };

    contextMenu();
    var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(12);
    item.simulate('mouseover');

    yield sleep(300);

    var contextSubMenu = $('.htContextMenuSub_' + item.text());
    var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(1);

    button.simulate('mousedown');

    /* eslint-disable no-prototype-builtins */
    expect(getCellMeta(0, 0).borders.hasOwnProperty('right')).toBe(true);
    expect(getCellMeta(0, 0).borders.top).toEqual(empty);
    expect(getCellMeta(0, 0).borders.left).toEqual(empty);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(empty);
    expect(getCellMeta(0, 0).borders.right).toEqual(defaultBorder);
  }));

  it('should draw bottom border from context menu options', _asyncToGenerator(function* () {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    var defaultBorder = { color: '#000', width: 1 };
    var empty = { hide: true };

    contextMenu();
    var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(12);
    item.simulate('mouseover');

    yield sleep(300);

    var contextSubMenu = $('.htContextMenuSub_' + item.text());
    var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(2);

    button.simulate('mousedown');

    /* eslint-disable no-prototype-builtins */
    expect(getCellMeta(0, 0).borders.hasOwnProperty('right')).toBe(true);
    expect(getCellMeta(0, 0).borders.top).toEqual(empty);
    expect(getCellMeta(0, 0).borders.left).toEqual(empty);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(defaultBorder);
    expect(getCellMeta(0, 0).borders.right).toEqual(empty);
  }));

  it('should remove all bottoms border from context menu options', _asyncToGenerator(function* () {
    handsontable({
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
        }
      }]
    });

    contextMenu();
    var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(12);
    item.simulate('mouseover');

    yield sleep(300);

    var contextSubMenu = $('.htContextMenuSub_' + item.text());
    var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(4);

    button.simulate('mousedown');

    expect(getCellMeta(0, 0).borders).toBeUndefined();
  }));

  it('should disable `Borders` context menu item when menu was triggered from corner header', function () {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
      rowHeaders: true,
      colHeaders: true,
      contextMenu: true,
      customBorders: true
    });

    $('.ht_clone_top_left_corner .htCore').find('thead').find('th').eq(0).simulate('mousedown', { which: 3 });
    contextMenu();

    expect($('.htContextMenu tbody td.htDisabled').text()).toBe(['Insert column left', 'Insert column right', 'Remove row', 'Remove column', 'Undo', 'Redo', 'Read only', 'Alignment', 'Borders'].join(''));
  });
});
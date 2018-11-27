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

  describe('enable/disable plugin', () => {
    it('should disable plugin after call disablePlugin method', () => {
      const hot = handsontable({
        dropdownMenu: true,
        colHeaders: true,
        height: 100
      });

      expect(hot.view.wt.wtTable.getColumnHeader(0).querySelector('.changeType')).not.toBe(null);

      hot.getPlugin('dropdownMenu').disablePlugin();
      hot.render();

      expect(hot.view.wt.wtTable.getColumnHeader(0).querySelector('.changeType')).toBe(null);
    });

    it('should enable plugin after call enablePlugin method', () => {
      const hot = handsontable({
        dropdownMenu: false,
        colHeaders: true,
        height: 100
      });

      expect(hot.view.wt.wtTable.getColumnHeader(0).querySelector('.changeType')).toBe(null);

      hot.getPlugin('dropdownMenu').enablePlugin();
      hot.render();

      expect(hot.view.wt.wtTable.getColumnHeader(0).querySelector('.changeType')).not.toBe(null);
    });
  });

  describe('menu width', () => {
    it('should display the menu with the minimum width', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: {
          items: {
            custom1: {
              name: 'a'
            },
            custom2: {
              name: 'b'
            },
          }
        }
      });

      const $menu = $('.htDropdownMenu');

      dropdownMenu(0);

      expect($menu.find('.wtHider').width()).toEqual(215);
    });

    it('should display a submenu with the minimum width', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: {
          items: {
            custom1: {
              name: 'a'
            },
            custom2: {
              name() {
                return 'Menu';
              },
              submenu: {
                items: [{ name: () => 'Submenu' }]
              }
            }
          }
        }
      });

      dropdownMenu(0);

      const $item = $('.htDropdownMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(1);

      $item.simulate('mouseover');

      await sleep(300);

      const $contextSubMenu = $(`.htDropdownMenuSub_${$item.text()}`);

      expect($contextSubMenu.find('.wtHider').width()).toEqual(215);
    });
  });

  describe('menu opening', () => {
    it('should open menu after click on table header button', () => {
      const hot = handsontable({
        dropdownMenu: true,
        colHeaders: true,
        height: 100
      });

      expect(hot.getPlugin('dropdownMenu')).toBeDefined();
      expect($('.htDropdownMenu').is(':visible')).toBe(false);

      dropdownMenu(0);

      expect($('.htDropdownMenu').is(':visible')).toBe(true);
    });

    it('should open menu after click on table header button when only header cells are visible', () => {
      handsontable({
        data: [],
        colHeaders: ['Year', 'Kia'],
        columns: [{ data: 0 }, { data: 1 }],
        dropdownMenu: true,
        height: 100
      });

      expect($('.htDropdownMenu').is(':visible')).toBe(false);

      dropdownMenu(0);

      expect($('.htDropdownMenu').is(':visible')).toBe(true);
    });
  });

  describe('menu closing', () => {
    it('should close menu after click', function() {
      handsontable({
        dropdownMenu: true,
        colHeaders: true,
        height: 100
      });

      dropdownMenu(0);

      expect($('.htDropdownMenu').is(':visible')).toBe(true);

      mouseDown(this.$container);

      expect($('.htDropdownMenu').is(':visible')).toBe(false);
    });
  });

  describe('menu disabled', () => {
    it('should not open menu after table header button click', () => {
      const hot = handsontable({
        dropdownMenu: true,
        colHeaders: true,
        height: 100
      });

      hot.getPlugin('dropdownMenu').disablePlugin();
      hot.render();

      expect($('.htDropdownMenu').is(':visible')).toBe(false);

      dropdownMenu(0);

      expect($('.htDropdownMenu').is(':visible')).toBe(false);
      expect(hot.view.wt.wtTable.getColumnHeader(0).querySelector('.changeType')).toBe(null);
    });

    it('should not create dropdowm menu if it\'s disabled in constructor options', () => {
      const hot = handsontable({
        dropdownMenu: false,
        colHeaders: true,
        height: 100
      });

      expect(hot.getPlugin('dropdownMenu').isEnabled()).toBe(false);
      expect(hot.view.wt.wtTable.getColumnHeader(0).querySelector('.changeType')).toBe(null);
    });

    it('should reenable menu', () => {
      const hot = handsontable({
        dropdownMenu: true,
        colHeaders: true,
        height: 100
      });

      hot.getPlugin('dropdownMenu').disablePlugin();

      expect($('.htDropdownMenu').is(':visible')).toBe(false);

      dropdownMenu(0);

      expect($('.htDropdownMenu').is(':visible')).toBe(false);

      hot.getPlugin('dropdownMenu').enablePlugin();

      dropdownMenu(0);

      expect($('.htDropdownMenu').is(':visible')).toBe(true);
    });

    it('should reenable menu with updateSettings when it was disabled in constructor', () => {
      const hot = handsontable({
        dropdownMenu: false,
        colHeaders: true,
        height: 100
      });

      expect(hot.getPlugin('dropdownMenu').isEnabled()).toBe(false);

      updateSettings({
        dropdownMenu: true
      });

      expect(hot.getPlugin('dropdownMenu').isEnabled()).toBe(true);

      expect($('.htDropdownMenu').is(':visible')).toBe(false);

      dropdownMenu(0);

      expect($('.htDropdownMenu').is(':visible')).toBe(true);
    });

    it('should disable menu with updateSettings when it was enabled in constructor', () => {
      const hot = handsontable({
        dropdownMenu: true,
        colHeaders: true,
        height: 100
      });

      expect(hot.getPlugin('dropdownMenu').isEnabled()).toBe(true);

      updateSettings({
        dropdownMenu: false
      });

      expect(hot.getPlugin('dropdownMenu').isEnabled()).toBe(false);
    });
  });

  describe('menu destroy', () => {
    it('should close context menu when HOT is being destroyed', () => {
      handsontable({
        dropdownMenu: true,
        colHeaders: true,
        height: 100
      });

      dropdownMenu(0);

      expect($('.htDropdownMenu').is(':visible')).toBe(true);

      destroy();

      expect($('.htDropdownMenu').is(':visible')).toBe(false);
    });
  });

  describe('default context menu actions', () => {
    it('should display the default set of actions', () => {
      handsontable({
        dropdownMenu: true,
        colHeaders: true,
        comments: true,
        height: 100
      });

      dropdownMenu();

      const items = $('.htDropdownMenu tbody td');
      const actions = items.not('.htSeparator');
      const separators = items.filter('.htSeparator');

      expect(actions.length).toEqual(6);
      expect(separators.length).toEqual(4);

      expect(actions.text()).toEqual([
        'Insert column left',
        'Insert column right',
        'Remove column',
        'Clear column',
        'Read only',
        'Alignment',
      ].join(''));
    });

    it('should insert column on the left of selection', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        dropdownMenu: true,
        colHeaders: true,
        width: 400,
        height: 400
      });

      const afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');
      hot.addHook('afterCreateCol', afterCreateColCallback);

      expect(countCols()).toEqual(4);

      dropdownMenu(2);

      // Insert col left
      $('.htDropdownMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(0).simulate('mousedown');

      expect(afterCreateColCallback).toHaveBeenCalledWith(2, 1, 'ContextMenu.columnLeft', undefined, undefined, undefined);
      expect(countCols()).toEqual(5);
    });

    it('should Insert column right of selection', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        dropdownMenu: true,
        colHeaders: true,
        height: 100
      });

      const afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');
      hot.addHook('afterCreateCol', afterCreateColCallback);

      expect(countCols()).toEqual(4);

      dropdownMenu(2);

      // Insert col right
      $('.htDropdownMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(1).simulate('mousedown');

      expect(afterCreateColCallback).toHaveBeenCalledWith(3, 1, 'ContextMenu.columnRight', undefined, undefined, undefined);
      expect(countCols()).toEqual(5);
    });

    it('should remove column', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        dropdownMenu: true,
        colHeaders: true,
        height: 100
      });

      expect(countCols()).toEqual(4);

      dropdownMenu(1);

      // Clear column
      $('.htDropdownMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(2).simulate('mousedown');

      expect(countCols()).toEqual(3);
    });

    it('should clear column data', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        dropdownMenu: true,
        colHeaders: true,
        height: 100
      });

      dropdownMenu(1);

      // Clear column
      $('.htDropdownMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(3).simulate('mousedown');

      expect(hot.getDataAtCell(0, 0)).toBe('A1');
      expect(hot.getDataAtCell(1, 2)).toBe('C2');
      expect(hot.getDataAtCell(2, 3)).toBe('D3');
      expect(hot.getDataAtCell(0, 1)).toBeNull();
      expect(hot.getDataAtCell(1, 1)).toBeNull('');
      expect(hot.getDataAtCell(2, 1)).toBeNull('');
      expect(hot.getDataAtCell(3, 1)).toBeNull('');
    });

    it('should display only the specified actions', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        dropdownMenu: ['clear_column'],
        colHeaders: true,
        height: 100
      });

      dropdownMenu(1);

      expect($('.htDropdownMenu .ht_master .htCore').find('tbody td').length).toEqual(1);
    });
  });

  describe('custom options', () => {
    it('should have custom items list', () => {

      const callback1 = jasmine.createSpy('callback1');
      const callback2 = jasmine.createSpy('callback2');

      handsontable({
        dropdownMenu: {
          items: {
            cust1: {
              name: 'CustomItem1',
              callback: callback1
            },
            cust2: {
              name: 'CustomItem2',
              callback: callback2
            }
          }
        },
        colHeaders: true,
        height: 100
      });

      dropdownMenu();

      expect($('.htDropdownMenu .ht_master .htCore').find('tbody td').length).toEqual(2);
      expect($('.htDropdownMenu .ht_master .htCore').find('tbody td').text()).toEqual(['CustomItem1', 'CustomItem2'].join(''));

      $('.htDropdownMenu .ht_master .htCore').find('tbody td:eq(0)').simulate('mousedown');

      expect(callback1.calls.count()).toEqual(1);
      expect(callback2.calls.count()).toEqual(0);

      dropdownMenu();
      $('.htDropdownMenu .ht_master .htCore').find('tbody td:eq(1)').simulate('mousedown');

      expect(callback1.calls.count()).toEqual(1);
      expect(callback2.calls.count()).toEqual(1);
    });

    it('should have custom items list (defined as a function)', () => {
      let enabled = false;
      handsontable({
        dropdownMenu: {
          items: {
            cust1: {
              name() {
                if (enabled) {
                  return 'Disable my custom option';
                }

                return 'Enable my custom option';
              },
              callback() {

              }
            }
          }
        },
        colHeaders: true,
        height: 100
      });

      dropdownMenu();

      expect($('.htDropdownMenu .ht_master .htCore').find('tbody td').text()).toEqual('Enable my custom option');

      $('.htDropdownMenu .ht_master .htCore').find('tbody td:eq(0)').simulate('mousedown');

      enabled = true;
      dropdownMenu();

      expect($('.htDropdownMenu .ht_master .htCore').find('tbody td').text()).toEqual('Disable my custom option');

      $('.htDropdownMenu .ht_master .htCore').find('tbody td:eq(0)').simulate('mousedown');
    });

    it('should enable to define item options globally', () => {
      const callback = jasmine.createSpy('callback');

      handsontable({
        dropdownMenu: {
          callback,
          items: {
            cust1: {
              name: 'CustomItem1'
            },
            cust2: {
              name: 'CustomItem2'
            }
          }
        },
        colHeaders: true,
        height: 100
      });

      dropdownMenu();

      $('.htDropdownMenu .ht_master .htCore').find('tbody td:eq(0)').simulate('mousedown');

      expect(callback.calls.count()).toEqual(1);

      dropdownMenu();
      $('.htDropdownMenu .ht_master .htCore').find('tbody td:eq(1)').simulate('mousedown');

      expect(callback.calls.count()).toEqual(2);
    });

    it('should override default items options', () => {
      const callback = jasmine.createSpy('callback');

      handsontable({
        dropdownMenu: {
          items: {
            remove_col: {
              callback
            },
            column_clear: {
              name: 'CLEAR'
            }
          }
        },
        colHeaders: true,
        height: 100
      });

      dropdownMenu();

      expect($('.htDropdownMenu .ht_master .htCore').find('tbody td').length).toEqual(2);
      expect($('.htDropdownMenu .ht_master .htCore').find('tbody td').text()).toEqual(['Remove column', 'CLEAR'].join(''));

      $('.htDropdownMenu .ht_master .htCore').find('tbody td:eq(0)').simulate('mousedown');

      expect(callback.calls.count()).toEqual(1);
    });

    it('should fire item callback after item has been clicked', () => {
      const customItem = {
        name: 'Custom item',
        callback() {}
      };

      spyOn(customItem, 'callback');

      handsontable({
        dropdownMenu: {
          items: {
            customItemKey: customItem
          }
        },
        colHeaders: true,
        height: 100
      });

      dropdownMenu();

      $('.htDropdownMenu .ht_master .htCore').find('tbody td:eq(0)').simulate('mousedown');

      expect(customItem.callback.calls.count()).toEqual(1);
      expect(customItem.callback.calls.argsFor(0)[0]).toEqual('customItemKey');
    });
  });

  describe('working with multiple tables', () => {
    beforeEach(function() {
      this.$container2 = $(`<div id="${id}-2"></div>`).appendTo('body');
    });

    afterEach(function() {
      if (this.$container2) {
        this.$container2.handsontable('destroy');
        this.$container2.remove();
      }
    });

    it('should apply enabling/disabling contextMenu using updateSetting only to particular instance of HOT', function() {
      const hot1 = handsontable({
        dropdownMenu: false,
        height: 100
      });
      let hot2 = this.$container2.handsontable({
        dropdownMenu: true,
        height: 100
      });

      hot2 = hot2.handsontable('getInstance');

      expect(hot1.getPlugin('dropdownMenu').isEnabled()).toBe(false);
      expect(hot2.getPlugin('dropdownMenu').isEnabled()).toBe(true);

      hot1.updateSettings({
        dropdownMenu: true
      });
      hot2.updateSettings({
        dropdownMenu: false
      });

      expect(hot1.getPlugin('dropdownMenu').isEnabled()).toBe(true);
      expect(hot2.getPlugin('dropdownMenu').isEnabled()).toBe(false);
    });
  });

  describe('afterDropdownMenuDefaultOptions hook', () => {
    it('should call with dropdown menu options as the first param', () => {
      let options;

      const afterDropdownMenuDefaultOptions = function(options_) {
        options = options_;
        options.items.cust1 = {
          name: 'My custom item',
          callback() {}
        };
      };

      Handsontable.hooks.add('afterDropdownMenuDefaultOptions', afterDropdownMenuDefaultOptions);

      handsontable({
        dropdownMenu: true,
        colHeaders: true,
        height: 100
      });

      dropdownMenu();

      const $menu = $('.htDropdownMenu .ht_master .htCore');

      expect(options).toBeDefined();
      expect(options.items).toBeDefined();
      expect($menu.find('tbody td').text()).toContain('My custom item');

      $menu.find('tbody td:eq(0)').simulate('mousedown');

      Handsontable.hooks.remove('afterDropdownMenuDefaultOptions', afterDropdownMenuDefaultOptions);
    });
  });

  describe('beforeDropdownMenuSetItems hook', () => {
    it('should add new menu item even when item is excluded from plugin settings', () => {
      let hot;

      Handsontable.hooks.add('beforeDropdownMenuSetItems', function(options) {
        if (this === hot || !hot) {
          options.push({
            key: 'test',
            name: 'Test'
          });
        }
      });

      hot = handsontable({
        colHeaders: true,
        dropdownMenu: ['make_read_only'],
        height: 100
      });

      dropdownMenu();

      const items = $('.htDropdownMenu tbody td');
      const actions = items.not('.htSeparator');

      expect(actions.text()).toEqual([
        'Read only',
        'Test',
      ].join(''));
    });

    it('should be called only with items selected in plugin settings', () => {
      let keys = [];
      let hot;

      Handsontable.hooks.add('beforeDropdownMenuSetItems', function(items) {
        if (this === hot || !hot) {
          keys = items.map(v => v.key);
        }
      });

      hot = handsontable({
        colHeaders: true,
        dropdownMenu: ['make_read_only', 'col_left'],
        height: 100
      });

      dropdownMenu();

      expect(keys).toEqual(['make_read_only', 'col_left']);
    });
  });

  it('should be possible undo the alignment process by calling the \'Undo\' action without contextMenu', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(9, 9),
      dropdownMenu: true
    });

    // top 3 rows center
    selectCell(0, 0, 2, 8);
    hot.getPlugin('dropdownMenu').executeCommand('alignment:center');

    // middle 3 rows unchanged - left

    // bottom 3 rows right
    selectCell(6, 0, 8, 8);
    hot.getPlugin('dropdownMenu').executeCommand('alignment:right');

    // left 3 columns - middle
    selectCell(0, 0, 8, 2);
    hot.getPlugin('dropdownMenu').executeCommand('alignment:middle');

    // middle 3 columns unchanged - top

    // right 3 columns - bottom
    selectCell(0, 6, 8, 8);
    hot.getPlugin('dropdownMenu').executeCommand('alignment:bottom');

    let cellMeta = hot.getCellMeta(0, 0);
    expect(cellMeta.className.includes('htCenter')).toBeTruthy();
    expect(cellMeta.className.includes('htMiddle')).toBeTruthy();

    cellMeta = hot.getCellMeta(0, 7);
    expect(cellMeta.className.includes('htCenter')).toBeTruthy();
    expect(cellMeta.className.includes('htBottom')).toBeTruthy();

    cellMeta = hot.getCellMeta(5, 1);
    expect(cellMeta.className.includes('htMiddle')).toBeTruthy();

    cellMeta = hot.getCellMeta(5, 7);
    expect(cellMeta.className.includes('htBottom')).toBeTruthy();

    cellMeta = hot.getCellMeta(7, 1);
    expect(cellMeta.className.includes('htRight')).toBeTruthy();
    expect(cellMeta.className.includes('htMiddle')).toBeTruthy();

    cellMeta = hot.getCellMeta(7, 5);
    expect(cellMeta.className.includes('htRight')).toBeTruthy();

    cellMeta = hot.getCellMeta(7, 7);
    expect(cellMeta.className.includes('htRight')).toBeTruthy();
    expect(cellMeta.className.includes('htBottom')).toBeTruthy();

    hot.undo();
    cellMeta = hot.getCellMeta(0, 7);
    expect(cellMeta.className.includes('htCenter')).toBeTruthy();
    expect(cellMeta.className.includes('htBottom')).toBeFalsy();

    cellMeta = hot.getCellMeta(5, 7);
    expect(cellMeta.className.includes('htBottom')).toBeFalsy();

    cellMeta = hot.getCellMeta(7, 7);
    expect(cellMeta.className.includes('htRight')).toBeTruthy();
    expect(cellMeta.className.includes('htBottom')).toBeFalsy();

    hot.undo();

    cellMeta = hot.getCellMeta(0, 0);
    expect(cellMeta.className.includes('htCenter')).toBeTruthy();
    expect(cellMeta.className.includes('htMiddle')).toBeFalsy();

    cellMeta = hot.getCellMeta(5, 1);
    expect(cellMeta.className.includes('htMiddle')).toBeFalsy();

    cellMeta = hot.getCellMeta(7, 1);
    expect(cellMeta.className.includes('htRight')).toBeTruthy();
    expect(cellMeta.className.includes('htMiddle')).toBeFalsy();

    hot.undo();

    cellMeta = hot.getCellMeta(7, 1);
    expect(cellMeta.className.includes('htRight')).toBeFalsy();
    expect(cellMeta.className.includes('htMiddle')).toBeFalsy();

    cellMeta = hot.getCellMeta(7, 5);
    expect(cellMeta.className.includes('htRight')).toBeFalsy();

    cellMeta = hot.getCellMeta(7, 7);
    expect(cellMeta.className.includes('htRight')).toBeFalsy();
    expect(cellMeta.className.includes('htBottom')).toBeFalsy();
  });

  it('should be possible redo the alignment process by calling the \'Redo\' action without contextMenu', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(9, 9),
      dropdownMenu: true
    });

    // top 3 rows center
    selectCell(0, 0, 2, 8);
    hot.getPlugin('dropdownMenu').executeCommand('alignment:center');

    // middle 3 rows unchanged - left

    // bottom 3 rows right
    selectCell(6, 0, 8, 8);
    hot.getPlugin('dropdownMenu').executeCommand('alignment:right');

    // left 3 columns - middle
    selectCell(0, 0, 8, 2);
    hot.getPlugin('dropdownMenu').executeCommand('alignment:middle');

    // middle 3 columns unchanged - top

    // right 3 columns - bottom
    selectCell(0, 6, 8, 8);
    hot.getPlugin('dropdownMenu').executeCommand('alignment:bottom');

    let cellMeta = hot.getCellMeta(0, 0);
    expect(cellMeta.className.includes('htCenter')).toBeTruthy();
    expect(cellMeta.className.includes('htMiddle')).toBeTruthy();

    cellMeta = hot.getCellMeta(0, 7);
    expect(cellMeta.className.includes('htCenter')).toBeTruthy();
    expect(cellMeta.className.includes('htBottom')).toBeTruthy();

    cellMeta = hot.getCellMeta(5, 1);
    expect(cellMeta.className.includes('htMiddle')).toBeTruthy();

    cellMeta = hot.getCellMeta(5, 7);
    expect(cellMeta.className.includes('htBottom')).toBeTruthy();

    cellMeta = hot.getCellMeta(7, 1);
    expect(cellMeta.className.includes('htRight')).toBeTruthy();
    expect(cellMeta.className.includes('htMiddle')).toBeTruthy();

    cellMeta = hot.getCellMeta(7, 5);
    expect(cellMeta.className.includes('htRight')).toBeTruthy();

    cellMeta = hot.getCellMeta(7, 7);
    expect(cellMeta.className.includes('htRight')).toBeTruthy();
    expect(cellMeta.className.includes('htBottom')).toBeTruthy();

    hot.undo();
    hot.undo();
    hot.undo();
    hot.undo();

    hot.redo();
    cellMeta = hot.getCellMeta(0, 0);
    expect(cellMeta.className.includes('htCenter')).toBeTruthy();
    cellMeta = hot.getCellMeta(1, 5);
    expect(cellMeta.className.includes('htCenter')).toBeTruthy();
    cellMeta = hot.getCellMeta(2, 8);
    expect(cellMeta.className.includes('htCenter')).toBeTruthy();

    hot.redo();
    cellMeta = hot.getCellMeta(6, 0);
    expect(cellMeta.className.includes('htRight')).toBeTruthy();
    cellMeta = hot.getCellMeta(7, 5);
    expect(cellMeta.className.includes('htRight')).toBeTruthy();
    cellMeta = hot.getCellMeta(8, 8);
    expect(cellMeta.className.includes('htRight')).toBeTruthy();

    hot.redo();
    cellMeta = hot.getCellMeta(0, 0);
    expect(cellMeta.className.includes('htMiddle')).toBeTruthy();
    expect(cellMeta.className.includes('htCenter')).toBeTruthy();
    cellMeta = hot.getCellMeta(5, 1);
    expect(cellMeta.className.includes('htMiddle')).toBeTruthy();
    cellMeta = hot.getCellMeta(8, 2);
    expect(cellMeta.className.includes('htMiddle')).toBeTruthy();
    expect(cellMeta.className.includes('htRight')).toBeTruthy();

    hot.redo();
    cellMeta = hot.getCellMeta(0, 6);
    expect(cellMeta.className.includes('htBottom')).toBeTruthy();
    expect(cellMeta.className.includes('htCenter')).toBeTruthy();
    cellMeta = hot.getCellMeta(5, 7);
    expect(cellMeta.className.includes('htBottom')).toBeTruthy();
    cellMeta = hot.getCellMeta(8, 8);
    expect(cellMeta.className.includes('htBottom')).toBeTruthy();
    expect(cellMeta.className.includes('htRight')).toBeTruthy();
  });
});

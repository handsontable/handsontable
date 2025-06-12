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
    it('should disable plugin after call disablePlugin method', async() => {
      handsontable({
        dropdownMenu: true,
        colHeaders: true,
        height: 100
      });

      expect(tableView()._wt.wtTable.getColumnHeader(0).querySelector('.changeType')).not.toBe(null);

      getPlugin('dropdownMenu').disablePlugin();
      await render();

      expect(tableView()._wt.wtTable.getColumnHeader(0).querySelector('.changeType')).toBe(null);
    });

    it('should enable plugin after call enablePlugin method', async() => {
      handsontable({
        dropdownMenu: false,
        colHeaders: true,
        height: 100
      });

      expect(tableView()._wt.wtTable.getColumnHeader(0).querySelector('.changeType')).toBe(null);

      getPlugin('dropdownMenu').enablePlugin();
      await render();

      expect(tableView()._wt.wtTable.getColumnHeader(0).querySelector('.changeType')).not.toBe(null);
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

      await dropdownMenu(0);

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

      await dropdownMenu(0);

      const $item = $('.htDropdownMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(1);

      $item.simulate('mouseover');

      await sleep(300);

      const $contextSubMenu = $(`.htDropdownMenuSub_${$item.text()}`);

      expect($contextSubMenu.find('.wtHider').width()).toEqual(215);
    });
  });

  describe('menu opening', () => {
    it('should open menu after click on table header button', async() => {
      handsontable({
        dropdownMenu: true,
        colHeaders: true,
        height: 100
      });

      expect(getPlugin('dropdownMenu')).toBeDefined();
      expect($('.htDropdownMenu').is(':visible')).toBe(false);

      await dropdownMenu(0);

      expect($('.htDropdownMenu').is(':visible')).toBe(true);
    });

    it('should open menu after click on table header button and do not select any items by default', async() => {
      handsontable({
        dropdownMenu: true,
        colHeaders: true,
        height: 100
      });

      await dropdownMenu(0);

      const menu = getPlugin('dropdownMenu').menu;

      expect(menu.getSelectedItem()).toBe(null);
      expect(document.activeElement).toBe(menu.hotMenu.rootElement);
    });

    it('should be possible to define a custom container for DropdownMenu\'s UI elements', async() => {
      const uiContainer = $('<div/>').addClass('uiContainer');

      spec().$container.append(uiContainer);

      handsontable({
        colHeaders: true,
        dropdownMenu: {
          uiContainer: uiContainer[0],
        },
      });

      await dropdownMenu(0);

      expect($('.uiContainer .htDropdownMenu').is(':visible')).toBe(true);
    });

    it('should open menu after click on table header button when only header cells are visible', async() => {
      handsontable({
        data: [],
        colHeaders: ['Year', 'Kia'],
        columns: [{ data: 0 }, { data: 1 }],
        dropdownMenu: true,
        height: 100
      });

      expect($('.htDropdownMenu').is(':visible')).toBe(false);

      await dropdownMenu(0);

      expect($('.htDropdownMenu').is(':visible')).toBe(true);
    });
  });

  describe('menu closing', () => {
    it('should close menu after click', async() => {
      handsontable({
        dropdownMenu: true,
        colHeaders: true,
        height: 100
      });

      await dropdownMenu(0);

      expect($('.htDropdownMenu').is(':visible')).toBe(true);

      await mouseDown(spec().$container);

      expect($('.htDropdownMenu').is(':visible')).toBe(false);
    });
  });

  describe('menu disabled', () => {
    it('should not open menu after table header button click', async() => {
      handsontable({
        dropdownMenu: true,
        colHeaders: true,
        height: 100
      });

      getPlugin('dropdownMenu').disablePlugin();

      await render();

      expect($('.htDropdownMenu').is(':visible')).toBe(false);

      await dropdownMenu(0);

      expect($('.htDropdownMenu').is(':visible')).toBe(false);
      expect(tableView()._wt.wtTable.getColumnHeader(0).querySelector('.changeType')).toBe(null);
    });

    it('should not create dropdowm menu if it\'s disabled in constructor options', async() => {
      handsontable({
        dropdownMenu: false,
        colHeaders: true,
        height: 100
      });

      expect(getPlugin('dropdownMenu').isEnabled()).toBe(false);
      expect(tableView()._wt.wtTable.getColumnHeader(0).querySelector('.changeType')).toBe(null);
    });

    it('should reenable menu', async() => {
      handsontable({
        dropdownMenu: true,
        colHeaders: true,
        height: 100
      });

      getPlugin('dropdownMenu').disablePlugin();

      expect($('.htDropdownMenu').is(':visible')).toBe(false);

      await dropdownMenu(0);

      expect($('.htDropdownMenu').is(':visible')).toBe(false);

      getPlugin('dropdownMenu').enablePlugin();

      await dropdownMenu(0);

      expect($('.htDropdownMenu').is(':visible')).toBe(true);
    });

    it('should reenable menu with updateSettings when it was disabled in constructor', async() => {
      handsontable({
        dropdownMenu: false,
        colHeaders: true,
        height: 100
      });

      expect(getPlugin('dropdownMenu').isEnabled()).toBe(false);

      await updateSettings({
        dropdownMenu: true
      });

      expect(getPlugin('dropdownMenu').isEnabled()).toBe(true);

      expect($('.htDropdownMenu').is(':visible')).toBe(false);

      await dropdownMenu(0);

      expect($('.htDropdownMenu').is(':visible')).toBe(true);
    });

    it('should disable menu with updateSettings when it was enabled in constructor', async() => {
      handsontable({
        dropdownMenu: true,
        colHeaders: true,
        height: 100
      });

      expect(getPlugin('dropdownMenu').isEnabled()).toBe(true);

      await updateSettings({
        dropdownMenu: false
      });

      expect(getPlugin('dropdownMenu').isEnabled()).toBe(false);
    });
  });

  describe('menu destroy', () => {
    it('should close context menu when HOT is being destroyed', async() => {
      handsontable({
        dropdownMenu: true,
        colHeaders: true,
        height: 100
      });

      await dropdownMenu(0);

      expect($('.htDropdownMenu').is(':visible')).toBe(true);

      destroy();

      expect($('.htDropdownMenu').is(':visible')).toBe(false);
    });
  });

  describe('selection', () => {
    it('should continue menu navigation from the position of the lastly highlighted item by mouse', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        colHeaders: true,
        dropdownMenu: true,
        height: 400
      });

      await dropdownMenu(1);

      $('.htDropdownMenu .ht_master .htCore tbody td')
        .not('.htSeparator')
        .eq(2) // "Insert column left"
        .simulate('mousemove')
        .simulate('mouseenter')
        .simulate('mouseover');

      expect(getPlugin('dropdownMenu').menu.getNavigator().getCurrentPage()).toBe(3);
      expect(getPlugin('dropdownMenu').menu.getSelectedItem()?.key).forThemes(({ classic, main, horizon }) => {
        classic.toEqual('remove_col');
        main.toEqual(undefined);
        horizon.toEqual(undefined);
      });

      await keyDownUp('arrowDown');

      expect(getPlugin('dropdownMenu').menu.getNavigator().getCurrentPage()).toBe(5);
      expect(getPlugin('dropdownMenu').menu.getSelectedItem()?.key).forThemes(({ classic, main, horizon }) => {
        classic.toEqual('clear_column');
        main.toEqual('clear_column');
        horizon.toEqual('clear_column');
      });
    });
  });

  describe('default context menu actions', () => {
    it('should display the default set of actions', async() => {
      handsontable({
        dropdownMenu: true,
        colHeaders: true,
        comments: true,
        height: 100
      });

      await dropdownMenu();

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

    it('should insert column on the left of selection', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        dropdownMenu: true,
        colHeaders: true,
        width: 400,
        height: 400
      });

      const afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');

      addHook('afterCreateCol', afterCreateColCallback);

      expect(countCols()).toEqual(4);

      await dropdownMenu(2);
      await selectDropdownMenuOption('Insert column left');

      expect(afterCreateColCallback)
        .toHaveBeenCalledWith(2, 1, 'ContextMenu.columnLeft');
      expect(countCols()).toEqual(5);
    });

    it('should Insert column right of selection', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        dropdownMenu: true,
        colHeaders: true,
        height: 100
      });

      const afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');

      addHook('afterCreateCol', afterCreateColCallback);

      expect(countCols()).toEqual(4);

      await dropdownMenu(2);
      await selectDropdownMenuOption('Insert column right');

      expect(afterCreateColCallback).toHaveBeenCalledWith(3, 1, 'ContextMenu.columnRight');
      expect(countCols()).toEqual(5);
    });

    it('should remove column', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        dropdownMenu: true,
        colHeaders: true,
        height: 100
      });

      expect(countCols()).toEqual(4);

      await dropdownMenu(1);
      await selectDropdownMenuOption('Remove column');

      expect(countCols()).toEqual(3);
    });

    it('should clear column data', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        dropdownMenu: true,
        colHeaders: true,
        height: 100
      });

      await dropdownMenu(1);
      await selectDropdownMenuOption('Clear column');

      expect(getDataAtCell(0, 0)).toBe('A1');
      expect(getDataAtCell(1, 2)).toBe('C2');
      expect(getDataAtCell(2, 3)).toBe('D3');
      expect(getDataAtCell(0, 1)).toBeNull();
      expect(getDataAtCell(1, 1)).toBeNull('');
      expect(getDataAtCell(2, 1)).toBeNull('');
      expect(getDataAtCell(3, 1)).toBeNull('');
    });

    it('should display only the specified actions', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        dropdownMenu: ['clear_column'],
        colHeaders: true,
        height: 100
      });

      await dropdownMenu(1);

      expect($('.htDropdownMenu .ht_master .htCore').find('tbody td').length).toEqual(1);
    });

    it('should highlight menu items after hovering them', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        colHeaders: true,
        dropdownMenu: true,
        height: 400
      });

      await dropdownMenu(1);

      $('.htDropdownMenu .ht_master .htCore tbody td')
        .not('.htSeparator')
        .eq(2) // "Insert column left"
        .simulate('mousemove')
        .simulate('mouseenter')
        .simulate('mouseover');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem()?.key).forThemes(({ classic, main, horizon }) => {
        classic.toEqual('remove_col');
        main.toEqual(undefined);
        horizon.toEqual(undefined);
      });
    });
  });

  describe('custom options', () => {
    it('should have custom items list', async() => {

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

      await dropdownMenu();

      expect($('.htDropdownMenu .ht_master .htCore').find('tbody td').length).toEqual(2);
      expect($('.htDropdownMenu .ht_master .htCore').find('tbody td').text())
        .toEqual(['CustomItem1', 'CustomItem2'].join(''));

      await selectDropdownMenuOption('CustomItem1');

      expect(callback1.calls.count()).toEqual(1);
      expect(callback2.calls.count()).toEqual(0);

      await dropdownMenu();
      await selectDropdownMenuOption('CustomItem2');

      expect(callback1.calls.count()).toEqual(1);
      expect(callback2.calls.count()).toEqual(1);
    });

    it('should have custom items list (defined as a function)', async() => {
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

      await dropdownMenu();

      expect($('.htDropdownMenu .ht_master .htCore').find('tbody td').text()).toEqual('Enable my custom option');

      await selectDropdownMenuOption('Enable my custom option');

      enabled = true;
      await dropdownMenu();

      expect($('.htDropdownMenu .ht_master .htCore').find('tbody td').text()).toEqual('Disable my custom option');

      await selectDropdownMenuOption('Disable my custom option');
    });

    it('should enable to define item options globally', async() => {
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

      await dropdownMenu();

      await selectDropdownMenuOption('CustomItem1');

      expect(callback.calls.count()).toEqual(1);

      await dropdownMenu();
      await selectDropdownMenuOption('CustomItem2');

      expect(callback.calls.count()).toEqual(2);
    });

    it('should override default items options', async() => {
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

      await dropdownMenu();

      expect($('.htDropdownMenu .ht_master .htCore').find('tbody td').length).toEqual(2);
      expect($('.htDropdownMenu .ht_master .htCore').find('tbody td').text())
        .toEqual(['Remove column', 'CLEAR'].join(''));

      await selectDropdownMenuOption('Remove column');

      expect(callback.calls.count()).toEqual(1);
    });

    it('should fire item callback after item has been clicked', async() => {
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

      await dropdownMenu();
      await selectDropdownMenuOption('Custom item');

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

    it('should apply enabling/disabling contextMenu using updateSetting only to particular instance of HOT', async() => {
      const hot1 = handsontable({
        dropdownMenu: false,
        height: 100
      });
      let hot2 = spec().$container2.handsontable({
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
    it('should call with dropdown menu options as the first param', async() => {
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

      await dropdownMenu();

      const $menu = $('.htDropdownMenu .ht_master .htCore');

      expect(options).toBeDefined();
      expect(options.items).toBeDefined();
      expect($menu.find('tbody td').text()).toContain('My custom item');

      await selectDropdownMenuOption('My custom item');

      Handsontable.hooks.remove('afterDropdownMenuDefaultOptions', afterDropdownMenuDefaultOptions);
    });
  });

  describe('beforeDropdownMenuSetItems hook', () => {
    it('should add new menu item even when item is excluded from plugin settings', async() => {
      const hookListener = function(options) {
        options.push({
          key: 'test',
          name: 'Test'
        });
      };

      Handsontable.hooks.add('beforeDropdownMenuSetItems', hookListener);

      handsontable({
        colHeaders: true,
        dropdownMenu: ['make_read_only'],
        height: 100
      });

      await dropdownMenu();
      await sleep(200);

      const items = $('.htDropdownMenu tbody td');
      const actions = items.not('.htSeparator');

      expect(actions.text()).toEqual([
        'Read only',
        'Test',
      ].join(''));

      Handsontable.hooks.remove('beforeDropdownMenuSetItems', hookListener);
    });

    it('should be called only with items selected in plugin settings', async() => {
      let keys = [];
      const hookListener = function(items) {
        keys = items.map(v => v.key);
      };

      Handsontable.hooks.add('beforeDropdownMenuSetItems', hookListener);

      handsontable({
        colHeaders: true,
        dropdownMenu: ['make_read_only', 'col_left'],
        height: 100
      });

      await dropdownMenu();
      await sleep(200);

      expect(keys).toEqual(['make_read_only', 'col_left']);

      Handsontable.hooks.remove('beforeDropdownMenuSetItems', hookListener);
    });
  });

  it('should be possible undo the alignment process by calling the \'Undo\' action without contextMenu', async() => {
    handsontable({
      data: createSpreadsheetData(9, 9),
      dropdownMenu: true
    });

    // top 3 rows center
    await selectCell(0, 0, 2, 8);

    getPlugin('dropdownMenu').executeCommand('alignment:center');

    // middle 3 rows unchanged - left

    // bottom 3 rows right
    await selectCell(6, 0, 8, 8);

    getPlugin('dropdownMenu').executeCommand('alignment:right');

    // left 3 columns - middle
    await selectCell(0, 0, 8, 2);

    getPlugin('dropdownMenu').executeCommand('alignment:middle');

    // middle 3 columns unchanged - top

    // right 3 columns - bottom
    await selectCell(0, 6, 8, 8);

    getPlugin('dropdownMenu').executeCommand('alignment:bottom');

    let cellMeta = getCellMeta(0, 0);

    expect(cellMeta.className.includes('htCenter')).toBeTruthy();
    expect(cellMeta.className.includes('htMiddle')).toBeTruthy();

    cellMeta = getCellMeta(0, 7);
    expect(cellMeta.className.includes('htCenter')).toBeTruthy();
    expect(cellMeta.className.includes('htBottom')).toBeTruthy();

    cellMeta = getCellMeta(5, 1);
    expect(cellMeta.className.includes('htMiddle')).toBeTruthy();

    cellMeta = getCellMeta(5, 7);
    expect(cellMeta.className.includes('htBottom')).toBeTruthy();

    cellMeta = getCellMeta(7, 1);
    expect(cellMeta.className.includes('htRight')).toBeTruthy();
    expect(cellMeta.className.includes('htMiddle')).toBeTruthy();

    cellMeta = getCellMeta(7, 5);
    expect(cellMeta.className.includes('htRight')).toBeTruthy();

    cellMeta = getCellMeta(7, 7);
    expect(cellMeta.className.includes('htRight')).toBeTruthy();
    expect(cellMeta.className.includes('htBottom')).toBeTruthy();

    getPlugin('undoRedo').undo();
    cellMeta = getCellMeta(0, 7);
    expect(cellMeta.className.includes('htCenter')).toBeTruthy();
    expect(cellMeta.className.includes('htBottom')).toBeFalsy();

    cellMeta = getCellMeta(5, 7);
    expect(cellMeta.className.includes('htBottom')).toBeFalsy();

    cellMeta = getCellMeta(7, 7);
    expect(cellMeta.className.includes('htRight')).toBeTruthy();
    expect(cellMeta.className.includes('htBottom')).toBeFalsy();

    getPlugin('undoRedo').undo();

    cellMeta = getCellMeta(0, 0);
    expect(cellMeta.className.includes('htCenter')).toBeTruthy();
    expect(cellMeta.className.includes('htMiddle')).toBeFalsy();

    cellMeta = getCellMeta(5, 1);
    expect(cellMeta.className.includes('htMiddle')).toBeFalsy();

    cellMeta = getCellMeta(7, 1);
    expect(cellMeta.className.includes('htRight')).toBeTruthy();
    expect(cellMeta.className.includes('htMiddle')).toBeFalsy();

    getPlugin('undoRedo').undo();

    cellMeta = getCellMeta(7, 1);
    expect(cellMeta.className.includes('htRight')).toBeFalsy();
    expect(cellMeta.className.includes('htMiddle')).toBeFalsy();

    cellMeta = getCellMeta(7, 5);
    expect(cellMeta.className.includes('htRight')).toBeFalsy();

    cellMeta = getCellMeta(7, 7);
    expect(cellMeta.className.includes('htRight')).toBeFalsy();
    expect(cellMeta.className.includes('htBottom')).toBeFalsy();
  });

  it('should be possible redo the alignment process by calling the \'Redo\' action without contextMenu', async() => {
    handsontable({
      data: createSpreadsheetData(9, 9),
      dropdownMenu: true
    });

    // top 3 rows center
    await selectCell(0, 0, 2, 8);

    getPlugin('dropdownMenu').executeCommand('alignment:center');

    // middle 3 rows unchanged - left

    // bottom 3 rows right
    await selectCell(6, 0, 8, 8);

    getPlugin('dropdownMenu').executeCommand('alignment:right');

    // left 3 columns - middle
    await selectCell(0, 0, 8, 2);

    getPlugin('dropdownMenu').executeCommand('alignment:middle');

    // middle 3 columns unchanged - top

    // right 3 columns - bottom
    await selectCell(0, 6, 8, 8);

    getPlugin('dropdownMenu').executeCommand('alignment:bottom');

    let cellMeta = getCellMeta(0, 0);

    expect(cellMeta.className.includes('htCenter')).toBeTruthy();
    expect(cellMeta.className.includes('htMiddle')).toBeTruthy();

    cellMeta = getCellMeta(0, 7);
    expect(cellMeta.className.includes('htCenter')).toBeTruthy();
    expect(cellMeta.className.includes('htBottom')).toBeTruthy();

    cellMeta = getCellMeta(5, 1);
    expect(cellMeta.className.includes('htMiddle')).toBeTruthy();

    cellMeta = getCellMeta(5, 7);
    expect(cellMeta.className.includes('htBottom')).toBeTruthy();

    cellMeta = getCellMeta(7, 1);
    expect(cellMeta.className.includes('htRight')).toBeTruthy();
    expect(cellMeta.className.includes('htMiddle')).toBeTruthy();

    cellMeta = getCellMeta(7, 5);
    expect(cellMeta.className.includes('htRight')).toBeTruthy();

    cellMeta = getCellMeta(7, 7);
    expect(cellMeta.className.includes('htRight')).toBeTruthy();
    expect(cellMeta.className.includes('htBottom')).toBeTruthy();

    getPlugin('undoRedo').undo();
    getPlugin('undoRedo').undo();
    getPlugin('undoRedo').undo();
    getPlugin('undoRedo').undo();

    getPlugin('undoRedo').redo();
    cellMeta = getCellMeta(0, 0);
    expect(cellMeta.className.includes('htCenter')).toBeTruthy();
    cellMeta = getCellMeta(1, 5);
    expect(cellMeta.className.includes('htCenter')).toBeTruthy();
    cellMeta = getCellMeta(2, 8);
    expect(cellMeta.className.includes('htCenter')).toBeTruthy();

    getPlugin('undoRedo').redo();
    cellMeta = getCellMeta(6, 0);
    expect(cellMeta.className.includes('htRight')).toBeTruthy();
    cellMeta = getCellMeta(7, 5);
    expect(cellMeta.className.includes('htRight')).toBeTruthy();
    cellMeta = getCellMeta(8, 8);
    expect(cellMeta.className.includes('htRight')).toBeTruthy();

    getPlugin('undoRedo').redo();
    cellMeta = getCellMeta(0, 0);
    expect(cellMeta.className.includes('htMiddle')).toBeTruthy();
    expect(cellMeta.className.includes('htCenter')).toBeTruthy();
    cellMeta = getCellMeta(5, 1);
    expect(cellMeta.className.includes('htMiddle')).toBeTruthy();
    cellMeta = getCellMeta(8, 2);
    expect(cellMeta.className.includes('htMiddle')).toBeTruthy();
    expect(cellMeta.className.includes('htRight')).toBeTruthy();

    getPlugin('undoRedo').redo();
    cellMeta = getCellMeta(0, 6);
    expect(cellMeta.className.includes('htBottom')).toBeTruthy();
    expect(cellMeta.className.includes('htCenter')).toBeTruthy();
    cellMeta = getCellMeta(5, 7);
    expect(cellMeta.className.includes('htBottom')).toBeTruthy();
    cellMeta = getCellMeta(8, 8);
    expect(cellMeta.className.includes('htBottom')).toBeTruthy();
    expect(cellMeta.className.includes('htRight')).toBeTruthy();
  });

  it('should not scroll the viewport after clicking the button in the header of the partially visible column', async() => {
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

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(651); // 900 column width - 250 viewport width + 1 header border compensation
      main.toBe(666);
      horizon.toBe(666);
    });

    await dropdownMenu(6); // click on the column `G` header button

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(651);
      main.toBe(666);
      horizon.toBe(666);
    });
  });
});

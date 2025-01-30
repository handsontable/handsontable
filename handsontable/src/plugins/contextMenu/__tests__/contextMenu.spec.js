describe('ContextMenu', () => {
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

  it('should update context menu items by calling `updateSettings` method', async() => {
    handsontable({
      contextMenu: ['row_above', 'row_below', '---------', 'remove_row'],
      height: 100
    });

    contextMenu();

    let items = $('.htContextMenu tbody td');
    let actions = items.not('.htSeparator');
    let separators = items.filter('.htSeparator');

    expect(actions.length).toEqual(3);
    expect(separators.length).toEqual(1);

    expect(actions.text()).toEqual([
      'Insert row above',
      'Insert row below',
      'Remove row',
    ].join(''));

    updateSettings({
      contextMenu: ['remove_row']
    });

    await sleep(300);

    contextMenu();

    items = $('.htContextMenu tbody td');
    actions = items.not('.htSeparator');
    separators = items.filter('.htSeparator');

    expect(actions.length).toEqual(1);
    expect(separators.length).toEqual(0);

    expect(actions.text()).toEqual([
      'Remove row',
    ].join(''));

    updateSettings({
      contextMenu: {
        items: {
          remove_col: true,
          hsep1: '---------',
          custom: { name: 'My custom item' },
        }
      }
    });

    await sleep(300);

    contextMenu();

    items = $('.htContextMenu tbody td');
    actions = items.not('.htSeparator');
    separators = items.filter('.htSeparator');

    expect(actions.length).toEqual(2);
    expect(separators.length).toEqual(1);

    expect(actions.text()).toEqual([
      'Remove column',
      'My custom item',
    ].join(''));
  });

  describe('menu width', () => {
    it('should display the menu with the minimum width', async() => {
      handsontable({
        contextMenu: {
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

      const $menu = $('.htContextMenu');

      contextMenu();

      await sleep(300);

      expect($menu.find('.wtHider').width()).toEqual(215);
      expect($menu.width()).forThemes(({ classic, main }) => {
        classic.toEqual(215);
        main.toEqual(217);
      });
    });

    it('should expand menu when one of items is wider then default width of the menu', async() => {
      handsontable({
        contextMenu: {
          items: {
            custom1: {
              name: 'a'
            },
            custom2: {
              name: 'This is very long text which should expand the context menu...'
            },
          }
        }
      });

      const $menu = $('.htContextMenu');

      contextMenu();

      await sleep(300);

      expect($menu.find('.wtHider').width()).toBeGreaterThanOrEqual(355);
    });

    it('should display a submenu with the minimum width', async() => {
      handsontable({
        contextMenu: {
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

      contextMenu();

      await sleep(300);

      const $item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(1);

      $item.simulate('mouseover');

      await sleep(300);

      const $contextSubMenu = $(`.htContextMenuSub_${$item.text()}`);

      expect($contextSubMenu.find('.wtHider').width()).toEqual(215);
    });
  });

  describe('menu opening', () => {
    it('should open menu after right click on table cell', () => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      expect(getPlugin('contextMenu')).toBeDefined();
      expect($('.htContextMenu').is(':visible')).toBe(false);

      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it('should open menu after right click on table cell and do not select any items by default', () => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      contextMenu();

      const menu = getPlugin('contextMenu').menu;

      expect(menu.getSelectedItem()).toBe(null);
      expect(document.activeElement).toBe(menu.hotMenu.rootElement);
    });

    it('should not open context menu after right click on inner htCore', async() => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      contextMenu();

      let eventPrevented = false;
      const rewriteEventPrevention = (e) => {
        eventPrevented = e.defaultPrevented;
      };

      document.addEventListener('contextmenu', rewriteEventPrevention);

      const contextMenuHtCore = $('.htContextMenu .ht_master .htCore')[0];
      const contextmenuEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });

      contextMenuHtCore.dispatchEvent(contextmenuEvent);
      document.removeEventListener('contextmenu', rewriteEventPrevention);

      expect(eventPrevented).toBe(true);
    });

    it('should be possible to define a custom container for ContextMenu\'s UI elements', () => {
      const uiContainer = $('<div/>').addClass('uiContainer');

      spec().$container.append(uiContainer);

      handsontable({
        contextMenu: {
          uiContainer: uiContainer[0],
        },
      });

      contextMenu();

      expect($('.uiContainer .htContextMenu').is(':visible')).toBe(true);
    });

    it('should finish selection after right click on table cell', () => {
      const hot = handsontable({
        contextMenu: true,
      });

      const cell = getCell(0, 0);
      const cellOffset = $(cell).offset();

      $(cell).simulate('mousedown', { button: 2 });
      $(cell).simulate('contextmenu', {
        clientX: cellOffset.left - hot.rootWindow.scrollX,
        clientY: cellOffset.top - hot.rootWindow.scrollY,
      });

      expect(hot.selection.isInProgress()).toBe(false);
    });

    it('should call every selection hooks after right click on table cell', () => {
      const hot = handsontable({
        contextMenu: true,
      });

      const afterSelectionCallback = jasmine.createSpy('afterSelectionCallback');
      const afterSelectionByPropCallback = jasmine.createSpy('afterSelectionByPropCallback');
      const afterSelectionEndCallback = jasmine.createSpy('afterSelectionEndCallback');
      const afterSelectionEndByPropCallback = jasmine.createSpy('afterSelectionEndByPropCallback');

      addHook('afterSelection', afterSelectionCallback);
      addHook('afterSelectionByProp', afterSelectionByPropCallback);
      addHook('afterSelectionEnd', afterSelectionEndCallback);
      addHook('afterSelectionEndByProp', afterSelectionEndByPropCallback);

      const cell = getCell(0, 0);
      const cellOffset = $(cell).offset();

      $(cell).simulate('mousedown', { button: 2 });
      $(cell).simulate('contextmenu', {
        clientX: cellOffset.left - hot.rootWindow.scrollX,
        clientY: cellOffset.top - hot.rootWindow.scrollY,
      });

      expect(afterSelectionCallback.calls.count()).toEqual(1);
      expect(afterSelectionByPropCallback.calls.count()).toEqual(1);
      expect(afterSelectionEndCallback.calls.count()).toEqual(1);
      expect(afterSelectionEndByPropCallback.calls.count()).toEqual(1);
      expect(afterSelectionCallback).toHaveBeenCalledWith(0, 0, 0, 0, jasmine.any(Object), 0);
      expect(afterSelectionByPropCallback).toHaveBeenCalledWith(0, 0, 0, 0, jasmine.any(Object), 0);
      expect(afterSelectionEndCallback).toHaveBeenCalledWith(0, 0, 0, 0, 0);
      expect(afterSelectionEndByPropCallback).toHaveBeenCalledWith(0, 0, 0, 0, 0);
    });

    it('should not open the menu after clicking an open editor', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(2, 2);
      keyDownUp('enter');

      expect(getPlugin('contextMenu')).toBeDefined();
      expect($('.htContextMenu').is(':visible')).toBe(false);

      contextMenu(getActiveEditor().TEXTAREA);

      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should open menu after right click on header cell when only header cells are visible', () => {
      const hot = handsontable({
        data: [],
        colHeaders: ['Year', 'Kia'],
        columns: [{ data: 0 }, { data: 1 }],
        contextMenu: true,
        height: 100
      });

      expect(hot.getPlugin('contextMenu')).toBeDefined();
      expect($('.htContextMenu').is(':visible')).toBe(false);

      contextMenu(hot.rootElement.querySelector('.ht_clone_top thead th'));

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it('should open menu after right click on selected column header (the current selection should not be changed)', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 10),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        height: 100
      });

      selectColumns(1, 4);

      expect(hot.getPlugin('contextMenu')).toBeDefined();
      expect($('.htContextMenu').is(':visible')).toBe(false);

      contextMenu(hot.rootElement.querySelector('.ht_clone_top thead th:nth-child(4)'));

      expect($('.htContextMenu').is(':visible')).toBe(true);
      expect(`
        |   ║   : * : * : * : * :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===:===|
        | - ║   : A : 0 : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should open menu after right click on selected row header (the current selection should not be changed)', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 10),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        height: 100
      });

      selectRows(1, 3);

      expect(hot.getPlugin('contextMenu')).toBeDefined();
      expect($('.htContextMenu').is(':visible')).toBe(false);

      contextMenu(hot.rootElement.querySelector('.ht_clone_inline_start tbody tr:nth-child(3) th'));

      expect($('.htContextMenu').is(':visible')).toBe(true);
      expect(`
        |   ║ - : - : - : - : - : - : - : - : - : - |
        |===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   |
        | * ║ A : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should open menu after right click on header corner', () => {
      const hot = handsontable({
        data: [],
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        height: 100
      });

      expect(hot.getPlugin('contextMenu')).toBeDefined();
      expect($('.htContextMenu').is(':visible')).toBe(false);

      contextMenu(hot.rootElement.querySelector('.ht_clone_top_inline_start_corner thead th'));

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it('should open menu after right click active cell border', () => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      expect(getPlugin('contextMenu')).toBeDefined();
      expect($('.htContextMenu').is(':visible')).toBe(false);

      selectCell(0, 0);

      spec().$container.find('.wtBorder.current:eq(0)').simulate('contextmenu');

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });
  });

  describe('menu closing', () => {
    it('should close menu after click', () => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);

      mouseDown(spec().$container);

      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should close menu after left click on menu item (Windows OS simulation)', () => {
      Handsontable.helper.setPlatformMeta({ platform: 'Win' }); // Let HoT think that it runs on Windows OS
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: ['row_above', 'remove_row', '---------', 'alignment'],
        height: 400,
      });

      selectCell(0, 0);
      contextMenu();
      selectContextMenuOption('Insert row above');

      expect($('.htContextMenu').is(':visible')).toBe(false);

      Handsontable.helper.setPlatformMeta(); // Reset platform
    });

    it('should close menu after left click on menu item (macOS and others OS simulation)', () => {
      Handsontable.helper.setPlatformMeta({ platform: 'MacIntel' }); // Let HoT think that it runs on macOS
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: ['row_above', 'remove_row', '---------', 'alignment'],
        height: 400,
      });

      selectCell(0, 0);
      contextMenu();
      selectContextMenuOption('Insert row above');

      expect($('.htContextMenu').is(':visible')).toBe(false);

      Handsontable.helper.setPlatformMeta(); // Reset platform
    });

    it('should close menu after right click on menu item (Windows OS simulation, #6507#issuecomment-582392301)', () => {
      Handsontable.helper.setPlatformMeta({ platform: 'Win' }); // Let HoT think that it runs on Windows OS
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: ['row_above', 'remove_row', '---------', 'alignment'],
        height: 400,
        beforeOnCellContextMenu(event) {
          // Block event propagation to test if the "contextmenu" handler closes the menu.
          Handsontable.dom.stopImmediatePropagation(event);
        }
      });

      selectCell(0, 0);
      contextMenu();

      // Order of events occurrence on Windows machines is "mousedown" -> "mouseup" -> "contextmenu" (other OS'
      // have "mousedown" -> "contextmenu" -> "mouseup").
      $('.htContextMenu .ht_master .htCore')
        .find('tbody td')
        .not('.htSeparator')
        .eq(0)
        .simulate('mouseenter', { button: 2 })
        .simulate('mousedown', { button: 2 })
        .simulate('mouseup', { button: 2 })
        .simulate('contextmenu');

      expect($('.htContextMenu').is(':visible')).toBe(false);

      Handsontable.helper.setPlatformMeta(); // Reset platform
    });

    it('should close menu after right click on menu item (mac OS and others OS simulation, #6507#issuecomment-582392301)', () => {
      Handsontable.helper.setPlatformMeta({ platform: 'MacIntel' }); // Let HoT think that it runs on macOS
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: ['row_above', 'remove_row', '---------', 'alignment'],
        height: 400,
      });

      selectCell(0, 0);
      contextMenu();

      // Order of events occurrence on macOS machines is "mousedown" -> "contextmenu" -> "mouseup"
      $('.htContextMenu .ht_master .htCore')
        .find('tbody td')
        .not('.htSeparator')
        .eq(0)
        .simulate('mouseenter', { button: 2 })
        .simulate('mousedown', { button: 2 })
        .simulate('contextmenu')
        .simulate('mouseup', { button: 2 });

      expect($('.htContextMenu').is(':visible')).toBe(false);

      Handsontable.helper.setPlatformMeta(); // Reset platform
    });

    it('should close menu after click under the menu', () => {
      handsontable({
        data: createSpreadsheetData(500, 10),
        contextMenu: ['row_above', 'remove_row'],
        height: 500
      });

      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);

      const rect = $('.htContextMenu')[0].getBoundingClientRect();
      const x = parseInt(rect.left + (rect.width / 2), 10);
      const y = parseInt(rect.top + rect.height, 10) + 3;

      mouseDown(document.elementFromPoint(x, y));

      expect($('.htContextMenu').is(':visible')).toBe(false);
    });
  });

  describe('menu disabled', () => {
    it('should not open menu after right click', () => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      getPlugin('contextMenu').disablePlugin();

      expect($('.htContextMenu').is(':visible')).toBe(false);

      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should not create context menu if it\'s disabled in constructor options', () => {
      handsontable({
        contextMenu: false,
        height: 100
      });

      expect(getPlugin('contextMenu').isEnabled()).toBe(false);
    });

    it('should reenable menu', async() => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      const plugin = getPlugin('contextMenu');

      plugin.disablePlugin();

      expect($('.htContextMenu').is(':visible')).toBe(false);

      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(false);

      plugin.enablePlugin();

      await sleep(300);

      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it('should reenable menu with updateSettings when it was disabled in constructor', async() => {
      handsontable({
        contextMenu: false,
        height: 100
      });

      const plugin = getPlugin('contextMenu');

      expect(plugin.isEnabled()).toBe(false);

      updateSettings({
        contextMenu: true
      });

      expect(plugin.isEnabled()).toBe(true);

      expect($('.htContextMenu').is(':visible')).toBe(false);

      contextMenu();

      await sleep(300);

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it('should disable menu with updateSettings when it was enabled in constructor', () => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      const plugin = getPlugin('contextMenu');

      expect(plugin.isEnabled()).toBe(true);

      updateSettings({
        contextMenu: false
      });

      expect(plugin.isEnabled()).toBe(false);
    });

    it('should work properly (remove row) after destroy and new init', () => {
      const test = function() {
        handsontable({
          startRows: 5,
          contextMenu: ['remove_row'],
          height: 100
        });

        selectCell(0, 0);
        contextMenu();
        selectContextMenuOption('Remove row');

        expect(getData().length).toEqual(4);
      };

      test();
      destroy();
      test();
    });
  });

  describe('menu hidden items', () => {
    it('should remove separators from top, bottom and duplicated', () => {
      handsontable({
        contextMenu: [
          '---------',
          '---------',
          'row_above',
          '---------',
          '---------',
          'row_below',
          '---------',
          'remove_row'
        ],
        height: 100
      });

      contextMenu();

      const items = $('.htContextMenu tbody td');
      const actions = items.not('.htSeparator');
      const separators = items.filter('.htSeparator');

      expect(actions.length).toEqual(3);
      expect(separators.length).toEqual(2);
    });

    it('should hide option if hidden function return true', () => {
      handsontable({
        startCols: 5,
        colHeaders: true,
        contextMenu: [
          {
            key: '',
            name: 'Custom option',
            hidden() {
              return !this.selection.isSelectedByColumnHeader();
            }
          }
        ]
      });

      contextMenu();
      let items = $('.htContextMenu tbody td');
      let actions = items.not('.htSeparator');

      expect(actions.length).toEqual(1);
      expect($('.htContextMenu tbody td.htDisabled').text()).toBe([
        'No available options',
      ].join(''));

      const header = $('.ht_clone_top thead th').eq(1);

      header.simulate('mousedown');
      header.simulate('mouseup');
      contextMenu();

      items = $('.htContextMenu tbody td');
      actions = items.not('.htSeparator');
      expect(actions.length).toEqual(1);
    });
  });

  describe('menu destroy', () => {
    it('should close context menu when HOT is being destroyed', () => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);

      destroy();

      expect($('.htContextMenu').is(':visible')).toBe(false);
    });
  });

  describe('subMenu', () => {
    it('should not open subMenu immediately', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);

      item.simulate('mouseover');
      const contextSubMenu = $(`.htContextMenuSub_${item.text()}`).find('tbody td');

      expect(contextSubMenu.length).toEqual(0);
    });

    it('should open subMenu with delay', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);

      item.simulate('mouseover');

      await sleep(300);

      const contextSubMenu = $(`.htContextMenuSub_${item.text()}`);

      expect(contextSubMenu.length).toEqual(1);
    });

    it('should open subMenu and not highlight the first item (trigger by mouse)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);

      item.simulate('mouseover');

      await sleep(300);

      expect(getPlugin('contextMenu').menu.hotSubMenus.alignment.hotMenu.getSelected()).toBeUndefined();
    });

    it('should NOT open subMenu if there is no subMenu for item', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(8);

      item.simulate('mouseover');

      expect(item.hasClass('htSubmenu')).toBe(false);

      const contextSubMenu = $(`.htContextMenuSub_${item.text()}`);

      expect(contextSubMenu.length).toEqual(0);
    });

    it('should not throw error when opening multi-level menu with name declared as `function` #4550', async() => {
      const spy = spyOn(window, 'onerror');

      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: {
          items: {
            alignment: {
              name() {
                return 'Alignment';
              },
              submenu: {
                items: [
                  { key: 'alignment:left', name: 'Align to LEFT' }
                ]
              }
            }
          }
        }
      });

      contextMenu();

      const $submenu = $('.htSubmenu');

      $submenu.simulate('mouseover');

      await sleep(350);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not throw error when opening multi-level menu with name declared as `function` which return value not castable to string', async() => {
      const spy = spyOn(window, 'onerror');

      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: {
          items: {
            alignment: {
              name() {
                return undefined;
              },
              submenu: {
                items: [
                  { key: 'alignment:left', name: 'Align to LEFT' }
                ]
              }
            },
            custom1: {
              name() {
                return null;
              },
              submenu: {
                items: [
                  { key: 'custom1:test', name: 'Test1' }
                ]
              }
            },
            custom2: {
              name() {
                return 0;
              },
              submenu: {
                items: [
                  { key: 'custom2:test', name: 'Test2' }
                ]
              }
            }
          }
        }
      });

      contextMenu();

      const $submenu1 = $('.htSubmenu').eq(0);

      $submenu1.simulate('mouseover');

      await sleep(350);

      const $submenu2 = $('.htSubmenu').eq(1);

      $submenu2.simulate('mouseover');

      await sleep(350);

      const $submenu3 = $('.htSubmenu').eq(2);

      $submenu3.simulate('mouseover');

      await sleep(350);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('default context menu actions', () => {
    it('should display the default set of actions', () => {
      handsontable({
        contextMenu: true,
        comments: true,
        height: 100
      });

      contextMenu();

      const items = $('.htContextMenu tbody td');
      const actions = items.not('.htSeparator');
      const separators = items.filter('.htSeparator');

      expect(actions.length).toEqual(15);
      expect(separators.length).toEqual(7);

      expect(actions.text()).toEqual([
        'Insert row above',
        'Insert row below',
        'Insert column left',
        'Insert column right',
        'Remove row',
        'Remove column',
        'Undo',
        'Redo',
        'Read only',
        'Alignment',
        'Add comment',
        'Delete comment',
        'Read-only comment',
        'Copy',
        'Cut',
      ].join(''));
    });

    it('should disable column manipulation when row header selected', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        colHeaders: true,
        rowHeaders: true,
        height: 100
      });

      const rowHeader = $('.ht_clone_inline_start .htCore').eq(0).find('tbody').find('th').eq(0);

      simulateClick(rowHeader, 'RMB');
      contextMenu();

      expect($('.htContextMenu tbody td.htDisabled').text()).toBe([
        'Insert column left',
        'Insert column right',
        'Remove columns',
        'Undo',
        'Redo',
      ].join(''));
    });

    it('should disable row manipulation when column header selected', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        colHeaders: true,
        rowHeaders: true,
        height: 100
      });

      const header = $('.ht_clone_top .htCore').find('thead').find('th').eq(2);

      simulateClick(header, 'RMB');
      contextMenu();

      expect($('.htContextMenu tbody td.htDisabled').text()).toBe([
        'Insert row above',
        'Insert row below',
        'Remove rows',
        'Undo',
        'Redo',
      ].join(''));
    });

    it('should disable proper options when corner header was selected and there are visible cells', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        colHeaders: true,
        rowHeaders: true,
        height: 100
      });

      const corner = $('.ht_clone_top_inline_start_corner .htCore')
        .find('thead')
        .find('th')
        .eq(0);

      simulateClick(corner, 'RMB');
      contextMenu(corner);

      expect($('.htContextMenu tbody td.htDisabled').text()).toBe([
        'Undo',
        'Redo',
        'Read only',
        'Alignment',
      ].join(''));
    });

    // This test should be removed when some changes in handling a such dataset will be done. Regression check.
    it('should disable proper options when row header was selected and there are no visible cells #6733', () => {
      handsontable({
        data: [null],
        contextMenu: true,
        colHeaders: true,
        rowHeaders: true
      });

      const header = $('.ht_clone_inline_start .htCore')
        .find('tbody')
        .find('th')
        .eq(0);

      simulateClick(header, 'RMB');
      contextMenu(header);

      expect($('.htContextMenu tbody td.htDisabled').text()).toBe([
        'Insert column left',
        'Insert column right',
        'Remove column',
        'Undo',
        'Redo',
        'Read only',
        'Alignment',
        'Copy',
        'Cut',
      ].join(''));
    });

    describe('should disable proper options when corner header was selected and there are no visible cells and', () => {
      it('data schema was defined', () => {
        handsontable({
          data: [],
          dataSchema: [],
          contextMenu: true,
          colHeaders: true,
          rowHeaders: true
        });

        const corner = $('.ht_clone_top_inline_start_corner .htCore')
          .find('thead')
          .find('th')
          .eq(0);

        simulateClick(corner, 'RMB');
        contextMenu(corner);

        expect($('.htContextMenu tbody td.htDisabled').text()).toBe([
          'Insert row above',
          'Insert column left',
          'Remove row',
          'Remove column',
          'Undo',
          'Redo',
          'Read only',
          'Alignment',
          'Copy',
          'Cut'
        ].join(''));
      });

      it('data schema was not defined', () => {
        handsontable({
          data: [],
          contextMenu: true,
          colHeaders: true,
          rowHeaders: true
        });

        const corner = $('.ht_clone_top_inline_start_corner .htCore')
          .find('thead')
          .find('th')
          .eq(0);

        simulateClick(corner, 'RMB');
        contextMenu(corner);

        expect($('.htContextMenu tbody td.htDisabled').text()).toBe([
          'Insert row above',
          'Insert column left',
          'Insert column right',
          'Remove row',
          'Remove column',
          'Undo',
          'Redo',
          'Read only',
          'Alignment',
          'Copy',
          'Cut'
        ].join(''));
      });
    });

    it('should insert row above selection', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 400
      });

      const afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');

      addHook('afterCreateRow', afterCreateRowCallback);

      expect(countRows()).toEqual(4);

      selectCell(1, 0, 3, 0);
      contextMenu();
      selectContextMenuOption('Insert row above');

      expect(afterCreateRowCallback).toHaveBeenCalledWith(1, 1, 'ContextMenu.rowAbove');
      expect(countRows()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should insert row below selection when initial data is empty', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        data: [],
        dataSchema: [],
        contextMenu: true,
        height: 400
      });

      const afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');

      addHook('afterCreateRow', afterCreateRowCallback);

      expect(countRows()).toEqual(0);

      const cell = $('.ht_clone_top_inline_start_corner .htCore').find('thead').find('th').eq(0);

      simulateClick(cell, 'RMB');
      selectContextMenuOption('Insert row below');

      expect(afterCreateRowCallback).toHaveBeenCalledWith(0, 1, 'ContextMenu.rowBelow');
      expect(countRows()).toEqual(1);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should NOT display insert row selection', () => {
      handsontable({
        contextMenu: true,
        allowInsertRow: false
      });

      contextMenu();

      const items = $('.htContextMenu tbody td');
      const actions = items.not('.htSeparator');
      const separators = items.filter('.htSeparator');

      expect(actions.length).toEqual(10);
      expect(separators.length).toEqual(5);

      expect(actions.text()).toEqual([
        'Insert column left',
        'Insert column right',
        'Remove row',
        'Remove column',
        'Undo',
        'Redo',
        'Read only',
        'Alignment',
        'Copy',
        'Cut'
      ].join(''));
    });

    it('should NOT display insert column selection', () => {
      handsontable({
        contextMenu: true,
        allowInsertColumn: false
      });

      contextMenu();

      const items = $('.htContextMenu tbody td');
      const actions = items.not('.htSeparator');

      expect(actions.length).toEqual(10);

      expect(actions.text()).toEqual([
        'Insert row above',
        'Insert row below',
        'Remove row',
        'Remove column',
        'Undo',
        'Redo',
        'Read only',
        'Alignment',
        'Copy',
        'Cut'
      ].join(''));
    });

    it('should insert row above selection (reverse selection)', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      const afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');

      addHook('afterCreateRow', afterCreateRowCallback);

      expect(countRows()).toEqual(4);

      selectCell(3, 0, 1, 0);
      contextMenu();
      selectContextMenuOption('Insert row above');

      expect(afterCreateRowCallback).toHaveBeenCalledWith(1, 1, 'ContextMenu.rowAbove');
      expect(countRows()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should insert row below selection', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true
      });

      const afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');

      addHook('afterCreateRow', afterCreateRowCallback);

      expect(countRows()).toEqual(4);

      selectCell(1, 0, 3, 0);
      contextMenu();
      selectContextMenuOption('Insert row below');

      expect(afterCreateRowCallback).toHaveBeenCalledWith(4, 1, 'ContextMenu.rowBelow');
      expect(countRows()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should insert row below selection (reverse selection)', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true
      });

      const afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');

      addHook('afterCreateRow', afterCreateRowCallback);

      expect(countRows()).toEqual(4);

      selectCell(3, 0, 1, 0);
      contextMenu();
      selectContextMenuOption('Insert row below');

      expect(afterCreateRowCallback).toHaveBeenCalledWith(4, 1, 'ContextMenu.rowBelow');
      expect(countRows()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should Insert column left of selection', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        width: 400,
        height: 400
      });

      const afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');

      addHook('afterCreateCol', afterCreateColCallback);

      expect(countCols()).toEqual(4);

      selectCell(0, 1, 0, 3);
      contextMenu();
      selectContextMenuOption('Insert column left');

      expect(afterCreateColCallback).toHaveBeenCalledWith(1, 1, 'ContextMenu.columnLeft');
      expect(countCols()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should Insert column right of selection when initial data is empty', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        data: [],
        dataSchema: [],
        contextMenu: true,
        height: 400
      });

      const afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');

      addHook('afterCreateCol', afterCreateColCallback);

      expect(countCols()).toEqual(0);

      const cell = $('.ht_clone_top_inline_start_corner .htCore').find('thead').find('th').eq(0);

      simulateClick(cell, 'RMB');
      contextMenu(cell[0]);
      selectContextMenuOption('Insert column right');

      expect(afterCreateColCallback).toHaveBeenCalledWith(0, 1, 'ContextMenu.columnRight');
      expect(countCols()).toEqual(1);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should Insert column left of selection (reverse selection)', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      const afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');

      addHook('afterCreateCol', afterCreateColCallback);

      expect(countCols()).toEqual(4);

      selectCell(0, 3, 0, 1);
      contextMenu();
      selectContextMenuOption('Insert column left');

      expect(afterCreateColCallback).toHaveBeenCalledWith(1, 1, 'ContextMenu.columnLeft');
      expect(countCols()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should Insert column right of selection', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      const afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');

      addHook('afterCreateCol', afterCreateColCallback);

      expect(countCols()).toEqual(4);

      selectCell(0, 1, 0, 3);
      contextMenu();
      selectContextMenuOption('Insert column right');

      expect(afterCreateColCallback).toHaveBeenCalledWith(4, 1, 'ContextMenu.columnRight');
      expect(countCols()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should Insert column right of selection (reverse selection)', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      const afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');

      addHook('afterCreateCol', afterCreateColCallback);

      expect(countCols()).toEqual(4);

      selectCell(0, 3, 0, 1);
      contextMenu();
      selectContextMenuOption('Insert column right');

      expect(afterCreateColCallback).toHaveBeenCalledWith(4, 1, 'ContextMenu.columnRight');
      expect(countCols()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should remove selected rows', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      const afterRemoveRowCallback = jasmine.createSpy('afterRemoveRowCallback');

      addHook('afterRemoveRow', afterRemoveRowCallback);

      expect(countRows()).toEqual(4);

      selectCell(1, 0, 3, 0);
      contextMenu();
      selectContextMenuOption('Remove row');

      expect(afterRemoveRowCallback).toHaveBeenCalledWith(1, 3, [1, 2, 3], 'ContextMenu.removeRow');
      expect(countRows()).toEqual(1);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should allow to remove the latest row', () => {
      handsontable({
        data: createSpreadsheetData(1, 4),
        contextMenu: true,
        height: 100
      });

      const afterRemoveRowCallback = jasmine.createSpy('afterRemoveRowCallback');

      addHook('afterRemoveRow', afterRemoveRowCallback);

      expect(countRows()).toBe(1);

      selectCell(0, 0, 0, 0);
      contextMenu();
      selectContextMenuOption('Remove row');

      expect(afterRemoveRowCallback).toHaveBeenCalledWith(0, 1, [0], 'ContextMenu.removeRow');
      expect(countRows()).toBe(0);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should remove selected rows (reverse selection)', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      const afterRemoveRowCallback = jasmine.createSpy('afterRemoveRowCallback');

      addHook('afterRemoveRow', afterRemoveRowCallback);

      expect(countRows()).toBe(4);

      selectCell(3, 0, 1, 0);
      contextMenu();
      selectContextMenuOption('Remove row');

      expect(afterRemoveRowCallback).toHaveBeenCalledWith(1, 3, [1, 2, 3], 'ContextMenu.removeRow');
      expect(countRows()).toBe(1);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should remove selected columns', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      const afterRemoveColCallback = jasmine.createSpy('afterRemoveColCallback');

      addHook('afterRemoveCol', afterRemoveColCallback);

      expect(countCols()).toBe(4);

      selectCell(0, 1, 0, 3);
      contextMenu();
      selectContextMenuOption('Remove column');

      expect(afterRemoveColCallback).toHaveBeenCalledWith(1, 3, [1, 2, 3], 'ContextMenu.removeColumn');
      expect(countCols()).toBe(1);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should allow to remove the latest column', () => {
      handsontable({
        data: createSpreadsheetData(4, 1),
        contextMenu: true,
        height: 100
      });

      const afterRemoveColCallback = jasmine.createSpy('afterRemoveColCallback');

      addHook('afterRemoveCol', afterRemoveColCallback);

      expect(countCols()).toBe(1);

      selectCell(0, 0, 0, 0);
      contextMenu();
      selectContextMenuOption('Remove column');

      expect(afterRemoveColCallback).toHaveBeenCalledWith(0, 1, [0], 'ContextMenu.removeColumn');
      expect(countCols()).toBe(0);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should remove selected columns (reverse selection)', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      const afterRemoveColCallback = jasmine.createSpy('afterRemoveColCallback');

      addHook('afterRemoveCol', afterRemoveColCallback);

      expect(countCols()).toEqual(4);

      selectCell(0, 3, 0, 1);
      contextMenu();
      selectContextMenuOption('Remove column');

      expect(afterRemoveColCallback).toHaveBeenCalledWith(1, 3, [1, 2, 3], 'ContextMenu.removeColumn');
      expect(countCols()).toEqual(1);
    });

    it('should undo changes', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      setDataAtCell(0, 0, 'XX');
      selectCell(0, 0);
      contextMenu();
      selectContextMenuOption('Undo');

      expect(getDataAtCell(0, 0)).toBe('A1');
    });

    it('should hide undo menu item when the UndoRedo plugin is disabled', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100,
        undo: false,
      });

      selectCell(0, 0);
      contextMenu();

      const $undoMenuItem = $('.htContextMenu .ht_master .htCore')
        .find('tbody td:contains("Undo")');

      expect($undoMenuItem.length).toBe(0);
    });

    it('should hide undo menu item when the UndoRedo plugin is missing', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100,
        undo: true,
      });

      const origGetPlugin = hot.getPlugin;

      spyOn(hot, 'getPlugin').and.callFake(function(pluginName) {
        if (pluginName === 'undoRedo') {
          return;
        }

        return origGetPlugin.call(this, pluginName);
      });

      selectCell(0, 0);
      contextMenu();

      const $undoMenuItem = $('.htContextMenu .ht_master .htCore')
        .find('tbody td:contains("Undo")');

      expect($undoMenuItem.length).toBe(0);
    });

    it('should redo changes', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(0, 0);
      setDataAtCell(0, 0, 'XX');
      getPlugin('undoRedo').undo();

      expect(getDataAtCell(0, 0)).toBe('A1');

      contextMenu();
      selectContextMenuOption('Redo');

      expect(getDataAtCell(0, 0)).toBe('XX');
    });

    it('should hide redo menu item when the UndoRedo plugin is disabled', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100,
        undo: false,
      });

      selectCell(0, 0);
      contextMenu();

      const $undoMenuItem = $('.htContextMenu .ht_master .htCore')
        .find('tbody td:contains("Redo")');

      expect($undoMenuItem.length).toBe(0);
    });

    it('should hide redo menu item when the UndoRedo plugin is missing', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100,
        undo: true,
      });

      const origGetPlugin = hot.getPlugin;

      spyOn(hot, 'getPlugin').and.callFake(function(pluginName) {
        if (pluginName === 'undoRedo') {
          return;
        }

        return origGetPlugin.call(this, pluginName);
      });

      selectCell(0, 0);
      contextMenu();

      const $undoMenuItem = $('.htContextMenu .ht_master .htCore')
        .find('tbody td:contains("Redo")');

      expect($undoMenuItem.length).toBe(0);
    });

    it('should display only the specified actions', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: ['remove_row', 'undo'],
        height: 100
      });

      contextMenu();

      expect($('.htContextMenu .ht_master .htCore').find('tbody td').length).toEqual(2);
    });

    it('should not close menu after clicking on submenu root item', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: ['row_above', 'remove_row', '---------', 'alignment'],
        height: 400
      });

      selectCell(1, 0, 3, 0);
      contextMenu();
      selectContextMenuOption('Alignment');

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it('should not deselect submenu while selecting child items', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: ['row_above', 'remove_row', '---------', 'alignment'],
        height: 400
      });

      selectCell(1, 0, 3, 0);
      contextMenu();

      $('.htContextMenu .ht_master .htCore tbody td')
        .not('.htSeparator')
        .eq(2) // "Alignment"
        .simulate('mousemove')
        .simulate('mouseenter')
        .simulate('mouseover')
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click')
        .simulate('mouseout');

      // wait for a debounced delay in the appearing sub-menu
      await sleep(500);

      $('.htContextMenuSub_Alignment .ht_master .htCore tbody td')
        .not('.htSeparator')
        .eq(0) // "Left"
        .simulate('mousemove')
        .simulate('mouseenter')
        .simulate('mouseover')
        .simulate('mousedown'); // Without finishing LMB

      // The selection of the ContextMenu should be active and pointed to "alignment" item
      expect(getPlugin('contextMenu').menu.getSelectedItem().key).toBe('alignment');
    });

    it('should highlight menu items after hovering them', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 400
      });

      selectCell(1, 0, 3, 0);
      contextMenu();

      $('.htContextMenu .ht_master .htCore tbody td')
        .not('.htSeparator')
        .eq(2) // "Insert column left"
        .simulate('mousemove')
        .simulate('mouseenter')
        .simulate('mouseover');

      expect(getPlugin('contextMenu').menu.getSelectedItem().key).toBe('col_left');
    });
  });

  describe('disabling actions', () => {
    it('should not close menu after clicking on disabled item', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: ['undo', 'redo'],
        height: 400
      });

      selectCell(1, 0, 3, 0);
      contextMenu();
      selectContextMenuOption('Undo');

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it('should disable undo and redo action if undoRedo plugin is not enabled ', () => {
      handsontable({
        contextMenu: true,
        undoRedo: false,
        height: 100
      });

      contextMenu();

      const $menu = $('.htContextMenu .ht_master .htCore');

      expect($menu.find('tbody td:eq(9)').text()).toEqual('Undo');
      expect($menu.find('tbody td:eq(9)').hasClass('htDisabled')).toBe(true);
      expect($menu.find('tbody td:eq(10)').text()).toEqual('Redo');
      expect($menu.find('tbody td:eq(10)').hasClass('htDisabled')).toBe(true);
    });

    it('should disable undo when there is nothing to undo ', () => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      contextMenu();

      let $menu = $(getPlugin('contextMenu').menu.container).find('.ht_master .htCore');

      expect(getPlugin('undoRedo').isUndoAvailable()).toBe(false);
      expect($menu.find('tbody td:eq(9)').text()).toEqual('Undo');
      expect($menu.find('tbody td:eq(9)').hasClass('htDisabled')).toBe(true);

      closeContextMenu();

      setDataAtCell(0, 0, 'foo');

      contextMenu();
      $menu = $(getPlugin('contextMenu').menu.container).find('.ht_master .htCore');
      expect(getPlugin('undoRedo').isUndoAvailable()).toBe(true);
      expect($menu.find('tbody td:eq(9)').hasClass('htDisabled')).toBe(false);
    });

    it('should disable redo when there is nothing to redo ', () => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      contextMenu();

      let $menu = $(getPlugin('contextMenu').menu.container).find('.ht_master .htCore');

      expect(getPlugin('undoRedo').isRedoAvailable()).toBe(false);
      expect($menu.find('tbody td:eq(10)').text()).toEqual('Redo');
      expect($menu.find('tbody td:eq(10)').hasClass('htDisabled')).toBe(true);

      closeContextMenu();

      setDataAtCell(0, 0, 'foo');
      getPlugin('undoRedo').undo();

      contextMenu();
      $menu = $(getPlugin('contextMenu').menu.container).find('.ht_master .htCore');
      expect(getPlugin('undoRedo').isRedoAvailable()).toBe(true);
      expect($menu.find('tbody td:eq(10)').hasClass('htDisabled')).toBe(false);
    });

    it('should disable Insert row in context menu when maxRows is reached', () => {
      handsontable({
        contextMenu: true,
        maxRows: 6,
        height: 100
      });

      contextMenu();

      let $menu = $(getPlugin('contextMenu').menu.container).find('.ht_master .htCore');

      expect($menu.find('tbody td:eq(0)').text()).toEqual('Insert row above');
      expect($menu.find('tbody td:eq(0)').hasClass('htDisabled')).toBe(false);
      expect($menu.find('tbody td:eq(1)').text()).toEqual('Insert row below');
      expect($menu.find('tbody td:eq(1)').hasClass('htDisabled')).toBe(false);

      closeContextMenu();

      alter('insert_row_above');

      contextMenu();
      $menu = $(getPlugin('contextMenu').menu.container).find('.ht_master .htCore');

      expect($menu.find('tbody td:eq(0)').hasClass('htDisabled')).toBe(true);
      expect($menu.find('tbody td:eq(1)').hasClass('htDisabled')).toBe(true);
    });

    it('should disable Insert col in context menu when maxCols is reached', () => {
      handsontable({
        contextMenu: true,
        maxCols: 6,
        height: 100
      });

      contextMenu();

      let $menu = $(getPlugin('contextMenu').menu.container).find('.ht_master .htCore');

      expect($menu.find('tbody td:eq(3)').text()).toEqual('Insert column left');
      expect($menu.find('tbody td:eq(3)').hasClass('htDisabled')).toBe(false);
      expect($menu.find('tbody td:eq(4)').text()).toEqual('Insert column right');
      expect($menu.find('tbody td:eq(4)').hasClass('htDisabled')).toBe(false);

      closeContextMenu();

      alter('insert_col_start');

      contextMenu();
      $menu = $(getPlugin('contextMenu').menu.container).find('.ht_master .htCore');
      expect($menu.find('tbody td:eq(3)').hasClass('htDisabled')).toBe(true);
      expect($menu.find('tbody td:eq(4)').hasClass('htDisabled')).toBe(true);
    });

    it('should NOT disable Insert col in context menu when only one column exists', () => {
      handsontable({
        data: [['single col']],
        contextMenu: true,
        maxCols: 10,
        height: 100
      });

      selectCell(0, 0);
      contextMenu();

      const $menu = $(getPlugin('contextMenu').menu.container).find('.ht_master .htCore');

      expect($menu.find('tbody td:eq(3)').text()).toEqual('Insert column left');
      expect($menu.find('tbody td:eq(3)').hasClass('htDisabled')).toBe(false);
      expect($menu.find('tbody td:eq(4)').text()).toEqual('Insert column right');
      expect($menu.find('tbody td:eq(4)').hasClass('htDisabled')).toBe(false);
    });

    it('should disable Remove col in context menu when rows are selected by headers', () => {
      handsontable({
        contextMenu: ['remove_col', 'remove_row'],
        height: 100,
        colHeaders: true,
        rowHeaders: true
      });

      const $rowsHeaders = spec().$container.find('.ht_clone_inline_start tr th');

      $rowsHeaders.eq(1).simulate('mousedown');
      $rowsHeaders.eq(2).simulate('mouseover');
      $rowsHeaders.eq(3).simulate('mouseover');
      $rowsHeaders.eq(3).simulate('mousemove');
      $rowsHeaders.eq(3).simulate('mouseup');

      contextMenu();

      const $menu = $(getPlugin('contextMenu').menu.container).find('.ht_master .htCore');

      expect($menu.find('tbody td:eq(0)').text()).toEqual('Remove columns');
      expect($menu.find('tbody td:eq(0)').hasClass('htDisabled')).toBe(true);
    });

    it('should disable Remove row in context menu when columns are selected by headers', () => {
      handsontable({
        contextMenu: ['remove_col', 'remove_row'],
        height: 100,
        colHeaders: true,
        rowHeaders: true
      });

      spec().$container.find('thead tr:eq(0) th:eq(1)').simulate('mousedown');
      spec().$container.find('thead tr:eq(0) th:eq(2)').simulate('mouseover');
      spec().$container.find('thead tr:eq(0) th:eq(3)').simulate('mouseover');
      spec().$container.find('thead tr:eq(0) th:eq(3)').simulate('mousemove');
      spec().$container.find('thead tr:eq(0) th:eq(3)').simulate('mouseup');

      contextMenu();

      const $menu = $(getPlugin('contextMenu').menu.container).find('.ht_master .htCore');

      expect($menu.find('tbody td:eq(1)').text()).toEqual('Remove rows');
      expect($menu.find('tbody td:eq(1)').hasClass('htDisabled')).toBe(true);
    });
  });

  describe('custom options', () => {
    it('should have custom items list', () => {
      const callback1 = jasmine.createSpy('callback1');
      const callback2 = jasmine.createSpy('callback2');

      handsontable({
        contextMenu: {
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
        height: 100
      });

      contextMenu();

      expect($('.htContextMenu .ht_master .htCore').find('tbody td').length).toEqual(2);
      expect($('.htContextMenu .ht_master .htCore').find('tbody td').text())
        .toEqual(['CustomItem1', 'CustomItem2'].join(''));

      selectContextMenuOption('CustomItem1');

      expect(callback1.calls.count()).toEqual(1);
      expect(callback2.calls.count()).toEqual(0);

      contextMenu();
      selectContextMenuOption('CustomItem2');

      expect(callback1.calls.count()).toEqual(1);
      expect(callback2.calls.count()).toEqual(1);
    });

    it('should have custom items list (defined as a function)', () => {
      let enabled = false;

      handsontable({
        contextMenu: {
          items: {
            cust1: {
              name() {
                return !enabled ? 'Enable my custom option' : 'Disable my custom option';
              },
              callback() { }
            }
          }
        },
        height: 100
      });

      contextMenu();

      expect($('.htContextMenu .ht_master .htCore').find('tbody td').text()).toEqual('Enable my custom option');

      selectContextMenuOption('Enable my custom option');

      enabled = true;

      contextMenu();

      expect($('.htContextMenu .ht_master .htCore').find('tbody td').text()).toEqual('Disable my custom option');
    });

    it('should bind HOT instace to menu\'s `name` function', () => {
      let thisInsideFunction;

      const hot = handsontable({
        contextMenu: {
          items: {
            cust1: {
              name() {
                thisInsideFunction = this;

                return 'Example';
              },
            }
          }
        },
        height: 100
      });

      contextMenu();

      expect(thisInsideFunction).toEqual(hot);
    });

    it('should enable to define item options globally', () => {
      const callback = jasmine.createSpy('callback');

      handsontable({
        contextMenu: {
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
        height: 100
      });

      contextMenu();

      selectContextMenuOption('CustomItem1');

      expect(callback.calls.count()).toEqual(1);

      contextMenu();
      selectContextMenuOption('CustomItem2');

      expect(callback.calls.count()).toEqual(2);
    });

    it('should override default items options', () => {
      const callback = jasmine.createSpy('callback');

      handsontable({
        contextMenu: {
          items: {
            remove_row: {
              callback
            },
            remove_col: {
              name: 'Delete column'
            }
          }
        },
        height: 100
      });

      contextMenu();

      expect($('.htContextMenu .ht_master .htCore').find('tbody td').length).toEqual(2);
      expect($('.htContextMenu .ht_master .htCore').find('tbody td').text())
        .toEqual(['Remove row', 'Delete column'].join(''));

      selectContextMenuOption('Remove row');

      expect(callback.calls.count()).toEqual(1);

      expect(countCols()).toEqual(5);

      contextMenu();
      selectContextMenuOption('Delete column');

      expect(countCols()).toEqual(4);
    });

    it('should fire item callback after item has been clicked', () => {
      const customItem = {
        name: 'Custom item',
        callback() {}
      };

      spyOn(customItem, 'callback');

      handsontable({
        contextMenu: {
          items: {
            customItemKey: customItem
          }
        },
        height: 100
      });

      contextMenu();

      selectContextMenuOption('Custom item');

      expect(customItem.callback.calls.count()).toEqual(1);
      expect(customItem.callback.calls.argsFor(0)[0]).toEqual('customItemKey');
    });

    it('should sanitize HTML for custom item', () => {
      handsontable({
        contextMenu: {
          items: {
            customItemKey: {
              name: '<img src onerror="xss()"> XSS item',
            }
          }
        },
      });

      contextMenu();

      expect($('.htContextMenu .ht_master .htCore').find('tbody td').html())
        .toBe('<div class="htItemWrapper"><img src=""> XSS item</div>');
    });
  });

  describe('mouse navigation', () => {
    it('should not scroll window position after fireing mouseenter on menu item', () => {
      handsontable({
        data: createSpreadsheetData(1000, 5),
        contextMenu: true,
      });

      selectCell(100, 0);
      contextMenu();
      window.scrollTo(0, 0);
      $('.htContextMenu .ht_master .htCore').find('tr td:eq("0")').simulate('mouseenter');

      const scrollHeight = typeof window.scrollY !== 'undefined' ? window.scrollY : document.documentElement.scrollTop;

      expect(scrollHeight).toBe(0);
    });

    it('should not scroll window position after fireing click on menu', () => {
      handsontable({
        data: createSpreadsheetData(1000, 5),
        contextMenu: {
          items: {
            item1: {
              name: 'Item1'
            },
            sep1: Handsontable.plugins.ContextMenu.SEPARATOR,
            item2: {
              name: 'Item2'
            },
            item3: {
              name: 'Item3'
            }
          }
        }
      });

      selectCell(100, 0);
      contextMenu();
      window.scrollTo(0, 0);
      $('.htContextMenu .ht_master .htCore')
        .find('tbody td')
        .not('.htSeparator')
        .eq(0)
        .simulate('mousedown')
        .simulate('mouseup');

      const scrollHeight = typeof window.scrollY !== 'undefined' ? window.scrollY : document.documentElement.scrollTop;

      expect(scrollHeight).toBe(0);
    });

    it('should fire command after the \'mouseup\' event triggered by the left mouse button', () => {
      const callback = jasmine.createSpy('callback');

      handsontable({
        contextMenu: {
          items: {
            item1: {
              name: 'Item',
              callback,
            },
          },
        },
        height: 100
      });

      contextMenu();

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td:eq(0)');

      item
        .simulate('mouseenter')
        .simulate('mousedown');

      expect(callback.calls.count()).toBe(0);

      item.simulate('mouseup');

      expect(callback.calls.count()).toBe(1);
    });

    it('should fire command after the \'mouseup\' event triggered by the middle mouse button', () => {
      const callback = jasmine.createSpy('callback');

      handsontable({
        contextMenu: {
          items: {
            item1: {
              name: 'Item',
              callback,
            },
          },
        },
        height: 100
      });

      contextMenu();

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td:eq(0)');

      item
        .simulate('mouseenter')
        .simulate('mousedown');

      expect(callback.calls.count()).toBe(0);

      item.simulate('mouseup', { button: 1 });

      expect(callback.calls.count()).toBe(1);
    });

    it('should fire command after the \'mouseup\' event triggered by the right mouse button', () => {
      const callback = jasmine.createSpy('callback');

      handsontable({
        contextMenu: {
          items: {
            item1: {
              name: 'Item',
              callback,
            },
          },
        },
        height: 100
      });

      contextMenu();

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td:eq(0)');

      item
        .simulate('mouseenter')
        .simulate('mousedown');

      expect(callback.calls.count()).toBe(0);

      item.simulate('mouseup', { button: 2 });

      expect(callback.calls.count()).toBe(1);
    });

    it('should not fire command after the \'contextmenu\' event', () => {
      const callback = jasmine.createSpy('callback');

      handsontable({
        contextMenu: {
          items: {
            item1: {
              name: 'Item',
              callback,
            },
          },
        },
        height: 100
      });

      contextMenu();

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td:eq(0)');

      item
        .simulate('mouseenter')
        .simulate('mousedown');

      expect(callback.calls.count()).toBe(0);

      item.simulate('contextmenu');

      expect(callback.calls.count()).toBe(0);
    });

    it('should not open another instance of ContextMenu after fireing command by the RMB (Windows OS simulation)', () => {
      Handsontable.helper.setPlatformMeta({ platform: 'Win' }); // Let HoT think that it runs on Windows OS
      handsontable({
        contextMenu: {
          items: {
            item1: {
              name: 'Item',
              callback: () => {},
            },
          },
        },
        height: 100
      });

      contextMenu();

      // Order of events occurrence on Windows machines is "mousedown" -> "mouseup" -> "contextmenu"
      $('.htContextMenu .ht_master .htCore').find('tbody td:eq(0)')
        .simulate('mouseenter', { button: 2 })
        .simulate('mousedown', { button: 2 })
        .simulate('mouseup', { button: 2 })
        .simulate('contextmenu')
      ;

      expect($('.htContextMenu').is(':visible')).toBe(false);

      Handsontable.helper.setPlatformMeta(); // Reset platform
    });

    it('should not open another instance of ContextMenu after fireing command by the RMB (macOS and others simulation)', () => {
      Handsontable.helper.setPlatformMeta({ platform: 'MacIntel' }); // Let HoT think that it runs on macOS
      handsontable({
        contextMenu: {
          items: {
            item1: {
              name: 'Item',
              callback: () => {},
            },
          },
        },
        height: 100
      });

      contextMenu();

      // Order of events occurrence on macOS machines is "mousedown" -> "contextmenu" -> "mouseup"
      $('.htContextMenu .ht_master .htCore').find('tbody td:eq(0)')
        .simulate('mouseenter', { button: 2 })
        .simulate('mousedown', { button: 2 })
        .simulate('contextmenu')
        .simulate('mouseup', { button: 2 })
      ;

      expect($('.htContextMenu').is(':visible')).toBe(false);

      Handsontable.helper.setPlatformMeta(); // Reset platform
    });
  });

  describe('selection', () => {
    it('should not be cleared when a context menu is triggered on a selected single cell', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(0, 0);
      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);
      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    });

    it('should not be cleared when a context menu is triggered on a range of selected cells', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(0, 0, 2, 2);
      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);
      expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    });

    it('should not be cleared when a context menu is triggered on the first layer of the non-contiguous selection', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        contextMenu: true,
        height: 200
      });

      mouseDown(getCell(0, 0));
      mouseOver(getCell(2, 2));
      mouseUp(getCell(2, 2));

      keyDown('control/meta');

      mouseDown(getCell(2, 2));
      mouseOver(getCell(7, 2));
      mouseUp(getCell(7, 2));

      mouseDown(getCell(2, 4));
      mouseOver(getCell(2, 4));
      mouseUp(getCell(2, 4));

      keyUp('control/meta');
      contextMenu(getCell(0, 0));

      expect($('.htContextMenu').is(':visible')).toBe(true);
      expect(getSelected()).toEqual([[0, 0, 2, 2], [2, 2, 7, 2], [2, 4, 2, 4]]);
    });

    it('should not be cleared when a context menu is triggered on the second layer of the non-contiguous selection', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        contextMenu: true,
        height: 200
      });

      mouseDown(getCell(0, 0));
      mouseOver(getCell(2, 2));
      mouseUp(getCell(2, 2));

      keyDown('control/meta');

      mouseDown(getCell(2, 2));
      mouseOver(getCell(7, 2));
      mouseUp(getCell(7, 2));

      mouseDown(getCell(2, 4));
      mouseOver(getCell(2, 4));
      mouseUp(getCell(2, 4));

      keyUp('control/meta');
      contextMenu(getCell(2, 2));

      expect($('.htContextMenu').is(':visible')).toBe(true);
      expect(getSelected()).toEqual([[0, 0, 2, 2], [2, 2, 7, 2], [2, 4, 2, 4]]);
    });

    it('should not be cleared when a context menu is triggered on the last layer of the non-contiguous selection', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        contextMenu: true,
        height: 200
      });

      mouseDown(getCell(0, 0));
      mouseOver(getCell(2, 2));
      mouseUp(getCell(2, 2));

      keyDown('control/meta');

      mouseDown(getCell(2, 2));
      mouseOver(getCell(7, 2));
      mouseUp(getCell(7, 2));

      mouseDown(getCell(2, 4));
      mouseOver(getCell(2, 4));
      mouseUp(getCell(2, 4));

      keyUp('control/meta');
      contextMenu(getCell(2, 4));

      expect($('.htContextMenu').is(':visible')).toBe(true);
      expect(getSelected()).toEqual([[0, 0, 2, 2], [2, 2, 7, 2], [2, 4, 2, 4]]);
    });

    it('should properly change selection on right click on headers', () => {
      const hot = handsontable({
        data: createSpreadsheetData(2, 2),
        contextMenu: true,
        colHeaders: true,
        rowHeaders: true,
      });

      selectCell(0, 0);
      contextMenu(getCell(-1, 0));

      expect(getSelected()).toEqual([[-1, 0, 1, 0]]);
      expect(hot.selection.isEntireColumnSelected()).toBe(true);

      selectCell(1, 0);
      contextMenu(getCell(1, -1));

      expect(getSelected()).toEqual([[1, -1, 1, 1]]);
      expect(hot.selection.isEntireRowSelected()).toBe(true);
    });

    it('should continue menu navigation from the position of the lastly highlighted item by mouse', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 400
      });

      selectCell(1, 0, 3, 0);
      contextMenu();

      $('.htContextMenu .ht_master .htCore tbody td')
        .not('.htSeparator')
        .eq(2) // "Insert column left"
        .simulate('mousemove')
        .simulate('mouseenter')
        .simulate('mouseover');

      expect(getPlugin('contextMenu').menu.getNavigator().getCurrentPage()).toBe(3);
      expect(getPlugin('contextMenu').menu.getSelectedItem().key).toBe('col_left');

      keyDownUp('arrowDown');

      expect(getPlugin('contextMenu').menu.getNavigator().getCurrentPage()).toBe(4);
      expect(getPlugin('contextMenu').menu.getSelectedItem().key).toBe('col_right');
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

    it('should apply enabling/disabling contextMenu using updateSetting only to particular instance of HOT ', async() => {
      const hot1 = handsontable({
        contextMenu: false,
        height: 100
      });
      const hot2 = spec().$container2.handsontable({
        contextMenu: true,
        height: 100
      }).handsontable('getInstance');
      const contextMenuContainer = $('.htContextMenu');

      contextMenu();
      expect(hot1.getPlugin('contextMenu').isEnabled()).toBe(false);
      expect(contextMenuContainer.is(':visible')).toBe(false);

      contextMenu2();
      expect(hot2.getPlugin('contextMenu').isEnabled()).toBe(true);
      expect($('.htContextMenu').is(':visible')).toBe(true);

      mouseDown(hot2.rootElement); // close menu

      hot1.updateSettings({
        contextMenu: true
      });
      hot2.updateSettings({
        contextMenu: false
      });

      contextMenu2();
      expect(hot2.getPlugin('contextMenu').isEnabled()).toBe(false);

      contextMenu();

      await sleep(300);

      expect($('.htContextMenu').is(':visible')).toBe(true);

      /**
       *
       */
      function contextMenu2() {
        const hot = spec().$container2.data('handsontable');
        let selected = hot.getSelected();

        if (!selected) {
          hot.selectCell(0, 0);
          selected = hot.getSelected();
        }

        const cell = hot.getCell(selected[0][0], selected[0][1]);
        const cellOffset = $(cell).offset();

        $(cell).simulate('contextmenu', {
          pageX: cellOffset.left,
          pageY: cellOffset.top
        });
      }
    });

    it('should perform a contextMenu action only for particular instance of HOT ', () => {
      const hot1 = handsontable({
        contextMenu: true,
        height: 100
      });

      const hot2 = spec().$container2.handsontable({
        contextMenu: true,
        height: 100
      }).handsontable('getInstance');

      hot1.selectCell(0, 0);
      contextMenu();

      expect(hot1.countRows()).toEqual(5);
      expect(hot2.countRows()).toEqual(5);

      selectContextMenuOption('Insert row above');

      expect(hot1.countRows()).toEqual(6);
      expect(hot2.countRows()).toEqual(5);

      hot2.selectCell(0, 0);
      contextMenu2();

      expect(hot1.countRows()).toEqual(6);
      expect(hot2.countRows()).toEqual(5);

      selectContextMenuOption('Insert row above');

      expect(hot1.countRows()).toEqual(6);
      expect(hot2.countRows()).toEqual(6);

      /**
       *
       */
      function contextMenu2() {
        const hot = spec().$container2.data('handsontable');
        let selected = hot.getSelected();

        if (!selected) {
          hot.selectCell(0, 0);
          selected = hot.getSelected();
        }

        const cell = hot.getCell(selected[0][0], selected[0][1]);
        const cellOffset = $(cell).offset();

        $(cell).simulate('contextmenu', {
          pageX: cellOffset.left,
          pageY: cellOffset.top
        });
      }
    });
  });

  describe('context menu with disabled `allowInvalid`', () => {
    it('should not close invalid cell', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        contextMenu: true,
        validator: (value, callback) => callback(false),
        allowInvalid: false
      });

      selectCell(0, 0);
      keyDownUp('enter');

      contextMenu(getCell(2, 2));

      await sleep(100);

      contextMenu(getCell(2, 2));

      await sleep(100);

      expect(getActiveEditor().isOpened()).toBe(true);
    });
  });

  describe('context menu with native scroll', () => {
    beforeEach(function() {
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

    it('should display menu table is not scrolled', () => {
      handsontable({
        data: createSpreadsheetData(40, 30),
        colWidths: 50, // can also be a number or a function
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        height: 100
      });

      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it('should display menu table is scrolled', () => {
      const hot = handsontable({
        data: createSpreadsheetData(40, 30),
        colWidths: 50, // can also be a number or a function
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        height: 100
      });

      const mainHolder = hot.view._wt.wtTable.holder;

      $(mainHolder).scrollTop(300);
      $(mainHolder).scroll();

      selectCell(15, 3);
      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it('should not close the menu, when table is scrolled', () => {
      const hot = handsontable({
        data: createSpreadsheetData(40, 30),
        colWidths: 50, // can also be a number or a function
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        height: 100
      });

      const $mainHolder = $(hot.view._wt.wtTable.holder);

      selectCell(15, 3);
      const scrollTop = $mainHolder.scrollTop();

      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);

      $mainHolder.scrollTop(scrollTop + 60).scroll();

      expect($('.htContextMenu').is(':visible')).toBe(true);

      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);

      $mainHolder.scrollTop(scrollTop + 100).scroll();

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it('should not attempt to close menu, when table is scrolled and the menu is already closed', () => {
      const hot = handsontable({
        data: createSpreadsheetData(40, 30),
        colWidths: 50, // can also be a number or a function
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        height: 100
      });

      const mainHolder = $(hot.view._wt.wtTable.holder);

      selectCell(15, 3);

      const scrollTop = mainHolder.scrollTop();

      contextMenu();

      spyOn(hot.getPlugin('contextMenu'), 'close');

      mainHolder.scrollTop(scrollTop + 100).scroll();

      expect(hot.getPlugin('contextMenu').close).not.toHaveBeenCalled();
    });

    it('should not scroll the window when hovering over context menu items (#1897 reopen)', async() => {
      spec().$wrapper.css('overflow', 'visible');

      handsontable({
        data: createSpreadsheetData(403, 303),
        colWidths: 50, // can also be a number or a function
        contextMenu: true
      });

      const beginningScrollX = window.scrollX;

      selectCell(2, 4);
      contextMenu();

      await sleep(100);

      const cmInstance = getPlugin('contextMenu').menu.hotMenu;

      cmInstance.selectCell(3, 0);

      expect(window.scrollX).toBe(beginningScrollX);

      cmInstance.selectCell(4, 0);

      expect(window.scrollX).toBe(beginningScrollX);

      cmInstance.selectCell(6, 0);

      expect(window.scrollX).toBe(beginningScrollX);
    });
  });

  describe('afterContextMenuDefaultOptions hook', () => {
    it('should be called each time the user tries to open the context menu', async() => {
      const cb = jasmine.createSpy();

      handsontable({
        contextMenu: true,
        afterContextMenuDefaultOptions: cb
      });

      expect(cb.calls.count()).toBe(0);

      selectCell(0, 0);
      contextMenu();

      await sleep(100);

      expect(cb.calls.count()).toBe(1);

      contextMenu();

      await sleep(100);

      expect(cb.calls.count()).toBe(2);
    });

    it('should call afterContextMenuDefaultOptions hook with context menu options as the first param', async() => {
      const cb = jasmine.createSpy();

      cb.and.callFake((options) => {
        options.items.cust1 = {
          name: 'My custom item',
          callback() {}
        };
      });

      Handsontable.hooks.add('afterContextMenuDefaultOptions', cb);

      handsontable({
        contextMenu: true,
        height: 100
      });

      contextMenu();

      await sleep(200);

      const $menu = $('.htContextMenu .ht_master .htCore');

      expect($menu.find('tbody td').text()).toContain('My custom item');
      expect(cb.calls.count()).toBe(1);
      expect(cb.calls.argsFor(0)[0].items.cust1.key).toBe('cust1');
      expect(cb.calls.argsFor(0)[0].items.cust1.name).toBe('My custom item');

      Handsontable.hooks.remove('afterContextMenuDefaultOptions', cb);
    });
  });

  describe('beforeContextMenuSetItems hook', () => {
    it('should be called each time the user tries to open the context menu', async() => {
      const cb = jasmine.createSpy();

      handsontable({
        contextMenu: true,
        beforeContextMenuSetItems: cb
      });

      expect(cb.calls.count()).toBe(0);

      selectCell(0, 0);
      contextMenu();

      await sleep(100);

      expect(cb.calls.count()).toBe(1);

      contextMenu();

      await sleep(100);

      expect(cb.calls.count()).toBe(2);
    });

    it('should add new menu item even when item is excluded from plugin settings', async() => {
      const hookListener = function(options) {
        options.push({
          key: 'test',
          name: 'Test'
        });
      };

      Handsontable.hooks.add('beforeContextMenuSetItems', hookListener);

      handsontable({
        contextMenu: ['make_read_only'],
        height: 100
      });

      contextMenu();

      await sleep(200);

      const items = $('.htContextMenu tbody td');
      const actions = items.not('.htSeparator');

      expect(actions.text()).toEqual([
        'Read only',
        'Test',
      ].join(''));

      Handsontable.hooks.remove('beforeContextMenuSetItems', hookListener);
    });

    it('should be called only with items selected in plugin settings', async() => {
      let keys = [];
      const hookListener = function(items) {
        keys = items.map(v => v.key);
      };

      Handsontable.hooks.add('beforeContextMenuSetItems', hookListener);

      handsontable({
        contextMenu: ['make_read_only', 'col_left'],
        height: 100
      });

      contextMenu();

      await sleep(200);

      expect(keys).toEqual(['make_read_only', 'col_left']);

      Handsontable.hooks.remove('beforeContextMenuSetItems', hookListener);
    });
  });

  describe('table listening', () => {
    it('should listen to changes after removing all rows', () => {
      const hot = handsontable({
        data: [[1]],
        rowHeaders: true,
        colHeaders: true,
        contextMenu: ['remove_row'],
      });

      selectRows(0);
      contextMenu();

      selectContextMenuOption('Remove row');

      expect(hot.countRows()).toBe(0);
      expect(hot.isListening()).toBe(true);
    });

    it('should listen to changes after removing all columns', () => {
      const hot = handsontable({
        data: [[1]],
        rowHeaders: true,
        colHeaders: true,
        contextMenu: ['remove_col'],
      });

      selectColumns(0);
      contextMenu();

      selectContextMenuOption('Remove column');

      expect(hot.countCols()).toBe(0);
      expect(hot.isListening()).toBe(true);
    });
  });

  describe('Cleaning up after the context menu', () => {
    it('should not leave any context menu containers after destroying the Handsontable instance', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();
      selectContextMenuOption('Alignment');

      destroy();

      expect($('.htMenu').size()).toEqual(0);
      expect($('.htMenu').size()).toEqual(0);
    });
  });

  describe('Changing selection after alter actions from context-menu', () => {
    describe('should keep the row selection in the same position as before inserting the row', () => {
      it('above the selected row', () => {
        handsontable({
          data: createSpreadsheetData(4, 4),
          contextMenu: true,
          rowHeaders: true,
          colHeaders: true
        });

        const header = $('.ht_clone_inline_start .htCore')
          .find('tbody')
          .find('th')
          .eq(0);

        simulateClick(header, 'RMB');
        selectContextMenuOption('Insert row above');

        expect(getSelected()).toEqual([
          [1, -1, 1, 3]
        ]);
        expect(getSelectedRangeLast().highlight.row).toBe(1);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(1);
        expect(getSelectedRangeLast().from.col).toBe(-1);
        expect(getSelectedRangeLast().to.row).toBe(1);
        expect(getSelectedRangeLast().to.col).toBe(3);
        expect(`
        |   ║ - : - : - : - |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        | * ║ A : 0 : 0 : 0 |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('below the selected row', () => {
        handsontable({
          data: createSpreadsheetData(4, 4),
          contextMenu: true,
          rowHeaders: true,
          colHeaders: true
        });

        const header = $('.ht_clone_inline_start .htCore')
          .find('tbody')
          .find('th')
          .eq(0);

        simulateClick(header, 'RMB');
        selectContextMenuOption('Insert row below');

        expect(getSelected()).toEqual([[0, -1, 0, 3]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(-1);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(3);
        expect(`
        |   ║ - : - : - : - |
        |===:===:===:===:===|
        | * ║ A : 0 : 0 : 0 |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });
    });
  });

  it('should not throw error while calling the `updateSettings` in a body of any callback executed right ' +
    'after some context-menu action', () => {
    const errorSpy = spyOn(console, 'error');
    const hot = handsontable({
      data: createSpreadsheetData(4, 4),
      contextMenu: true,
      height: 100
    });

    hot.addHook('beforeCreateCol', () => {
      hot.updateSettings({}); // Will close the menu. Instance of Handsontable being a context-menu is destroyed.
    });

    contextMenu();
    selectContextMenuOption('insert column left');

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('should inherit the actual layout direction option from the root Handsontable instance', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      contextMenu: true,
      height: 400,
      layoutDirection: 'inherit',
    });

    contextMenu();

    expect(getPlugin('contextMenu').menu.hotMenu.getSettings().layoutDirection).toBe('ltr');
  });
});

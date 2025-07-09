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

    await contextMenu();

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

    await updateSettings({
      contextMenu: ['remove_row']
    });

    await sleep(300);
    await contextMenu();

    items = $('.htContextMenu tbody td');
    actions = items.not('.htSeparator');
    separators = items.filter('.htSeparator');

    expect(actions.length).toEqual(1);
    expect(separators.length).toEqual(0);

    expect(actions.text()).toEqual([
      'Remove row',
    ].join(''));

    await updateSettings({
      contextMenu: {
        items: {
          remove_col: true,
          hsep1: '---------',
          custom: { name: 'My custom item' },
        }
      }
    });

    await sleep(300);
    await contextMenu();

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

      await contextMenu();
      await sleep(300);

      expect($menu.find('.wtHider').width()).toEqual(215);
      expect($menu.width()).forThemes(({ classic, main, horizon }) => {
        classic.toEqual(218);
        main.toEqual(217);
        horizon.toEqual(215);
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

      await contextMenu();
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

      await contextMenu();
      await sleep(300);

      const $item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(1);

      $item.simulate('mouseover');

      await sleep(300);

      const $contextSubMenu = $(`.htContextMenuSub_${$item.text()}`);

      expect($contextSubMenu.find('.wtHider').width()).toEqual(215);
    });
  });

  describe('menu opening', () => {
    it('should open menu after right click on table cell', async() => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      expect(getPlugin('contextMenu')).toBeDefined();
      expect($('.htContextMenu').is(':visible')).toBe(false);

      await contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it('should open menu after right click on table cell and do not select any items by default', async() => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      await contextMenu();

      const menu = getPlugin('contextMenu').menu;

      expect(menu.getSelectedItem()).toBe(null);
      expect(document.activeElement).toBe(menu.hotMenu.rootElement);
    });

    it('should not open context menu after right click on inner htCore', async() => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      await contextMenu();

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

    it('should be possible to define a custom container for ContextMenu\'s UI elements', async() => {
      const uiContainer = $('<div/>').addClass('uiContainer');

      spec().$container.append(uiContainer);

      handsontable({
        contextMenu: {
          uiContainer: uiContainer[0],
        },
      });

      await contextMenu();

      expect($('.uiContainer .htContextMenu').is(':visible')).toBe(true);
    });

    it('should finish selection after right click on table cell', async() => {
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

      expect(selection().isInProgress()).toBe(false);
    });

    it('should call every selection hooks after right click on table cell', async() => {
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

    it('should not open the menu after clicking an open editor', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      await selectCell(2, 2);
      await keyDownUp('enter');

      expect(getPlugin('contextMenu')).toBeDefined();
      expect($('.htContextMenu').is(':visible')).toBe(false);

      await contextMenu(getActiveEditor().TEXTAREA);

      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should open menu after right click on header cell when only header cells are visible', async() => {
      const hot = handsontable({
        data: [],
        colHeaders: ['Year', 'Kia'],
        columns: [{ data: 0 }, { data: 1 }],
        contextMenu: true,
        height: 100
      });

      expect(getPlugin('contextMenu')).toBeDefined();
      expect($('.htContextMenu').is(':visible')).toBe(false);

      await contextMenu(hot.rootElement.querySelector('.ht_clone_top thead th'));

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it('should open menu after right click on selected column header (the current selection should not be changed)', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 10),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        height: 100
      });

      await selectColumns(1, 4);

      expect(getPlugin('contextMenu')).toBeDefined();
      expect($('.htContextMenu').is(':visible')).toBe(false);

      await contextMenu(hot.rootElement.querySelector('.ht_clone_top thead th:nth-child(4)'));

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

    it('should open menu after right click on selected row header (the current selection should not be changed)', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 10),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        height: 100
      });

      await selectRows(1, 3);

      expect(getPlugin('contextMenu')).toBeDefined();
      expect($('.htContextMenu').is(':visible')).toBe(false);

      await contextMenu(hot.rootElement.querySelector('.ht_clone_inline_start tbody tr:nth-child(3) th'));

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

    it('should open menu after right click on header corner', async() => {
      const hot = handsontable({
        data: [],
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        height: 100
      });

      expect(getPlugin('contextMenu')).toBeDefined();
      expect($('.htContextMenu').is(':visible')).toBe(false);

      await contextMenu(hot.rootElement.querySelector('.ht_clone_top_inline_start_corner thead th'));

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it('should open menu after right click active cell border', async() => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      expect(getPlugin('contextMenu')).toBeDefined();
      expect($('.htContextMenu').is(':visible')).toBe(false);

      await selectCell(0, 0);

      spec().$container.find('.wtBorder.current:eq(0)').simulate('contextmenu');

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });
  });

  describe('menu closing', () => {
    it('should close menu after click', async() => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      await contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);

      await mouseDown(spec().$container);

      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should close menu after left click on menu item (Windows OS simulation)', async() => {
      Handsontable.helper.setPlatformMeta({ platform: 'Win' }); // Let HoT think that it runs on Windows OS
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: ['row_above', 'remove_row', '---------', 'alignment'],
        height: 400,
      });

      await selectCell(0, 0);
      await contextMenu();
      await selectContextMenuOption('Insert row above');

      expect($('.htContextMenu').is(':visible')).toBe(false);

      Handsontable.helper.setPlatformMeta(); // Reset platform
    });

    it('should close menu after left click on menu item (macOS and others OS simulation)', async() => {
      Handsontable.helper.setPlatformMeta({ platform: 'MacIntel' }); // Let HoT think that it runs on macOS
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: ['row_above', 'remove_row', '---------', 'alignment'],
        height: 400,
      });

      await selectCell(0, 0);
      await contextMenu();
      await selectContextMenuOption('Insert row above');

      expect($('.htContextMenu').is(':visible')).toBe(false);

      Handsontable.helper.setPlatformMeta(); // Reset platform
    });

    it('should close menu after right click on menu item (Windows OS simulation, #6507#issuecomment-582392301)', async() => {
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

      await selectCell(0, 0);
      await contextMenu();

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

    it('should close menu after right click on menu item (mac OS and others OS simulation, #6507#issuecomment-582392301)', async() => {
      Handsontable.helper.setPlatformMeta({ platform: 'MacIntel' }); // Let HoT think that it runs on macOS
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: ['row_above', 'remove_row', '---------', 'alignment'],
        height: 400,
      });

      await selectCell(0, 0);
      await contextMenu();

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

    it('should close menu after click under the menu', async() => {
      handsontable({
        data: createSpreadsheetData(500, 10),
        contextMenu: ['row_above', 'remove_row'],
        height: 500
      });

      await contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);

      const rect = $('.htContextMenu')[0].getBoundingClientRect();
      const x = parseInt(rect.left + (rect.width / 2), 10);
      const y = parseInt(rect.top + rect.height, 10) + 3;

      await mouseDown(document.elementFromPoint(x, y));

      expect($('.htContextMenu').is(':visible')).toBe(false);
    });
  });

  describe('menu disabled', () => {
    it('should not open menu after right click', async() => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      getPlugin('contextMenu').disablePlugin();

      expect($('.htContextMenu').is(':visible')).toBe(false);

      await contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should not create context menu if it\'s disabled in constructor options', async() => {
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

      await contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(false);

      plugin.enablePlugin();

      await sleep(300);
      await contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it('should reenable menu with updateSettings when it was disabled in constructor', async() => {
      handsontable({
        contextMenu: false,
        height: 100
      });

      const plugin = getPlugin('contextMenu');

      expect(plugin.isEnabled()).toBe(false);

      await updateSettings({
        contextMenu: true
      });

      expect(plugin.isEnabled()).toBe(true);

      expect($('.htContextMenu').is(':visible')).toBe(false);

      await contextMenu();
      await sleep(300);

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it('should disable menu with updateSettings when it was enabled in constructor', async() => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      const plugin = getPlugin('contextMenu');

      expect(plugin.isEnabled()).toBe(true);

      await updateSettings({
        contextMenu: false
      });

      expect(plugin.isEnabled()).toBe(false);
    });

    it('should work properly (remove row) after destroy and new init', async() => {
      const test = async function() {
        handsontable({
          startRows: 5,
          contextMenu: ['remove_row'],
          height: 100
        });

        await selectCell(0, 0);
        await contextMenu();
        await selectContextMenuOption('Remove row');

        expect(getData().length).toEqual(4);
      };

      await test();
      await destroy();
      await test();
    });
  });

  describe('menu hidden items', () => {
    it('should remove separators from top, bottom and duplicated', async() => {
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

      await contextMenu();

      const items = $('.htContextMenu tbody td');
      const actions = items.not('.htSeparator');
      const separators = items.filter('.htSeparator');

      expect(actions.length).toEqual(3);
      expect(separators.length).toEqual(2);
    });

    it('should hide option if hidden function return true', async() => {
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

      await contextMenu();
      let items = $('.htContextMenu tbody td');
      let actions = items.not('.htSeparator');

      expect(actions.length).toEqual(1);
      expect($('.htContextMenu tbody td.htDisabled').text()).toBe([
        'No available options',
      ].join(''));

      const header = $('.ht_clone_top thead th').eq(1);

      header.simulate('mousedown');
      header.simulate('mouseup');

      await contextMenu();

      items = $('.htContextMenu tbody td');
      actions = items.not('.htSeparator');

      expect(actions.length).toEqual(1);
    });
  });

  describe('menu destroy', () => {
    it('should close context menu when HOT is being destroyed', async() => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      await contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);

      destroy();

      expect($('.htContextMenu').is(':visible')).toBe(false);
    });
  });

  describe('subMenu', () => {
    it('should not open subMenu immediately', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      await contextMenu();

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

      await contextMenu();

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

      await contextMenu();

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);

      item.simulate('mouseover');

      await sleep(300);

      expect(getPlugin('contextMenu').menu.hotSubMenus.alignment.hotMenu.getSelected()).toBeUndefined();
    });

    it('should NOT open subMenu if there is no subMenu for item', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      await contextMenu();

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

      await contextMenu();

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

      await contextMenu();

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
    it('should display the default set of actions', async() => {
      handsontable({
        contextMenu: true,
        comments: true,
        height: 100
      });

      await contextMenu();

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

    it('should disable column manipulation when row header selected', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        colHeaders: true,
        rowHeaders: true,
        height: 100
      });

      const rowHeader = $('.ht_clone_inline_start .htCore').eq(0).find('tbody').find('th').eq(0);

      await simulateClick(rowHeader, 'RMB');
      await contextMenu();

      expect($('.htContextMenu tbody td.htDisabled').text()).toBe([
        'Insert column left',
        'Insert column right',
        'Remove columns',
        'Undo',
        'Redo',
      ].join(''));
    });

    it('should disable row manipulation when column header selected', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        colHeaders: true,
        rowHeaders: true,
        height: 100
      });

      const header = $('.ht_clone_top .htCore').find('thead').find('th').eq(2);

      await simulateClick(header, 'RMB');
      await contextMenu();

      expect($('.htContextMenu tbody td.htDisabled').text()).toBe([
        'Insert row above',
        'Insert row below',
        'Remove rows',
        'Undo',
        'Redo',
      ].join(''));
    });

    it('should disable proper options when corner header was selected and there are visible cells', async() => {
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

      await simulateClick(corner, 'RMB');
      await contextMenu(corner);

      expect($('.htContextMenu tbody td.htDisabled').text()).toBe([
        'Undo',
        'Redo',
        'Read only',
        'Alignment',
      ].join(''));
    });

    // This test should be removed when some changes in handling a such dataset will be done. Regression check.
    it('should disable proper options when row header was selected and there are no visible cells #6733', async() => {
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

      await simulateClick(header, 'RMB');
      await contextMenu(header);

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
      it('data schema was defined', async() => {
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

        await simulateClick(corner, 'RMB');
        await contextMenu(corner);

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

      it('data schema was not defined', async() => {
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

        await simulateClick(corner, 'RMB');
        await contextMenu(corner);

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

    it('should insert row above selection', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 400
      });

      const afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');

      addHook('afterCreateRow', afterCreateRowCallback);

      expect(countRows()).toEqual(4);

      await selectCell(1, 0, 3, 0);
      await contextMenu();
      await selectContextMenuOption('Insert row above');

      expect(afterCreateRowCallback).toHaveBeenCalledWith(1, 1, 'ContextMenu.rowAbove');
      expect(countRows()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should insert row below selection when initial data is empty', async() => {
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

      await simulateClick(cell, 'RMB');
      await selectContextMenuOption('Insert row below');

      expect(afterCreateRowCallback).toHaveBeenCalledWith(0, 1, 'ContextMenu.rowBelow');
      expect(countRows()).toEqual(1);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should NOT display insert row selection', async() => {
      handsontable({
        contextMenu: true,
        allowInsertRow: false
      });

      await contextMenu();

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

    it('should NOT display insert column selection', async() => {
      handsontable({
        contextMenu: true,
        allowInsertColumn: false
      });

      await contextMenu();

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

    it('should insert row above selection (reverse selection)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      const afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');

      addHook('afterCreateRow', afterCreateRowCallback);

      expect(countRows()).toEqual(4);

      await selectCell(3, 0, 1, 0);
      await contextMenu();
      await selectContextMenuOption('Insert row above');

      expect(afterCreateRowCallback).toHaveBeenCalledWith(1, 1, 'ContextMenu.rowAbove');
      expect(countRows()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should insert row below selection', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true
      });

      const afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');

      addHook('afterCreateRow', afterCreateRowCallback);

      expect(countRows()).toEqual(4);

      await selectCell(1, 0, 3, 0);
      await contextMenu();
      await selectContextMenuOption('Insert row below');

      expect(afterCreateRowCallback).toHaveBeenCalledWith(4, 1, 'ContextMenu.rowBelow');
      expect(countRows()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should insert row below selection (reverse selection)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true
      });

      const afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');

      addHook('afterCreateRow', afterCreateRowCallback);

      expect(countRows()).toEqual(4);

      await selectCell(3, 0, 1, 0);
      await contextMenu();
      await selectContextMenuOption('Insert row below');

      expect(afterCreateRowCallback).toHaveBeenCalledWith(4, 1, 'ContextMenu.rowBelow');
      expect(countRows()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should Insert column left of selection', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        width: 400,
        height: 400
      });

      const afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');

      addHook('afterCreateCol', afterCreateColCallback);

      expect(countCols()).toEqual(4);

      await selectCell(0, 1, 0, 3);
      await contextMenu();
      await selectContextMenuOption('Insert column left');

      expect(afterCreateColCallback).toHaveBeenCalledWith(1, 1, 'ContextMenu.columnLeft');
      expect(countCols()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should Insert column right of selection when initial data is empty', async() => {
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

      await simulateClick(cell, 'RMB');
      await contextMenu(cell[0]);
      await selectContextMenuOption('Insert column right');

      expect(afterCreateColCallback).toHaveBeenCalledWith(0, 1, 'ContextMenu.columnRight');
      expect(countCols()).toEqual(1);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should Insert column left of selection (reverse selection)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      const afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');

      addHook('afterCreateCol', afterCreateColCallback);

      expect(countCols()).toEqual(4);

      await selectCell(0, 3, 0, 1);
      await contextMenu();
      await selectContextMenuOption('Insert column left');

      expect(afterCreateColCallback).toHaveBeenCalledWith(1, 1, 'ContextMenu.columnLeft');
      expect(countCols()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should Insert column right of selection', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      const afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');

      addHook('afterCreateCol', afterCreateColCallback);

      expect(countCols()).toEqual(4);

      await selectCell(0, 1, 0, 3);
      await contextMenu();
      await selectContextMenuOption('Insert column right');

      expect(afterCreateColCallback).toHaveBeenCalledWith(4, 1, 'ContextMenu.columnRight');
      expect(countCols()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should Insert column right of selection (reverse selection)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      const afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');

      addHook('afterCreateCol', afterCreateColCallback);

      expect(countCols()).toEqual(4);

      await selectCell(0, 3, 0, 1);
      await contextMenu();
      await selectContextMenuOption('Insert column right');

      expect(afterCreateColCallback).toHaveBeenCalledWith(4, 1, 'ContextMenu.columnRight');
      expect(countCols()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should remove selected rows', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      const afterRemoveRowCallback = jasmine.createSpy('afterRemoveRowCallback');

      addHook('afterRemoveRow', afterRemoveRowCallback);

      expect(countRows()).toEqual(4);

      await selectCell(1, 0, 3, 0);
      await contextMenu();
      await selectContextMenuOption('Remove row');

      expect(afterRemoveRowCallback).toHaveBeenCalledWith(1, 3, [1, 2, 3], 'ContextMenu.removeRow');
      expect(countRows()).toEqual(1);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should allow to remove the latest row', async() => {
      handsontable({
        data: createSpreadsheetData(1, 4),
        contextMenu: true,
        height: 100
      });

      const afterRemoveRowCallback = jasmine.createSpy('afterRemoveRowCallback');

      addHook('afterRemoveRow', afterRemoveRowCallback);

      expect(countRows()).toBe(1);

      await selectCell(0, 0, 0, 0);
      await contextMenu();
      await selectContextMenuOption('Remove row');

      expect(afterRemoveRowCallback).toHaveBeenCalledWith(0, 1, [0], 'ContextMenu.removeRow');
      expect(countRows()).toBe(0);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should remove selected rows (reverse selection)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      const afterRemoveRowCallback = jasmine.createSpy('afterRemoveRowCallback');

      addHook('afterRemoveRow', afterRemoveRowCallback);

      expect(countRows()).toBe(4);

      await selectCell(3, 0, 1, 0);
      await contextMenu();
      await selectContextMenuOption('Remove row');

      expect(afterRemoveRowCallback).toHaveBeenCalledWith(1, 3, [1, 2, 3], 'ContextMenu.removeRow');
      expect(countRows()).toBe(1);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should remove selected columns', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      const afterRemoveColCallback = jasmine.createSpy('afterRemoveColCallback');

      addHook('afterRemoveCol', afterRemoveColCallback);

      expect(countCols()).toBe(4);

      await selectCell(0, 1, 0, 3);
      await contextMenu();
      await selectContextMenuOption('Remove column');

      expect(afterRemoveColCallback).toHaveBeenCalledWith(1, 3, [1, 2, 3], 'ContextMenu.removeColumn');
      expect(countCols()).toBe(1);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should allow to remove the latest column', async() => {
      handsontable({
        data: createSpreadsheetData(4, 1),
        contextMenu: true,
        height: 100
      });

      const afterRemoveColCallback = jasmine.createSpy('afterRemoveColCallback');

      addHook('afterRemoveCol', afterRemoveColCallback);

      expect(countCols()).toBe(1);

      await selectCell(0, 0, 0, 0);
      await contextMenu();
      await selectContextMenuOption('Remove column');

      expect(afterRemoveColCallback).toHaveBeenCalledWith(0, 1, [0], 'ContextMenu.removeColumn');
      expect(countCols()).toBe(0);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should remove selected columns (reverse selection)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      const afterRemoveColCallback = jasmine.createSpy('afterRemoveColCallback');

      addHook('afterRemoveCol', afterRemoveColCallback);

      expect(countCols()).toEqual(4);

      await selectCell(0, 3, 0, 1);
      await contextMenu();
      await selectContextMenuOption('Remove column');

      expect(afterRemoveColCallback).toHaveBeenCalledWith(1, 3, [1, 2, 3], 'ContextMenu.removeColumn');
      expect(countCols()).toEqual(1);
    });

    it('should undo changes', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      await setDataAtCell(0, 0, 'XX');
      await selectCell(0, 0);
      await contextMenu();
      await selectContextMenuOption('Undo');

      expect(getDataAtCell(0, 0)).toBe('A1');
    });

    it('should hide undo menu item when the UndoRedo plugin is disabled', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100,
        undo: false,
      });

      await selectCell(0, 0);
      await contextMenu();

      const $undoMenuItem = $('.htContextMenu .ht_master .htCore')
        .find('tbody td:contains("Undo")');

      expect($undoMenuItem.length).toBe(0);
    });

    it('should hide undo menu item when the UndoRedo plugin is missing', async() => {
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

      await selectCell(0, 0);
      await contextMenu();

      const $undoMenuItem = $('.htContextMenu .ht_master .htCore')
        .find('tbody td:contains("Undo")');

      expect($undoMenuItem.length).toBe(0);
    });

    it('should redo changes', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      await selectCell(0, 0);
      await setDataAtCell(0, 0, 'XX');
      getPlugin('undoRedo').undo();

      expect(getDataAtCell(0, 0)).toBe('A1');

      await contextMenu();
      await selectContextMenuOption('Redo');

      expect(getDataAtCell(0, 0)).toBe('XX');
    });

    it('should hide redo menu item when the UndoRedo plugin is disabled', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100,
        undo: false,
      });

      await selectCell(0, 0);
      await contextMenu();

      const $undoMenuItem = $('.htContextMenu .ht_master .htCore')
        .find('tbody td:contains("Redo")');

      expect($undoMenuItem.length).toBe(0);
    });

    it('should hide redo menu item when the UndoRedo plugin is missing', async() => {
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

      await selectCell(0, 0);
      await contextMenu();

      const $undoMenuItem = $('.htContextMenu .ht_master .htCore')
        .find('tbody td:contains("Redo")');

      expect($undoMenuItem.length).toBe(0);
    });

    it('should display only the specified actions', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: ['remove_row', 'undo'],
        height: 100
      });

      await contextMenu();

      expect($('.htContextMenu .ht_master .htCore').find('tbody td').length).toEqual(2);
    });

    it('should not close menu after clicking on submenu root item', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: ['row_above', 'remove_row', '---------', 'alignment'],
        height: 400
      });

      await selectCell(1, 0, 3, 0);
      await contextMenu();
      await selectContextMenuOption('Alignment');

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it('should not deselect submenu while selecting child items', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: ['row_above', 'remove_row', '---------', 'alignment'],
        height: 400
      });

      await selectCell(1, 0, 3, 0);
      await contextMenu();

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

    it('should highlight menu items after hovering them', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 400
      });

      await selectCell(1, 0, 3, 0);
      await contextMenu();

      $('.htContextMenu .ht_master .htCore tbody td')
        .not('.htSeparator')
        .eq(2) // "Insert column left"
        .simulate('mousemove')
        .simulate('mouseenter')
        .simulate('mouseover');

      expect(getPlugin('contextMenu').menu.getSelectedItem()?.key).forThemes(({ classic, main, horizon }) => {
        classic.toEqual('col_left');
        main.toEqual(undefined);
        horizon.toEqual(undefined);
      });
    });
  });

  describe('disabling actions', () => {
    it('should not close menu after clicking on disabled item', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: ['undo', 'redo'],
        height: 400
      });

      await selectCell(1, 0, 3, 0);
      await contextMenu();
      await selectContextMenuOption('Undo');

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it('should disable undo and redo action if undoRedo plugin is not enabled ', async() => {
      handsontable({
        contextMenu: true,
        undoRedo: false,
        height: 100
      });

      await contextMenu();

      const $menu = $('.htContextMenu .ht_master .htCore');

      expect($menu.find('tbody td:eq(9)').text()).toEqual('Undo');
      expect($menu.find('tbody td:eq(9)').hasClass('htDisabled')).toBe(true);
      expect($menu.find('tbody td:eq(10)').text()).toEqual('Redo');
      expect($menu.find('tbody td:eq(10)').hasClass('htDisabled')).toBe(true);
    });

    it('should disable undo when there is nothing to undo ', async() => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      await contextMenu();

      let $menu = $(getPlugin('contextMenu').menu.container).find('.ht_master .htCore');

      expect(getPlugin('undoRedo').isUndoAvailable()).toBe(false);
      expect($menu.find('tbody td:eq(9)').text()).toEqual('Undo');
      expect($menu.find('tbody td:eq(9)').hasClass('htDisabled')).toBe(true);

      await closeContextMenu();

      await setDataAtCell(0, 0, 'foo');

      await contextMenu();
      $menu = $(getPlugin('contextMenu').menu.container).find('.ht_master .htCore');
      expect(getPlugin('undoRedo').isUndoAvailable()).toBe(true);
      expect($menu.find('tbody td:eq(9)').hasClass('htDisabled')).toBe(false);
    });

    it('should disable redo when there is nothing to redo ', async() => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      await contextMenu();

      let $menu = $(getPlugin('contextMenu').menu.container).find('.ht_master .htCore');

      expect(getPlugin('undoRedo').isRedoAvailable()).toBe(false);
      expect($menu.find('tbody td:eq(10)').text()).toEqual('Redo');
      expect($menu.find('tbody td:eq(10)').hasClass('htDisabled')).toBe(true);

      await closeContextMenu();
      await setDataAtCell(0, 0, 'foo');

      getPlugin('undoRedo').undo();

      await contextMenu();
      $menu = $(getPlugin('contextMenu').menu.container).find('.ht_master .htCore');
      expect(getPlugin('undoRedo').isRedoAvailable()).toBe(true);
      expect($menu.find('tbody td:eq(10)').hasClass('htDisabled')).toBe(false);
    });

    it('should disable Insert row in context menu when maxRows is reached', async() => {
      handsontable({
        contextMenu: true,
        maxRows: 6,
        height: 100
      });

      await contextMenu();

      let $menu = $(getPlugin('contextMenu').menu.container).find('.ht_master .htCore');

      expect($menu.find('tbody td:eq(0)').text()).toEqual('Insert row above');
      expect($menu.find('tbody td:eq(0)').hasClass('htDisabled')).toBe(false);
      expect($menu.find('tbody td:eq(1)').text()).toEqual('Insert row below');
      expect($menu.find('tbody td:eq(1)').hasClass('htDisabled')).toBe(false);

      await closeContextMenu();
      await alter('insert_row_above');
      await contextMenu();

      $menu = $(getPlugin('contextMenu').menu.container).find('.ht_master .htCore');

      expect($menu.find('tbody td:eq(0)').hasClass('htDisabled')).toBe(true);
      expect($menu.find('tbody td:eq(1)').hasClass('htDisabled')).toBe(true);
    });

    it('should disable Insert col in context menu when maxCols is reached', async() => {
      handsontable({
        contextMenu: true,
        maxCols: 6,
        height: 100
      });

      await contextMenu();

      let $menu = $(getPlugin('contextMenu').menu.container).find('.ht_master .htCore');

      expect($menu.find('tbody td:eq(3)').text()).toEqual('Insert column left');
      expect($menu.find('tbody td:eq(3)').hasClass('htDisabled')).toBe(false);
      expect($menu.find('tbody td:eq(4)').text()).toEqual('Insert column right');
      expect($menu.find('tbody td:eq(4)').hasClass('htDisabled')).toBe(false);

      await closeContextMenu();
      await alter('insert_col_start');
      await contextMenu();

      $menu = $(getPlugin('contextMenu').menu.container).find('.ht_master .htCore');
      expect($menu.find('tbody td:eq(3)').hasClass('htDisabled')).toBe(true);
      expect($menu.find('tbody td:eq(4)').hasClass('htDisabled')).toBe(true);
    });

    it('should NOT disable Insert col in context menu when only one column exists', async() => {
      handsontable({
        data: [['single col']],
        contextMenu: true,
        maxCols: 10,
        height: 100
      });

      await selectCell(0, 0);
      await contextMenu();

      const $menu = $(getPlugin('contextMenu').menu.container).find('.ht_master .htCore');

      expect($menu.find('tbody td:eq(3)').text()).toEqual('Insert column left');
      expect($menu.find('tbody td:eq(3)').hasClass('htDisabled')).toBe(false);
      expect($menu.find('tbody td:eq(4)').text()).toEqual('Insert column right');
      expect($menu.find('tbody td:eq(4)').hasClass('htDisabled')).toBe(false);
    });

    it('should disable Remove col in context menu when rows are selected by headers', async() => {
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

      await contextMenu();

      const $menu = $(getPlugin('contextMenu').menu.container).find('.ht_master .htCore');

      expect($menu.find('tbody td:eq(0)').text()).toEqual('Remove columns');
      expect($menu.find('tbody td:eq(0)').hasClass('htDisabled')).toBe(true);
    });

    it('should disable Remove row in context menu when columns are selected by headers', async() => {
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

      await contextMenu();

      const $menu = $(getPlugin('contextMenu').menu.container).find('.ht_master .htCore');

      expect($menu.find('tbody td:eq(1)').text()).toEqual('Remove rows');
      expect($menu.find('tbody td:eq(1)').hasClass('htDisabled')).toBe(true);
    });
  });

  describe('custom options', () => {
    it('should have custom items list', async() => {
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

      await contextMenu();

      expect($('.htContextMenu .ht_master .htCore').find('tbody td').length).toEqual(2);
      expect($('.htContextMenu .ht_master .htCore').find('tbody td').text())
        .toEqual(['CustomItem1', 'CustomItem2'].join(''));

      await selectContextMenuOption('CustomItem1');

      expect(callback1.calls.count()).toEqual(1);
      expect(callback2.calls.count()).toEqual(0);

      await contextMenu();
      await selectContextMenuOption('CustomItem2');

      expect(callback1.calls.count()).toEqual(1);
      expect(callback2.calls.count()).toEqual(1);
    });

    it('should have custom items list (defined as a function)', async() => {
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

      await contextMenu();

      expect($('.htContextMenu .ht_master .htCore').find('tbody td').text()).toEqual('Enable my custom option');

      await selectContextMenuOption('Enable my custom option');

      enabled = true;

      await contextMenu();

      expect($('.htContextMenu .ht_master .htCore').find('tbody td').text()).toEqual('Disable my custom option');
    });

    it('should bind HOT instace to menu\'s `name` function', async() => {
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

      await contextMenu();

      expect(thisInsideFunction).toEqual(hot);
    });

    it('should enable to define item options globally', async() => {
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

      await contextMenu();

      await selectContextMenuOption('CustomItem1');

      expect(callback.calls.count()).toEqual(1);

      await contextMenu();
      await selectContextMenuOption('CustomItem2');

      expect(callback.calls.count()).toEqual(2);
    });

    it('should override default items options', async() => {
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

      await contextMenu();

      expect($('.htContextMenu .ht_master .htCore').find('tbody td').length).toEqual(2);
      expect($('.htContextMenu .ht_master .htCore').find('tbody td').text())
        .toEqual(['Remove row', 'Delete column'].join(''));

      await selectContextMenuOption('Remove row');

      expect(callback.calls.count()).toEqual(1);

      expect(countCols()).toEqual(5);

      await contextMenu();
      await selectContextMenuOption('Delete column');

      expect(countCols()).toEqual(4);
    });

    it('should fire item callback after item has been clicked', async() => {
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

      await contextMenu();
      await selectContextMenuOption('Custom item');

      expect(customItem.callback.calls.count()).toEqual(1);
      expect(customItem.callback.calls.argsFor(0)[0]).toEqual('customItemKey');
    });

    it('should sanitize HTML for custom item', async() => {
      handsontable({
        contextMenu: {
          items: {
            customItemKey: {
              name: '<img src onerror="xss()"> XSS item',
            }
          }
        },
      });

      await contextMenu();

      expect($('.htContextMenu .ht_master .htCore').find('tbody td').html())
        .toBe('<div class="htItemWrapper"><img src=""> XSS item</div>');
    });
  });

  describe('mouse navigation', () => {
    it('should not scroll window position after fireing mouseenter on menu item', async() => {
      handsontable({
        data: createSpreadsheetData(1000, 5),
        contextMenu: true,
      });

      await selectCell(100, 0);
      await contextMenu();
      await scrollWindowTo(0, 0);

      $('.htContextMenu .ht_master .htCore').find('tr td:eq("0")').simulate('mouseenter');

      const scrollHeight = typeof window.scrollY !== 'undefined' ? window.scrollY : document.documentElement.scrollTop;

      expect(scrollHeight).toBe(0);
    });

    it('should not scroll window position after fireing click on menu', async() => {
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

      await selectCell(100, 0);
      await contextMenu();
      await scrollWindowTo(0, 0);

      $('.htContextMenu .ht_master .htCore')
        .find('tbody td')
        .not('.htSeparator')
        .eq(0)
        .simulate('mousedown')
        .simulate('mouseup');

      const scrollHeight = typeof window.scrollY !== 'undefined' ? window.scrollY : document.documentElement.scrollTop;

      expect(scrollHeight).toBe(0);
    });

    it('should fire command after the \'mouseup\' event triggered by the left mouse button', async() => {
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

      await contextMenu();

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td:eq(0)');

      item
        .simulate('mouseenter')
        .simulate('mousedown');

      expect(callback.calls.count()).toBe(0);

      item.simulate('mouseup');

      expect(callback.calls.count()).toBe(1);
    });

    it('should fire command after the \'mouseup\' event triggered by the middle mouse button', async() => {
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

      await contextMenu();

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td:eq(0)');

      item
        .simulate('mouseenter')
        .simulate('mousedown');

      expect(callback.calls.count()).toBe(0);

      item.simulate('mouseup', { button: 1 });

      expect(callback.calls.count()).toBe(1);
    });

    it('should fire command after the \'mouseup\' event triggered by the right mouse button', async() => {
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

      await contextMenu();

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td:eq(0)');

      item
        .simulate('mouseenter')
        .simulate('mousedown');

      expect(callback.calls.count()).toBe(0);

      item.simulate('mouseup', { button: 2 });

      expect(callback.calls.count()).toBe(1);
    });

    it('should not fire command after the \'contextmenu\' event', async() => {
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

      await contextMenu();

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td:eq(0)');

      item
        .simulate('mouseenter')
        .simulate('mousedown');

      expect(callback.calls.count()).toBe(0);

      item.simulate('contextmenu');

      expect(callback.calls.count()).toBe(0);
    });

    it('should not open another instance of ContextMenu after fireing command by the RMB (Windows OS simulation)', async() => {
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

      await contextMenu();

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

    it('should not open another instance of ContextMenu after fireing command by the RMB (macOS and others simulation)', async() => {
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

      await contextMenu();

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
    it('should not be cleared when a context menu is triggered on a selected single cell', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      await selectCell(0, 0);
      await contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);
      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    });

    it('should not be cleared when a context menu is triggered on a range of selected cells', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      await selectCell(0, 0, 2, 2);
      await contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);
      expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    });

    it('should not be cleared when a context menu is triggered on the first layer of the non-contiguous selection', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        contextMenu: true,
        height: 200
      });

      await mouseDown(getCell(0, 0));
      await mouseOver(getCell(2, 2));
      await mouseUp(getCell(2, 2));

      await keyDown('control/meta');

      await mouseDown(getCell(2, 2));
      await mouseOver(getCell(7, 2));
      await mouseUp(getCell(7, 2));

      await mouseDown(getCell(2, 4));
      await mouseOver(getCell(2, 4));
      await mouseUp(getCell(2, 4));

      await keyUp('control/meta');
      await contextMenu(getCell(0, 0));

      expect($('.htContextMenu').is(':visible')).toBe(true);
      expect(getSelected()).toEqual([[0, 0, 2, 2], [2, 2, 7, 2], [2, 4, 2, 4]]);
    });

    it('should not be cleared when a context menu is triggered on the second layer of the non-contiguous selection', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        contextMenu: true,
        height: 200
      });

      await mouseDown(getCell(0, 0));
      await mouseOver(getCell(2, 2));
      await mouseUp(getCell(2, 2));

      await keyDown('control/meta');

      await mouseDown(getCell(2, 2));
      await mouseOver(getCell(7, 2));
      await mouseUp(getCell(7, 2));

      await mouseDown(getCell(2, 4));
      await mouseOver(getCell(2, 4));
      await mouseUp(getCell(2, 4));

      await keyUp('control/meta');
      await contextMenu(getCell(2, 2));

      expect($('.htContextMenu').is(':visible')).toBe(true);
      expect(getSelected()).toEqual([[0, 0, 2, 2], [2, 2, 7, 2], [2, 4, 2, 4]]);
    });

    it('should not be cleared when a context menu is triggered on the last layer of the non-contiguous selection', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        contextMenu: true,
        height: 200
      });

      await mouseDown(getCell(0, 0));
      await mouseOver(getCell(2, 2));
      await mouseUp(getCell(2, 2));

      await keyDown('control/meta');

      await mouseDown(getCell(2, 2));
      await mouseOver(getCell(7, 2));
      await mouseUp(getCell(7, 2));

      await mouseDown(getCell(2, 4));
      await mouseOver(getCell(2, 4));
      await mouseUp(getCell(2, 4));

      await keyUp('control/meta');
      await contextMenu(getCell(2, 4));

      expect($('.htContextMenu').is(':visible')).toBe(true);
      expect(getSelected()).toEqual([[0, 0, 2, 2], [2, 2, 7, 2], [2, 4, 2, 4]]);
    });

    it('should properly change selection on right click on headers', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        contextMenu: true,
        colHeaders: true,
        rowHeaders: true,
      });

      await selectCell(0, 0);
      await contextMenu(getCell(-1, 0));

      expect(getSelected()).toEqual([[-1, 0, 1, 0]]);
      expect(selection().isEntireColumnSelected()).toBe(true);

      await selectCell(1, 0);
      await contextMenu(getCell(1, -1));

      expect(getSelected()).toEqual([[1, -1, 1, 1]]);
      expect(selection().isEntireRowSelected()).toBe(true);
    });

    it('should continue menu navigation from the position of the lastly highlighted item by mouse', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 400
      });

      await selectCell(1, 0, 3, 0);
      await contextMenu();

      $('.htContextMenu .ht_master .htCore tbody td')
        .not('.htSeparator')
        .eq(2) // "Insert column left"
        .simulate('mousemove')
        .simulate('mouseenter')
        .simulate('mouseover');

      expect(getPlugin('contextMenu').menu.getNavigator().getCurrentPage()).toBe(3);
      expect(getPlugin('contextMenu').menu.getSelectedItem()?.key).forThemes(({ classic, main, horizon }) => {
        classic.toEqual('col_left');
        main.toEqual(undefined);
        horizon.toEqual(undefined);
      });

      await keyDownUp('arrowDown');

      expect(getPlugin('contextMenu').menu.getNavigator().getCurrentPage()).toBe(4);
      expect(getPlugin('contextMenu').menu.getSelectedItem()?.key).forThemes(({ classic, main, horizon }) => {
        classic.toEqual('col_right');
        main.toEqual('col_right');
        horizon.toEqual('col_right');
      });
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

      await contextMenu();
      expect(hot1.getPlugin('contextMenu').isEnabled()).toBe(false);
      expect(contextMenuContainer.is(':visible')).toBe(false);

      contextMenu2();
      expect(hot2.getPlugin('contextMenu').isEnabled()).toBe(true);
      expect($('.htContextMenu').is(':visible')).toBe(true);

      await mouseDown(hot2.rootElement); // close menu

      hot1.updateSettings({
        contextMenu: true
      });
      hot2.updateSettings({
        contextMenu: false
      });

      contextMenu2();
      expect(hot2.getPlugin('contextMenu').isEnabled()).toBe(false);

      await contextMenu();
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

    it('should perform a contextMenu action only for particular instance of HOT ', async() => {
      const hot1 = handsontable({
        contextMenu: true,
        height: 100
      });

      const hot2 = spec().$container2.handsontable({
        contextMenu: true,
        height: 100
      }).handsontable('getInstance');

      hot1.selectCell(0, 0);
      await contextMenu();

      expect(hot1.countRows()).toEqual(5);
      expect(hot2.countRows()).toEqual(5);

      await selectContextMenuOption('Insert row above');

      expect(hot1.countRows()).toEqual(6);
      expect(hot2.countRows()).toEqual(5);

      hot2.selectCell(0, 0);
      contextMenu2();

      expect(hot1.countRows()).toEqual(6);
      expect(hot2.countRows()).toEqual(5);

      await selectContextMenuOption('Insert row above');

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

      await selectCell(0, 0);
      await keyDownUp('enter');

      await contextMenu(getCell(2, 2));

      await sleep(100);

      await contextMenu(getCell(2, 2));

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

    it('should display menu table is not scrolled', async() => {
      handsontable({
        data: createSpreadsheetData(40, 30),
        colWidths: 50, // can also be a number or a function
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        height: 100
      });

      await contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it('should display menu table is scrolled', async() => {
      handsontable({
        data: createSpreadsheetData(40, 30),
        colWidths: 50, // can also be a number or a function
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        height: 100
      });

      await scrollViewportVertically(300);

      await selectCell(15, 3);
      await contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it('should not close the menu, when table is scrolled', async() => {
      handsontable({
        data: createSpreadsheetData(40, 30),
        colWidths: 50, // can also be a number or a function
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        height: 100
      });

      const $mainHolder = $(tableView()._wt.wtTable.holder);

      await selectCell(15, 3);
      const scrollTop = $mainHolder.scrollTop();

      await contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);

      await scrollViewportVertically(scrollTop + 60);

      expect($('.htContextMenu').is(':visible')).toBe(true);

      await contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);

      await scrollViewportVertically(scrollTop + 100);

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it('should not attempt to close menu, when table is scrolled and the menu is already closed', async() => {
      handsontable({
        data: createSpreadsheetData(40, 30),
        colWidths: 50, // can also be a number or a function
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        height: 100
      });

      const mainHolder = $(tableView()._wt.wtTable.holder);

      await selectCell(15, 3);

      const scrollTop = mainHolder.scrollTop();

      await contextMenu();

      spyOn(getPlugin('contextMenu'), 'close');

      await scrollViewportVertically(scrollTop + 100);

      expect(getPlugin('contextMenu').close).not.toHaveBeenCalled();
    });

    it('should not scroll the window when hovering over context menu items (#1897 reopen)', async() => {
      spec().$wrapper.css('overflow', 'visible');

      handsontable({
        data: createSpreadsheetData(403, 303),
        colWidths: 50, // can also be a number or a function
        contextMenu: true
      });

      const beginningScrollX = window.scrollX;

      await selectCell(2, 4);
      await contextMenu();

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

      await selectCell(0, 0);
      await contextMenu();

      await sleep(100);

      expect(cb.calls.count()).toBe(1);

      await contextMenu();

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

      await contextMenu();

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

      await selectCell(0, 0);
      await contextMenu();

      await sleep(100);

      expect(cb.calls.count()).toBe(1);

      await contextMenu();

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

      await contextMenu();

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

      await contextMenu();

      await sleep(200);

      expect(keys).toEqual(['make_read_only', 'col_left']);

      Handsontable.hooks.remove('beforeContextMenuSetItems', hookListener);
    });
  });

  describe('table listening', () => {
    it('should listen to changes after removing all rows', async() => {
      handsontable({
        data: [[1]],
        rowHeaders: true,
        colHeaders: true,
        contextMenu: ['remove_row'],
      });

      await selectRows(0);
      await contextMenu();

      await selectContextMenuOption('Remove row');

      expect(countRows()).toBe(0);
      expect(isListening()).toBe(true);
    });

    it('should listen to changes after removing all columns', async() => {
      handsontable({
        data: [[1]],
        rowHeaders: true,
        colHeaders: true,
        contextMenu: ['remove_col'],
      });

      await selectColumns(0);
      await contextMenu();

      await selectContextMenuOption('Remove column');

      expect(countCols()).toBe(0);
      expect(isListening()).toBe(true);
    });
  });

  describe('Cleaning up after the context menu', () => {
    it('should not leave any context menu containers after destroying the Handsontable instance', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      await contextMenu();
      await selectContextMenuOption('Alignment');

      destroy();

      expect($('.htMenu').size()).toEqual(0);
      expect($('.htMenu').size()).toEqual(0);
    });
  });

  describe('Changing selection after alter actions from context-menu', () => {
    describe('should keep the row selection in the same position as before inserting the row', () => {
      it('above the selected row', async() => {
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

        await simulateClick(header, 'RMB');
        await selectContextMenuOption('Insert row above');

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

      it('below the selected row', async() => {
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

        await simulateClick(header, 'RMB');
        await selectContextMenuOption('Insert row below');

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
    'after some context-menu action', async() => {
    const errorSpy = spyOn(console, 'error');

    handsontable({
      data: createSpreadsheetData(4, 4),
      contextMenu: true,
      height: 100
    });

    addHook('beforeCreateCol', async() => {
      await updateSettings({}); // Will close the menu. Instance of Handsontable being a context-menu is destroyed.
    });

    await contextMenu();
    await selectContextMenuOption('insert column left');

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('should inherit the actual layout direction option from the root Handsontable instance', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      contextMenu: true,
      height: 400,
      layoutDirection: 'inherit',
    });

    await contextMenu();

    expect(getPlugin('contextMenu').menu.hotMenu.getSettings().layoutDirection).toBe('ltr');
  });

  it('should close the context menu after call `useTheme`', async() => {
    const hot = handsontable({
      contextMenu: true,
      height: 100
    });

    expect(getPlugin('contextMenu')).toBeDefined();
    expect($('.htContextMenu').is(':visible')).toBe(false);

    await contextMenu();

    expect($('.htContextMenu').is(':visible')).toBe(true);

    hot.useTheme(undefined);

    expect($('.htContextMenu').is(':visible')).toBe(false);
  });
});

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

describe('ContextMenu', function () {
      var id = 'testContainer';

      beforeEach(function () {
            this.$container = $('<div id="' + id + '"></div>').appendTo('body');
      });

      afterEach(function () {
            if (this.$container) {
                  destroy();
                  this.$container.remove();
            }
      });

      it('should update context menu items by calling `updateSettings` method', _asyncToGenerator(function* () {
            handsontable({
                  contextMenu: ['row_above', 'row_below', '---------', 'remove_row'],
                  height: 100
            });

            contextMenu();

            var items = $('.htContextMenu tbody td');
            var actions = items.not('.htSeparator');
            var separators = items.filter('.htSeparator');

            expect(actions.length).toEqual(3);
            expect(separators.length).toEqual(1);

            expect(actions.text()).toEqual(['Insert row above', 'Insert row below', 'Remove row'].join(''));

            updateSettings({
                  contextMenu: ['remove_row']
            });

            yield sleep(300);

            contextMenu();

            items = $('.htContextMenu tbody td');
            actions = items.not('.htSeparator');
            separators = items.filter('.htSeparator');

            expect(actions.length).toEqual(1);
            expect(separators.length).toEqual(0);

            expect(actions.text()).toEqual(['Remove row'].join(''));

            updateSettings({
                  contextMenu: {
                        items: {
                              remove_col: true,
                              hsep1: '---------',
                              custom: { name: 'My custom item' }
                        }
                  }
            });

            yield sleep(300);

            contextMenu();

            items = $('.htContextMenu tbody td');
            actions = items.not('.htSeparator');
            separators = items.filter('.htSeparator');

            expect(actions.length).toEqual(2);
            expect(separators.length).toEqual(1);

            expect(actions.text()).toEqual(['Remove column', 'My custom item'].join(''));
      }));

      describe('menu width', function () {
            it('should display the menu with the minimum width', _asyncToGenerator(function* () {
                  handsontable({
                        contextMenu: {
                              items: {
                                    custom1: {
                                          name: 'a'
                                    },
                                    custom2: {
                                          name: 'b'
                                    }
                              }
                        }
                  });

                  var $menu = $('.htContextMenu');

                  contextMenu();

                  yield sleep(300);

                  expect($menu.find('.wtHider').width()).toEqual(215);
            }));

            it('should expand menu when one of items is wider then default width of the menu', _asyncToGenerator(function* () {
                  handsontable({
                        contextMenu: {
                              items: {
                                    custom1: {
                                          name: 'a'
                                    },
                                    custom2: {
                                          name: 'This is very long text which should expand the context menu...'
                                    }
                              }
                        }
                  });

                  var $menu = $('.htContextMenu');

                  contextMenu();

                  yield sleep(300);

                  expect($menu.find('.wtHider').width()).toBeGreaterThan(215);
            }));

            it('should display a submenu with the minimum width', _asyncToGenerator(function* () {
                  handsontable({
                        contextMenu: {
                              items: {
                                    custom1: {
                                          name: 'a'
                                    },
                                    custom2: {
                                          name: function name() {
                                                return 'Menu';
                                          },

                                          submenu: {
                                                items: [{ name: function name() {
                                                            return 'Submenu';
                                                      } }]
                                          }
                                    }
                              }
                        }
                  });

                  contextMenu();

                  yield sleep(300);

                  var $item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(1);

                  $item.simulate('mouseover');

                  yield sleep(300);

                  var $contextSubMenu = $('.htContextMenuSub_' + $item.text());

                  expect($contextSubMenu.find('.wtHider').width()).toEqual(215);
            }));
      });

      describe('menu opening', function () {
            it('should open menu after right click on table cell', function () {
                  handsontable({
                        contextMenu: true,
                        height: 100
                  });

                  expect(getPlugin('contextMenu')).toBeDefined();
                  expect($('.htContextMenu').is(':visible')).toBe(false);

                  contextMenu();

                  expect($('.htContextMenu').is(':visible')).toBe(true);
            });

            it('should finish selection after right click on table cell', function () {
                  var hot = handsontable({
                        contextMenu: true
                  });

                  var cell = getCell(0, 0);
                  var cellOffset = $(cell).offset();

                  $(cell).simulate('mousedown', { button: 2 });
                  $(cell).simulate('contextmenu', {
                        clientX: cellOffset.left - Handsontable.dom.getWindowScrollLeft(),
                        clientY: cellOffset.top - Handsontable.dom.getWindowScrollTop()
                  });

                  expect(hot.selection.isInProgress()).toBe(false);
            });

            it('should call every selection hooks after right click on table cell', function () {
                  handsontable({
                        contextMenu: true
                  });

                  var afterSelectionCallback = jasmine.createSpy('afterSelectionCallback');
                  var afterSelectionByPropCallback = jasmine.createSpy('afterSelectionByPropCallback');
                  var afterSelectionEndCallback = jasmine.createSpy('afterSelectionEndCallback');
                  var afterSelectionEndByPropCallback = jasmine.createSpy('afterSelectionEndByPropCallback');

                  addHook('afterSelection', afterSelectionCallback);
                  addHook('afterSelectionByProp', afterSelectionByPropCallback);
                  addHook('afterSelectionEnd', afterSelectionEndCallback);
                  addHook('afterSelectionEndByProp', afterSelectionEndByPropCallback);

                  var cell = getCell(0, 0);
                  var cellOffset = $(cell).offset();

                  $(cell).simulate('mousedown', { button: 2 });
                  $(cell).simulate('contextmenu', {
                        clientX: cellOffset.left - Handsontable.dom.getWindowScrollLeft(),
                        clientY: cellOffset.top - Handsontable.dom.getWindowScrollTop()
                  });

                  expect(afterSelectionCallback.calls.count()).toEqual(1);
                  expect(afterSelectionByPropCallback.calls.count()).toEqual(1);
                  expect(afterSelectionEndCallback.calls.count()).toEqual(1);
                  expect(afterSelectionEndByPropCallback.calls.count()).toEqual(1);
                  expect(afterSelectionCallback).toHaveBeenCalledWith(0, 0, 0, 0, jasmine.any(Object), 0);
                  expect(afterSelectionByPropCallback).toHaveBeenCalledWith(0, 0, 0, 0, jasmine.any(Object), 0);
                  expect(afterSelectionEndCallback).toHaveBeenCalledWith(0, 0, 0, 0, 0, void 0);
                  expect(afterSelectionEndByPropCallback).toHaveBeenCalledWith(0, 0, 0, 0, 0, void 0);
            });

            it('should not open the menu after clicking an open editor', function () {
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

            it('should open menu after right click on header cell when only header cells are visible', function () {
                  var hot = handsontable({
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

            it('should open menu after right click on selected column header (the current selection should not be changed)', function () {
                  var hot = handsontable({
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
                  expect('\n        |   \u2551   : * : * : * : * :   :   :   :   :   |\n        |===:===:===:===:===:===:===:===:===:===:===|\n        | - \u2551   : A : 0 : 0 : 0 :   :   :   :   :   |\n        | - \u2551   : 0 : 0 : 0 : 0 :   :   :   :   :   |\n        | - \u2551   : 0 : 0 : 0 : 0 :   :   :   :   :   |\n        | - \u2551   : 0 : 0 : 0 : 0 :   :   :   :   :   |\n        | - \u2551   : 0 : 0 : 0 : 0 :   :   :   :   :   |\n        ').toBeMatchToSelectionPattern();
            });

            it('should open menu after right click on selected row header (the current selection should not be changed)', function () {
                  var hot = handsontable({
                        data: createSpreadsheetData(5, 10),
                        colHeaders: true,
                        rowHeaders: true,
                        contextMenu: true,
                        height: 100
                  });

                  selectRows(1, 3);

                  expect(hot.getPlugin('contextMenu')).toBeDefined();
                  expect($('.htContextMenu').is(':visible')).toBe(false);

                  contextMenu(hot.rootElement.querySelector('.ht_clone_left tbody tr:nth-child(3) th'));

                  expect($('.htContextMenu').is(':visible')).toBe(true);
                  expect('\n        |   \u2551 - : - : - : - : - : - : - : - : - : - |\n        |===:===:===:===:===:===:===:===:===:===:===|\n        |   \u2551   :   :   :   :   :   :   :   :   :   |\n        | * \u2551 A : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |\n        | * \u2551 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |\n        | * \u2551 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |\n        |   \u2551   :   :   :   :   :   :   :   :   :   |\n        ').toBeMatchToSelectionPattern();
            });

            it('should open menu after right click on header corner', function () {
                  var hot = handsontable({
                        data: [],
                        colHeaders: true,
                        rowHeaders: true,
                        contextMenu: true,
                        height: 100
                  });

                  expect(hot.getPlugin('contextMenu')).toBeDefined();
                  expect($('.htContextMenu').is(':visible')).toBe(false);

                  contextMenu(hot.rootElement.querySelector('.ht_clone_top_left_corner thead th'));

                  expect($('.htContextMenu').is(':visible')).toBe(true);
            });

            it('should open menu after right click active cell border', function () {
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

      describe('menu closing', function () {
            it('should close menu after click', function () {
                  handsontable({
                        contextMenu: true,
                        height: 100
                  });

                  contextMenu();

                  expect($('.htContextMenu').is(':visible')).toBe(true);

                  mouseDown(spec().$container);

                  expect($('.htContextMenu').is(':visible')).toBe(false);
            });

            it('should close menu after click under the menu', function () {
                  handsontable({
                        data: createSpreadsheetData(500, 10),
                        contextMenu: true,
                        height: 500
                  });

                  contextMenu();

                  expect($('.htContextMenu').is(':visible')).toBe(true);

                  var rect = $('.htContextMenu')[0].getBoundingClientRect();
                  var x = parseInt(rect.left + rect.width / 2, 10);
                  var y = parseInt(rect.top + rect.height, 10);
                  mouseDown(document.elementFromPoint(x, y));

                  expect($('.htContextMenu').is(':visible')).toBe(false);
            });
      });

      describe('menu disabled', function () {
            it('should not open menu after right click', function () {
                  handsontable({
                        contextMenu: true,
                        height: 100
                  });

                  getPlugin('contextMenu').disablePlugin();

                  expect($('.htContextMenu').is(':visible')).toBe(false);

                  contextMenu();

                  expect($('.htContextMenu').is(':visible')).toBe(false);
            });

            it('should not create context menu if it\'s disabled in constructor options', function () {
                  handsontable({
                        contextMenu: false,
                        height: 100
                  });

                  expect(getPlugin('contextMenu').isEnabled()).toBe(false);
            });

            it('should reenable menu', _asyncToGenerator(function* () {
                  handsontable({
                        contextMenu: true,
                        height: 100
                  });

                  var plugin = getPlugin('contextMenu');

                  plugin.disablePlugin();

                  expect($('.htContextMenu').is(':visible')).toBe(false);

                  contextMenu();

                  expect($('.htContextMenu').is(':visible')).toBe(false);

                  plugin.enablePlugin();

                  yield sleep(300);

                  contextMenu();

                  expect($('.htContextMenu').is(':visible')).toBe(true);
            }));

            it('should reenable menu with updateSettings when it was disabled in constructor', function () {
                  handsontable({
                        contextMenu: false,
                        height: 100
                  });

                  var plugin = getPlugin('contextMenu');

                  expect(plugin.isEnabled()).toBe(false);

                  updateSettings({
                        contextMenu: true
                  });

                  expect(plugin.isEnabled()).toBe(true);

                  expect($('.htContextMenu').is(':visible')).toBe(false);

                  contextMenu();

                  setTimeout(function () {
                        expect($('.htContextMenu').is(':visible')).toBe(true);
                  }, 300);
            });

            it('should disable menu with updateSettings when it was enabled in constructor', function () {
                  handsontable({
                        contextMenu: true,
                        height: 100
                  });

                  var plugin = getPlugin('contextMenu');

                  expect(plugin.isEnabled()).toBe(true);

                  updateSettings({
                        contextMenu: false
                  });

                  expect(plugin.isEnabled()).toBe(false);
            });

            it('should work properly (remove row) after destroy and new init', function () {
                  var test = function test() {
                        handsontable({
                              startRows: 5,
                              contextMenu: ['remove_row'],
                              height: 100
                        });
                        selectCell(0, 0);
                        contextMenu();

                        var action = $('.htContextMenu .ht_master .htCore tbody').find('td').not('.htSeparator').eq(0);

                        action.simulate('mousedown');

                        expect(getData().length).toEqual(4);
                  };
                  test();

                  destroy();

                  test();
            });
      });

      describe('menu hidden items', function () {
            it('should remove separators from top, bottom and duplicated', function () {
                  handsontable({
                        contextMenu: ['---------', '---------', 'row_above', '---------', '---------', 'row_below', '---------', 'remove_row'],
                        height: 100
                  });

                  contextMenu();

                  var items = $('.htContextMenu tbody td');
                  var actions = items.not('.htSeparator');
                  var separators = items.filter('.htSeparator');

                  expect(actions.length).toEqual(3);
                  expect(separators.length).toEqual(2);
            });

            it('should hide option if hidden function return true', function () {
                  handsontable({
                        startCols: 5,
                        colHeaders: true,
                        contextMenu: [{
                              key: '',
                              name: 'Custom option',
                              hidden: function hidden() {
                                    return !this.selection.isSelectedByColumnHeader();
                              }
                        }]
                  });

                  contextMenu();
                  var items = $('.htContextMenu tbody td');
                  var actions = items.not('.htSeparator');

                  expect(actions.length).toEqual(0);

                  var header = $('.ht_clone_top thead th').eq(1);

                  header.simulate('mousedown');
                  header.simulate('mouseup');
                  contextMenu();

                  items = $('.htContextMenu tbody td');
                  actions = items.not('.htSeparator');
                  expect(actions.length).toEqual(1);
            });
      });

      describe('menu destroy', function () {
            it('should close context menu when HOT is being destroyed', function () {
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

      describe('subMenu', function () {
            it('should not open subMenu immediately', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        height: 100
                  });

                  contextMenu();

                  var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
                  item.simulate('mouseover');
                  var contextSubMenu = $('.htContextMenuSub_' + item.text()).find('tbody td');

                  expect(contextSubMenu.length).toEqual(0);
            });

            it('should open subMenu with delay', _asyncToGenerator(function* () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        height: 100
                  });

                  contextMenu();

                  var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);

                  item.simulate('mouseover');

                  yield sleep(300);

                  var contextSubMenu = $('.htContextMenuSub_' + item.text());

                  expect(contextSubMenu.length).toEqual(1);
            }));

            it('should NOT open subMenu if there is no subMenu for item', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        height: 100
                  });

                  contextMenu();

                  var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(8);

                  item.simulate('mouseover');

                  expect(item.hasClass('htSubmenu')).toBe(false);

                  var contextSubMenu = $('.htContextMenuSub_' + item.text());

                  expect(contextSubMenu.length).toEqual(0);
            });

            it('should not throw error when opening multi-level menu with name declared as `function` #4550', _asyncToGenerator(function* () {
                  var spy = spyOn(window, 'onerror');

                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: {
                              items: {
                                    alignment: {
                                          name: function name() {
                                                return 'Alignment';
                                          },

                                          submenu: {
                                                items: [{ key: 'alignment:left', name: 'Align to LEFT' }]
                                          }
                                    }
                              }
                        }
                  });

                  contextMenu();

                  var $submenu = $('.htSubmenu');

                  $submenu.simulate('mouseover');

                  yield sleep(350);

                  expect(spy).not.toHaveBeenCalled();
            }));

            it('should not throw error when opening multi-level menu with name declared as `function` which return value not castable to string', _asyncToGenerator(function* () {
                  var spy = spyOn(window, 'onerror');

                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: {
                              items: {
                                    alignment: {
                                          name: function name() {
                                                return void 0;
                                          },

                                          submenu: {
                                                items: [{ key: 'alignment:left', name: 'Align to LEFT' }]
                                          }
                                    },
                                    custom1: {
                                          name: function name() {
                                                return null;
                                          },

                                          submenu: {
                                                items: [{ key: 'custom1:test', name: 'Test1' }]
                                          }
                                    },
                                    custom2: {
                                          name: function name() {
                                                return 0;
                                          },

                                          submenu: {
                                                items: [{ key: 'custom2:test', name: 'Test2' }]
                                          }
                                    }
                              }
                        }
                  });

                  contextMenu();

                  var $submenu1 = $('.htSubmenu').eq(0);

                  $submenu1.simulate('mouseover');

                  yield sleep(350);

                  var $submenu2 = $('.htSubmenu').eq(1);

                  $submenu2.simulate('mouseover');

                  yield sleep(350);

                  var $submenu3 = $('.htSubmenu').eq(2);

                  $submenu3.simulate('mouseover');

                  yield sleep(350);

                  expect(spy).not.toHaveBeenCalled();
            }));

            it('should open subMenu on the left of main menu if on the right there\'s no space left', function () {
                  handsontable({
                        data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
                        contextMenu: true,
                        width: window.innerWidth
                  });

                  selectCell(0, countCols() - 1);
                  contextMenu();

                  var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
                  var contextMenuRoot = $('.htContextMenu');

                  item.simulate('mouseover');

                  expect(item.text()).toBe('Alignment');
                  expect(item.hasClass('htSubmenu')).toBe(true);

                  var contextSubMenu = $('.htContextMenuSub_' + item.text());

                  expect(contextSubMenu.offset().left).toBeLessThan(contextMenuRoot.offset().left - contextSubMenu.width() + 30); // 30 - scroll
            });

            it('should open subMenu on the right of main menu if there\'s free space', _asyncToGenerator(function* () {
                  handsontable({
                        data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
                        contextMenu: true,
                        width: window.innerWidth
                  });

                  selectCell(0, countCols() - 10);
                  contextMenu();

                  var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
                  var contextMenuRoot = $('.htContextMenu');

                  item.simulate('mouseover');

                  yield sleep(300);

                  expect(item.text()).toBe('Alignment');
                  expect(item.hasClass('htSubmenu')).toBe(true);

                  var contextSubMenu = $('.htContextMenuSub_' + item.text());

                  expect(contextSubMenu.offset().left).toBeGreaterThan(contextMenuRoot.offset().left + contextMenuRoot.width() - 30); // 30 - scroll
            }));

            it('should open subMenu on the left-bottom of main menu if there\'s free space', _asyncToGenerator(function* () {
                  handsontable({
                        data: createSpreadsheetData(Math.floor(window.innerHeight / 23), Math.floor(window.innerWidth / 50)),
                        contextMenu: true,
                        height: window.innerHeight
                  });

                  window.scrollTo(0, document.body.clientHeight);
                  selectCell(0, countCols() - 1);
                  contextMenu();

                  var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
                  var contextMenuRoot = $('.htContextMenu');

                  item.simulate('mouseover');

                  yield sleep(300);

                  expect(item.text()).toBe('Alignment');
                  expect(item.hasClass('htSubmenu')).toBe(true);

                  var contextSubMenu = $('.htContextMenuSub_' + item.text());

                  expect(parseInt(contextSubMenu.offset().top, 10)).toBeAroundValue(parseInt(item.offset().top, 10) - 1);
                  expect(parseInt(contextSubMenu.offset().left, 10)).toBeLessThan(contextMenuRoot.offset().left - contextSubMenu.width() + 30); // 30 - scroll
            }));

            it('should open subMenu on the right-bottom of main menu if there\'s free space', _asyncToGenerator(function* () {
                  handsontable({
                        data: createSpreadsheetData(Math.floor(window.innerHeight / 23), Math.floor(window.innerWidth / 50)),
                        contextMenu: true,
                        height: window.innerHeight
                  });

                  window.scrollTo(0, document.body.clientHeight);
                  selectCell(0, countCols() - 10);

                  contextMenu();

                  var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
                  var contextMenuRoot = $('.htContextMenu');

                  item.simulate('mouseover');

                  yield sleep(300);

                  expect(item.text()).toBe('Alignment');
                  expect(item.hasClass('htSubmenu')).toBe(true);

                  var contextSubMenu = $('.htContextMenuSub_' + item.text());

                  expect(parseInt(contextSubMenu.offset().top, 10)).toBeAroundValue(parseInt(item.offset().top, 10) - 1);
                  expect(parseInt(contextSubMenu.offset().left, 10)).toBeGreaterThan(contextMenuRoot.offset().left + contextMenuRoot.width() - 30); // 30 - scroll
            }));

            it('should open subMenu on the left-top of main menu if there\'s no free space on bottom', _asyncToGenerator(function* () {
                  handsontable({
                        data: createSpreadsheetData(Math.floor(window.innerHeight / 23), Math.floor(window.innerWidth / 50)),
                        contextMenu: true,
                        height: window.innerHeight
                  });

                  selectCell(countRows() - 1, countCols() - 1);
                  contextMenu();

                  var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
                  var contextMenuRoot = $('.htContextMenu');

                  item.simulate('mouseover');

                  yield sleep(300);

                  expect(item.text()).toBe('Alignment');
                  expect(item.hasClass('htSubmenu')).toBe(true);

                  var contextSubMenu = $('.htContextMenuSub_' + item.text());

                  expect(contextSubMenu.offset().top + contextSubMenu.height() - 28).toBeAroundValue(item.offset().top);
                  expect(contextSubMenu.offset().left).toBeLessThan(contextMenuRoot.offset().left - contextSubMenu.width() + 30); // 30 - scroll
            }));

            it('should open subMenu on the right-top of main menu if there\'s no free space on bottom', _asyncToGenerator(function* () {
                  handsontable({
                        data: createSpreadsheetData(Math.floor(window.innerHeight / 23), Math.floor(window.innerWidth / 50)),
                        contextMenu: true,
                        height: window.innerHeight
                  });

                  selectCell(countRows() - 1, countCols() - 10);
                  contextMenu();

                  var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
                  var contextMenuRoot = $('.htContextMenu');

                  item.simulate('mouseover');

                  yield sleep(300);

                  expect(item.text()).toBe('Alignment');
                  expect(item.hasClass('htSubmenu')).toBe(true);

                  var contextSubMenu = $('.htContextMenuSub_' + item.text());

                  expect(contextSubMenu.offset().top + contextSubMenu.height() - 28).toBeAroundValue(item.offset().top);
                  expect(contextSubMenu.offset().left).toBeGreaterThan(contextMenuRoot.offset().left + contextMenuRoot.width() - 30); // 30 - scroll
            }));
      });

      describe('default context menu actions', function () {
            it('should display the default set of actions', function () {
                  handsontable({
                        contextMenu: true,
                        comments: true,
                        height: 100
                  });

                  contextMenu();

                  var items = $('.htContextMenu tbody td');
                  var actions = items.not('.htSeparator');
                  var separators = items.filter('.htSeparator');

                  expect(actions.length).toEqual(15);
                  expect(separators.length).toEqual(7);

                  expect(actions.text()).toEqual(['Insert row above', 'Insert row below', 'Insert column left', 'Insert column right', 'Remove row', 'Remove column', 'Undo', 'Redo', 'Read only', 'Alignment', 'Add comment', 'Delete comment', 'Read-only comment', 'Copy', 'Cut'].join(''));
            });

            it('should disable column manipulation when row header selected', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        colHeaders: true,
                        rowHeaders: true,
                        height: 100
                  });

                  $('.ht_clone_left .htCore').eq(0).find('tbody').find('th').eq(0).simulate('mousedown', { which: 3 });
                  contextMenu();

                  expect($('.htContextMenu tbody td.htDisabled').text()).toBe(['Insert column left', 'Insert column right', 'Remove columns', 'Undo', 'Redo'].join(''));
            });

            it('should disable row manipulation when column header selected', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        colHeaders: true,
                        rowHeaders: true,
                        height: 100
                  });

                  var header = $('.ht_clone_top .htCore').find('thead').find('th').eq(2);

                  header.simulate('mousedown', { which: 3 });
                  contextMenu();

                  expect($('.htContextMenu tbody td.htDisabled').text()).toBe(['Insert row above', 'Insert row below', 'Remove rows', 'Undo', 'Redo'].join(''));
            });

            it('should disable cells manipulation when corner header selected', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        colHeaders: true,
                        rowHeaders: true,
                        height: 100
                  });

                  $('.ht_clone_top_left_corner .htCore').find('thead').find('th').eq(0).simulate('mousedown', { which: 3 });
                  contextMenu();

                  expect($('.htContextMenu tbody td.htDisabled').text()).toBe(['Remove row', 'Remove column', 'Undo', 'Redo', 'Read only', 'Alignment'].join(''));
            });

            it('should insert row above selection', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        height: 400
                  });

                  var afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');
                  addHook('afterCreateRow', afterCreateRowCallback);

                  expect(countRows()).toEqual(4);

                  selectCell(1, 0, 3, 0);
                  contextMenu();

                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(0).simulate('mousedown'); // Insert row above

                  expect(afterCreateRowCallback).toHaveBeenCalledWith(1, 1, 'ContextMenu.rowAbove', void 0, void 0, void 0);
                  expect(countRows()).toEqual(5);
                  expect($('.htContextMenu').is(':visible')).toBe(false);
            });

            it('should insert row above selection when initial data is empty', function () {
                  handsontable({
                        rowHeaders: true,
                        colHeaders: true,
                        data: [],
                        dataSchema: [],
                        contextMenu: true,
                        height: 400
                  });

                  var afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');

                  addHook('afterCreateRow', afterCreateRowCallback);

                  expect(countRows()).toEqual(0);

                  var cell = $('.ht_clone_top_left_corner .htCore').find('thead').find('th').eq(0);

                  cell.simulate('mousedown', { which: 3 });
                  contextMenu(cell[0]);
                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(0).simulate('mousedown'); // Insert row above

                  expect(afterCreateRowCallback).toHaveBeenCalledWith(0, 1, 'ContextMenu.rowAbove', void 0, void 0, void 0);
                  expect(countRows()).toEqual(1);
                  expect($('.htContextMenu').is(':visible')).toBe(false);
            });

            it('should NOT display insert row selection', function () {
                  handsontable({
                        contextMenu: true,
                        allowInsertRow: false
                  });

                  contextMenu();

                  var items = $('.htContextMenu tbody td');
                  var actions = items.not('.htSeparator');
                  var separators = items.filter('.htSeparator');

                  expect(actions.length).toEqual(10);
                  expect(separators.length).toEqual(5);

                  expect(actions.text()).toEqual(['Insert column left', 'Insert column right', 'Remove row', 'Remove column', 'Undo', 'Redo', 'Read only', 'Alignment', 'Copy', 'Cut'].join(''));
            });

            it('should NOT display insert column selection', function () {
                  handsontable({
                        contextMenu: true,
                        allowInsertColumn: false
                  });

                  contextMenu();

                  var items = $('.htContextMenu tbody td');
                  var actions = items.not('.htSeparator');

                  expect(actions.length).toEqual(10);

                  expect(actions.text()).toEqual(['Insert row above', 'Insert row below', 'Remove row', 'Remove column', 'Undo', 'Redo', 'Read only', 'Alignment', 'Copy', 'Cut'].join(''));
            });

            it('should insert row above selection (reverse selection)', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        height: 100
                  });

                  var afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');

                  addHook('afterCreateRow', afterCreateRowCallback);

                  expect(countRows()).toEqual(4);

                  selectCell(3, 0, 1, 0);
                  contextMenu();
                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(0).simulate('mousedown'); // Insert row above

                  expect(afterCreateRowCallback).toHaveBeenCalledWith(1, 1, 'ContextMenu.rowAbove', void 0, void 0, void 0);
                  expect(countRows()).toEqual(5);
                  expect($('.htContextMenu').is(':visible')).toBe(false);
            });

            it('should insert row below selection', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        height: 100
                  });

                  var afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');

                  addHook('afterCreateRow', afterCreateRowCallback);

                  expect(countRows()).toEqual(4);

                  selectCell(1, 0, 3, 0);
                  contextMenu();
                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(1).simulate('mousedown'); // Insert row above

                  expect(afterCreateRowCallback).toHaveBeenCalledWith(4, 1, 'ContextMenu.rowBelow', void 0, void 0, void 0);
                  expect(countRows()).toEqual(5);
                  expect($('.htContextMenu').is(':visible')).toBe(false);
            });

            it('should insert row below selection when initial data is empty', function () {
                  handsontable({
                        rowHeaders: true,
                        colHeaders: true,
                        data: [],
                        dataSchema: [],
                        contextMenu: true,
                        height: 400
                  });

                  var afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');

                  addHook('afterCreateRow', afterCreateRowCallback);

                  expect(countRows()).toEqual(0);

                  var cell = $('.ht_clone_top_left_corner .htCore').find('thead').find('th').eq(0);

                  cell.simulate('mousedown', { which: 3 });
                  contextMenu(cell[0]);
                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(1).simulate('mousedown'); // Insert row below

                  expect(afterCreateRowCallback).toHaveBeenCalledWith(0, 1, 'ContextMenu.rowBelow', void 0, void 0, void 0);
                  expect(countRows()).toEqual(1);
                  expect($('.htContextMenu').is(':visible')).toBe(false);
            });

            it('should insert row below selection (reverse selection)', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        height: 100
                  });

                  var afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');

                  addHook('afterCreateRow', afterCreateRowCallback);

                  expect(countRows()).toEqual(4);

                  selectCell(3, 0, 1, 0);
                  contextMenu();
                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(1).simulate('mousedown'); // Insert row below

                  expect(afterCreateRowCallback).toHaveBeenCalledWith(4, 1, 'ContextMenu.rowBelow', void 0, void 0, void 0);
                  expect(countRows()).toEqual(5);
                  expect($('.htContextMenu').is(':visible')).toBe(false);
            });

            it('should Insert column left of selection', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        width: 400,
                        height: 400
                  });

                  var afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');

                  addHook('afterCreateCol', afterCreateColCallback);

                  expect(countCols()).toEqual(4);

                  selectCell(0, 1, 0, 3);
                  contextMenu();
                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(2).simulate('mousedown'); // Insert col left

                  expect(afterCreateColCallback).toHaveBeenCalledWith(1, 1, 'ContextMenu.columnLeft', void 0, void 0, void 0);
                  expect(countCols()).toEqual(5);
                  expect($('.htContextMenu').is(':visible')).toBe(false);
            });

            it('should Insert column left of selection when initial data is empty', function () {
                  handsontable({
                        rowHeaders: true,
                        colHeaders: true,
                        data: [],
                        dataSchema: [],
                        contextMenu: true,
                        height: 400
                  });

                  var afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');

                  addHook('afterCreateCol', afterCreateColCallback);

                  expect(countCols()).toEqual(0);

                  var cell = $('.ht_clone_top_left_corner .htCore').find('thead').find('th').eq(0);

                  cell.simulate('mousedown', { which: 3 });
                  contextMenu(cell[0]);
                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(3).simulate('mousedown'); // Insert column left

                  expect(afterCreateColCallback).toHaveBeenCalledWith(0, 1, 'ContextMenu.columnRight', void 0, void 0, void 0);
                  expect(countCols()).toEqual(1);
                  expect($('.htContextMenu').is(':visible')).toBe(false);
            });

            it('should Insert column left of selection (reverse selection)', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        height: 100
                  });

                  var afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');

                  addHook('afterCreateCol', afterCreateColCallback);

                  expect(countCols()).toEqual(4);

                  selectCell(0, 3, 0, 1);
                  contextMenu();
                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(2).simulate('mousedown'); // Insert col left

                  expect(afterCreateColCallback).toHaveBeenCalledWith(1, 1, 'ContextMenu.columnLeft', void 0, void 0, void 0);
                  expect(countCols()).toEqual(5);
                  expect($('.htContextMenu').is(':visible')).toBe(false);
            });

            it('should Insert column right of selection', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        height: 100
                  });

                  var afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');

                  addHook('afterCreateCol', afterCreateColCallback);

                  expect(countCols()).toEqual(4);

                  selectCell(0, 1, 0, 3);
                  contextMenu();
                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(2).simulate('mousedown'); // Insert col right

                  expect(afterCreateColCallback).toHaveBeenCalledWith(1, 1, 'ContextMenu.columnLeft', void 0, void 0, void 0);
                  expect(countCols()).toEqual(5);
                  expect($('.htContextMenu').is(':visible')).toBe(false);
            });

            it('should Insert column right of selection when initial data is empty', function () {
                  handsontable({
                        rowHeaders: true,
                        colHeaders: true,
                        data: [],
                        dataSchema: [],
                        contextMenu: true,
                        height: 400
                  });

                  var afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');

                  addHook('afterCreateCol', afterCreateColCallback);

                  expect(countCols()).toEqual(0);

                  var cell = $('.ht_clone_top_left_corner .htCore').find('thead').find('th').eq(0);

                  cell.simulate('mousedown', { which: 3 });
                  contextMenu(cell[0]);
                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(3).simulate('mousedown'); // Insert column right

                  expect(afterCreateColCallback).toHaveBeenCalledWith(0, 1, 'ContextMenu.columnRight', void 0, void 0, void 0);
                  expect(countCols()).toEqual(1);
                  expect($('.htContextMenu').is(':visible')).toBe(false);
            });

            it('should Insert column right of selection (reverse selection)', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        height: 100
                  });

                  var afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');

                  addHook('afterCreateCol', afterCreateColCallback);

                  expect(countCols()).toEqual(4);

                  selectCell(0, 3, 0, 1);
                  contextMenu();
                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(3).simulate('mousedown'); // Insert col right

                  expect(afterCreateColCallback).toHaveBeenCalledWith(4, 1, 'ContextMenu.columnRight', void 0, void 0, void 0);
                  expect(countCols()).toEqual(5);
                  expect($('.htContextMenu').is(':visible')).toBe(false);
            });

            it('should remove selected rows', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        height: 100
                  });

                  var afterRemoveRowCallback = jasmine.createSpy('afterRemoveRowCallback');

                  addHook('afterRemoveRow', afterRemoveRowCallback);

                  expect(countRows()).toEqual(4);

                  selectCell(1, 0, 3, 0);
                  contextMenu();
                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(4).simulate('mousedown'); // Remove row

                  expect(afterRemoveRowCallback).toHaveBeenCalledWith(1, 3, [1, 2, 3], 'ContextMenu.removeRow', void 0, void 0);
                  expect(countRows()).toEqual(1);
                  expect($('.htContextMenu').is(':visible')).toBe(false);
            });

            it('should allow to remove the latest row', function () {
                  handsontable({
                        data: createSpreadsheetData(1, 4),
                        contextMenu: true,
                        height: 100
                  });

                  var afterRemoveRowCallback = jasmine.createSpy('afterRemoveRowCallback');

                  addHook('afterRemoveRow', afterRemoveRowCallback);

                  expect(countRows()).toBe(1);

                  selectCell(0, 0, 0, 0);
                  contextMenu();

                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(4).simulate('mousedown'); // Remove row

                  expect(afterRemoveRowCallback).toHaveBeenCalledWith(0, 1, [0], 'ContextMenu.removeRow', void 0, void 0);
                  expect(countRows()).toBe(0);
                  expect($('.htContextMenu').is(':visible')).toBe(false);
            });

            it('should remove selected rows (reverse selection)', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        height: 100
                  });

                  var afterRemoveRowCallback = jasmine.createSpy('afterRemoveRowCallback');

                  addHook('afterRemoveRow', afterRemoveRowCallback);

                  expect(countRows()).toBe(4);

                  selectCell(3, 0, 1, 0);
                  contextMenu();
                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(4).simulate('mousedown'); // Remove row

                  expect(afterRemoveRowCallback).toHaveBeenCalledWith(1, 3, [1, 2, 3], 'ContextMenu.removeRow', void 0, void 0);
                  expect(countRows()).toBe(1);
                  expect($('.htContextMenu').is(':visible')).toBe(false);
            });

            it('should remove selected columns', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        height: 100
                  });

                  var afterRemoveColCallback = jasmine.createSpy('afterRemoveColCallback');

                  addHook('afterRemoveCol', afterRemoveColCallback);

                  expect(countCols()).toBe(4);

                  selectCell(0, 1, 0, 3);
                  contextMenu();
                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(5).simulate('mousedown'); // Remove col

                  expect(afterRemoveColCallback).toHaveBeenCalledWith(1, 3, [1, 2, 3], 'ContextMenu.removeColumn', void 0, void 0);
                  expect(countCols()).toBe(1);
                  expect($('.htContextMenu').is(':visible')).toBe(false);
            });

            it('should allow to remove the latest column', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 1),
                        contextMenu: true,
                        height: 100
                  });

                  var afterRemoveColCallback = jasmine.createSpy('afterRemoveColCallback');

                  addHook('afterRemoveCol', afterRemoveColCallback);

                  expect(countCols()).toBe(1);

                  selectCell(0, 0, 0, 0);
                  contextMenu();

                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(5).simulate('mousedown'); // Remove column

                  expect(afterRemoveColCallback).toHaveBeenCalledWith(0, 1, [0], 'ContextMenu.removeColumn', void 0, void 0);
                  expect(countCols()).toBe(0);
                  expect($('.htContextMenu').is(':visible')).toBe(false);
            });

            it('should remove selected columns (reverse selection)', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        height: 100
                  });

                  var afterRemoveColCallback = jasmine.createSpy('afterRemoveColCallback');

                  addHook('afterRemoveCol', afterRemoveColCallback);

                  expect(countCols()).toEqual(4);

                  selectCell(0, 3, 0, 1);

                  contextMenu();

                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(5).simulate('mousedown'); // Remove col

                  expect(afterRemoveColCallback).toHaveBeenCalledWith(1, 3, [1, 2, 3], 'ContextMenu.removeColumn', void 0, void 0);
                  expect(countCols()).toEqual(1);
            });

            it('should undo changes', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        height: 100
                  });

                  selectCell(0, 0);

                  expect(getDataAtCell(0, 0)).toEqual('A1');

                  setDataAtCell(0, 0, 'XX');

                  expect(getDataAtCell(0, 0)).toEqual('XX');

                  contextMenu();

                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(6).simulate('mousedown'); // Undo

                  expect(getDataAtCell(0, 0)).toEqual('A1');
            });

            it('should redo changes', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        height: 100
                  });

                  selectCell(0, 0);

                  expect(getDataAtCell(0, 0)).toEqual('A1');

                  setDataAtCell(0, 0, 'XX');

                  expect(getDataAtCell(0, 0)).toEqual('XX');

                  undo();

                  expect(getDataAtCell(0, 0)).toEqual('A1');

                  contextMenu();

                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(7).simulate('mousedown'); // Redo

                  expect(getDataAtCell(0, 0)).toEqual('XX');
            });

            it('should display only the specified actions', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: ['remove_row', 'undo'],
                        height: 100
                  });

                  contextMenu();

                  expect($('.htContextMenu .ht_master .htCore').find('tbody td').length).toEqual(2);
            });

            it('should make a single selected cell read-only', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        height: 100
                  });

                  selectCell(0, 0);

                  expect(getDataAtCell(0, 0)).toEqual('A1');
                  expect(getCellMeta(0, 0).readOnly).toBe(false);

                  selectCell(0, 0);
                  contextMenu();

                  var menu = $('.htContextMenu .ht_master .htCore tbody');

                  menu.find('td').not('.htSeparator').eq(8).simulate('mousedown'); // Make read-only

                  expect(getCellMeta(0, 0).readOnly).toBe(true);
            });

            it('should make a single selected cell writable, when it\'s set to read-only', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        height: 100
                  });

                  selectCell(0, 0);

                  expect(getDataAtCell(0, 0)).toEqual('A1');

                  getCellMeta(0, 0).readOnly = true;

                  selectCell(0, 0);
                  contextMenu();

                  var menu = $('.htContextMenu .ht_master .htCore tbody');

                  menu.find('td').not('.htSeparator').eq(8).simulate('mousedown');

                  expect(getCellMeta(0, 0).readOnly).toBe(false);
            });

            it('should make a range of selected cells read-only, if all of them are writable', function () {
                  var hot = handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        height: 100
                  });

                  expect(hot.getCellMeta(0, 0).readOnly).toEqual(false);
                  expect(hot.getCellMeta(0, 1).readOnly).toEqual(false);
                  expect(hot.getCellMeta(1, 0).readOnly).toEqual(false);
                  expect(hot.getCellMeta(1, 1).readOnly).toEqual(false);

                  selectCell(0, 0, 2, 2);

                  contextMenu();
                  $('.htContextMenu .ht_master .htCore tbody').find('td').not('.htSeparator').eq(8).simulate('mousedown');

                  expect(hot.getCellMeta(0, 0).readOnly).toEqual(true);
                  expect(hot.getCellMeta(0, 1).readOnly).toEqual(true);
                  expect(hot.getCellMeta(1, 0).readOnly).toEqual(true);
                  expect(hot.getCellMeta(1, 1).readOnly).toEqual(true);
                  expect(getSelected()).toEqual([[0, 0, 2, 2]]);
            });

            it('should make a multiple of selected cells read-only, if all of them are writable', function () {
                  var hot = handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        height: 100
                  });

                  expect(hot.getCellMeta(0, 0).readOnly).toBe(false);
                  expect(hot.getCellMeta(0, 1).readOnly).toBe(false);
                  expect(hot.getCellMeta(1, 0).readOnly).toBe(false);
                  expect(hot.getCellMeta(1, 1).readOnly).toBe(false);

                  selectCell(0, 0, 2, 2);

                  contextMenu();
                  $('.htContextMenu .ht_master .htCore tbody').find('td').not('.htSeparator').eq(8).simulate('mousedown');

                  expect(hot.getCellMeta(0, 0).readOnly).toBe(true);
                  expect(hot.getCellMeta(0, 1).readOnly).toBe(true);
                  expect(hot.getCellMeta(1, 0).readOnly).toBe(true);
                  expect(hot.getCellMeta(1, 1).readOnly).toBe(true);
            });

            it('should not close menu after clicking on submenu root item', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: ['row_above', 'remove_row', '---------', 'alignment'],
                        height: 400
                  });

                  selectCell(1, 0, 3, 0);
                  contextMenu();

                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(2).simulate('mousedown'); // Alignment
                  expect($('.htContextMenu').is(':visible')).toBe(true);
            });

            it('should make a group of selected cells read-only, if all of them are writable (reverse selection)', function () {
                  var hot = handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        height: 100
                  });

                  expect(hot.getCellMeta(0, 0).readOnly).toBe(false);
                  expect(hot.getCellMeta(0, 1).readOnly).toBe(false);
                  expect(hot.getCellMeta(1, 0).readOnly).toBe(false);
                  expect(hot.getCellMeta(1, 1).readOnly).toBe(false);

                  selectCell(2, 2, 0, 0);

                  contextMenu();

                  var menu = $('.htContextMenu .ht_master .htCore tbody');

                  menu.find('td').not('.htSeparator').eq(8).simulate('mousedown'); // Make read-only

                  expect(hot.getCellMeta(0, 0).readOnly).toBe(true);
                  expect(hot.getCellMeta(0, 1).readOnly).toBe(true);
                  expect(hot.getCellMeta(1, 0).readOnly).toBe(true);
                  expect(hot.getCellMeta(1, 1).readOnly).toBe(true);
            });

            it('should make a group of selected cells writable if at least one of them is read-only', function () {
                  var hot = handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        height: 100
                  });

                  expect(hot.getCellMeta(0, 0).readOnly).toBe(false);
                  expect(hot.getCellMeta(0, 1).readOnly).toBe(false);
                  expect(hot.getCellMeta(1, 0).readOnly).toBe(false);
                  expect(hot.getCellMeta(1, 1).readOnly).toBe(false);

                  hot.getCellMeta(1, 1).readOnly = true;

                  selectCell(0, 0, 2, 2);

                  contextMenu();
                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(8).simulate('mousedown'); // Make writable

                  expect(hot.getCellMeta(0, 0).readOnly).toBe(false);
                  expect(hot.getCellMeta(0, 1).readOnly).toBe(false);
                  expect(hot.getCellMeta(1, 0).readOnly).toBe(false);
                  expect(hot.getCellMeta(1, 1).readOnly).toBe(false);
            });

            it('should make a group of selected cells writable if at least one of them is read-only (reverse selection)', function () {
                  var hot = handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: true,
                        height: 100
                  });

                  expect(hot.getCellMeta(0, 0).readOnly).toBe(false);
                  expect(hot.getCellMeta(0, 1).readOnly).toBe(false);
                  expect(hot.getCellMeta(1, 0).readOnly).toBe(false);
                  expect(hot.getCellMeta(1, 1).readOnly).toBe(false);

                  hot.getCellMeta(1, 1).readOnly = true;

                  selectCell(2, 2, 0, 0);

                  contextMenu();
                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(8).simulate('mousedown'); // Make writable

                  expect(hot.getCellMeta(0, 0).readOnly).toBe(false);
                  expect(hot.getCellMeta(0, 1).readOnly).toBe(false);
                  expect(hot.getCellMeta(1, 0).readOnly).toBe(false);
                  expect(hot.getCellMeta(1, 1).readOnly).toBe(false);
            });
      });

      describe('disabling actions', function () {
            it('should not close menu after clicking on disabled item', function () {
                  handsontable({
                        data: createSpreadsheetData(4, 4),
                        contextMenu: ['undo', 'redo'],
                        height: 400
                  });

                  selectCell(1, 0, 3, 0);
                  contextMenu();

                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(0).simulate('mousedown'); // Undo

                  expect($('.htContextMenu').is(':visible')).toBe(true);
            });

            it('should disable undo and redo action if undoRedo plugin is not enabled ', function () {
                  handsontable({
                        contextMenu: true,
                        undoRedo: false,
                        height: 100
                  });

                  contextMenu();

                  var $menu = $('.htContextMenu .ht_master .htCore');

                  expect($menu.find('tbody td:eq(9)').text()).toEqual('Undo');
                  expect($menu.find('tbody td:eq(9)').hasClass('htDisabled')).toBe(true);
                  expect($menu.find('tbody td:eq(10)').text()).toEqual('Redo');
                  expect($menu.find('tbody td:eq(10)').hasClass('htDisabled')).toBe(true);
            });

            it('should disable undo when there is nothing to undo ', function () {
                  var hot = handsontable({
                        contextMenu: true,
                        height: 100
                  });

                  contextMenu();

                  var $menu = $('.htContextMenu .ht_master .htCore');

                  expect(hot.undoRedo.isUndoAvailable()).toBe(false);
                  expect($menu.find('tbody td:eq(9)').text()).toEqual('Undo');
                  expect($menu.find('tbody td:eq(9)').hasClass('htDisabled')).toBe(true);

                  closeContextMenu();

                  setDataAtCell(0, 0, 'foo');

                  contextMenu();
                  $menu = $('.htContextMenu .ht_master .htCore');
                  expect(hot.undoRedo.isUndoAvailable()).toBe(true);
                  expect($menu.find('tbody td:eq(9)').hasClass('htDisabled')).toBe(false);
            });

            it('should disable redo when there is nothing to redo ', function () {
                  var hot = handsontable({
                        contextMenu: true,
                        height: 100
                  });

                  contextMenu();

                  var $menu = $('.htContextMenu .ht_master .htCore');

                  expect(hot.undoRedo.isRedoAvailable()).toBe(false);
                  expect($menu.find('tbody td:eq(10)').text()).toEqual('Redo');
                  expect($menu.find('tbody td:eq(10)').hasClass('htDisabled')).toBe(true);

                  closeContextMenu();

                  setDataAtCell(0, 0, 'foo');
                  undo();

                  contextMenu();
                  $menu = $('.htContextMenu .ht_master .htCore');
                  expect(hot.undoRedo.isRedoAvailable()).toBe(true);
                  expect($menu.find('tbody td:eq(10)').hasClass('htDisabled')).toBe(false);
            });

            it('should disable Insert row in context menu when maxRows is reached', function () {
                  handsontable({
                        contextMenu: true,
                        maxRows: 6,
                        height: 100
                  });

                  contextMenu();

                  var $menu = $('.htContextMenu .ht_master .htCore');

                  expect($menu.find('tbody td:eq(0)').text()).toEqual('Insert row above');
                  expect($menu.find('tbody td:eq(0)').hasClass('htDisabled')).toBe(false);
                  expect($menu.find('tbody td:eq(1)').text()).toEqual('Insert row below');
                  expect($menu.find('tbody td:eq(1)').hasClass('htDisabled')).toBe(false);

                  closeContextMenu();

                  alter('insert_row');

                  contextMenu();
                  $menu = $('.htContextMenu .ht_master .htCore');

                  expect($menu.find('tbody td:eq(0)').hasClass('htDisabled')).toBe(true);
                  expect($menu.find('tbody td:eq(1)').hasClass('htDisabled')).toBe(true);
            });

            it('should disable Insert col in context menu when maxCols is reached', function () {
                  handsontable({
                        contextMenu: true,
                        maxCols: 6,
                        height: 100
                  });

                  contextMenu();

                  var $menu = $('.htContextMenu .ht_master .htCore');

                  expect($menu.find('tbody td:eq(3)').text()).toEqual('Insert column left');
                  expect($menu.find('tbody td:eq(3)').hasClass('htDisabled')).toBe(false);
                  expect($menu.find('tbody td:eq(4)').text()).toEqual('Insert column right');
                  expect($menu.find('tbody td:eq(4)').hasClass('htDisabled')).toBe(false);

                  closeContextMenu();

                  alter('insert_col');

                  contextMenu();
                  $menu = $('.htContextMenu .ht_master .htCore');
                  expect($menu.find('tbody td:eq(3)').hasClass('htDisabled')).toBe(true);
                  expect($menu.find('tbody td:eq(4)').hasClass('htDisabled')).toBe(true);
            });

            it('should NOT disable Insert col in context menu when only one column exists', function () {
                  handsontable({
                        data: [['single col']],
                        contextMenu: true,
                        maxCols: 10,
                        height: 100
                  });

                  selectCell(0, 0);
                  contextMenu();

                  var $menu = $('.htContextMenu .ht_master .htCore');

                  expect($menu.find('tbody td:eq(3)').text()).toEqual('Insert column left');
                  expect($menu.find('tbody td:eq(3)').hasClass('htDisabled')).toBe(false);
                  expect($menu.find('tbody td:eq(4)').text()).toEqual('Insert column right');
                  expect($menu.find('tbody td:eq(4)').hasClass('htDisabled')).toBe(false);
            });

            it('should disable Remove col in context menu when rows are selected by headers', function () {
                  handsontable({
                        contextMenu: ['remove_col', 'remove_row'],
                        height: 100,
                        colHeaders: true,
                        rowHeaders: true
                  });

                  var $rowsHeaders = spec().$container.find('.ht_clone_left tr th');

                  $rowsHeaders.eq(1).simulate('mousedown');
                  $rowsHeaders.eq(2).simulate('mouseover');
                  $rowsHeaders.eq(3).simulate('mouseover');
                  $rowsHeaders.eq(3).simulate('mousemove');
                  $rowsHeaders.eq(3).simulate('mouseup');

                  contextMenu();

                  var $menu = $('.htContextMenu .ht_master .htCore');

                  expect($menu.find('tbody td:eq(0)').text()).toEqual('Remove columns');
                  expect($menu.find('tbody td:eq(0)').hasClass('htDisabled')).toBe(true);
            });

            it('should disable Remove row in context menu when columns are selected by headers', function () {
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

                  var $menu = $('.htContextMenu .ht_master .htCore');

                  expect($menu.find('tbody td:eq(1)').text()).toEqual('Remove rows');
                  expect($menu.find('tbody td:eq(1)').hasClass('htDisabled')).toBe(true);
            });
      });

      describe('custom options', function () {
            it('should have custom items list', function () {
                  var callback1 = jasmine.createSpy('callback1');
                  var callback2 = jasmine.createSpy('callback2');

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
                  expect($('.htContextMenu .ht_master .htCore').find('tbody td').text()).toEqual(['CustomItem1', 'CustomItem2'].join(''));

                  $('.htContextMenu .ht_master .htCore').find('tbody td:eq(0)').simulate('mousedown');

                  expect(callback1.calls.count()).toEqual(1);
                  expect(callback2.calls.count()).toEqual(0);

                  contextMenu();
                  $('.htContextMenu .ht_master .htCore').find('tbody td:eq(1)').simulate('mousedown');

                  expect(callback1.calls.count()).toEqual(1);
                  expect(callback2.calls.count()).toEqual(1);
            });

            it('should have custom items list (defined as a function)', function () {
                  var enabled = false;

                  handsontable({
                        contextMenu: {
                              items: {
                                    cust1: {
                                          name: function name() {
                                                return !enabled ? 'Enable my custom option' : 'Disable my custom option';
                                          },
                                          callback: function callback() {}
                                    }
                              }
                        },
                        height: 100
                  });

                  contextMenu();

                  expect($('.htContextMenu .ht_master .htCore').find('tbody td').text()).toEqual('Enable my custom option');

                  $('.htContextMenu .ht_master .htCore').find('tbody td:eq(0)').simulate('mousedown');

                  enabled = true;

                  contextMenu();

                  expect($('.htContextMenu .ht_master .htCore').find('tbody td').text()).toEqual('Disable my custom option');

                  $('.htContextMenu .ht_master .htCore').find('tbody td:eq(0)').simulate('mousedown');
            });

            it('should bind HOT instace to menu\'s `name` function', function () {
                  var thisInsideFunction = void 0;

                  var hot = handsontable({
                        contextMenu: {
                              items: {
                                    cust1: {
                                          name: function name() {
                                                thisInsideFunction = this;

                                                return 'Example';
                                          }
                                    }
                              }
                        },
                        height: 100
                  });

                  contextMenu();

                  expect(thisInsideFunction).toEqual(hot);
            });

            it('should enable to define item options globally', function () {
                  var callback = jasmine.createSpy('callback');

                  handsontable({
                        contextMenu: {
                              callback: callback,
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

                  $('.htContextMenu .ht_master .htCore').find('tbody td:eq(0)').simulate('mousedown');

                  expect(callback.calls.count()).toEqual(1);

                  contextMenu();
                  $('.htContextMenu .ht_master .htCore').find('tbody td:eq(1)').simulate('mousedown');

                  expect(callback.calls.count()).toEqual(2);
            });

            it('should override default items options', function () {
                  var callback = jasmine.createSpy('callback');

                  handsontable({
                        contextMenu: {
                              items: {
                                    remove_row: {
                                          callback: callback
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
                  expect($('.htContextMenu .ht_master .htCore').find('tbody td').text()).toEqual(['Remove row', 'Delete column'].join(''));

                  $('.htContextMenu .ht_master .htCore').find('tbody td:eq(0)').simulate('mousedown');

                  expect(callback.calls.count()).toEqual(1);

                  expect(countCols()).toEqual(5);

                  contextMenu();
                  $('.htContextMenu .ht_master .htCore').find('tbody td:eq(1)').simulate('mousedown');

                  expect(countCols()).toEqual(4);
            });

            it('should fire item callback after item has been clicked', function () {
                  var customItem = {
                        name: 'Custom item',
                        callback: function callback() {}
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

                  $('.htContextMenu .ht_master .htCore').find('tbody td:eq(0)').simulate('mousedown');

                  expect(customItem.callback.calls.count()).toEqual(1);
                  expect(customItem.callback.calls.argsFor(0)[0]).toEqual('customItemKey');
            });
      });

      describe('keyboard navigation', function () {
            describe('no item selected', function () {
                  it('should select the first item in menu, when user hits ARROW_DOWN', function () {
                        handsontable({
                              contextMenu: true,
                              height: 100
                        });

                        contextMenu();
                        var menuHot = getPlugin('contextMenu').menu.hotMenu;

                        expect(menuHot.getSelected()).toBeUndefined();

                        keyDownUp('arrow_down');

                        expect(menuHot.getSelected()).toEqual([[0, 0, 0, 0]]);
                  });

                  it('should scroll down, when user hits ARROW_DOWN for item in menu below the viewport', function () {
                        handsontable({
                              height: 100,
                              contextMenu: {
                                    items: {
                                          item1: { name: 'Item1' },
                                          item2: { name: 'Item2' },
                                          item3: { name: 'Item3' },
                                          item4: { name: 'Item4' },
                                          item5: { name: 'Item5' },
                                          item6: { name: 'Item6' },
                                          item7: { name: 'Item7' },
                                          item8: { name: 'Item8' },
                                          item9: { name: 'Item9' },
                                          item10: { name: 'Item10' },
                                          item11: { name: 'Item11' },
                                          item12: { name: 'Item12' },
                                          item13: { name: 'Item13' },
                                          item14: { name: 'Item14' },
                                          item15: { name: 'Item15' },
                                          item16: { name: 'Item16' },
                                          item17: { name: 'Item17' },
                                          item18: { name: 'Item18' },
                                          item19: { name: 'Item19' },
                                          item20: { name: 'Item20' },
                                          item21: { name: 'Item21' },
                                          item22: { name: 'Item22' },
                                          item23: { name: 'Item23' },
                                          item24: { name: 'Item24' },
                                          item25: { name: 'Item25' },
                                          item26: { name: 'Item26' },
                                          item27: { name: 'Item27' },
                                          item28: { name: 'Item28' },
                                          item29: { name: 'Item29' },
                                          item30: { name: 'Item30' },
                                          item31: { name: 'Item31' },
                                          item32: { name: 'Item32' },
                                          item33: { name: 'Item33' },
                                          item34: { name: 'Item34' },
                                          item35: { name: 'Item35' },
                                          item36: { name: 'Item36' },
                                          item37: { name: 'Item37' },
                                          item38: { name: 'Item38' },
                                          item39: { name: 'Item39' },
                                          item40: { name: 'Item40' }
                                    }
                              }
                        });

                        contextMenu();

                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');
                        keyDownUp('arrow_down');

                        var scrollHeight = typeof window.scrollY !== 'undefined' ? window.scrollY : document.documentElement.scrollTop;

                        expect(scrollHeight).not.toBe(0);
                  });

                  it('should select the first NOT DISABLED item in menu, when user hits ARROW_DOWN', function () {
                        handsontable({
                              contextMenu: {
                                    items: {
                                          item1: {
                                                name: 'Item1',
                                                disabled: true
                                          },
                                          item2: {
                                                name: 'Item2',
                                                disabled: true
                                          },
                                          item3: {
                                                name: 'Item3'
                                          }
                                    }
                              },
                              height: 100
                        });

                        contextMenu();

                        var menuHot = getPlugin('contextMenu').menu.hotMenu;

                        expect(menuHot.getSelected()).toBeUndefined();

                        keyDownUp('arrow_down');

                        expect(menuHot.getSelected()).toEqual([[2, 0, 2, 0]]);
                  });

                  it('should NOT select any items in menu, when user hits ARROW_DOWN and there is no items enabled', function () {
                        handsontable({
                              contextMenu: {
                                    items: {
                                          item1: {
                                                name: 'Item1',
                                                disabled: true
                                          },
                                          item2: {
                                                name: 'Item2',
                                                disabled: true
                                          },
                                          item3: {
                                                name: 'Item3',
                                                disabled: true
                                          }
                                    }
                              },
                              height: 100
                        });

                        contextMenu();

                        var menuHot = getPlugin('contextMenu').menu.hotMenu;

                        expect(menuHot.getSelected()).toBeUndefined();

                        keyDownUp('arrow_down');

                        expect(menuHot.getSelected()).toBeUndefined();
                  });

                  it('should select the last item in menu, when user hits ARROW_UP', function () {
                        handsontable({
                              contextMenu: {
                                    items: {
                                          item1: 'Item1',
                                          item2: 'Item2',
                                          item3: 'Item3'
                                    }
                              },
                              height: 100
                        });

                        contextMenu();

                        var menuHot = getPlugin('contextMenu').menu.hotMenu;

                        expect(menuHot.getSelected()).toBeUndefined();

                        keyDownUp('arrow_up');

                        expect(menuHot.getSelected()).toEqual([[2, 0, 2, 0]]);
                  });

                  it('should select the last NOT DISABLED item in menu, when user hits ARROW_UP', function () {
                        handsontable({
                              contextMenu: {
                                    items: {
                                          item1: {
                                                name: 'Item1'
                                          },
                                          item2: {
                                                name: 'Item2',
                                                disabled: true
                                          },
                                          item3: {
                                                name: 'Item3',
                                                disabled: true
                                          }
                                    }
                              },
                              height: 100
                        });

                        contextMenu();

                        var menuHot = getPlugin('contextMenu').menu.hotMenu;

                        expect(menuHot.getSelected()).toBeUndefined();

                        keyDownUp('arrow_up');

                        expect(menuHot.getSelected()).toEqual([[0, 0, 0, 0]]);
                  });

                  it('should NOT select any items in menu, when user hits ARROW_UP and there is no items enabled', function () {
                        handsontable({
                              contextMenu: {
                                    items: {
                                          item1: {
                                                name: 'Item1',
                                                disabled: true
                                          },
                                          item2: {
                                                name: 'Item2',
                                                disabled: true
                                          },
                                          item3: {
                                                name: 'Item3',
                                                disabled: true
                                          }
                                    }
                              },
                              height: 100
                        });

                        contextMenu();

                        var menuHot = getPlugin('contextMenu').menu.hotMenu;

                        expect(menuHot.getSelected()).toBeUndefined();

                        keyDownUp('arrow_up');

                        expect(menuHot.getSelected()).toBeUndefined();
                  });
            });

            describe('item selected', function () {

                  it('should select next item when user hits ARROW_DOWN', function () {
                        handsontable({
                              contextMenu: {
                                    items: {
                                          item1: {
                                                name: 'Item1'
                                          },
                                          item2: {
                                                name: 'Item2'
                                          },
                                          item3: {
                                                name: 'Item3'
                                          }
                                    }
                              },
                              height: 100
                        });

                        contextMenu();

                        var menuHot = getPlugin('contextMenu').menu.hotMenu;

                        keyDownUp('arrow_down');

                        expect(menuHot.getSelected()).toEqual([[0, 0, 0, 0]]);

                        keyDownUp('arrow_down');

                        expect(menuHot.getSelected()).toEqual([[1, 0, 1, 0]]);

                        keyDownUp('arrow_down');

                        expect(menuHot.getSelected()).toEqual([[2, 0, 2, 0]]);
                  });

                  it('should select next item (skipping disabled items) when user hits ARROW_DOWN', function () {
                        handsontable({
                              contextMenu: {
                                    items: {
                                          item1: {
                                                name: 'Item1'
                                          },
                                          item2: {
                                                name: 'Item2',
                                                disabled: true
                                          },
                                          item3: {
                                                name: 'Item3'
                                          }
                                    }
                              },
                              height: 100
                        });

                        contextMenu();

                        var menuHot = getPlugin('contextMenu').menu.hotMenu;

                        keyDownUp('arrow_down');

                        expect(menuHot.getSelected()).toEqual([[0, 0, 0, 0]]);

                        keyDownUp('arrow_down');

                        expect(menuHot.getSelected()).toEqual([[2, 0, 2, 0]]);
                  });

                  it('should select next item (skipping separators) when user hits ARROW_DOWN', function () {
                        handsontable({
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
                              },
                              height: 100
                        });

                        contextMenu();

                        var menuHot = getPlugin('contextMenu').menu.hotMenu;

                        keyDownUp('arrow_down');

                        expect(menuHot.getSelected()).toEqual([[0, 0, 0, 0]]);

                        keyDownUp('arrow_down');

                        expect(menuHot.getSelected()).toEqual([[2, 0, 2, 0]]);

                        keyDownUp('arrow_down');

                        expect(menuHot.getSelected()).toEqual([[3, 0, 3, 0]]);
                  });

                  it('should not change selection when last item is selected and user hits ARROW_DOWN', function () {
                        handsontable({
                              contextMenu: {
                                    items: {
                                          item1: {
                                                name: 'Item1'
                                          },
                                          item2: {
                                                name: 'Item2'
                                          },
                                          item3: {
                                                name: 'Item3'
                                          }
                                    }
                              },
                              height: 100
                        });

                        contextMenu();

                        var menuHot = getPlugin('contextMenu').menu.hotMenu;

                        keyDownUp('arrow_down');

                        expect(menuHot.getSelected()).toEqual([[0, 0, 0, 0]]);

                        keyDownUp('arrow_down');

                        expect(menuHot.getSelected()).toEqual([[1, 0, 1, 0]]);

                        keyDownUp('arrow_down');

                        expect(menuHot.getSelected()).toEqual([[2, 0, 2, 0]]);

                        keyDownUp('arrow_down');

                        expect(menuHot.getSelected()).toEqual([[2, 0, 2, 0]]);
                  });

                  it('should not change selection when last enabled item is selected and user hits ARROW_DOWN', function () {
                        handsontable({
                              contextMenu: {
                                    items: {
                                          item1: {
                                                name: 'Item1'
                                          },
                                          item2: {
                                                name: 'Item2'
                                          },
                                          item3: {
                                                name: 'Item3',
                                                disabled: true
                                          }
                                    }
                              },
                              height: 100
                        });

                        contextMenu();

                        var menuHot = getPlugin('contextMenu').menu.hotMenu;

                        keyDownUp('arrow_down');

                        expect(menuHot.getSelected()).toEqual([[0, 0, 0, 0]]);

                        keyDownUp('arrow_down');

                        expect(menuHot.getSelected()).toEqual([[1, 0, 1, 0]]);

                        keyDownUp('arrow_down');

                        expect(menuHot.getSelected()).toEqual([[1, 0, 1, 0]]);
                  });

                  it('should select next item when user hits ARROW_UP', function () {
                        handsontable({
                              contextMenu: {
                                    items: {
                                          item1: {
                                                name: 'Item1'
                                          },
                                          item2: {
                                                name: 'Item2'
                                          },
                                          item3: {
                                                name: 'Item3'
                                          }
                                    }
                              },
                              height: 100
                        });

                        contextMenu();

                        var menuHot = getPlugin('contextMenu').menu.hotMenu;

                        keyDownUp('arrow_up');

                        expect(menuHot.getSelected()).toEqual([[2, 0, 2, 0]]);

                        keyDownUp('arrow_up');

                        expect(menuHot.getSelected()).toEqual([[1, 0, 1, 0]]);

                        keyDownUp('arrow_up');

                        expect(menuHot.getSelected()).toEqual([[0, 0, 0, 0]]);
                  });

                  it('should select next item (skipping disabled items) when user hits ARROW_UP', function () {
                        handsontable({
                              contextMenu: {
                                    items: {
                                          item1: {
                                                name: 'Item1'
                                          },
                                          item2: {
                                                name: 'Item2',
                                                disabled: true
                                          },
                                          item3: {
                                                name: 'Item3'
                                          }
                                    }
                              },
                              height: 100
                        });

                        contextMenu();

                        var menuHot = getPlugin('contextMenu').menu.hotMenu;

                        keyDownUp('arrow_up');

                        expect(menuHot.getSelected()).toEqual([[2, 0, 2, 0]]);

                        keyDownUp('arrow_up');

                        expect(menuHot.getSelected()).toEqual([[0, 0, 0, 0]]);
                  });

                  it('should select next item (skipping separators) when user hits ARROW_UP', function () {
                        handsontable({
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
                              },
                              height: 100
                        });

                        contextMenu();

                        var menuHot = getPlugin('contextMenu').menu.hotMenu;

                        keyDownUp('arrow_up');

                        expect(menuHot.getSelected()).toEqual([[3, 0, 3, 0]]);

                        keyDownUp('arrow_up');

                        expect(menuHot.getSelected()).toEqual([[2, 0, 2, 0]]);

                        keyDownUp('arrow_up');

                        expect(menuHot.getSelected()).toEqual([[0, 0, 0, 0]]);
                  });

                  it('should not change selection when first item is selected and user hits ARROW_UP', function () {
                        handsontable({
                              contextMenu: {
                                    items: {
                                          item1: {
                                                name: 'Item1'
                                          },
                                          item2: {
                                                name: 'Item2'
                                          },
                                          item3: {
                                                name: 'Item3'
                                          }
                                    }
                              },
                              height: 100
                        });

                        contextMenu();

                        var menuHot = getPlugin('contextMenu').menu.hotMenu;

                        keyDownUp('arrow_up');

                        expect(menuHot.getSelected()).toEqual([[2, 0, 2, 0]]);

                        keyDownUp('arrow_up');

                        expect(menuHot.getSelected()).toEqual([[1, 0, 1, 0]]);

                        keyDownUp('arrow_up');

                        expect(menuHot.getSelected()).toEqual([[0, 0, 0, 0]]);

                        keyDownUp('arrow_up');

                        expect(menuHot.getSelected()).toEqual([[0, 0, 0, 0]]);
                  });

                  it('should not change selection when first enabled item is selected and user hits ARROW_UP', function () {
                        handsontable({
                              contextMenu: {
                                    items: {
                                          item1: {
                                                name: 'Item1',
                                                disabled: true
                                          },
                                          item2: {
                                                name: 'Item2'
                                          },
                                          item3: {
                                                name: 'Item3'
                                          }
                                    }
                              },
                              height: 100
                        });

                        contextMenu();

                        var menuHot = getPlugin('contextMenu').menu.hotMenu;

                        keyDownUp('arrow_up');

                        expect(menuHot.getSelected()).toEqual([[2, 0, 2, 0]]);

                        keyDownUp('arrow_up');

                        expect(menuHot.getSelected()).toEqual([[1, 0, 1, 0]]);

                        keyDownUp('arrow_up');

                        expect(menuHot.getSelected()).toEqual([[1, 0, 1, 0]]);
                  });

                  it('should perform a selected item action, when user hits ENTER', function () {
                        var itemAction = jasmine.createSpy('itemAction');
                        var hot = handsontable({
                              contextMenu: {
                                    items: {
                                          item1: {
                                                name: 'Item1',
                                                callback: itemAction
                                          },
                                          item2: 'Item2'
                                    }
                              },
                              height: 100
                        });

                        contextMenu();

                        var menuHot = hot.getPlugin('contextMenu').menu.hotMenu;

                        keyDownUp('arrow_down');

                        expect(menuHot.getSelected()).toEqual([[0, 0, 0, 0]]);

                        expect(itemAction).not.toHaveBeenCalled();

                        keyDownUp('enter');

                        expect(itemAction).toHaveBeenCalled();
                        expect($(hot.getPlugin('contextMenu').menu).is(':visible')).toBe(false);
                  });
            });

            it('should close menu when user hits ESC', function () {
                  handsontable({
                        contextMenu: true,
                        height: 100
                  });

                  contextMenu();

                  expect($('.htContextMenu').is(':visible')).toBe(true);

                  keyDownUp('esc');

                  expect($('.htContextMenu').is(':visible')).toBe(false);
            });

            it('should close sub-menu and parent menu in proper order when user hits ESC twice', _asyncToGenerator(function* () {
                  handsontable({
                        contextMenu: true,
                        height: 100
                  });

                  contextMenu();

                  var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);

                  item.simulate('mouseover');

                  yield sleep(300);

                  expect($('.htContextMenuSub_Alignment').is(':visible')).toBe(true);

                  keyDownUp('esc');

                  expect($('.htContextMenuSub_Alignment').is(':visible')).toBe(false);

                  keyDownUp('esc');

                  expect($('.htContextMenu').is(':visible')).toBe(false);
            }));
      });

      describe('mouse navigation', function () {
            it('should not scroll window position after fireing mouseenter on menu item', function () {
                  handsontable({
                        data: createSpreadsheetData(1000, 5),
                        contextMenu: true
                  });

                  selectCell(100, 0);
                  contextMenu();
                  window.scrollTo(0, 0);
                  $('.htContextMenu .ht_master .htCore').find('tr td:eq("0")').simulate('mouseenter');

                  var scrollHeight = typeof window.scrollY !== 'undefined' ? window.scrollY : document.documentElement.scrollTop;

                  expect(scrollHeight).toBe(0);
            });

            it('should not scroll window position after fireing click on menu', function () {
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
                  $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(0).simulate('mousedown');

                  var scrollHeight = typeof window.scrollY !== 'undefined' ? window.scrollY : document.documentElement.scrollTop;

                  expect(scrollHeight).toBe(0);
            });
      });

      describe('selection', function () {
            it('should not be cleared when a context menu is triggered on a selected single cell', function () {
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

            it('should not be cleared when a context menu is triggered on a range of selected cells', function () {
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

            it('should not be cleared when a context menu is triggered on the first layer of the non-contiguous selection', function () {
                  handsontable({
                        data: createSpreadsheetData(10, 10),
                        contextMenu: true,
                        height: 200
                  });

                  $(getCell(0, 0)).simulate('mousedown');
                  $(getCell(2, 2)).simulate('mouseover');
                  $(getCell(2, 2)).simulate('mouseup');

                  keyDown('ctrl');

                  $(getCell(2, 2)).simulate('mousedown');
                  $(getCell(7, 2)).simulate('mouseover');
                  $(getCell(7, 2)).simulate('mouseup');

                  $(getCell(2, 4)).simulate('mousedown');
                  $(getCell(2, 4)).simulate('mouseover');
                  $(getCell(2, 4)).simulate('mouseup');

                  keyUp('ctrl');
                  contextMenu(getCell(0, 0));

                  expect($('.htContextMenu').is(':visible')).toBe(true);
                  expect(getSelected()).toEqual([[0, 0, 2, 2], [2, 2, 7, 2], [2, 4, 2, 4]]);
            });

            it('should not be cleared when a context menu is triggered on the second layer of the non-contiguous selection', function () {
                  handsontable({
                        data: createSpreadsheetData(10, 10),
                        contextMenu: true,
                        height: 200
                  });

                  $(getCell(0, 0)).simulate('mousedown');
                  $(getCell(2, 2)).simulate('mouseover');
                  $(getCell(2, 2)).simulate('mouseup');

                  keyDown('ctrl');

                  $(getCell(2, 2)).simulate('mousedown');
                  $(getCell(7, 2)).simulate('mouseover');
                  $(getCell(7, 2)).simulate('mouseup');

                  $(getCell(2, 4)).simulate('mousedown');
                  $(getCell(2, 4)).simulate('mouseover');
                  $(getCell(2, 4)).simulate('mouseup');

                  keyUp('ctrl');
                  contextMenu(getCell(2, 2));

                  expect($('.htContextMenu').is(':visible')).toBe(true);
                  expect(getSelected()).toEqual([[0, 0, 2, 2], [2, 2, 7, 2], [2, 4, 2, 4]]);
            });

            it('should not be cleared when a context menu is triggered on the last layer of the non-contiguous selection', function () {
                  handsontable({
                        data: createSpreadsheetData(10, 10),
                        contextMenu: true,
                        height: 200
                  });

                  $(getCell(0, 0)).simulate('mousedown');
                  $(getCell(2, 2)).simulate('mouseover');
                  $(getCell(2, 2)).simulate('mouseup');

                  keyDown('ctrl');

                  $(getCell(2, 2)).simulate('mousedown');
                  $(getCell(7, 2)).simulate('mouseover');
                  $(getCell(7, 2)).simulate('mouseup');

                  $(getCell(2, 4)).simulate('mousedown');
                  $(getCell(2, 4)).simulate('mouseover');
                  $(getCell(2, 4)).simulate('mouseup');

                  keyUp('ctrl');
                  contextMenu(getCell(2, 4));

                  expect($('.htContextMenu').is(':visible')).toBe(true);
                  expect(getSelected()).toEqual([[0, 0, 2, 2], [2, 2, 7, 2], [2, 4, 2, 4]]);
            });
      });

      describe('working with multiple tables', function () {
            beforeEach(function () {
                  this.$container2 = $('<div id="' + id + '-2"></div>').appendTo('body');
            });

            afterEach(function () {
                  if (this.$container2) {
                        this.$container2.handsontable('destroy');
                        this.$container2.remove();
                  }
            });

            it('should apply enabling/disabling contextMenu using updateSetting only to particular instance of HOT ', function () {
                  var hot1 = handsontable({
                        contextMenu: false,
                        height: 100
                  });
                  var hot2 = spec().$container2.handsontable({
                        contextMenu: true,
                        height: 100
                  }).handsontable('getInstance');
                  var contextMenuContainer = $('.htContextMenu');

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

                  setTimeout(function () {
                        expect($('.htContextMenu').is(':visible')).toBe(true);
                  }, 1100);

                  function contextMenu2() {
                        var hot = spec().$container2.data('handsontable');
                        var selected = hot.getSelected();

                        if (!selected) {
                              hot.selectCell(0, 0);
                              selected = hot.getSelected();
                        }

                        var cell = hot.getCell(selected[0][0], selected[0][1]);
                        var cellOffset = $(cell).offset();

                        $(cell).simulate('contextmenu', {
                              pageX: cellOffset.left,
                              pageY: cellOffset.top
                        });
                  }
            });

            it('should perform a contextMenu action only for particular instance of HOT ', function () {
                  var hot1 = handsontable({
                        contextMenu: true,
                        height: 100
                  });

                  var hot2 = spec().$container2.handsontable({
                        contextMenu: true,
                        height: 100
                  }).handsontable('getInstance');

                  hot1.selectCell(0, 0);
                  contextMenu();

                  expect(hot1.countRows()).toEqual(5);
                  expect(hot2.countRows()).toEqual(5);

                  $('.htContextMenu .ht_master .htCore').find('tr td:eq("0")').simulate('mousedown'); // insert row above

                  expect(hot1.countRows()).toEqual(6);
                  expect(hot2.countRows()).toEqual(5);

                  hot2.selectCell(0, 0);
                  contextMenu2();

                  expect(hot1.countRows()).toEqual(6);
                  expect(hot2.countRows()).toEqual(5);

                  $('.htContextMenu .ht_master .htCore').find('tr td:eq("0")').simulate('mousedown'); // insert row above

                  expect(hot1.countRows()).toEqual(6);
                  expect(hot2.countRows()).toEqual(6);

                  function contextMenu2() {
                        var hot = spec().$container2.data('handsontable');
                        var selected = hot.getSelected();

                        if (!selected) {
                              hot.selectCell(0, 0);
                              selected = hot.getSelected();
                        }

                        var cell = hot.getCell(selected[0][0], selected[0][1]);
                        var cellOffset = $(cell).offset();

                        $(cell).simulate('contextmenu', {
                              pageX: cellOffset.left,
                              pageY: cellOffset.top
                        });
                  }
            });
      });

      describe('context menu with disabled `allowInvalid`', function () {
            it('should not close invalid cell', _asyncToGenerator(function* () {
                  handsontable({
                        data: createSpreadsheetData(10, 10),
                        contextMenu: true,
                        validator: function validator(value, callback) {
                              return callback(false);
                        },
                        allowInvalid: false
                  });

                  selectCell(0, 0);
                  keyDownUp('enter');

                  contextMenu(getCell(2, 2));

                  yield sleep(100);

                  contextMenu(getCell(2, 2));

                  yield sleep(100);

                  expect(getActiveEditor().isOpened()).toBe(true);
            }));
      });

      describe('context menu with native scroll', function () {
            beforeEach(function () {
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

            it('should display menu table is not scrolled', function () {
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

            it('should display menu table is scrolled', function () {
                  var hot = handsontable({
                        data: createSpreadsheetData(40, 30),
                        colWidths: 50, // can also be a number or a function
                        rowHeaders: true,
                        colHeaders: true,
                        contextMenu: true,
                        height: 100
                  });

                  var mainHolder = hot.view.wt.wtTable.holder;

                  $(mainHolder).scrollTop(300);
                  $(mainHolder).scroll();

                  selectCell(15, 3);
                  contextMenu();

                  expect($('.htContextMenu').is(':visible')).toBe(true);
            });

            it('should not close the menu, when table is scrolled', function () {
                  var hot = handsontable({
                        data: createSpreadsheetData(40, 30),
                        colWidths: 50, // can also be a number or a function
                        rowHeaders: true,
                        colHeaders: true,
                        contextMenu: true,
                        height: 100
                  });

                  var $mainHolder = $(hot.view.wt.wtTable.holder);

                  selectCell(15, 3);
                  var scrollTop = $mainHolder.scrollTop();
                  contextMenu();

                  expect($('.htContextMenu').is(':visible')).toBe(true);

                  $mainHolder.scrollTop(scrollTop + 60).scroll();

                  expect($('.htContextMenu').is(':visible')).toBe(true);

                  contextMenu();

                  expect($('.htContextMenu').is(':visible')).toBe(true);

                  $mainHolder.scrollTop(scrollTop + 100).scroll();

                  expect($('.htContextMenu').is(':visible')).toBe(true);
            });

            it('should not attempt to close menu, when table is scrolled and the menu is already closed', function () {
                  var hot = handsontable({
                        data: createSpreadsheetData(40, 30),
                        colWidths: 50, // can also be a number or a function
                        rowHeaders: true,
                        colHeaders: true,
                        contextMenu: true,
                        height: 100
                  });

                  var mainHolder = $(hot.view.wt.wtTable.holder);

                  selectCell(15, 3);

                  var scrollTop = mainHolder.scrollTop();

                  contextMenu();

                  spyOn(hot.getPlugin('contextMenu'), 'close');

                  mainHolder.scrollTop(scrollTop + 100).scroll();

                  expect(hot.getPlugin('contextMenu').close).not.toHaveBeenCalled();
            });

            it('should not scroll the window when hovering over context menu items (#1897 reopen)', function () {
                  spec().$wrapper.css('overflow', 'visible');

                  handsontable({
                        data: createSpreadsheetData(403, 303),
                        colWidths: 50, // can also be a number or a function
                        contextMenu: true
                  });

                  var beginningScrollX = window.scrollX;

                  selectCell(2, 4);
                  contextMenu();

                  var cmInstance = getPlugin('contextMenu').menu.hotMenu;

                  expect(1).toEqual(1);

                  cmInstance.selectCell(3, 0);

                  expect(window.scrollX).toEqual(beginningScrollX);

                  cmInstance.selectCell(4, 0);

                  expect(window.scrollX).toEqual(beginningScrollX);

                  cmInstance.selectCell(6, 0);

                  expect(window.scrollX).toEqual(beginningScrollX);
            });
      });

      describe('afterContextMenuDefaultOptions hook', function () {
            it('should call afterContextMenuDefaultOptions hook with context menu options as the first param', _asyncToGenerator(function* () {
                  var cb = jasmine.createSpy();

                  cb.and.callFake(function (options) {
                        options.items.cust1 = {
                              name: 'My custom item',
                              callback: function callback() {}
                        };
                  });

                  Handsontable.hooks.add('afterContextMenuDefaultOptions', cb);

                  handsontable({
                        contextMenu: true,
                        height: 100
                  });

                  contextMenu();

                  var $menu = $('.htContextMenu .ht_master .htCore');

                  expect($menu.find('tbody td').text()).toContain('My custom item');
                  expect(cb.calls.count()).toBe(1);
                  expect(cb.calls.argsFor(0)[0].items.cust1.key).toBe('cust1');
                  expect(cb.calls.argsFor(0)[0].items.cust1.name).toBe('My custom item');

                  Handsontable.hooks.remove('afterContextMenuDefaultOptions', cb);
            }));
      });

      describe('beforeContextMenuSetItems hook', function () {
            it('should add new menu item even when item is excluded from plugin settings', function () {
                  var hot = void 0;

                  Handsontable.hooks.add('beforeContextMenuSetItems', function (options) {
                        if (this === hot || !hot) {
                              options.push({
                                    key: 'test',
                                    name: 'Test'
                              });
                        }
                  });

                  hot = handsontable({
                        contextMenu: ['make_read_only'],
                        height: 100
                  });

                  contextMenu();

                  var items = $('.htContextMenu tbody td');
                  var actions = items.not('.htSeparator');

                  expect(actions.text()).toEqual(['Read only', 'Test'].join(''));
            });

            it('should be called only with items selected in plugin settings', function () {
                  var keys = [];
                  var hot = void 0;

                  Handsontable.hooks.add('beforeContextMenuSetItems', function (items) {
                        if (this === hot || !hot) {
                              keys = items.map(function (v) {
                                    return v.key;
                              });
                        }
                  });

                  hot = handsontable({
                        contextMenu: ['make_read_only', 'col_left'],
                        height: 100
                  });

                  contextMenu();

                  expect(keys).toEqual(['make_read_only', 'col_left']);
            });
      });
});
describe('HiddenColumns', () => {
  const id = 'testContainer';

  const { CONTEXTMENU_ITEMS_SHOW_COLUMN, CONTEXTMENU_ITEMS_HIDE_COLUMN, CONTEXTMENU_ITEMS_NO_ITEMS } = Handsontable.languages.dictionaryKeys;
  const MENU_NO_ITEMS = Handsontable.languages.getTranslatedPhrase('en-US', CONTEXTMENU_ITEMS_NO_ITEMS);
  const MENU_ITEM_SHOW_COLUMN = Handsontable.languages.getTranslatedPhrase('en-US', CONTEXTMENU_ITEMS_SHOW_COLUMN);
  const MENU_ITEM_SHOW_COLUMNS = Handsontable.languages.getTranslatedPhrase('en-US', CONTEXTMENU_ITEMS_SHOW_COLUMN, 1);
  const MENU_ITEM_HIDE_COLUMN = Handsontable.languages.getTranslatedPhrase('en-US', CONTEXTMENU_ITEMS_HIDE_COLUMN);
  const MENU_ITEM_HIDE_COLUMNS = Handsontable.languages.getTranslatedPhrase('en-US', CONTEXTMENU_ITEMS_HIDE_COLUMN, 1);
  const CSS_CLASS_BEFORE_HIDDEN = 'beforeHiddenColumn';
  const CSS_CLASS_AFTER_HIDDEN = 'afterHiddenColumn';
  const CONTEXTMENU_ITEM_SHOW = 'hidden_columns_show';
  const CONTEXTMENU_ITEM_HIDE = 'hidden_columns_hide';

  function getMultilineData(rows, cols) {
    const data = Handsontable.helper.createSpreadsheetData(rows, cols);

    // Column C
    data[0][2] += '\nline';
    data[1][2] += '\nline\nline';

    return data;
  }

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('configuration', () => {
    it('should hide columns if the "hiddenColumns" property is set', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenColumns: {
          columns: [1, 3],
        }
      });

      expect(spec().$container.find('tr:eq(0) td').length).toBe(3);
      expect(getCell(0, 0).innerText).toBe('A1');
      expect(getCell(0, 1)).toBe(null);
      expect(getCell(0, 2).innerText).toBe('C1');
      expect(getCell(0, 3)).toBe(null);
      expect(getCell(0, 4).innerText).toBe('E1');
      expect(countCols()).toBe(5);
    });

    it('should return to default state after calling the disablePlugin method', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenColumns: {
          columns: [1, 3],
        },
      });

      getPlugin('hiddenColumns').disablePlugin();
      render();

      expect(getCell(0, 0).innerText).toBe('A1');
      expect(getCell(0, 1).innerText).toBe('B1');
      expect(getCell(0, 2).innerText).toBe('C1');
      expect(getCell(0, 3).innerText).toBe('D1');
      expect(getCell(0, 4).innerText).toBe('E1');
      expect(countCols()).toBe(5);
    });

    it('should hide columns after calling the enablePlugin method', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenColumns: {
          columns: [1, 3],
        },
      });

      const plugin = getPlugin('hiddenColumns');
      plugin.disablePlugin();
      render();

      expect(countCols()).toBe(5);

      plugin.enablePlugin();
      render();

      expect(countCols()).toBe(5);
      expect(getCell(0, 0).innerText).toBe('A1');
      expect(getCell(0, 1)).toBe(null);
      expect(getCell(0, 2).innerText).toBe('C1');
      expect(getCell(0, 3)).toBe(null);
      expect(getCell(0, 4).innerText).toBe('E1');
    });

    it('should initialize the plugin after setting it up with the "updateSettings" method', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
      });

      const plugin = getPlugin('hiddenColumns');

      expect(plugin.enabled).toEqual(false);

      updateSettings({
        hiddenColumns: {
          columns: [1, 3],
        },
      });

      expect(plugin.enabled).toEqual(true);
      expect(spec().$container.find('tr:eq(0) td').length).toBe(3);
      expect(countCols()).toBe(5);
      expect(getCell(0, 0).innerText).toBe('A1');
      expect(getCell(0, 1)).toBe(null);
      expect(getCell(0, 2).innerText).toBe('C1');
      expect(getCell(0, 3)).toBe(null);
      expect(getCell(0, 4).innerText).toBe('E1');
    });

    it('should update hidden columns with the "updateSettings" method', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenColumns: {
          columns: [1, 3],
        },
      });

      expect(countCols()).toBe(5);
      expect(spec().$container.find('tr:eq(0) td').length).toBe(3);
      expect(getCell(0, 0).innerText).toBe('A1');
      expect(getCell(0, 1)).toBe(null);
      expect(getCell(0, 2).innerText).toBe('C1');
      expect(getCell(0, 3)).toBe(null);
      expect(getCell(0, 4).innerText).toBe('E1');

      updateSettings({
        hiddenColumns: {
          columns: [0, 2, 4],
        },
      });

      expect(countCols()).toBe(5);
      expect(spec().$container.find('tr:eq(0) td').length).toBe(2);
      expect(getCell(0, 0)).toBe(null);
      expect(getCell(0, 1).innerText).toBe('B1');
      expect(getCell(0, 2)).toBe(null);
      expect(getCell(0, 3).innerText).toBe('D1');
      expect(getCell(0, 4)).toBe(null);
    });
  });

  describe('indicators', () => {
    it('should add proper class names in column headers', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
        hiddenColumns: {
          columns: [1, 3],
          indicators: true,
        },
        colHeaders: true,
      });

      expect(getCell(-1, 0)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN);
      expect(getCell(-1, 1)).toBe(null);
      expect(getCell(-1, 2)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN);
      expect(getCell(-1, 2)).toHaveClass(CSS_CLASS_AFTER_HIDDEN);
      expect(getCell(-1, 3)).toBe(null);
      expect(getCell(-1, 4)).toHaveClass(CSS_CLASS_AFTER_HIDDEN);
    });

    it('should render indicators after enabling them in updateSettings', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 3),
        hiddenColumns: {
          columns: [0, 2],
        },
        colHeaders: true,
      });

      expect(getCell(-1, 1)).not.toHaveClass(CSS_CLASS_BEFORE_HIDDEN);
      expect(getCell(-1, 1)).not.toHaveClass(CSS_CLASS_AFTER_HIDDEN);

      updateSettings({
        hiddenColumns: {
          columns: [0, 2],
          indicators: true,
        },
      });

      expect(getCell(-1, 1)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN);
      expect(getCell(-1, 1)).toHaveClass(CSS_CLASS_AFTER_HIDDEN);
    });
  });

  describe('context-menu', () => {
    describe('items', () => {
      describe('hiding', () => {
        it('should not render context menu item for hiding if no column is selected', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(1, 5),
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_HIDE],
            hiddenColumns: true,
          });

          selectCell(0, 0);
          contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toBe(MENU_NO_ITEMS);
        });

        it('should render proper context menu item for hiding if only one column is selected', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(1, 5),
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_HIDE],
            hiddenColumns: true,
          });

          const $header = $(getCell(-1, 0));

          $header.simulate('mousedown');
          $header.simulate('mouseup');
          contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_HIDE_COLUMN);
        });

        it('should render proper context menu item for hiding a few selected columns', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(1, 5),
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_HIDE],
            hiddenColumns: true,
          });

          const start = getCell(-1, 0);
          const end = getCell(-1, 2);

          mouseDown(start);
          mouseOver(end);
          mouseUp(end);

          contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_HIDE_COLUMNS);
        });
      });

      describe('unhiding', () => {
        it('should not render context menu item for unhiding if no column is selected', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(1, 5),
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenColumns: true,
          });

          selectCell(0, 0);
          contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toBe(MENU_NO_ITEMS);
        });

        it('should not render context menu item for unhiding if the first visible column is selected and no column before is hidden', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(1, 5),
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenColumns: {
              columns: [1, 2, 3]
            },
          });

          const header = getCell(-1, 0);

          mouseDown(header);
          mouseUp(header);
          contextMenu(header);

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toBe(MENU_NO_ITEMS);
        });

        it('should not render context menu item for unhiding if the last visible column is selected and no column after is hidden', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(1, 5),
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenColumns: {
              columns: [1, 2, 3],
            },
          });

          const header = getCell(-1, 4);

          mouseDown(header);
          mouseUp(header);
          contextMenu(header);

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toBe(MENU_NO_ITEMS);
        });

        it('should not render context menu item for unhiding if selected column is not the first one and is not the last one', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(1, 5),
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenColumns: {
              columns: [1, 3],
            },
          });

          const header = getCell(-1, 2);

          mouseDown(header);
          mouseUp(header);
          contextMenu(header);

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toBe(MENU_NO_ITEMS);
        });

        it('should render proper context menu item for unhiding if the first visible column is selected and every column before is hidden', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(1, 5),
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenColumns: {
              columns: [0, 1],
            },
          });

          const $header = $(getCell(-1, 2));

          $header.simulate('mousedown');
          $header.simulate('mouseup');
          contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_SHOW_COLUMNS);
        });

        it('should render proper context menu item for unhiding if the last visible column is selected and every column after is hidden', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(1, 5),
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenColumns: {
              columns: [3, 4],
            },
          });

          const $header = $(getCell(-1, 2));

          $header.simulate('mousedown');
          $header.simulate('mouseup');
          contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_SHOW_COLUMNS);
        });

        it('should render proper context menu item for unhiding a few columns', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(1, 5),
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenColumns: {
              columns: [1, 3],
            },
          });

          const start = getCell(-1, 0);
          const end = getCell(-1, 4);

          mouseDown(start);
          mouseOver(end);
          mouseUp(end);

          contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_SHOW_COLUMNS);
        });

        it('should render proper context menu item for unhiding only one column', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(1, 5),
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenColumns: {
              columns: [1],
            },
          });

          const start = getCell(-1, 0);
          const end = getCell(-1, 4);

          mouseDown(start);
          mouseOver(end);
          mouseUp(end);

          contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_SHOW_COLUMN);
        });
      });
    });

    describe('commands', () => {
      describe('hiding', () => {
        describe('should hide selected columns ', () => {
          describe('(selected from the left to the right)', () => {
            it('hiding from a column "at the start" to the next column', () => {
              handsontable({
                data: Handsontable.helper.createSpreadsheetData(1, 5),
                colHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenColumns: true,
              });

              selectColumns(0, 1);

              getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

              expect(spec().$container.find('tr:eq(0) th').length).toBe(3);
              expect(spec().$container.find('tr:eq(1) td').length).toBe(3);
              expect(getCell(0, 0)).toBe(null);
              expect(getCell(0, 1)).toBe(null);
              expect(getCell(0, 2).innerText).toBe('C1');
              expect(getCell(0, 3).innerText).toBe('D1');
              expect(getCell(0, 4).innerText).toBe('E1');
            });

            it('hiding from a column "in the middle" to the next column', () => {
              handsontable({
                data: Handsontable.helper.createSpreadsheetData(1, 5),
                colHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenColumns: true,
              });

              selectColumns(2, 3);

              getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

              expect(spec().$container.find('tr:eq(0) th').length).toBe(3);
              expect(spec().$container.find('tr:eq(1) td').length).toBe(3);
              expect(getCell(0, 0).innerText).toBe('A1');
              expect(getCell(0, 1).innerText).toBe('B1');
              expect(getCell(0, 2)).toBe(null);
              expect(getCell(0, 3)).toBe(null);
              expect(getCell(0, 4).innerText).toBe('E1');
            });

            it('hiding columns at the end', () => {
              handsontable({
                data: Handsontable.helper.createSpreadsheetData(1, 5),
                colHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenColumns: true,
              });

              selectColumns(3, 4);

              getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

              expect(spec().$container.find('tr:eq(0) th').length).toBe(3);
              expect(spec().$container.find('tr:eq(1) td').length).toBe(3);
              expect(getCell(0, 0).innerText).toBe('A1');
              expect(getCell(0, 1).innerText).toBe('B1');
              expect(getCell(0, 2).innerText).toBe('C1');
              expect(getCell(0, 3)).toBe(null);
              expect(getCell(0, 4)).toBe(null);
            });

            it('hiding all columns', () => {
              handsontable({
                data: Handsontable.helper.createSpreadsheetData(1, 5),
                colHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenColumns: true,
              });

              selectColumns(0, 4);

              getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

              expect(spec().$container.find('tr:eq(0) th').length).toBe(0);
              expect(spec().$container.find('tr:eq(1) td').length).toBe(0);
              expect(getCell(0, 0)).toBe(null);
              expect(getCell(0, 1)).toBe(null);
              expect(getCell(0, 2)).toBe(null);
              expect(getCell(0, 3)).toBe(null);
              expect(getCell(0, 4)).toBe(null);
            });
          });

          describe('(selected from the right to the left)', () => {
            it('hiding from column "at the end" to the previous column', () => {
              handsontable({
                data: Handsontable.helper.createSpreadsheetData(1, 5),
                colHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenColumns: true,
              });

              selectColumns(4, 3);

              getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

              expect(spec().$container.find('tr:eq(0) th').length).toBe(3);
              expect(spec().$container.find('tr:eq(1) td').length).toBe(3);
              expect(getCell(0, 0).innerText).toBe('A1');
              expect(getCell(0, 1).innerText).toBe('B1');
              expect(getCell(0, 2).innerText).toBe('C1');
              expect(getCell(0, 3)).toBe(null);
              expect(getCell(0, 4)).toBe(null);
            });

            it('hiding from a column "in the middle" to the previous column', () => {
              handsontable({
                data: Handsontable.helper.createSpreadsheetData(1, 5),
                colHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenColumns: true,
              });

              selectColumns(3, 2);

              getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

              expect(spec().$container.find('tr:eq(0) th').length).toBe(3);
              expect(spec().$container.find('tr:eq(1) td').length).toBe(3);
              expect(getCell(0, 0).innerText).toBe('A1');
              expect(getCell(0, 1).innerText).toBe('B1');
              expect(getCell(0, 2)).toBe(null);
              expect(getCell(0, 3)).toBe(null);
              expect(getCell(0, 4).innerText).toBe('E1');
            });

            it('hiding columns at the start', () => {
              handsontable({
                data: Handsontable.helper.createSpreadsheetData(1, 5),
                colHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenColumns: true,
              });

              selectColumns(1, 0);

              getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

              expect(spec().$container.find('tr:eq(0) th').length).toBe(3);
              expect(spec().$container.find('tr:eq(1) td').length).toBe(3);
              expect(getCell(0, 0)).toBe(null);
              expect(getCell(0, 1)).toBe(null);
              expect(getCell(0, 2).innerText).toBe('C1');
              expect(getCell(0, 3).innerText).toBe('D1');
              expect(getCell(0, 4).innerText).toBe('E1');
            });

            it('hiding all columns', () => {
              handsontable({
                data: Handsontable.helper.createSpreadsheetData(1, 5),
                colHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenColumns: true,
              });

              selectColumns(4, 0);

              getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

              expect(spec().$container.find('tr:eq(0) th').length).toBe(0);
              expect(spec().$container.find('tr:eq(1) td').length).toBe(0);
              expect(getCell(0, 0)).toBe(null);
              expect(getCell(0, 1)).toBe(null);
              expect(getCell(0, 2)).toBe(null);
              expect(getCell(0, 3)).toBe(null);
              expect(getCell(0, 4)).toBe(null);
            });
          });
        });

        describe('should select column on the right side after hide action ' +
          'when on the right there is visible column and', () => {
          it('when there is no hidden column', () => {
            handsontable({
              data: Handsontable.helper.createSpreadsheetData(2, 5),
              rowHeaders: true,
              colHeaders: true,
              contextMenu: [CONTEXTMENU_ITEM_HIDE],
              hiddenColumns: true,
            });

            selectColumns(1, 2);

            getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

            expect(getSelected()).toEqual([[0, 3, 1, 3]]);
            expect(getSelectedRangeLast().highlight.row).toBe(0);
            expect(getSelectedRangeLast().highlight.col).toBe(3);
            expect(getSelectedRangeLast().from.row).toBe(0);
            expect(getSelectedRangeLast().from.col).toBe(3);
            expect(getSelectedRangeLast().to.row).toBe(1);
            expect(getSelectedRangeLast().to.col).toBe(3);
            expect(`
            |   ║   : * :   |
            |===:===:===:===|
            | - ║   : A :   |
            | - ║   : 0 :   |
            `).toBeMatchToSelectionPattern();
          });

          it('when there are hidden columns', () => {
            handsontable({
              data: Handsontable.helper.createSpreadsheetData(2, 10),
              rowHeaders: true,
              colHeaders: true,
              contextMenu: [CONTEXTMENU_ITEM_HIDE],
              hiddenColumns: {
                columns: [0, 1, 5, 6, 7]
              }
            });

            selectColumns(3, 4);

            getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

            expect(getSelected()).toEqual([[0, 8, 1, 8]]);
            expect(getSelectedRangeLast().highlight.row).toBe(0);
            expect(getSelectedRangeLast().highlight.col).toBe(8);
            expect(getSelectedRangeLast().from.row).toBe(0);
            expect(getSelectedRangeLast().from.col).toBe(8);
            expect(getSelectedRangeLast().to.row).toBe(1);
            expect(getSelectedRangeLast().to.col).toBe(8);
            expect(`
            |   ║   : * :   |
            |===:===:===:===|
            | - ║   : A :   |
            | - ║   : 0 :   |
            `).toBeMatchToSelectionPattern();
          });
        });

        describe('should select column on the left side after hide action ' +
          'when on the right there is no more visible column and ', () => {
          it('there is no hidden column', () => {
            handsontable({
              data: Handsontable.helper.createSpreadsheetData(2, 5),
              rowHeaders: true,
              colHeaders: true,
              contextMenu: [CONTEXTMENU_ITEM_HIDE],
              hiddenColumns: true,
            });

            selectColumns(3, 4);

            getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

            expect(getSelected()).toEqual([[0, 2, 1, 2]]);
            expect(getSelectedRangeLast().highlight.row).toBe(0);
            expect(getSelectedRangeLast().highlight.col).toBe(2);
            expect(getSelectedRangeLast().from.row).toBe(0);
            expect(getSelectedRangeLast().from.col).toBe(2);
            expect(getSelectedRangeLast().to.row).toBe(1);
            expect(getSelectedRangeLast().to.col).toBe(2);
            expect(`
            |   ║   :   : * |
            |===:===:===:===|
            | - ║   :   : A |
            | - ║   :   : 0 |
            `).toBeMatchToSelectionPattern();
          });

          it('there are hidden columns', () => {
            handsontable({
              data: Handsontable.helper.createSpreadsheetData(2, 10),
              rowHeaders: true,
              colHeaders: true,
              contextMenu: [CONTEXTMENU_ITEM_HIDE],
              hiddenColumns: {
                columns: [0, 1, 5, 6, 7]
              }
            });

            selectColumns(8, 9);

            getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

            expect(getSelected()).toEqual([[0, 4, 1, 4]]);
            expect(getSelectedRangeLast().highlight.row).toBe(0);
            expect(getSelectedRangeLast().highlight.col).toBe(4);
            expect(getSelectedRangeLast().from.row).toBe(0);
            expect(getSelectedRangeLast().from.col).toBe(4);
            expect(getSelectedRangeLast().to.row).toBe(1);
            expect(getSelectedRangeLast().to.col).toBe(4);
            expect(`
            |   ║   :   : * |
            |===:===:===:===|
            | - ║   :   : A |
            | - ║   :   : 0 |
            `).toBeMatchToSelectionPattern();
          });
        });

        it('should not preserve selection after hiding all columns', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 10),
            rowHeaders: true,
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_HIDE],
            hiddenColumns: {
              columns: [0, 1, 5, 6, 7]
            }
          });

          selectAll();

          getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

          expect(getSelectedLast()).toBeUndefined();
          expect(`
          |   |
          |   |
          |   |
          `).toBeMatchToSelectionPattern();
        });
      });

      describe('unhiding', () => {
        it('should unhide hidden columns in selection', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 5),
            rowHeaders: true,
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenColumns: {
              columns: [1, 3],
            },
          });

          expect(spec().$container.find('tr:eq(0) th').length).toBe(4);
          expect(spec().$container.find('tr:eq(1) td').length).toBe(3);
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(0, 1)).toBe(null);
          expect(getCell(0, 2).innerText).toBe('C1');
          expect(getCell(0, 3)).toBe(null);
          expect(getCell(0, 4).innerText).toBe('E1');

          selectColumns(0, 4);

          contextMenu();
          getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_SHOW);

          expect(spec().$container.find('tr:eq(0) th').length).toBe(6);
          expect(spec().$container.find('tr:eq(1) td').length).toBe(5);
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(0, 1).innerText).toBe('B1');
          expect(getCell(0, 2).innerText).toBe('C1');
          expect(getCell(0, 3).innerText).toBe('D1');
          expect(getCell(0, 4).innerText).toBe('E1');
          expect(getSelected()).toEqual([[0, 0, 1, 4]]);
          expect(getSelectedRangeLast().highlight.row).toBe(0);
          expect(getSelectedRangeLast().highlight.col).toBe(0);
          expect(getSelectedRangeLast().from.row).toBe(0);
          expect(getSelectedRangeLast().from.col).toBe(0);
          expect(getSelectedRangeLast().to.row).toBe(1);
          expect(getSelectedRangeLast().to.col).toBe(4);
          expect(`
          |   ║ * : * : * : * : * |
          |===:===:===:===:===:===|
          | - ║ A : 0 : 0 : 0 : 0 |
          | - ║ 0 : 0 : 0 : 0 : 0 |
          `).toBeMatchToSelectionPattern();
        });

        it('should unhide hidden columns before the first visible and selected column', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 5),
            rowHeaders: true,
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenColumns: {
              columns: [0, 1],
            },
          });

          expect(spec().$container.find('tr:eq(0) th').length).toBe(4);
          expect(spec().$container.find('tr:eq(1) td').length).toBe(3);
          expect(getCell(0, 0)).toBe(null);
          expect(getCell(0, 1)).toBe(null);
          expect(getCell(0, 2).innerText).toBe('C1');
          expect(getCell(0, 3).innerText).toBe('D1');
          expect(getCell(0, 4).innerText).toBe('E1');

          selectColumns(2);

          contextMenu();
          getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_SHOW);

          expect(spec().$container.find('tr:eq(0) th').length).toBe(6);
          expect(spec().$container.find('tr:eq(1) td').length).toBe(5);
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(0, 1).innerText).toBe('B1');
          expect(getCell(0, 2).innerText).toBe('C1');
          expect(getCell(0, 3).innerText).toBe('D1');
          expect(getCell(0, 4).innerText).toBe('E1');
          expect(getSelected()).toEqual([[0, 0, 1, 2]]);
          expect(getSelectedRangeLast().highlight.row).toBe(0);
          expect(getSelectedRangeLast().highlight.col).toBe(0);
          expect(getSelectedRangeLast().from.row).toBe(0);
          expect(getSelectedRangeLast().from.col).toBe(0);
          expect(getSelectedRangeLast().to.row).toBe(1);
          expect(getSelectedRangeLast().to.col).toBe(2);
          expect(`
          |   ║ * : * : * :   :   |
          |===:===:===:===:===:===|
          | - ║ A : 0 : 0 :   :   |
          | - ║ 0 : 0 : 0 :   :   |
          `).toBeMatchToSelectionPattern();
        });

        it('should unhide hidden columns after the last visible and selected column', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 5),
            rowHeaders: true,
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenColumns: {
              columns: [3, 4],
            },
          });

          expect(spec().$container.find('tr:eq(0) th').length).toBe(4);
          expect(spec().$container.find('tr:eq(1) td').length).toBe(3);
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(0, 1).innerText).toBe('B1');
          expect(getCell(0, 2).innerText).toBe('C1');
          expect(getCell(0, 3)).toBe(null);
          expect(getCell(0, 4)).toBe(null);

          selectColumns(2);

          contextMenu();
          getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_SHOW);

          expect(spec().$container.find('tr:eq(0) th').length).toBe(6);
          expect(spec().$container.find('tr:eq(1) td').length).toBe(5);
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(0, 1).innerText).toBe('B1');
          expect(getCell(0, 2).innerText).toBe('C1');
          expect(getCell(0, 3).innerText).toBe('D1');
          expect(getCell(0, 4).innerText).toBe('E1');
          expect(getSelected()).toEqual([[0, 2, 1, 4]]);
          expect(getSelectedRangeLast().highlight.row).toBe(0);
          expect(getSelectedRangeLast().highlight.col).toBe(2);
          expect(getSelectedRangeLast().from.row).toBe(0);
          expect(getSelectedRangeLast().from.col).toBe(2);
          expect(getSelectedRangeLast().to.row).toBe(1);
          expect(getSelectedRangeLast().to.col).toBe(4);
          expect(`
          |   ║   :   : * : * : * |
          |===:===:===:===:===:===|
          | - ║   :   : A : 0 : 0 |
          | - ║   :   : 0 : 0 : 0 |
          `).toBeMatchToSelectionPattern();
        });

        it('should unhide all columns when they had been hidden previously', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 5),
            rowHeaders: true,
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenColumns: {
              columns: [0, 1, 2, 3, 4],
            },
          });

          expect(spec().$container.find('tr:eq(0) th').length).toBe(1);
          expect(spec().$container.find('tr:eq(1) td').length).toBe(0);
          expect(getCell(0, 0)).toBe(null);
          expect(getCell(0, 1)).toBe(null);
          expect(getCell(0, 2)).toBe(null);
          expect(getCell(0, 3)).toBe(null);
          expect(getCell(0, 4)).toBe(null);

          const header = $('.ht_clone_left .htCore')
            .find('tbody')
            .find('th')
            .eq(0);

          selectAll();
          contextMenu(header);
          getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_SHOW);

          expect(spec().$container.find('tr:eq(0) th').length).toBe(6);
          expect(spec().$container.find('tr:eq(1) td').length).toBe(5);
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(0, 1).innerText).toBe('B1');
          expect(getCell(0, 2).innerText).toBe('C1');
          expect(getCell(0, 3).innerText).toBe('D1');
          expect(getCell(0, 4).innerText).toBe('E1');
          expect(getSelected()).toEqual([[0, 0, 1, 4]]);
          expect(getSelectedRangeLast().highlight.row).toBe(0);
          expect(getSelectedRangeLast().highlight.col).toBe(0);
          expect(getSelectedRangeLast().from.row).toBe(0);
          expect(getSelectedRangeLast().from.col).toBe(0);
          expect(getSelectedRangeLast().to.row).toBe(1);
          expect(getSelectedRangeLast().to.col).toBe(4);
          expect(`
            |   ║ * : * : * : * : * |
            |===:===:===:===:===:===|
            | * ║ A : 0 : 0 : 0 : 0 |
            | * ║ 0 : 0 : 0 : 0 : 0 |
          `).toBeMatchToSelectionPattern();
        });

        it('should cooperate with the `fixedColumnsLeft` option properly', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 10),
            width: 300,
            height: 200,
            rowHeaders: true,
            colHeaders: true,
            contextMenu: true,
            hiddenColumns: {
              columns: [1]
            },
            fixedColumnsLeft: 3,
          });

          selectColumns(0, 2);

          expect(spec().$container.find('tr:eq(0) th').length).toBe(11 - 1);
          expect(spec().$container.find('tr:eq(1) td').length).toBe(10 - 1);
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(0, 1)).toBe(null);
          expect(getCell(0, 2).innerText).toBe('C1');
          expect(getCell(0, 3).innerText).toBe('D1');
          expect(getCell(0, 4).innerText).toBe('E1');
          expect(getCell(0, 5).innerText).toBe('F1');
          expect(getCell(0, 6).innerText).toBe('G1');
          expect(getCell(0, 7).innerText).toBe('H1');
          expect(getCell(0, 8).innerText).toBe('I1');
          expect(getCell(0, 9).innerText).toBe('J1');
          expect(getSelected()).toEqual([[0, 0, 1, 2]]);
          expect(getSelectedRangeLast().highlight.row).toBe(0);
          expect(getSelectedRangeLast().highlight.col).toBe(0);
          expect(getSelectedRangeLast().from.row).toBe(0);
          expect(getSelectedRangeLast().from.col).toBe(0);
          expect(getSelectedRangeLast().to.row).toBe(1);
          expect(getSelectedRangeLast().to.col).toBe(2);
          expect(`
          |   ║ * : * |   :   :   :   :   :   :   |
          |===:===:===:===:===:===:===:===:===:===|
          | - ║ A : 0 |   :   :   :   :   :   :   |
          | - ║ 0 : 0 |   :   :   :   :   :   :   |
          `).toBeMatchToSelectionPattern();

          contextMenu();
          getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_SHOW);

          expect(spec().$container.find('tr:eq(0) th').length).toBe(11);
          expect(spec().$container.find('tr:eq(1) td').length).toBe(10);
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(0, 1).innerText).toBe('B1');
          expect(getCell(0, 2).innerText).toBe('C1');
          expect(getCell(0, 3).innerText).toBe('D1');
          expect(getCell(0, 4).innerText).toBe('E1');
          expect(getCell(0, 5).innerText).toBe('F1');
          expect(getCell(0, 6).innerText).toBe('G1');
          expect(getCell(0, 7).innerText).toBe('H1');
          expect(getCell(0, 8).innerText).toBe('I1');
          expect(getCell(0, 9).innerText).toBe('J1');
          expect(getSelected()).toEqual([[0, 0, 1, 2]]);
          expect(getSelectedRangeLast().highlight.row).toBe(0);
          expect(getSelectedRangeLast().highlight.col).toBe(0);
          expect(getSelectedRangeLast().from.row).toBe(0);
          expect(getSelectedRangeLast().from.col).toBe(0);
          expect(getSelectedRangeLast().to.row).toBe(1);
          expect(getSelectedRangeLast().to.col).toBe(2);
          expect(`
          |   ║ * : * : * |   :   :   :   :   :   :   |
          |===:===:===:===:===:===:===:===:===:===:===|
          | - ║ A : 0 : 0 |   :   :   :   :   :   :   |
          | - ║ 0 : 0 : 0 |   :   :   :   :   :   :   |
          `).toBeMatchToSelectionPattern();
        });
      });
    });

    describe('Changing selection after alter actions from context-menu', () => {
      describe('should keep the row selection in the same position as before inserting the row', () => {
        describe('above the selected row', () => {
          it('when the first column is hidden', () => {
            handsontable({
              data: createSpreadsheetData(4, 4),
              contextMenu: true,
              rowHeaders: true,
              colHeaders: true,
              hiddenColumns: {
                columns: [0]
              },
            });

            const header = $('.ht_clone_left .htCore')
              .find('tbody')
              .find('th')
              .eq(0);
            simulateClick(header, 'RMB');
            contextMenu(header);

            $('.htContextMenu .ht_master .htCore')
              .find('tbody td')
              .not('.htSeparator')
              .eq(0)
              .simulate('mousedown')
              .simulate('mouseup'); // Insert row above

            expect(getSelected()).toEqual([[1, 0, 1, 3]]);
            expect(getSelectedRangeLast().highlight.row).toBe(1);
            expect(getSelectedRangeLast().highlight.col).toBe(1);
            expect(getSelectedRangeLast().from.row).toBe(1);
            expect(getSelectedRangeLast().from.col).toBe(0);
            expect(getSelectedRangeLast().to.row).toBe(1);
            expect(getSelectedRangeLast().to.col).toBe(3);
            expect(`
            |   ║ - : - : - |
            |===:===:===:===|
            |   ║   :   :   |
            | * ║ A : 0 : 0 |
            |   ║   :   :   |
            |   ║   :   :   |
            |   ║   :   :   |
            `).toBeMatchToSelectionPattern();
          });

          it('when all columns are hidden', () => {
            handsontable({
              data: createSpreadsheetData(4, 4),
              contextMenu: true,
              rowHeaders: true,
              colHeaders: true,
              hiddenColumns: {
                columns: [0, 1, 2, 3],
              },
            });

            const header = $('.ht_clone_left .htCore')
              .find('tbody')
              .find('th')
              .eq(0);
            simulateClick(header, 'RMB');
            contextMenu(header);

            $('.htContextMenu .ht_master .htCore')
              .find('tbody td')
              .not('.htSeparator')
              .eq(0)
              .simulate('mousedown')
              .simulate('mouseup'); // Insert row above

            expect(getSelected()).toEqual([[1, 0, 1, 3]]);
            expect(getSelectedRangeLast().highlight.row).toBe(1);
            expect(getSelectedRangeLast().highlight.col).toBe(0);
            expect(getSelectedRangeLast().from.row).toBe(1);
            expect(getSelectedRangeLast().from.col).toBe(0);
            expect(getSelectedRangeLast().to.row).toBe(1);
            expect(getSelectedRangeLast().to.col).toBe(3);
            expect(`
            |   |
            |   |
            | * |
            |   |
            |   |
            |   |
            `).toBeMatchToSelectionPattern();
          });
        });

        describe('below the selected row', () => {
          it('the first column is hidden', () => {
            handsontable({
              data: createSpreadsheetData(4, 4),
              contextMenu: true,
              rowHeaders: true,
              colHeaders: true,
              hiddenColumns: {
                columns: [0],
              },
            });

            const header = $('.ht_clone_left .htCore')
              .find('tbody')
              .find('th')
              .eq(0);
            simulateClick(header, 'RMB');
            contextMenu(header);

            $('.htContextMenu .ht_master .htCore')
              .find('tbody td')
              .not('.htSeparator')
              .eq(1)
              .simulate('mousedown')
              .simulate('mouseup'); // Insert row below

            expect(getSelected()).toEqual([[0, 0, 0, 3]]);
            expect(getSelectedRangeLast().highlight.row).toBe(0);
            expect(getSelectedRangeLast().highlight.col).toBe(1);
            expect(getSelectedRangeLast().from.row).toBe(0);
            expect(getSelectedRangeLast().from.col).toBe(0);
            expect(getSelectedRangeLast().to.row).toBe(0);
            expect(getSelectedRangeLast().to.col).toBe(3);
            expect(`
            |   ║ - : - : - |
            |===:===:===:===|
            | * ║ A : 0 : 0 |
            |   ║   :   :   |
            |   ║   :   :   |
            |   ║   :   :   |
            |   ║   :   :   |
            `).toBeMatchToSelectionPattern();
          });

          it('when all columns are hidden', () => {
            handsontable({
              data: createSpreadsheetData(4, 4),
              contextMenu: true,
              rowHeaders: true,
              colHeaders: true,
              hiddenColumns: {
                columns: [0, 1, 2, 3],
              },
            });

            const header = $('.ht_clone_left .htCore')
              .find('tbody')
              .find('th')
              .eq(0);
            simulateClick(header, 'RMB');
            contextMenu(header);

            $('.htContextMenu .ht_master .htCore')
              .find('tbody td')
              .not('.htSeparator')
              .eq(1)
              .simulate('mousedown')
              .simulate('mouseup'); // Insert row below

            expect(getSelected()).toEqual([[0, 0, 0, 3]]);
            expect(getSelectedRangeLast().highlight.row).toBe(0);
            expect(getSelectedRangeLast().highlight.col).toBe(0);
            expect(getSelectedRangeLast().from.row).toBe(0);
            expect(getSelectedRangeLast().from.col).toBe(0);
            expect(getSelectedRangeLast().to.row).toBe(0);
            expect(getSelectedRangeLast().to.col).toBe(3);
            expect(`
            |   |
            | * |
            |   |
            |   |
            |   |
            |   |
            `).toBeMatchToSelectionPattern();
          });
        });
      });
    });
  });

  describe('cell selection UI', () => {
    it('should select entire row by header if first column is hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0],
        },
      });

      const header = getCell(0, -1);

      simulateClick(header, 'LMB');

      expect(getSelected()).toEqual([[0, 0, 0, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(1);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(4);
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

    it('should select entire row by header if last column is hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [4],
        },
      });

      const header = getCell(0, -1);

      simulateClick(header, 'LMB');

      expect(getSelected()).toEqual([[0, 0, 0, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(4);
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

    it('should select entire row by header if any column in the middle is hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      const header = getCell(0, -1);

      simulateClick(header, 'LMB');

      expect(getSelected()).toEqual([[0, 0, 0, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(4);
      expect(`
      |   ║ - : - |
      |===:===:===|
      | * ║ A : 0 |
      |   ║   :   |
      |   ║   :   |
      |   ║   :   |
      |   ║   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select entire row by header if all columns are hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1, 2, 3, 4],
        },
      });

      const header = $('.ht_clone_left .htCore')
        .find('tbody')
        .find('th')
        .eq(0);
      simulateClick(header, 'LMB');

      expect(getSelected()).toEqual([[0, 0, 0, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(4);
      expect(`
      |   |
      | * |
      |   |
      |   |
      |   |
      |   |
      `).toBeMatchToSelectionPattern();
    });

    it('should keep hidden columns in cell range', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      const startCell = getCell(0, 0);
      const endCell = getCell(0, 4);

      mouseDown(startCell, 'LMB');
      mouseOver(endCell);
      mouseUp(endCell);

      expect(getSelected()).toEqual([[0, 0, 0, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(4);
      expect(`
      |   ║ - : - |
      |===:===:===|
      | - ║ A : 0 |
      |   ║   :   |
      |   ║   :   |
      |   ║   :   |
      |   ║   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select non-contiguous columns properly when there are some hidden columns', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 8),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1],
        },
      });

      const startColumn = getCell(-1, 4);
      const endColumn = getCell(-1, 6);

      mouseDown(startColumn, 'LMB');
      mouseUp(startColumn);

      keyDown('ctrl');

      mouseDown(endColumn, 'LMB');
      mouseUp(endColumn);

      keyUp('ctrl');

      expect(getSelected()).toEqual([
        [0, 4, 4, 4],
        [0, 6, 4, 6],
      ]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(6);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(6);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(6);
      expect(`
      |   ║   :   : * :   : * :   |
      |===:===:===:===:===:===:===|
      | - ║   :   : 0 :   : A :   |
      | - ║   :   : 0 :   : 0 :   |
      | - ║   :   : 0 :   : 0 :   |
      | - ║   :   : 0 :   : 0 :   |
      | - ║   :   : 0 :   : 0 :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select cells by using two layers when CTRL key is pressed and some columns are hidden', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 8,
        startCols: 12,
        hiddenColumns: {
          columns: [0, 1],
        },
      });

      $(getCell(1, 3)).simulate('mousedown');
      $(getCell(4, 6)).simulate('mouseover');
      $(getCell(4, 6)).simulate('mouseup');

      expect(getSelected()).toEqual([[1, 3, 4, 6]]);
      expect(getSelectedRangeLast().highlight.row).toBe(1);
      expect(getSelectedRangeLast().highlight.col).toBe(3);
      expect(getSelectedRangeLast().from.row).toBe(1);
      expect(getSelectedRangeLast().from.col).toBe(3);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(6);
      expect(`
      |   ║   : - : - : - : - :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   :   :   |
      | - ║   : A : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      keyDown('ctrl');

      $(getCell(3, 5)).simulate('mousedown');
      $(getCell(5, 8)).simulate('mouseover');
      $(getCell(5, 8)).simulate('mouseup');

      expect(getSelected()).toEqual([[1, 3, 4, 6], [3, 5, 5, 8]]);
      expect(getSelectedRangeLast().highlight.row).toBe(3);
      expect(getSelectedRangeLast().highlight.col).toBe(5);
      expect(getSelectedRangeLast().from.row).toBe(3);
      expect(getSelectedRangeLast().from.col).toBe(5);
      expect(getSelectedRangeLast().to.row).toBe(5);
      expect(getSelectedRangeLast().to.col).toBe(8);
      expect(`
      |   ║   : - : - : - : - : - : - :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : B : 1 : 0 : 0 :   :   :   |
      | - ║   : 0 : 0 : 1 : 1 : 0 : 0 :   :   :   |
      | - ║   :   :   : 0 : 0 : 0 : 0 :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    describe('should select entire table after the corner was clicked and', () => {
      it('just some columns were hidden', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [0, 1, 2],
          },
        });

        const corner = $('.ht_clone_top_left_corner .htCore')
          .find('thead')
          .find('th')
          .eq(0);
        simulateClick(corner, 'LMB');

        expect(getSelected()).toEqual([[0, 0, 4, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(3); // Corner (col) is shifted to renderable index.
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(4);
        expect(`
        |   ║ * : * |
        |===:===:===|
        | * ║ A : 0 |
        | * ║ 0 : 0 |
        | * ║ 0 : 0 |
        | * ║ 0 : 0 |
        | * ║ 0 : 0 |
        `).toBeMatchToSelectionPattern();
      });

      it('all columns were hidden', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [0, 1, 2, 3, 4],
          },
        });

        const corner = $('.ht_clone_top_left_corner .htCore')
          .find('thead')
          .find('th')
          .eq(0);
        simulateClick(corner, 'LMB');

        expect(getSelected()).toEqual([[0, 0, 4, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(4);
        expect(`
        |   |
        | * |
        | * |
        | * |
        | * |
        | * |
        `).toBeMatchToSelectionPattern();
      });
    });
  });

  describe('cell selection (API)', () => {
    // Do we need this test case?
    it('should not throw any errors, when selecting a whole row with the last column hidden', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        hiddenColumns: {
          columns: [3]
        },
        rowHeaders: true,
      });

      let errorThrown = false;

      try {
        hot.selectCell(2, 0, 2, 3);

      } catch (err) {
        errorThrown = true;
      }

      expect(errorThrown).toBe(false);
    });

    it('should select entire table after call selectAll if some columns are hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1],
        },
      });

      selectAll();

      expect(getSelected()).toEqual([[0, 0, 4, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(2);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(4);
      expect(`
      |   ║ * : * : * |
      |===:===:===:===|
      | * ║ A : 0 : 0 |
      | * ║ 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
    });

    it('should select entire table after call selectAll if all of columns are hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1, 2, 3, 4],
        },
      });

      selectAll();

      expect(getSelected()).toEqual([[0, 0, 4, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(0); // a fallback to 0
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(4);
      expect(`
      |   |
      | * |
      | * |
      | * |
      | * |
      | * |
      `).toBeMatchToSelectionPattern();
    });

    it('should select entire row after call selectRows if the first column is hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0],
        },
      });

      selectRows(0);

      expect(getSelected()).toEqual([[0, 0, 0, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(1);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(4);
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

    it('should select entire row after call selectRows if the last column is hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [4],
        },
      });

      selectRows(0);

      expect(getSelected()).toEqual([[0, 0, 0, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(4);
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

    it('should select entire row after call selectRows if columns between the first and the last are hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      selectRows(0);

      expect(getSelected()).toEqual([[0, 0, 0, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(4);
      expect(`
      |   ║ - : - |
      |===:===:===|
      | * ║ A : 0 |
      |   ║   :   |
      |   ║   :   |
      |   ║   :   |
      |   ║   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select hidden column internally after the `selectColumns` call (no visual effect)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1],
        },
      });

      selectColumns(1);

      expect(getSelected()).toEqual([[0, 1, 4, 1]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(1); // a fallback to 1
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(1);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(1);
      expect(`
      |   ║   :   :   :   |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select columns after the `selectColumns` call if range is partially hidden at the beginning of selection #1', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      selectColumns(1, 4);

      expect(getSelected()).toEqual([[0, 1, 4, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(4);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(1);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(4);
      expect(`
      |   ║   : * |
      |===:===:===|
      | - ║   : A |
      | - ║   : 0 |
      | - ║   : 0 |
      | - ║   : 0 |
      | - ║   : 0 |
      `).toBeMatchToSelectionPattern();
    });

    it('should select columns after the `selectColumns` call if range is partially hidden at the beginning of selection #2', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      selectColumns(2, 4);

      expect(getSelected()).toEqual([[0, 2, 4, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(4);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(2);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(4);
      expect(`
      |   ║   : * |
      |===:===:===|
      | - ║   : A |
      | - ║   : 0 |
      | - ║   : 0 |
      | - ║   : 0 |
      | - ║   : 0 |
      `).toBeMatchToSelectionPattern();
    });

    it('should select columns after the `selectColumns` call if range is partially hidden at the end of selection #1', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      selectColumns(0, 2);

      expect(getSelected()).toEqual([[0, 0, 4, 2]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(2);
      expect(`
      |   ║ * :   |
      |===:===:===|
      | - ║ A :   |
      | - ║ 0 :   |
      | - ║ 0 :   |
      | - ║ 0 :   |
      | - ║ 0 :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select columns after the `selectColumns` call if range is partially hidden at the end of selection #2', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      selectColumns(0, 3);

      expect(getSelected()).toEqual([[0, 0, 4, 3]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(3);
      expect(`
      |   ║ * :   |
      |===:===:===|
      | - ║ A :   |
      | - ║ 0 :   |
      | - ║ 0 :   |
      | - ║ 0 :   |
      | - ║ 0 :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select columns after call selectColumns if range is partially hidden in the middle of selection', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      selectColumns(0, 4);

      expect(getSelected()).toEqual([[0, 0, 4, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(4);
      expect(`
      |   ║ * : * |
      |===:===:===|
      | - ║ A : 0 |
      | - ║ 0 : 0 |
      | - ║ 0 : 0 |
      | - ║ 0 : 0 |
      | - ║ 0 : 0 |
      `).toBeMatchToSelectionPattern();
    });

    it('should select columns after call selectColumns if range is partially hidden at the start and at the end of the range', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 3],
        },
      });

      selectColumns(1, 3);

      expect(getSelected()).toEqual([[0, 1, 4, 3]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(2);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(1);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(3);
      expect(`
      |   ║   : * :   |
      |===:===:===:===|
      | - ║   : A :   |
      | - ║   : 0 :   |
      | - ║   : 0 :   |
      | - ║   : 0 :   |
      | - ║   : 0 :   |
      `).toBeMatchToSelectionPattern();
    });
  });

  describe('redrawing rendered selection when the selected range has been changed', () => {
    describe('by showing columns placed before the current selection', () => {
      it('single cell was selected', () => {
        handsontable({
          rowHeaders: true,
          colHeaders: true,
          startRows: 5,
          startCols: 5,
          hiddenColumns: {
            columns: [0, 1, 2],
          },
        });

        selectCell(3, 3);

        getPlugin('hiddenColumns').showColumns([0]);
        render();

        expect(getSelected()).toEqual([[3, 3, 3, 3]]);
        expect(getSelectedRangeLast().highlight.row).toBe(3);
        expect(getSelectedRangeLast().highlight.col).toBe(3);
        expect(getSelectedRangeLast().from.row).toBe(3);
        expect(getSelectedRangeLast().from.col).toBe(3);
        expect(getSelectedRangeLast().to.row).toBe(3);
        expect(getSelectedRangeLast().to.col).toBe(3);
        expect(`
        |   ║   : - :   |
        |===:===:===:===|
        |   ║   :   :   |
        |   ║   :   :   |
        |   ║   :   :   |
        | - ║   : # :   |
        |   ║   :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenColumns').showColumns([1, 2]);
        render();

        expect(getSelected()).toEqual([[3, 3, 3, 3]]);
        expect(getSelectedRangeLast().highlight.row).toBe(3);
        expect(getSelectedRangeLast().highlight.col).toBe(3);
        expect(getSelectedRangeLast().from.row).toBe(3);
        expect(getSelectedRangeLast().from.col).toBe(3);
        expect(getSelectedRangeLast().to.row).toBe(3);
        expect(getSelectedRangeLast().to.col).toBe(3);
        expect(`
        |   ║   :   :   : - :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | - ║   :   :   : # :   |
        |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      describe('entire row was selected and', () => {
        it('columns at the start had been hidden and were showed', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            rowHeaders: true,
            colHeaders: true,
            hiddenColumns: {
              columns: [0, 1],
            },
          });

          selectRows(0);

          getPlugin('hiddenColumns').showColumns([1]);
          render();

          expect(getSelected()).toEqual([[0, 0, 0, 4]]);
          expect(getSelectedRangeLast().highlight.row).toBe(0);
          expect(getSelectedRangeLast().highlight.col).toBe(1);
          expect(getSelectedRangeLast().from.row).toBe(0);
          expect(getSelectedRangeLast().from.col).toBe(0);
          expect(getSelectedRangeLast().to.row).toBe(0);
          expect(getSelectedRangeLast().to.col).toBe(4);
          expect(`
          |   ║ - : - : - : - |
          |===:===:===:===:===|
          | * ║ A : 0 : 0 : 0 |
          |   ║   :   :   :   |
          |   ║   :   :   :   |
          |   ║   :   :   :   |
          |   ║   :   :   :   |
          `).toBeMatchToSelectionPattern();

          getPlugin('hiddenColumns').showColumns([0]);
          render();

          expect(getSelected()).toEqual([[0, 0, 0, 4]]);
          expect(getSelectedRangeLast().highlight.row).toBe(0);
          expect(getSelectedRangeLast().highlight.col).toBe(0);
          expect(getSelectedRangeLast().from.row).toBe(0);
          expect(getSelectedRangeLast().from.col).toBe(0);
          expect(getSelectedRangeLast().to.row).toBe(0);
          expect(getSelectedRangeLast().to.col).toBe(4);
          expect(`
          |   ║ - : - : - : - : - |
          |===:===:===:===:===:===|
          | * ║ A : 0 : 0 : 0 : 0 |
          |   ║   :   :   :   :   |
          |   ║   :   :   :   :   |
          |   ║   :   :   :   :   |
          |   ║   :   :   :   :   |
          `).toBeMatchToSelectionPattern();
        });
      });

      it('non-contiguous selection', () => {
        handsontable({
          rowHeaders: true,
          colHeaders: true,
          startRows: 8,
          startCols: 12,
          hiddenColumns: {
            columns: [0, 1, 2],
          },
        });

        $(getCell(1, 3)).simulate('mousedown');
        $(getCell(4, 6)).simulate('mouseover');
        $(getCell(4, 6)).simulate('mouseup');

        keyDown('ctrl');

        $(getCell(3, 5)).simulate('mousedown');
        $(getCell(5, 8)).simulate('mouseover');
        $(getCell(5, 8)).simulate('mouseup');

        keyDown('ctrl');

        $(getCell(3, 6)).simulate('mousedown');
        $(getCell(6, 9)).simulate('mouseover');
        $(getCell(6, 9)).simulate('mouseup');

        expect(getSelected()).toEqual([[1, 3, 4, 6], [3, 5, 5, 8], [3, 6, 6, 9]]);
        expect(getSelectedRangeLast().highlight.row).toBe(3);
        expect(getSelectedRangeLast().highlight.col).toBe(6);
        expect(getSelectedRangeLast().from.row).toBe(3);
        expect(getSelectedRangeLast().from.col).toBe(6);
        expect(getSelectedRangeLast().to.row).toBe(6);
        expect(getSelectedRangeLast().to.col).toBe(9);
        expect(`
        |   ║ - : - : - : - : - : - : - :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║ 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║ 0 : 0 : 1 : C : 1 : 1 : 0 :   :   |
        | - ║ 0 : 0 : 1 : 2 : 1 : 1 : 0 :   :   |
        | - ║   :   : 0 : 1 : 1 : 1 : 0 :   :   |
        | - ║   :   :   : 0 : 0 : 0 : 0 :   :   |
        |   ║   :   :   :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenColumns').showColumns([0]);
        render();

        expect(getSelected()).toEqual([[1, 3, 4, 6], [3, 5, 5, 8], [3, 6, 6, 9]]);
        expect(getSelectedRangeLast().highlight.row).toBe(3);
        expect(getSelectedRangeLast().highlight.col).toBe(6);
        expect(getSelectedRangeLast().from.row).toBe(3);
        expect(getSelectedRangeLast().from.col).toBe(6);
        expect(getSelectedRangeLast().to.row).toBe(6);
        expect(getSelectedRangeLast().to.col).toBe(9);
        expect(`
        |   ║   : - : - : - : - : - : - : - :   :   |
        |===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   |
        | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 : 1 : C : 1 : 1 : 0 :   :   |
        | - ║   : 0 : 0 : 1 : 2 : 1 : 1 : 0 :   :   |
        | - ║   :   :   : 0 : 1 : 1 : 1 : 0 :   :   |
        | - ║   :   :   :   : 0 : 0 : 0 : 0 :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenColumns').showColumns([1, 2]);
        render();

        expect(getSelected()).toEqual([[1, 3, 4, 6], [3, 5, 5, 8], [3, 6, 6, 9]]);
        expect(getSelectedRangeLast().highlight.row).toBe(3);
        expect(getSelectedRangeLast().highlight.col).toBe(6);
        expect(getSelectedRangeLast().from.row).toBe(3);
        expect(getSelectedRangeLast().from.col).toBe(6);
        expect(getSelectedRangeLast().to.row).toBe(6);
        expect(getSelectedRangeLast().to.col).toBe(9);
        expect(`
        |   ║   :   :   : - : - : - : - : - : - : - :   :   |
        |===:===:===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   :   :   |
        | - ║   :   :   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║   :   :   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║   :   :   : 0 : 0 : 1 : C : 1 : 1 : 0 :   :   |
        | - ║   :   :   : 0 : 0 : 1 : 2 : 1 : 1 : 0 :   :   |
        | - ║   :   :   :   :   : 0 : 1 : 1 : 1 : 0 :   :   |
        | - ║   :   :   :   :   :   : 0 : 0 : 0 : 0 :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });
    });

    describe('by hiding columns placed before the current selection', () => {
      it('single cell was selected', () => {
        handsontable({
          rowHeaders: true,
          colHeaders: true,
          startRows: 5,
          startCols: 5,
          hiddenColumns: true,
        });

        selectCell(3, 3);

        getPlugin('hiddenColumns').hideColumns([1, 2]);
        render();

        expect(getSelected()).toEqual([[3, 3, 3, 3]]);
        expect(getSelectedRangeLast().highlight.row).toBe(3);
        expect(getSelectedRangeLast().highlight.col).toBe(3);
        expect(getSelectedRangeLast().from.row).toBe(3);
        expect(getSelectedRangeLast().from.col).toBe(3);
        expect(getSelectedRangeLast().to.row).toBe(3);
        expect(getSelectedRangeLast().to.col).toBe(3);
        expect(`
        |   ║   : - :   |
        |===:===:===:===|
        |   ║   :   :   |
        |   ║   :   :   |
        |   ║   :   :   |
        | - ║   : # :   |
        |   ║   :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenColumns').hideColumns([0]);
        render();

        expect(getSelected()).toEqual([[3, 3, 3, 3]]);
        expect(getSelectedRangeLast().highlight.row).toBe(3);
        expect(getSelectedRangeLast().highlight.col).toBe(3);
        expect(getSelectedRangeLast().from.row).toBe(3);
        expect(getSelectedRangeLast().from.col).toBe(3);
        expect(getSelectedRangeLast().to.row).toBe(3);
        expect(getSelectedRangeLast().to.col).toBe(3);
        expect(`
        |   ║ - :   |
        |===:===:===|
        |   ║   :   |
        |   ║   :   |
        |   ║   :   |
        | - ║ # :   |
        |   ║   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('non-contiguous selection', () => {
        handsontable({
          rowHeaders: true,
          colHeaders: true,
          startRows: 8,
          startCols: 12,
          hiddenColumns: true,
        });

        $(getCell(1, 3)).simulate('mousedown');
        $(getCell(4, 6)).simulate('mouseover');
        $(getCell(4, 6)).simulate('mouseup');

        keyDown('ctrl');

        $(getCell(3, 5)).simulate('mousedown');
        $(getCell(5, 8)).simulate('mouseover');
        $(getCell(5, 8)).simulate('mouseup');

        keyDown('ctrl');

        $(getCell(3, 6)).simulate('mousedown');
        $(getCell(6, 9)).simulate('mouseover');
        $(getCell(6, 9)).simulate('mouseup');

        expect(getSelected()).toEqual([[1, 3, 4, 6], [3, 5, 5, 8], [3, 6, 6, 9]]);
        expect(getSelectedRangeLast().highlight.row).toBe(3);
        expect(getSelectedRangeLast().highlight.col).toBe(6);
        expect(getSelectedRangeLast().from.row).toBe(3);
        expect(getSelectedRangeLast().from.col).toBe(6);
        expect(getSelectedRangeLast().to.row).toBe(6);
        expect(getSelectedRangeLast().to.col).toBe(9);
        expect(`
        |   ║   :   :   : - : - : - : - : - : - : - :   :   |
        |===:===:===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   :   :   |
        | - ║   :   :   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║   :   :   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║   :   :   : 0 : 0 : 1 : C : 1 : 1 : 0 :   :   |
        | - ║   :   :   : 0 : 0 : 1 : 2 : 1 : 1 : 0 :   :   |
        | - ║   :   :   :   :   : 0 : 1 : 1 : 1 : 0 :   :   |
        | - ║   :   :   :   :   :   : 0 : 0 : 0 : 0 :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenColumns').hideColumns([1, 2]);
        render();

        expect(getSelected()).toEqual([[1, 3, 4, 6], [3, 5, 5, 8], [3, 6, 6, 9]]);
        expect(getSelectedRangeLast().highlight.row).toBe(3);
        expect(getSelectedRangeLast().highlight.col).toBe(6);
        expect(getSelectedRangeLast().from.row).toBe(3);
        expect(getSelectedRangeLast().from.col).toBe(6);
        expect(getSelectedRangeLast().to.row).toBe(6);
        expect(getSelectedRangeLast().to.col).toBe(9);
        expect(`
        |   ║   : - : - : - : - : - : - : - :   :   |
        |===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   |
        | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 : 1 : C : 1 : 1 : 0 :   :   |
        | - ║   : 0 : 0 : 1 : 2 : 1 : 1 : 0 :   :   |
        | - ║   :   :   : 0 : 1 : 1 : 1 : 0 :   :   |
        | - ║   :   :   :   : 0 : 0 : 0 : 0 :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenColumns').hideColumns([0]);
        render();

        expect(getSelected()).toEqual([[1, 3, 4, 6], [3, 5, 5, 8], [3, 6, 6, 9]]);
        expect(getSelectedRangeLast().highlight.row).toBe(3);
        expect(getSelectedRangeLast().highlight.col).toBe(6);
        expect(getSelectedRangeLast().from.row).toBe(3);
        expect(getSelectedRangeLast().from.col).toBe(6);
        expect(getSelectedRangeLast().to.row).toBe(6);
        expect(getSelectedRangeLast().to.col).toBe(9);
        expect(`
        |   ║ - : - : - : - : - : - : - :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║ 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║ 0 : 0 : 1 : C : 1 : 1 : 0 :   :   |
        | - ║ 0 : 0 : 1 : 2 : 1 : 1 : 0 :   :   |
        | - ║   :   : 0 : 1 : 1 : 1 : 0 :   :   |
        | - ║   :   :   : 0 : 0 : 0 : 0 :   :   |
        |   ║   :   :   :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });
    });

    describe('by showing hidden, ', () => {
      it('selected columns', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [1, 2],
          },
        });

        selectColumns(1, 2);

        getPlugin('hiddenColumns').showColumns([2]);
        render();

        expect(getSelected()).toEqual([[0, 1, 4, 2]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(2);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(1);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(2);
        expect(`
        |   ║   : * :   :   |
        |===:===:===:===:===|
        | - ║   : A :   :   |
        | - ║   : 0 :   :   |
        | - ║   : 0 :   :   |
        | - ║   : 0 :   :   |
        | - ║   : 0 :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenColumns').showColumns([1]);
        render();

        expect(getSelected()).toEqual([[0, 1, 4, 2]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(1);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(1);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(2);
        expect(`
        |   ║   : * : * :   :   |
        |===:===:===:===:===:===|
        | - ║   : A : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('selected cell', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [1],
          },
        });

        selectCell(3, 1);

        getPlugin('hiddenColumns').showColumns([1]);
        render();

        expect(getSelected()).toEqual([[3, 1, 3, 1]]);
        expect(getSelectedRangeLast().highlight.row).toBe(3);
        expect(getSelectedRangeLast().highlight.col).toBe(1);
        expect(getSelectedRangeLast().from.row).toBe(3);
        expect(getSelectedRangeLast().from.col).toBe(1);
        expect(getSelectedRangeLast().to.row).toBe(3);
        expect(getSelectedRangeLast().to.col).toBe(1);
        expect(`
        |   ║   : - :   :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | - ║   : # :   :   :   |
        |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('selected cells (just a few)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [1],
          },
        });

        selectCells([[3, 1], [0, 1], [0, 1]]);

        getPlugin('hiddenColumns').showColumns([1]);
        render();

        expect(getSelected()).toEqual([[3, 1, 3, 1], [0, 1, 0, 1], [0, 1, 0, 1]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(1);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(1);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(1);
        expect(`
        |   ║   : - :   :   :   |
        |===:===:===:===:===:===|
        | - ║   : B :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | - ║   : 0 :   :   :   |
        |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('selected cells (all of them)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [0, 1, 2, 3, 4],
          },
        });

        selectAll();

        getPlugin('hiddenColumns').showColumns([0, 1, 2, 3, 4]);
        render();

        expect(getSelected()).toEqual([[0, 0, 4, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(4);
        expect(`
        |   ║ * : * : * : * : * |
        |===:===:===:===:===:===|
        | * ║ A : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      });
    });

    it('by showing columns from a selection containing hidden columns at the start and at the end of the range', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 3],
        },
      });

      selectColumns(1, 3);

      getPlugin('hiddenColumns').showColumns([3]);
      render();

      expect(getSelected()).toEqual([[0, 1, 4, 3]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(2);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(1);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(3);
      expect(`
      |   ║   : * : * :   |
      |===:===:===:===:===|
      | - ║   : A : 0 :   |
      | - ║   : 0 : 0 :   |
      | - ║   : 0 : 0 :   |
      | - ║   : 0 : 0 :   |
      | - ║   : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();

      getPlugin('hiddenColumns').showColumns([1]);
      render();

      expect(getSelected()).toEqual([[0, 1, 4, 3]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(1);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(1);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(3);
      expect(`
      |   ║   : * : * : * :   |
      |===:===:===:===:===:===|
      | - ║   : A : 0 : 0 :   |
      | - ║   : 0 : 0 : 0 :   |
      | - ║   : 0 : 0 : 0 :   |
      | - ║   : 0 : 0 : 0 :   |
      | - ║   : 0 : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
    });

    describe('by hiding ', () => {
      it('selected columns', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: true,
        });

        selectColumns(1, 2);

        getPlugin('hiddenColumns').hideColumns([1]);
        render();

        expect(getSelected()).toEqual([[0, 1, 4, 2]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(2);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(1);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(2);
        expect(`
        |   ║   : * :   :   |
        |===:===:===:===:===|
        | - ║   : A :   :   |
        | - ║   : 0 :   :   |
        | - ║   : 0 :   :   |
        | - ║   : 0 :   :   |
        | - ║   : 0 :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenColumns').hideColumns([2]);
        render();

        expect(getSelected()).toEqual([[0, 1, 4, 2]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(1);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(1);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(2);
        expect(`
        |   ║   :   :   |
        |===:===:===:===|
        |   ║   :   :   |
        |   ║   :   :   |
        |   ║   :   :   |
        |   ║   :   :   |
        |   ║   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('selected cell', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: true,
        });

        selectCell(3, 1);

        getPlugin('hiddenColumns').hideColumns([1]);
        render();

        expect(getSelected()).toEqual([[3, 1, 3, 1]]);
        expect(getSelectedRangeLast().highlight.row).toBe(3);
        expect(getSelectedRangeLast().highlight.col).toBe(1);
        expect(getSelectedRangeLast().from.row).toBe(3);
        expect(getSelectedRangeLast().from.col).toBe(1);
        expect(getSelectedRangeLast().to.row).toBe(3);
        expect(getSelectedRangeLast().to.col).toBe(1);
        expect(`
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('selected cells', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: true,
        });

        selectCells([[3, 1], [0, 1], [0, 1]]);

        getPlugin('hiddenColumns').hideColumns([1]);
        render();

        expect(getSelected()).toEqual([[3, 1, 3, 1], [0, 1, 0, 1], [0, 1, 0, 1]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(1);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(1);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(1);
        expect(`
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('all selected cells', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: true,
        });

        selectAll();

        getPlugin('hiddenColumns').hideColumns([0, 1, 2, 3, 4]);
        render();

        expect(getSelected()).toEqual([[0, 0, 4, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(4);
        expect(`
        |   |
        | * |
        | * |
        | * |
        | * |
        | * |
        `).toBeMatchToSelectionPattern();
      });
    });

    it('showed columns on a table with all columns hidden and with selected entire row', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1, 2, 3, 4],
        },
      });

      selectRows(0);

      getPlugin('hiddenColumns').showColumns([4]);
      render();

      expect(getSelected()).toEqual([[0, 0, 0, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(4);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(4);
      expect(`
      |   ║ - |
      |===:===|
      | * ║ A |
      |   ║   |
      |   ║   |
      |   ║   |
      |   ║   |
      `).toBeMatchToSelectionPattern();

      getPlugin('hiddenColumns').showColumns([1, 2, 3]);
      render();

      expect(getSelected()).toEqual([[0, 0, 0, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(1);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(4);
      expect(`
      |   ║ - : - : - : - |
      |===:===:===:===:===|
      | * ║ A : 0 : 0 : 0 |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();

      getPlugin('hiddenColumns').showColumns([0]);
      render();

      expect(getSelected()).toEqual([[0, 0, 0, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(4);
      expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
      | * ║ A : 0 : 0 : 0 : 0 |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });
  });

  describe('copy-paste functionality', () => {
    class DataTransferObject {
      constructor() {
        this.data = {
          'text/plain': '',
          'text/html': ''
        };
      }
      getData(type) {
        return this.data[type];
      }
      setData(type, value) {
        this.data[type] = value;
      }
    }

    function getClipboardEventMock() {
      const event = {};
      event.clipboardData = new DataTransferObject();
      event.preventDefault = () => {};
      return event;
    }

    it('should allow to copy hidden cell', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenColumns: {
          columns: [2, 4]
        }
      });

      const copyEvent = getClipboardEventMock('copy');
      const plugin = hot.getPlugin('CopyPaste');

      selectCell(0, 4);

      plugin.setCopyableText();
      plugin.onCopy(copyEvent);

      expect(copyEvent.clipboardData.getData('text/plain')).toEqual('E1');
    });

    it('should allow to copy hidden columns, when "copyPasteEnabled" property is not set', () => {
      const hot = handsontable({
        data: getMultilineData(5, 10),
        hiddenColumns: {
          columns: [2, 4]
        },
        width: 500,
        height: 300,
      });

      const copyEvent = getClipboardEventMock('copy');
      const plugin = hot.getPlugin('CopyPaste');

      selectCell(0, 0, 4, 9);

      plugin.setCopyableText();
      plugin.onCopy(copyEvent);

      /* eslint-disable no-tabs */
      expect(copyEvent.clipboardData.getData('text/plain')).toEqual(
        'A1	B1	"C1\n' +
        'line"	D1	E1	F1	G1	H1	I1	J1\n' +
        'A2	B2	"C2\n' +
        'line\n' +
        'line"	D2	E2	F2	G2	H2	I2	J2\n' +
        'A3	B3	C3	D3	E3	F3	G3	H3	I3	J3\n' +
        'A4	B4	C4	D4	E4	F4	G4	H4	I4	J4\n' +
        'A5	B5	C5	D5	E5	F5	G5	H5	I5	J5'
      );
    });

    it('should allow to copy hidden columns, when "copyPasteEnabled" property is set to true', () => {
      const hot = handsontable({
        data: getMultilineData(5, 10),
        hiddenColumns: {
          columns: [2, 4],
          copyPasteEnabled: true
        },
        width: 500,
        height: 300
      });

      const copyEvent = getClipboardEventMock('copy');
      const plugin = hot.getPlugin('CopyPaste');

      selectCell(0, 0, 4, 9);

      plugin.setCopyableText();
      plugin.onCopy(copyEvent);

      /* eslint-disable no-tabs */
      expect(copyEvent.clipboardData.getData('text/plain')).toEqual(
        'A1	B1	"C1\n' +
        'line"	D1	E1	F1	G1	H1	I1	J1\n' +
        'A2	B2	"C2\n' +
        'line\n' +
        'line"	D2	E2	F2	G2	H2	I2	J2\n' +
        'A3	B3	C3	D3	E3	F3	G3	H3	I3	J3\n' +
        'A4	B4	C4	D4	E4	F4	G4	H4	I4	J4\n' +
        'A5	B5	C5	D5	E5	F5	G5	H5	I5	J5'
      );
    });

    it('should skip hidden columns, while copying data, when "copyPasteEnabled" property is set to false', () => {
      handsontable({
        data: getMultilineData(5, 10),
        hiddenColumns: {
          columns: [2, 4],
          copyPasteEnabled: false
        },
        width: 500,
        height: 300
      });

      const copyEvent = getClipboardEventMock('copy');
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 0, 4, 9);

      plugin.setCopyableText();
      plugin.onCopy(copyEvent);

      /* eslint-disable no-tabs */
      expect(copyEvent.clipboardData.getData('text/plain')).toEqual(
        'A1	B1	D1	F1	G1	H1	I1	J1\n' +
        'A2	B2	D2	F2	G2	H2	I2	J2\n' +
        'A3	B3	D3	F3	G3	H3	I3	J3\n' +
        'A4	B4	D4	F4	G4	H4	I4	J4\n' +
        'A5	B5	D5	F5	G5	H5	I5	J5'
      );
    });

    it('should skip hidden columns, while pasting data, when "copyPasteEnabled" property is set to false', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        hiddenColumns: {
          columns: [2, 4],
          copyPasteEnabled: false
        },
        width: 500,
        height: 300
      });

      selectCell(0, 0);

      const plugin = getPlugin('CopyPaste');
      plugin.paste('a\tb\tc\td\te\nf\tg\th\ti\tj');

      expect(getDataAtRow(0)).toEqual(['a', 'b', 'C1', 'c', 'E1', 'd', 'e', 'H1', 'I1', 'J1']);
      expect(getDataAtRow(1)).toEqual(['f', 'g', 'C2', 'h', 'E2', 'i', 'j', 'H2', 'I2', 'J2']);
    });
  });

  describe('navigation', () => {
    it('should go to the closest not hidden cell on the right side while navigating by right arrow', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      selectCell(0, 0);

      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_RIGHT);

      expect(getSelected()).toEqual([[0, 4, 0, 4]]);
      expect(getCell(0, 4)).toHaveClass('current');
      expect(`
      |   : # |
      |   :   |
      |   :   |
      |   :   |
      |   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(4);
    });

    it('should go to the closest not hidden cell on the left side while navigating by left arrow', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      selectCell(0, 4);

      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_LEFT);

      expect(getCell(0, 0)).toHaveClass('current');
      expect(`
      | # :   |
      |   :   |
      |   :   |
      |   :   |
      |   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(0);
    });

    it('should go to the first visible cell in the next row while navigating by right arrow if all column on the right side are hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenColumns: {
          columns: [3, 4],
        },
      });

      selectCell(0, 2);

      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_RIGHT);

      expect(getCell(1, 0)).toHaveClass('current');
      expect(`
      |   :   :   |
      | # :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, 0, 1, 0]]);
      expect(getSelectedRangeLast().highlight.row).toBe(1);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(1);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(1);
      expect(getSelectedRangeLast().to.col).toBe(0);
    });

    it('should go to the last visible cell in the previous row while navigating by left arrow if all column on the left side are hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenColumns: {
          columns: [0, 1],
        },
      });

      selectCell(1, 2);

      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_LEFT);

      expect(getCell(0, 4)).toHaveClass('current');
      expect(`
      |   :   : # |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[0, 4, 0, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(4);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(4);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(4);
    });

    it('should go to the first cell in the next visible column while navigating by down arrow if column on the right side is hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      selectCell(4, 0);

      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_DOWN);

      expect(getCell(0, 4)).toHaveClass('current');
      expect(`
      |   : # |
      |   :   |
      |   :   |
      |   :   |
      |   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[0, 4, 0, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(4);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(4);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(4);
    });

    it('should go to the last cell in the previous visible column while navigating by up arrow if column on the left side is hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      selectCell(0, 4);

      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_UP);

      expect(getCell(4, 0)).toHaveClass('current');
      expect(`
      |   :   |
      |   :   |
      |   :   |
      |   :   |
      | # :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[4, 0, 4, 0]]);
      expect(getSelectedRangeLast().highlight.row).toBe(4);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(4);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(0);
    });

    describe('should go to the proper cell while navigating if row header is selected and', () => {
      it('first columns are hidden', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [0, 1],
          },
        });

        const header = getCell(0, -1);

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_RIGHT);

        expect(`
        |   ║   : - :   |
        |===:===:===:===|
        | - ║   : # :   |
        |   ║   :   :   |
        |   ║   :   :   |
        |   ║   :   :   |
        |   ║   :   :   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[0, 3, 0, 3]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(3);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(3);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(3);
      });

      it('last columns are hidden', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [3, 4],
          },
        });

        const header = getCell(0, -1);

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_LEFT);

        expect(`
        |   ║   :   : - |
        |===:===:===:===|
        |   ║   :   :   |
        |   ║   :   :   |
        |   ║   :   :   |
        |   ║   :   :   |
        | - ║   :   : # |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[4, 2, 4, 2]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(2);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(2);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(2);
      });

      it('just one column is visible (column at the start is not hidden)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [1, 2, 3, 4],
          },
        });

        let header = getCell(0, -1); // first visible cell

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_UP);

        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        |   ║   |
        |   ║   |
        |   ║   |
        | - ║ # |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[4, 0, 4, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(0);

        header = getCell(0, -1); // first visible cell

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_DOWN);

        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        | - ║ # |
        |   ║   |
        |   ║   |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[1, 0, 1, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(1);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(1);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(1);
        expect(getSelectedRangeLast().to.col).toBe(0);

        header = getCell(0, -1); // first visible cell

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_LEFT);

        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        |   ║   |
        |   ║   |
        |   ║   |
        | - ║ # |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[4, 0, 4, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(0);

        header = getCell(0, -1); // first visible cell

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_RIGHT);

        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        | - ║ # |
        |   ║   |
        |   ║   |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[1, 0, 1, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(1);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(1);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(1);
        expect(getSelectedRangeLast().to.col).toBe(0);

        header = getCell(4, -1); // last visible cell

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_UP);

        expect(getSelected()).toEqual([[3, 0, 3, 0]]);
        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        |   ║   |
        |   ║   |
        | - ║ # |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelectedRangeLast().highlight.row).toBe(3);
        expect(getSelectedRangeLast().highlight.col).toBe(0);

        header = getCell(4, -1); // last visible cell

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_DOWN);

        expect(`
        |   ║ - |
        |===:===|
        | - ║ # |
        |   ║   |
        |   ║   |
        |   ║   |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[0, 0, 0, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(0);

        header = getCell(4, -1); // last visible cell

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_LEFT);

        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        |   ║   |
        |   ║   |
        | - ║ # |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[3, 0, 3, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(3);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(3);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(3);
        expect(getSelectedRangeLast().to.col).toBe(0);

        header = getCell(4, -1); // last visible cell

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_RIGHT);

        expect(`
        |   ║ - |
        |===:===|
        | - ║ # |
        |   ║   |
        |   ║   |
        |   ║   |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[0, 0, 0, 0]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(0);
      });

      it('just one column is visible (column at the end is not hidden)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [0, 1, 2, 3],
          },
        });

        let header = getCell(0, -1); // first visible cell

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_UP);

        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        |   ║   |
        |   ║   |
        |   ║   |
        | - ║ # |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[4, 4, 4, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(4);

        header = getCell(0, -1); // first visible cell

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_DOWN);

        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        | - ║ # |
        |   ║   |
        |   ║   |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[1, 4, 1, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(1);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(1);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(1);
        expect(getSelectedRangeLast().to.col).toBe(4);

        header = getCell(0, -1); // first visible cell

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_LEFT);

        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        |   ║   |
        |   ║   |
        |   ║   |
        | - ║ # |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[4, 4, 4, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(4);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(4);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(4);
        expect(getSelectedRangeLast().to.col).toBe(4);

        header = getCell(0, -1); // first visible cell

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_RIGHT);

        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        | - ║ # |
        |   ║   |
        |   ║   |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[1, 4, 1, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(1);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(1);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(1);
        expect(getSelectedRangeLast().to.col).toBe(4);

        header = getCell(4, -1); // last visible cell

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_UP);

        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        |   ║   |
        |   ║   |
        | - ║ # |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[3, 4, 3, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(3);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(3);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(3);
        expect(getSelectedRangeLast().to.col).toBe(4);

        header = getCell(4, -1); // last visible cell

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_DOWN);

        expect(`
        |   ║ - |
        |===:===|
        | - ║ # |
        |   ║   |
        |   ║   |
        |   ║   |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[0, 4, 0, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(4);

        header = getCell(4, -1); // last visible cell

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_LEFT);

        expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        |   ║   |
        |   ║   |
        | - ║ # |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[3, 4, 3, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(3);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(3);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(3);
        expect(getSelectedRangeLast().to.col).toBe(4);

        header = getCell(4, -1); // last visible cell

        simulateClick(header, 'LMB');
        keyDownUp(Handsontable.helper.KEY_CODES.ARROW_RIGHT);

        expect(`
        |   ║ - |
        |===:===|
        | - ║ # |
        |   ║   |
        |   ║   |
        |   ║   |
        |   ║   |
        `).toBeMatchToSelectionPattern();
        expect(getSelected()).toEqual([[0, 4, 0, 4]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(4);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(4);
        expect(getSelectedRangeLast().to.row).toBe(0);
        expect(getSelectedRangeLast().to.col).toBe(4);
      });
    });

    describe('should not change position and call hook when single hidden cell was selected and navigating by any arrow key', () => {
      describe('without shift key pressed', () => {
        it('hidden cell at the table start', () => {
          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            hiddenColumns: {
              columns: [0],
            },
          });

          const hookSpy1 = jasmine.createSpy('beforeModifyTransformStart');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformStart');

          hot.addHook('modifyTransformStart', hookSpy1);
          hot.addHook('afterModifyTransformStart', hookSpy2);

          selectCell(1, 0);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_UP);

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(-1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_DOWN);

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_LEFT);

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(-1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_RIGHT);

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);
        });

        it('hidden cell in the table middle', () => {
          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            hiddenColumns: {
              columns: [2],
            },
          });

          const hookSpy1 = jasmine.createSpy('modifyTransformStart');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformStart');

          hot.addHook('modifyTransformStart', hookSpy1);
          hot.addHook('afterModifyTransformStart', hookSpy2);

          selectCell(1, 2);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_UP);

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(-1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_DOWN);

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_LEFT);

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(-1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_RIGHT);

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);
        });

        it('hidden cell at the table end', () => {
          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            hiddenColumns: {
              columns: [4],
            },
          });

          const hookSpy1 = jasmine.createSpy('modifyTransformStart');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformStart');

          hot.addHook('modifyTransformStart', hookSpy1);
          hot.addHook('afterModifyTransformStart', hookSpy2);

          selectCell(1, 4);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_UP);

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(-1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(4);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_DOWN);

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(4);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_LEFT);

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(-1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(4);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp(Handsontable.helper.KEY_CODES.ARROW_RIGHT);

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(4);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);
        });
      });

      describe('with shift key pressed', () => {
        it('hidden cell at the table start', () => {
          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            hiddenColumns: {
              columns: [0],
            },
          });

          const hookSpy1 = jasmine.createSpy('modifyTransformEnd');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformEnd');

          hot.addHook('modifyTransformEnd', hookSpy1);
          hot.addHook('afterModifyTransformEnd', hookSpy2);

          selectCell(1, 0);

          keyDownUp('shift+arrow_up');

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(-1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp('shift+arrow_down');

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp('shift+arrow_left');

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(-1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp('shift+arrow_right');

          expect(getSelected()).toEqual([[1, 0, 1, 0]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);
        });

        it('hidden cell in the table middle', () => {
          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            hiddenColumns: {
              columns: [2],
            },
          });

          const hookSpy1 = jasmine.createSpy('modifyTransformEnd');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformEnd');

          hot.addHook('modifyTransformEnd', hookSpy1);
          hot.addHook('afterModifyTransformEnd', hookSpy2);

          selectCell(1, 2);

          keyDownUp('shift+arrow_up');

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(-1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp('shift+arrow_down');

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp('shift+arrow_left');

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(-1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp('shift+arrow_right');

          expect(getSelected()).toEqual([[1, 2, 1, 2]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(2);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);
        });

        it('hidden cell at the table end', () => {
          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            hiddenColumns: {
              columns: [4],
            },
          });

          const hookSpy1 = jasmine.createSpy('modifyTransformEnd');
          const hookSpy2 = jasmine.createSpy('afterModifyTransformEnd');

          hot.addHook('modifyTransformEnd', hookSpy1);
          hot.addHook('afterModifyTransformEnd', hookSpy2);

          selectCell(1, 4);

          keyDownUp('shift+arrow_up');

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(-1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(4);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp('shift+arrow_down');

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(4);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp('shift+arrow_left');

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(-1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(4);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);

          keyDownUp('shift+arrow_right');

          expect(getSelected()).toEqual([[1, 4, 1, 4]]);
          expect(hookSpy1.calls.mostRecent().args[0].row).toEqual(0);
          expect(hookSpy1.calls.mostRecent().args[0].col).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].row).toEqual(1);
          expect(hookSpy2.calls.mostRecent().args[0].col).toEqual(4);
          expect(hookSpy2.calls.mostRecent().args[1]).toEqual(0);
          expect(hookSpy2.calls.mostRecent().args[2]).toEqual(0);
        });
      });
    });
  });

  describe('plugin hooks', () => {
    describe('beforeHideColumns', () => {
      it('should fire the `beforeHideColumns` hook before hiding a single column by plugin API', () => {
        const beforeHideColumnsHookCallback = jasmine.createSpy('beforeHideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: true,
          beforeHideColumns: beforeHideColumnsHookCallback
        });

        getPlugin('hiddenColumns').hideColumn(2);

        expect(beforeHideColumnsHookCallback).toHaveBeenCalledWith([], [2], true, void 0, void 0, void 0);
      });

      it('should fire the `beforeHideColumns` hook before hiding multiple columns by plugin API', () => {
        const beforeHideColumnsHookCallback = jasmine.createSpy('beforeHideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: true,
          beforeHideColumns: beforeHideColumnsHookCallback
        });

        getPlugin('hiddenColumns').hideColumns([2, 3, 4]);

        expect(beforeHideColumnsHookCallback).toHaveBeenCalledWith([], [2, 3, 4], true, void 0, void 0, void 0);
      });

      it('should be possible to cancel the hiding action by returning `false` from the `beforeHideColumns` hook', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: true,
          beforeHideColumns: () => false
        });

        getPlugin('hiddenColumns').hideColumn(2);

        expect(getPlugin('hiddenColumns').isHidden(2)).toBeFalsy();
      });

      it('should not perform hiding and return `false` as the third parameter of the `beforeHideColumns` hook' +
        ' if any of the provided columns is out of scope of the table', () => {
        const beforeHideColumnsHookCallback = jasmine.createSpy('beforeHideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: true,
          beforeHideColumns: beforeHideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');
        plugin.hideColumns([0, 5, 10, 15]);

        expect(beforeHideColumnsHookCallback).toHaveBeenCalledWith([], [], false, void 0, void 0, void 0);
        expect(plugin.isHidden(0)).toBeFalsy();
        expect(plugin.isHidden(5)).toBeFalsy();
        expect(plugin.isHidden(10)).toBeFalsy();
      });

      it('should not perform hiding and return `false` as the third parameter of the `beforeHideColumns` hook' +
        ' if any of the provided columns is not integer', () => {
        const beforeHideColumnsHookCallback = jasmine.createSpy('beforeHideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: true,
          beforeHideColumns: beforeHideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');
        plugin.hideColumns([0, 5, 1.1]);

        expect(beforeHideColumnsHookCallback).toHaveBeenCalledWith([], [], false, void 0, void 0, void 0);
        expect(plugin.isHidden(0)).toBeFalsy();
        expect(plugin.isHidden(5)).toBeFalsy();
      });
    });

    describe('afterHideColumns', () => {
      it('should fire the `afterHideColumns` hook after hiding a single column by plugin API', () => {
        const afterHideColumnsHookCallback = jasmine.createSpy('afterHideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: true,
          afterHideColumns: afterHideColumnsHookCallback
        });

        getPlugin('hiddenColumns').hideColumn(2);

        expect(afterHideColumnsHookCallback).toHaveBeenCalledWith([], [2], true, true, void 0, void 0);
      });

      it('should fire the `afterHideColumns` hook after hiding multiple columns by plugin API', () => {
        const afterHideColumnsHookCallback = jasmine.createSpy('afterHideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: true,
          afterHideColumns: afterHideColumnsHookCallback
        });

        getPlugin('hiddenColumns').hideColumns([2, 3, 4]);

        expect(afterHideColumnsHookCallback).toHaveBeenCalledWith([], [2, 3, 4], true, true, void 0, void 0);
      });

      it('it should NOT fire the `afterHideColumns` hook, if the `beforeHideColumns` hook returned false', () => {
        const afterHideColumnsHookCallback = jasmine.createSpy('afterHideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: true,
          beforeHideColumns: () => false,
          afterHideColumns: afterHideColumnsHookCallback
        });

        getPlugin('hiddenColumns').hideColumns([2, 3, 4]);

        expect(afterHideColumnsHookCallback).not.toHaveBeenCalled();
      });

      it('should return `false` as the fourth parameter, if the hiding action did not change the state of the hiddenColumns plugin', () => {
        const afterHideColumnsHookCallback = jasmine.createSpy('afterHideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [0, 5]
          },
          afterHideColumns: afterHideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');
        plugin.hideColumns([0, 5]);

        expect(afterHideColumnsHookCallback).toHaveBeenCalledWith([0, 5], [0, 5], true, false, void 0, void 0);
      });

      it('should return `true` as the third and fourth parameter, if the hiding action changed the state of the hiddenColumns plugin', () => {
        const afterHideColumnsHookCallback = jasmine.createSpy('afterHideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [0, 5]
          },
          afterHideColumns: afterHideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');
        plugin.hideColumns([0, 5, 6]);

        expect(afterHideColumnsHookCallback).toHaveBeenCalledWith([0, 5], [0, 5, 6], true, true, void 0, void 0);
      });

      it('should not perform hiding and return `false` as the third and fourth parameter of the `afterHideColumns` hook' +
        ' if any of the provided columns is out of scope of the table', () => {
        const afterHideColumnsHookCallback = jasmine.createSpy('afterHideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: true,
          afterHideColumns: afterHideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');
        plugin.hideColumns([0, 5, 10, 15]);

        expect(afterHideColumnsHookCallback).toHaveBeenCalledWith([], [], false, false, void 0, void 0);
        expect(plugin.isHidden(0)).toBeFalsy();
        expect(plugin.isHidden(5)).toBeFalsy();
        expect(plugin.isHidden(10)).toBeFalsy();
      });

      it('should not perform hiding and return `false` as the third and fourth parameter of the `afterHideColumns` hook' +
        ' if any of the provided columns is not integer', () => {
        const afterHideColumnsHookCallback = jasmine.createSpy('afterHideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: true,
          afterHideColumns: afterHideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');
        plugin.hideColumns([0, 5, 1.1]);

        expect(afterHideColumnsHookCallback).toHaveBeenCalledWith([], [], false, false, void 0, void 0);
        expect(plugin.isHidden(0)).toBeFalsy();
        expect(plugin.isHidden(5)).toBeFalsy();
      });
    });

    describe('beforeUnhideColumns', () => {
      it('should fire the `beforeUnhideColumns` hook before unhiding a single, previously hidden column', () => {
        const beforeUnhideColumnsHookCallback = jasmine.createSpy('beforeUnhideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [2]
          },
          beforeUnhideColumns: beforeUnhideColumnsHookCallback
        });

        getPlugin('hiddenColumns').showColumn(2);

        expect(beforeUnhideColumnsHookCallback).toHaveBeenCalledWith([2], [], true, void 0, void 0, void 0);
      });

      it('should fire the `beforeUnhideColumns` hook before unhiding the multiple, previously hidden columns ', () => {
        const beforeUnhideColumnsHookCallback = jasmine.createSpy('beforeUnhideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [2, 3, 4]
          },
          beforeUnhideColumns: beforeUnhideColumnsHookCallback
        });

        getPlugin('hiddenColumns').showColumns([2, 3, 4]);

        expect(beforeUnhideColumnsHookCallback).toHaveBeenCalledWith([2, 3, 4], [], true, void 0, void 0, void 0);
      });

      it('should be possible to cancel the unhiding action by returning `false` from the `beforeUnhideColumns` hook', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [2, 3, 4]
          },
          beforeUnhideColumns: () => false
        });

        getPlugin('hiddenColumns').showColumn(2);

        expect(getPlugin('hiddenColumns').isHidden(2)).toBeTruthy();
      });

      it('should not perform unhiding and return `false` as the third parameter of the `beforeUnhideColumns` hook' +
        ' if any of the provided columns is out of scope of the table', () => {
        const beforeUnhideColumnsHookCallback = jasmine.createSpy('beforeUnhideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [0, 5]
          },
          beforeUnhideColumns: beforeUnhideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');
        plugin.showColumns([0, 5, 10, 15]);

        expect(beforeUnhideColumnsHookCallback).toHaveBeenCalledWith([0, 5], [0, 5], false, void 0, void 0, void 0);
        expect(plugin.isHidden(0)).toBeTruthy();
        expect(plugin.isHidden(5)).toBeTruthy();
      });

      it('should not perform unhiding and return `false` as the third parameter of the `beforeUnhideColumns` hook' +
        ' if any of the provided columns is out of scope of the table', () => {
        const beforeUnhideColumnsHookCallback = jasmine.createSpy('beforeUnhideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [0, 5]
          },
          beforeUnhideColumns: beforeUnhideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');
        plugin.showColumns([0, 5, 10, 15]);

        expect(beforeUnhideColumnsHookCallback).toHaveBeenCalledWith([0, 5], [0, 5], false, void 0, void 0, void 0);
        expect(plugin.isHidden(0)).toBeTruthy();
        expect(plugin.isHidden(5)).toBeTruthy();
      });
    });

    describe('afterUnhideColumns', () => {
      it('should fire the `afterUnhideColumns` hook after unhiding a previously hidden single column', () => {
        const afterUnhideColumnsHookCallback = jasmine.createSpy('afterUnhideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [2]
          },
          afterUnhideColumns: afterUnhideColumnsHookCallback
        });

        getPlugin('hiddenColumns').showColumn(2);

        expect(afterUnhideColumnsHookCallback).toHaveBeenCalledWith([2], [], true, true, void 0, void 0);
      });

      it('should fire the `afterUnhideColumns` hook after unhiding a multiple, previously hidden columns', () => {
        const afterUnhideColumnsHookCallback = jasmine.createSpy('afterUnhideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [2, 3, 4]
          },
          afterUnhideColumns: afterUnhideColumnsHookCallback
        });

        getPlugin('hiddenColumns').showColumns([2, 3, 4]);

        expect(afterUnhideColumnsHookCallback).toHaveBeenCalledWith([2, 3, 4], [], true, true, void 0, void 0);
      });

      it('it should NOT fire the `afterUnhideColumns` hook, if the `beforeUnhideColumns` hook returned false', () => {
        const afterUnhideColumnsHookCallback = jasmine.createSpy('afterUnhideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: true,
          beforeUnhideColumns: () => false,
          afterUnhideColumns: afterUnhideColumnsHookCallback
        });

        getPlugin('hiddenColumns').showColumns([2, 3, 4]);

        expect(afterUnhideColumnsHookCallback).not.toHaveBeenCalled();
      });

      it('should return `false` as the fourth parameter, if the unhiding action did not change the state of the hiddenColumns plugin', () => {
        const afterUnhideColumnsHookCallback = jasmine.createSpy('afterUnhideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: true,
          afterUnhideColumns: afterUnhideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');
        plugin.showColumns([0, 5]);

        expect(afterUnhideColumnsHookCallback).toHaveBeenCalledWith([], [], true, false, void 0, void 0);
      });

      it('should return `true` as the fourth parameter, if the unhiding action changed the state of the hiddenColumns plugin', () => {
        const afterUnhideColumnsHookCallback = jasmine.createSpy('afterUnhideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [0, 5]
          },
          afterUnhideColumns: afterUnhideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');
        plugin.showColumns([0, 5, 6]);

        expect(afterUnhideColumnsHookCallback).toHaveBeenCalledWith([0, 5], [], true, true, void 0, void 0);
      });

      it('should not perform hiding and return `false` as the third and fourth parameter of the `afterUnhideColumns` hook' +
        ' if any of the provided columns is not integer', () => {
        const afterUnhideColumnsHookCallback = jasmine.createSpy('afterUnhideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 7),
          hiddenColumns: {
            columns: [0, 5]
          },
          afterUnhideColumns: afterUnhideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');
        plugin.showColumns([0, 5, 1.1]);

        expect(afterUnhideColumnsHookCallback).toHaveBeenCalledWith([0, 5], [0, 5], false, false, void 0, void 0);
        expect(plugin.isHidden(0)).toBeTruthy();
        expect(plugin.isHidden(5)).toBeTruthy();
      });
    });
  });

  describe('cooperation with the AutoColumnSize', () => {
    it('should display proper column width (when indicator is enabled) #1', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        autoColumnSize: true,
        hiddenColumns: {
          columns: [0, 1],
          indicators: true,
        }
      });

      // Default column width + 15 px from the plugin (when `indicators` option is set).
      expect(colWidth(spec().$container, 0)).toBeAroundValue(65, 3);
    });

    it('should display proper column width (when indicator is enabled) #2', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        autoColumnSize: true,
        hiddenColumns: {
          columns: [0, 2],
          indicators: true,
        }
      });

      // Default column width + 15 px from the plugin (when `indicators` option is set).
      expect(colWidth(spec().$container, 0)).toBeAroundValue(65, 3);
    });

    it('should display proper column width (when indicator is enabled) #3', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        autoColumnSize: true,
        hiddenColumns: {
          columns: [1, 2],
          indicators: true,
        }
      });

      // Default column width + 15 px from the plugin (when `indicators` option is set).
      expect(colWidth(spec().$container, 0)).toBeAroundValue(65, 3);
    });

    it('should display proper column width (when indicator is disabled)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        autoColumnSize: true,
        hiddenColumns: {
          columns: [0, 1]
        }
      });

      // Default column width + 15 px from the plugin (when `indicators` option is unset).
      expect(colWidth(spec().$container, 0)).toBeAroundValue(50, 3);
    });

    it('should return proper values from the `getColWidth` function (when indicator is enabled)', () => {
      const hot = handsontable({
        data: [{ id: 'Short', name: 'Somewhat long', lastName: 'The very very very longest one' }],
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1],
          indicators: true,
        },
        columns: [
          { data: 'id', title: 'Identifier' },
          { data: 'name', title: 'Name' },
          { data: 'lastName', title: 'Last Name' },
        ],
        autoColumnSize: true,
      });

      expect(hot.getColWidth(0)).toBe(0);
      expect(hot.getColWidth(1)).toBe(0);
      expect([216 + 15, 229 + 15, 247 + 15, 260 + 15, 261 + 15]).toEqual(jasmine.arrayContaining([hot.getColWidth(2)]));
    });

    it('should return proper values from the `getColWidth` function (when indicator is disabled)', () => {
      const hot = handsontable({
        data: [{ id: 'Short', name: 'Somewhat long', lastName: 'The very very very longest one' }],
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1],
        },
        columns: [
          { data: 'id', title: 'Identifier' },
          { data: 'name', title: 'Name' },
          { data: 'lastName', title: 'Last Name' },
        ],
        autoColumnSize: true,
      });

      expect(hot.getColWidth(0)).toBe(0);
      expect(hot.getColWidth(1)).toBe(0);
      expect([216, 229, 247, 260, 261]).toEqual(jasmine.arrayContaining([hot.getColWidth(2)]));
    });

    it('should return proper values from the `getColWidth` function when the `ManualColumnResize` plugin define sizes for some columns', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
        hiddenColumns: {
          columns: [0, 2],
        },
        stretchH: 'all',
        manualColumnResize: [10, 11, 12, 13, 14],
      });

      expect(hot.getColWidth(0)).toBe(0);
      expect(hot.getColWidth(1)).toBe(11);
      expect(hot.getColWidth(2)).toBe(0);
      expect(hot.getColWidth(3)).toBe(13);
      expect(hot.getColWidth(4)).toBe(14);
    });

    it('should return proper values from the `getColHeader` function', () => {
      const hot = handsontable({
        data: [{ id: 'Short', name: 'Somewhat long', lastName: 'The very very very longest one' }],
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1],
        },
        columns: [
          { data: 'id', title: 'Identifier' },
          { data: 'name', title: 'Name' },
          { data: 'lastName', title: 'Last Name' },
        ],
        autoColumnSize: true,
      });

      expect(hot.getColHeader(0)).toBe('Identifier');
      expect(hot.getColHeader(1)).toBe('Name');
      expect(hot.getColHeader(2)).toBe('Last Name');
    });
  });

  describe('cooperation with the `stretchH` option', () => {
    it('should stretch all columns to a window size', () => {
      const stretchedColumns = new Set();

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
        hiddenColumns: {
          columns: [0, 2],
        },
        stretchH: 'all',
        beforeStretchingColumnWidth(width, column) {
          stretchedColumns.add(column);
        }
      });

      expect($(getHtCore()).find('td')[0].offsetWidth).toBeAroundValue(document.documentElement.clientWidth / 3, 2);
      expect($(getHtCore()).find('td')[1].offsetWidth).toBeAroundValue(document.documentElement.clientWidth / 3, 2);
      expect($(getHtCore()).find('td')[2].offsetWidth).toBeAroundValue(document.documentElement.clientWidth / 3, 2);
      expect(Array.from(stretchedColumns.values())).toEqual([1, 3, 4]);
    });

    it('should work properly when the `ManualColumnResize` plugin define sizes for some columns', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
        hiddenColumns: {
          columns: [0, 2],
        },
        stretchH: 'all',
        manualColumnResize: [10, 11, 12, 13, 14],
      });

      expect(hot.getColWidth(0)).toBe(0);
      // Rendered index: 0, visual index: 1
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(12);
      expect(hot.getColWidth(1)).toBe(11);
      expect(hot.getColWidth(2)).toBe(0);
      // Rendered index: 1, visual index: 3
      expect($(getHtCore()).find('td')[1].offsetWidth).toBe(13);
      expect(hot.getColWidth(3)).toBe(13);
    });
  });

  describe('cooperation with the `MergeCells` plugin', () => {
    it('should display properly merged area basing on the settings', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 3 }
        ],
        hiddenColumns: {
          columns: [1],
        }
      });

      expect(getData()).toEqual([
        ['A1', null, null, 'D1', 'E1'],
        [null, null, null, 'D2', 'E2'],
        ['A3', 'B3', 'C3', 'D3', 'E3'],
        ['A4', 'B4', 'C4', 'D4', 'E4'],
        ['A5', 'B5', 'C5', 'D5', 'E5'],
      ]);

      expect($(getHtCore())[0].offsetWidth).toBe(201);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(101);

      getPlugin('hiddenColumns').showColumns([1]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(251);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(151);

      getPlugin('hiddenColumns').hideColumns([1]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(201);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(101);
    });

    it('should display properly merged area containing hidden columns (start from visible cell, merging to visible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
        hiddenColumns: {
          columns: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(0, 1, 0, 3);

      // Merged from visual column index 1 (visible) to visual column index 3 (visible).
      //                                     |     merge    |
      expect(getData()).toEqual([['A1', 'B1', null, null, 'E1']]);
      expect($(getHtCore()).find('td')[0].innerText).toBe('B1');
      // Only two columns have been visible from the start.
      expect($(getHtCore())[0].offsetWidth).toBe(101);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(101);

      getPlugin('hiddenColumns').showColumns([2]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(151);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(151);

      getPlugin('hiddenColumns').hideColumns([2]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(101);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(101);

      getPlugin('hiddenColumns').showColumns([0, 2, 4]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(251);
      expect($(getHtCore()).find('td')[1].offsetWidth).toBe(150);
    });

    it('should display properly merged area containing hidden columns (start from invisible cell, merging to visible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
        hiddenColumns: {
          columns: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(0, 0, 0, 3);

      // Merged from visual column index 0 (invisible) to visual column index 3 (visible).
      //                              |        merge        |
      expect(getData()).toEqual([['A1', null, null, null, 'E1']]);

      // TODO: It should show value from the hidden column?
      // expect($(getHtCore()).find('td')[0].innerText).toBe('A1');

      // Only two columns have been visible from the start.
      expect($(getHtCore())[0].offsetWidth).toBe(101);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(101);

      getPlugin('hiddenColumns').showColumns([0]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(151);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(151);

      getPlugin('hiddenColumns').showColumns([2]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(201);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(201);

      getPlugin('hiddenColumns').hideColumns([0, 2]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(101);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(101);

      getPlugin('hiddenColumns').showColumns([0, 2, 4]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(251);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(201);
    });

    it('should display properly merged area containing hidden columns (start from visible cell, merging to invisible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
        hiddenColumns: {
          columns: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(0, 1, 0, 4);

      // Merged from visual column index 1 (visible) to visual column index 4 (invisible).
      //                                    |        merge        |
      expect(getData()).toEqual([['A1', 'B1', null, null, null]]);
      expect($(getHtCore()).find('td')[0].innerText).toBe('B1');
      // Only two columns have been visible from the start.
      expect($(getHtCore())[0].offsetWidth).toBe(101);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(101);

      getPlugin('hiddenColumns').showColumns([2]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(151);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(151);

      getPlugin('hiddenColumns').showColumns([4]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(201);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(201);

      getPlugin('hiddenColumns').hideColumns([2, 4]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(101);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(101);

      getPlugin('hiddenColumns').showColumns([0, 2, 4]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(251);
      expect($(getHtCore()).find('td')[1].offsetWidth).toBe(200);
    });

    it('should display properly merged area containing hidden columns (start from invisible cell, merging to invisible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
        hiddenColumns: {
          columns: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(0, 0, 0, 4);

      // Merged from visual column index 0 (invisible) to visual column index 4 (invisible).
      //                              |           merge           |
      expect(getData()).toEqual([['A1', null, null, null, null]]);

      // TODO: It should show value from the hidden column?
      // expect($(getHtCore()).find('td')[0].innerText).toBe('A1');

      // Only two columns have been visible from the start.
      expect($(getHtCore())[0].offsetWidth).toBe(101);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(101);

      getPlugin('hiddenColumns').showColumns([0]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(151);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(151);

      getPlugin('hiddenColumns').showColumns([2]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(201);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(201);

      getPlugin('hiddenColumns').showColumns([4]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(251);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(251);

      getPlugin('hiddenColumns').hideColumns([0, 2, 4]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(101);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(101);

      getPlugin('hiddenColumns').showColumns([0, 2, 4]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(251);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(251);
    });

    it('should return proper values from the `getCell` function', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
        hiddenColumns: {
          columns: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(0, 1, 0, 3);

      expect(getCell(0, 0)).toBe(null);
      expect(getCell(0, 1)).toBe($(getHtCore()).find('td')[0]);
      expect(getCell(0, 2)).toBe(null);
      expect(getCell(0, 3)).toBe($(getHtCore()).find('td')[0]);
      expect(getCell(0, 4)).toBe(null);

      getPlugin('hiddenColumns').showColumns([2]);
      render();

      expect(getCell(0, 0)).toBe(null);
      expect(getCell(0, 1)).toBe($(getHtCore()).find('td')[0]);
      expect(getCell(0, 2)).toBe($(getHtCore()).find('td')[0]);
      expect(getCell(0, 3)).toBe($(getHtCore()).find('td')[0]);
      expect(getCell(0, 4)).toBe(null);
    });

    it('should translate column indexes properly - regression check', () => {
      // An error have been thrown and too many columns have been drawn in the specific case. There haven't been done
      // index translation (from renderable to visual columns indexes and the other way around).

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 7),
        hiddenColumns: {
          columns: [0, 2],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(0, 3, 0, 5);

      // The same as at the start.
      expect($(getHtCore()).find('td').length).toBe(5);
      // Still the same width for the whole table.
      expect($(getHtCore())[0].offsetWidth).toBe(251);
      expect($(getHtCore()).find('td')[1].offsetWidth).toBe(150);
    });

    it('should select proper cell when calling the `selectCell` within area of merge', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
        hiddenColumns: {
          columns: [0, 2],
        },
        mergeCells: [
          { row: 0, col: 1, rowspan: 1, colspan: 4 }
        ]
      });

      selectCell(0, 1);

      // Second and third columns are not displayed (CSS - display: none).
      expect(`
      | # :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[0, 1, 0, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(1);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(1);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(4);

      deselectCell();
      selectCell(0, 2);

      // Second and third columns are not displayed (CSS - display: none).
      expect(`
      | # :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[0, 1, 0, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(1);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(1);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(4);

      deselectCell();
      selectCell(0, 3);

      // Second and third columns are not displayed (CSS - display: none).
      expect(`
      | # :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[0, 1, 0, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(1);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(1);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(4);

      // TODO: `selectCell(0, 4)` should give the same effect. There is bug at least from Handsontable 7.
    });
  });

  describe('alter actions', () => {
    it('should update hidden column indexes after columns removal (removing not hidden columns)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 10),
        hiddenColumns: true,
        manualColumnMove: [4, 0, 8, 5, 2, 6, 1, 7, 3, 9]
      });

      const plugin = getPlugin('hiddenColumns');

      plugin.hideColumns([6, 7, 8]); // visual column indexes after move (physical indexes: 1, 7, 3)
      alter('remove_col', 2, 3); // visual column index

      expect(plugin.isHidden(3)).toBe(true); // 6 -> 3
      expect(hot.getColWidth(3)).toEqual(0);
      expect(plugin.isHidden(4)).toBe(true); // 7 -> 4
      expect(hot.getColWidth(4)).toEqual(0);
      expect(plugin.isHidden(5)).toBe(true); // 8 -> 5
      expect(hot.getColWidth(5)).toEqual(0);

      expect(plugin.isHidden(6)).toBe(false);
      expect(hot.getColWidth(6)).toEqual(50);
      expect(plugin.isHidden(7)).toBe(false);
      expect(hot.getColWidth(7)).toEqual(50);
      expect(plugin.isHidden(8)).toBe(false);
      expect(hot.getColWidth(8)).toEqual(50);

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('E1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('G1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('J1');
      expect(getDataAtRow(0)).toEqual(['E1', 'A1', 'G1', 'B1', 'H1', 'D1', 'J1']);
    });

    it('should update hidden column indexes after columns removal (removing part of hidden columns)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 10),
        colHeaders: true,
        hiddenColumns: {
          indicators: true,
        },
        manualColumnMove: [4, 0, 8, 5, 2, 6, 1, 7, 3, 9]
      });

      const plugin = getPlugin('hiddenColumns');

      plugin.hideColumns([6, 7, 8]); // visual column indexes after move (physical indexes: 1, 7, 3)
      alter('remove_col', 6, 2); // visual column index

      expect(plugin.isHidden(6)).toBe(true); // 8 -> 6
      expect(hot.getColWidth(6)).toEqual(0);

      expect(getCell(-1, 5)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN);
      expect(getCell(-1, 6)).toBe(null);
      expect(getCell(-1, 7)).toHaveClass(CSS_CLASS_AFTER_HIDDEN);

      expect(plugin.isHidden(5)).toBe(false);
      expect(hot.getColWidth(5)).toEqual(65);
      expect(plugin.isHidden(7)).toBe(false);
      expect(hot.getColWidth(7)).toEqual(65);
      expect(plugin.isHidden(8)).toBe(false);
      expect(hot.getColWidth(8)).toEqual(50);

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('E1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('I1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('F1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(4)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(5)').text()).toEqual('G1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(6)').text()).toEqual('J1');
      expect(getDataAtRow(0)).toEqual(['E1', 'A1', 'I1', 'F1', 'C1', 'G1', 'D1', 'J1']);
    });

    it('should update hidden column indexes after columns insertion (inserting columns before already hidden columns)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 10),
        hiddenColumns: true,
        manualColumnMove: [4, 0, 8, 5, 2, 6, 1, 7, 3, 9]
      });

      const plugin = getPlugin('hiddenColumns');

      plugin.hideColumns([6, 7, 8]); // visual column indexes after move (physical indexes: 1, 7, 3)
      alter('insert_col', 0, 3); // visual column index

      expect(plugin.isHidden(9)).toBe(true); // 6 -> 9
      expect(hot.getColWidth(9)).toEqual(0);
      expect(plugin.isHidden(10)).toBe(true); // 7 -> 10
      expect(hot.getColWidth(10)).toEqual(0);
      expect(plugin.isHidden(11)).toBe(true); // 8 -> 11
      expect(hot.getColWidth(11)).toEqual(0);

      expect(plugin.isHidden(6)).toBe(false);
      expect(hot.getColWidth(6)).toEqual(50);
      expect(plugin.isHidden(7)).toBe(false);
      expect(hot.getColWidth(7)).toEqual(50);
      expect(plugin.isHidden(8)).toBe(false);
      expect(hot.getColWidth(8)).toEqual(50);

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('E1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(4)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(5)').text()).toEqual('I1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(6)').text()).toEqual('F1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(7)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(8)').text()).toEqual('G1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(9)').text()).toEqual('J1');
      expect(getDataAtRow(0)).toEqual([null, null, null, 'E1', 'A1', 'I1', 'F1', 'C1', 'G1', 'B1', 'H1', 'D1', 'J1']);
    });

    it('should update hidden column indexes after columns insertion (inserting columns between already hidden columns)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 10),
        colHeaders: true,
        hiddenColumns: {
          indicators: true,
        },
        manualColumnMove: [4, 0, 8, 5, 2, 6, 1, 7, 3, 9]
      });

      const plugin = getPlugin('hiddenColumns');

      plugin.hideColumns([6, 7, 8]); // visual column indexes after move (physical indexes: 1, 7, 3)
      alter('insert_col', 7, 2); // visual column index

      expect(plugin.isHidden(6)).toBe(true);
      expect(hot.getColWidth(6)).toEqual(0);
      expect(plugin.isHidden(9)).toBe(true); // 7 -> 9
      expect(hot.getColWidth(9)).toEqual(0);
      expect(plugin.isHidden(10)).toBe(true); // 8 -> 10
      expect(hot.getColWidth(10)).toEqual(0);

      expect(getCell(-1, 5)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN);
      expect(getCell(-1, 6)).toBe(null);
      expect(getCell(-1, 7)).toHaveClass(CSS_CLASS_AFTER_HIDDEN);
      expect(getCell(-1, 8)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN);
      expect(getCell(-1, 9)).toBe(null);
      expect(getCell(-1, 10)).toBe(null);
      expect(getCell(-1, 11)).toHaveClass(CSS_CLASS_AFTER_HIDDEN);

      expect(plugin.isHidden(5)).toBe(false);
      expect(hot.getColWidth(5)).toEqual(65);
      expect(plugin.isHidden(7)).toBe(false);
      expect(hot.getColWidth(7)).toEqual(65);
      expect(plugin.isHidden(8)).toBe(false);
      expect(hot.getColWidth(8)).toEqual(65);
      expect(plugin.isHidden(11)).toBe(false);
      expect(hot.getColWidth(11)).toEqual(65);

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('E1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('I1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('F1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(4)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(5)').text()).toEqual('G1');
      // Hidden B1
      expect(spec().$container.find('tbody tr:eq(0) td:eq(6)').text()).toEqual('');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(7)').text()).toEqual('');
      // Hidden H1
      expect(spec().$container.find('tbody tr:eq(0) td:eq(8)').text()).toEqual('J1');
      expect(getDataAtRow(0)).toEqual(['E1', 'A1', 'I1', 'F1', 'C1', 'G1', 'B1', null, null, 'H1', 'D1', 'J1']);
    });
  });

  describe('should cooperate with the `fixedColumnsLeft` option properly', () => {
    it('when there are hidden columns in the middle of fixed columns', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 10),
        colHeaders: true,
        hiddenColumns: {
          columns: [2, 3],
          indicators: true
        },
        fixedColumnsLeft: 6
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(6 - 2);
      expect(getLeftClone().width()).toBe((4 * 50) + (2 * 15) + 1); // 4 fixed, visible columns, with space for indicators.
      expect($(getCell(-1, 0).querySelector('span')).text()).toBe('A');
      expect($(getCell(-1, 1).querySelector('span')).text()).toBe('B');
      expect(getCell(-1, 2)).toBe(null);
      expect(getCell(-1, 3)).toBe(null);
      expect($(getCell(-1, 4).querySelector('span')).text()).toBe('E');
      expect($(getCell(-1, 5).querySelector('span')).text()).toBe('F');
    });

    it('when there is hidden column by the fixed column', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 10),
        colHeaders: true,
        hiddenColumns: {
          columns: [1],
          indicators: true
        },
        fixedColumnsLeft: 1
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(1);
      expect(getLeftClone().width()).toBe(50 + 15 + 1); // 1 fixed, visible column, with space for indicator.
      expect($(getCell(-1, 0).querySelector('span')).text()).toBe('A');
      expect(getCell(-1, 1)).toBe(null);
      expect($(getCell(-1, 2).querySelector('span')).text()).toBe('C');
    });

    it('when there are hidden columns at the start of fixed columns', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 10),
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1, 2],
          indicators: true
        },
        fixedColumnsLeft: 6
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(6 - 3);
      expect(getLeftClone().width()).toBe((3 * 50) + 15 + 1); // 3 fixed, visible columns, with space for indicator.
      expect(getCell(-1, 0)).toBe(null);
      expect(getCell(-1, 1)).toBe(null);
      expect(getCell(-1, 2)).toBe(null);
      expect($(getCell(-1, 3).querySelector('span')).text()).toBe('D');
      expect($(getCell(-1, 4).querySelector('span')).text()).toBe('E');
      expect($(getCell(-1, 5).querySelector('span')).text()).toBe('F');
    });

    it('when there are hidden columns at the end of fixed columns', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 10),
        colHeaders: true,
        hiddenColumns: {
          columns: [3, 4, 5],
          indicators: true
        },
        fixedColumnsLeft: 6
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(6 - 3);
      expect(getLeftClone().width()).toBe((3 * 50) + 15 + 1); // 3 fixed, visible columns, with space for indicator.
      expect($(getCell(-1, 0).querySelector('span')).text()).toBe('A');
      expect($(getCell(-1, 1).querySelector('span')).text()).toBe('B');
      expect($(getCell(-1, 2).querySelector('span')).text()).toBe('C');
      expect(getCell(-1, 3)).toBe(null);
      expect(getCell(-1, 4)).toBe(null);
      expect(getCell(-1, 5)).toBe(null);
    });

    it('when all fixed columns are hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 10),
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1, 2, 3],
          indicators: true
        },
        fixedColumnsLeft: 4
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(0);
      expect(getLeftClone().width()).toBe(0);
    });
  });

  it('should show proper column headers for the table with hidden column', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: ['AA', 'BB', 'CC', 'DD', 'EE'],
      hiddenColumns: {
        columns: [1]
      }
    });

    expect($(getCell(-1, 0).querySelector('span')).text()).toBe('AA');
    expect(getCell(-1, 1)).toBe(null);
    expect($(getCell(-1, 2).querySelector('span')).text()).toBe('CC');
    expect($(getCell(-1, 3).querySelector('span')).text()).toBe('DD');
    expect($(getCell(-1, 4).querySelector('span')).text()).toBe('EE');
  });
});

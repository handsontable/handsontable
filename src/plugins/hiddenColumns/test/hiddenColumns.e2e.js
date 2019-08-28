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
        },
        // cells(row, col) {
        //   const meta = {};

        //   if (this.instance.toRenderableColumn(col) === 2) {
        //     meta.type = 'date';
        //   }

        //   return meta;
        // },
      });

      expect(countRenderableColumns()).toBe(3);
      expect(getCell(0, 0).innerText).toBe('A1');
      expect(getCell(0, 1)).toBe(null);
      expect(getCell(0, 2).innerText).toBe('C1');
      expect(getCell(0, 3)).toBe(null);
      expect(getCell(0, 4).innerText).toBe('E1');
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
      plugin.enablePlugin();
      render();

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
      expect(countRenderableColumns()).toBe(3);
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

      expect(countRenderableColumns()).toBe(3);
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

      expect(countRenderableColumns()).toBe(2);
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

      expect(getCell(-1, 2)).not.toHaveClass(CSS_CLASS_BEFORE_HIDDEN);
      expect(getCell(-1, 2)).not.toHaveClass(CSS_CLASS_AFTER_HIDDEN);

      updateSettings({
        hiddenColumns: {
          hiddenColumns: {
            columns: [0, 2],
            indicators: true,
          },
        }
      });

      expect(getCell(-1, 2)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN);
      expect(getCell(-1, 2)).toHaveClass(CSS_CLASS_AFTER_HIDDEN);
    });
  });

  describe('API', () => {
    it('should hide column after calling the hideColumn method', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 3),
        hiddenColumns: true,
      });

      expect(getCell(0, 1).innerText).toBe('B1');

      getPlugin('hiddenColumns').hideColumn(1);
      render();

      expect(getCell(0, 1)).toBe(null);
    });

    it('should show column after calling the showColumn method', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 3),
        hiddenColumns: {
          columns: [1],
        },
      });

      expect(getCell(0, 1)).toBe(null);

      getPlugin('hiddenColumns').showColumn(1);
      render();

      expect(getCell(0, 1).innerText).toBe('B1');
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

          const items = spec().$container.find('.htContextMenu tbody td');
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

          const header = getCell(-1, 0);
          header.simulate('mousedown');
          header.simulate('mouseup');
          contextMenu();

          const items = spec().$container.find('.htContextMenu tbody td');
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

          const items = spec().$container.find('.htContextMenu tbody td');
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

          const items = spec().$container.find('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toBe(MENU_NO_ITEMS);
        });

        it('should not render context menu item for unhiding if the first visible column is selected and no column before is hidden', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(1, 5),
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenColumns: [1, 2, 3],
          });

          const header = getCell(-1, 0);

          mouseDown(header);
          mouseUp(header);
          contextMenu(header);

          const items = spec().$container.find('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toBe(MENU_NO_ITEMS);
        });

        it('should not render context menu item for unhiding if the last visible column is selected and no column after is hidden', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(1, 5),
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenColumns: [1, 2, 3],
          });

          const header = getCell(-1, 4);

          mouseDown(header);
          mouseUp(header);
          contextMenu(header);

          const items = spec().$container.find('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toBe(MENU_NO_ITEMS);
        });

        it('should not render context menu item for unhiding if selected column is not the first one and is not the last one', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(1, 5),
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenColumns: [1, 3],
          });

          const header = getCell(-1, 2);

          mouseDown(header);
          mouseUp(header);
          contextMenu(header);

          const items = spec().$container.find('.htContextMenu tbody td');
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

          const header = getCell(-1, 2);
          header.simulate('mousedown');
          header.simulate('mouseup');
          contextMenu();

          const items = spec().$container.find('.htContextMenu tbody td');
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

          const header = getCell(-1, 2);
          header.simulate('mousedown');
          header.simulate('mouseup');
          contextMenu();

          const items = spec().$container.find('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_SHOW_COLUMNS);
        });

        it('should render proper context menu item for unhiding a few columns', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(1, 5),
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_HIDE],
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

          const items = spec().$container.find('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_SHOW_COLUMNS);
        });

        it('should render proper context menu item for unhiding only one column', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(1, 5),
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_HIDE],
            hiddenColumns: {
              columns: [1, 2, 3],
            },
          });

          const start = getCell(-1, 0);
          const end = getCell(-1, 4);

          mouseDown(start);
          mouseOver(end);
          mouseUp(end);

          contextMenu();

          const items = spec().$container.find('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_SHOW_COLUMN);
        });
      });
    });

    describe('commands', () => {
      describe('hiding', () => {
        it('should hide selected columns', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(1, 5),
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_HIDE],
            hiddenColumns: true,
          });

          selectColumns(1, 2);

          getPlugin('contextMenu').commandExecutor.execute(CONTEXTMENU_ITEM_HIDE);

          expect(countRenderableColumns()).toBe(3);
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(0, 1)).toBe(null);
          expect(getCell(0, 2)).toBe(null);
          expect(getCell(0, 3).innerText).toBe('D1');
          expect(getCell(0, 4).innerText).toBe('E1');
        });

        it('should select column on the right side after hide action', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 5),
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_HIDE],
            hiddenColumns: true,
          });

          selectColumns(1, 2);

          getPlugin('contextMenu').commandExecutor.execute(CONTEXTMENU_ITEM_HIDE);

          expect(getSelectedLast()).toEqual([0, 3, 1, 3]);
        });

        it('should select column on the left side after hide action if on the right is no more visible column', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 5),
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_HIDE],
            hiddenColumns: true,
          });

          selectColumns(3, 4);

          getPlugin('contextMenu').commandExecutor.execute(CONTEXTMENU_ITEM_HIDE);

          expect(getSelectedLast()).toEqual([0, 2, 1, 2]);
        });
      });

      describe('unhiding', () => {
        it('should unhide hidden columns in selection', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 5),
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenColumns: {
              columns: [1, 3],
            },
          });

          expect(countRenderableColumns()).toBe(3);
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(0, 1)).toBe(null);
          expect(getCell(0, 2).innerText).toBe('C1');
          expect(getCell(0, 3)).toBe(null);
          expect(getCell(0, 4).innerText).toBe('E1');

          selectColumns(0, 4);

          getPlugin('contextMenu').commandExecutor.execute(CONTEXTMENU_ITEM_SHOW);

          expect(countRenderableColumns()).toBe(5);
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(0, 1).innerText).toBe('B1');
          expect(getCell(0, 2).innerText).toBe('C1');
          expect(getCell(0, 3).innerText).toBe('D1');
          expect(getCell(0, 4).innerText).toBe('E1');
          expect(getSelectedLast()).toEqual([0, 0, 1, 4]);
        });

        it('should unhide hidden columns before the first visible and selected column', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 5),
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenColumns: {
              columns: [0, 1],
            },
          });

          expect(countRenderableColumns()).toBe(3);
          expect(getCell(0, 0)).toBe(null);
          expect(getCell(0, 1)).toBe(null);
          expect(getCell(0, 2).innerText).toBe('C1');
          expect(getCell(0, 3).innerText).toBe('D1');
          expect(getCell(0, 4).innerText).toBe('E1');

          selectColumns(2);

          getPlugin('contextMenu').commandExecutor.execute(CONTEXTMENU_ITEM_SHOW);

          expect(countRenderableColumns()).toBe(5);
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(0, 1).innerText).toBe('B1');
          expect(getCell(0, 2).innerText).toBe('C1');
          expect(getCell(0, 3).innerText).toBe('D1');
          expect(getCell(0, 4).innerText).toBe('E1');
          expect(getSelectedLast()).toEqual([0, 0, 1, 2]);
        });

        it('should unhide hidden columns after the last visible and selected column', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 5),
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenColumns: {
              columns: [3, 4],
            },
          });

          expect(countRenderableColumns()).toBe(3);
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(0, 1).innerText).toBe('B1');
          expect(getCell(0, 2).innerText).toBe('C1');
          expect(getCell(0, 3)).toBe(null);
          expect(getCell(0, 4)).toBe(null);

          selectColumns(2);

          getPlugin('contextMenu').commandExecutor.execute(CONTEXTMENU_ITEM_SHOW);

          expect(countRenderableColumns()).toBe(5);
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(0, 1).innerText).toBe('B1');
          expect(getCell(0, 2).innerText).toBe('C1');
          expect(getCell(0, 3).innerText).toBe('D1');
          expect(getCell(0, 4).innerText).toBe('E1');
          expect(getSelectedLast()).toEqual([0, 2, 1, 4]);
        });
      });
    });
  });

  describe('cell selection UI', () => {
    it('should select entire row by header if first column is hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        hiddenColumns: {
          columns: [0],
        },
      });

      const header = getCell(0, -1);

      simulateClick(header, 'LMB');

      expect(getSelectedLast()).toEqual([0, 0, 0, 4]);
    });

    it('should select entire row by header if last column is hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        hiddenColumns: {
          columns: [4],
        },
      });

      const header = getCell(0, -1);

      simulateClick(header, 'LMB');

      expect(getSelectedLast()).toEqual([0, 0, 0, 4]);
    });

    it('should select entire row by header if any column in the middle is hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      const header = getCell(0, -1);

      simulateClick(header, 'LMB');

      expect(getSelectedLast()).toEqual([0, 0, 0, 4]);
    });

    it('should keep hidden columns in cell range', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      const startCell = getCell(0, 0);
      const endCell = getCell(0, 4);

      mouseDown(startCell, 'LMB');
      mouseOver(endCell);
      mouseUp(endCell);

      expect(getSelectedLast()).toEqual([0, 0, 0, 4]);
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

    it('should select entire table after call selectAll if all of columns ', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        hiddenColumns: {
          columns: [0, 1, 2, 3, 4],
        },
      });

      selectAll();

      expect(getSelectedLast()).toEqual([0, 0, 4, 4]);
    });

    it('should select entire row after call selectRows if the first column is hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        hiddenColumns: {
          columns: [0],
        },
      });

      selectRows(0);

      expect(getSelectedLast()).toEqual([0, 0, 0, 4]);
    });

    it('should select entire row after call selectRows if the last column is hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        hiddenColumns: {
          columns: [4],
        },
      });

      selectRows(0);

      expect(getSelectedLast()).toEqual([0, 0, 0, 4]);
    });

    it('should select entire row after call selectRows if columns between the first and the last are hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      selectRows(0);

      expect(getSelectedLast()).toEqual([0, 0, 0, 4]);
    });

    it('should select hidden column after call selectColumns', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        hiddenColumns: {
          columns: [1],
        },
      });

      selectColumns(1);

      expect(getSelectedLast()).toEqual([0, 1, 4, 1]);
    });

    it('should select columns after call selectColumns if range is partially hidden at the begining of selection', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      selectColumns(2, 4);

      expect(getSelectedLast()).toEqual([0, 2, 4, 4]);
    });

    it('should select columns after call selectColumns if range is partially hidden at the end of selection', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      selectColumns(0, 2);

      expect(getSelectedLast()).toEqual([0, 0, 4, 2]);
    });

    it('should select columns after call selectColumns if range is partially hidden in the middle of selection', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      selectColumns(0, 4);

      expect(getSelectedLast()).toEqual([0, 0, 4, 4]);
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

    it('should allow to copy hidden columns, when "copyPasteEnabled" property is not set', () => {
      const hot = handsontable({
        data: getMultilineData(5, 10),
        hiddenColumns: {
          columns: [
            2,
            4
          ]
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

      expect(getSelectedLast()).toEqual([0, 4, 0, 4]);
      expect(getCell(0, 1)).toHaveClass('current');
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

      expect(getSelectedLast()).toEqual([0, 0, 0, 0]);
      expect(getCell(0, 0)).toHaveClass('current');
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

      expect(getSelectedLast()).toEqual([1, 0, 1, 0]);
      expect(getCell(1, 0)).toHaveClass('current');
    });

    it('should go to the last visible cell in the previous row while navigating by left arrow if all column on the left side are hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenColumns: {
          columns: [0, 1],
        },
      });

      selectCell(1, 2);

      keyDownUp(Handsontable.helper.KEY_CODES.ARROW_RIGHT);

      expect(getSelectedLast()).toEqual([0, 4, 0, 4]);
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

      expect(getSelectedLast()).toEqual([0, 4, 0, 4]);
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

      expect(getSelectedLast()).toEqual([4, 0, 4, 0]);
    });
  });

  describe('manualColumnMove', () => {
    it('should properly render hidden ranges after moving action', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        hiddenColumns: {
          columns: [3]
        },
        width: 500,
        height: 300,
        manualColumnMove: true
      });
      const hiddenColumns = hot.getPlugin('hiddenColumns');
      const manualColumnMove = hot.getPlugin('manualColumnMove');

      manualColumnMove.moveColumns([0, 1], 4);
      hot.render();

      expect(hiddenColumns.getHiddenColumns()[0]).toEqual(3);
      expect(hot.getColWidth(1)).toEqual(0.1);
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
});

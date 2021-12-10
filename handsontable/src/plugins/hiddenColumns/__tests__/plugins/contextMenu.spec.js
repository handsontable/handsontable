describe('HiddenColumns', () => {
  const id = 'testContainer';

  const {
    CONTEXTMENU_ITEMS_SHOW_COLUMN,
    CONTEXTMENU_ITEMS_HIDE_COLUMN,
    CONTEXTMENU_ITEMS_NO_ITEMS
  } = Handsontable.languages.dictionaryKeys;
  const MENU_NO_ITEMS = Handsontable.languages.getTranslatedPhrase('en-US', CONTEXTMENU_ITEMS_NO_ITEMS);
  const MENU_ITEM_SHOW_COLUMN = Handsontable.languages.getTranslatedPhrase('en-US', CONTEXTMENU_ITEMS_SHOW_COLUMN);
  const MENU_ITEM_SHOW_COLUMNS = Handsontable.languages.getTranslatedPhrase('en-US', CONTEXTMENU_ITEMS_SHOW_COLUMN, 1);
  const MENU_ITEM_HIDE_COLUMN = Handsontable.languages.getTranslatedPhrase('en-US', CONTEXTMENU_ITEMS_HIDE_COLUMN);
  const MENU_ITEM_HIDE_COLUMNS = Handsontable.languages.getTranslatedPhrase('en-US', CONTEXTMENU_ITEMS_HIDE_COLUMN, 1);
  const CONTEXTMENU_ITEM_SHOW = 'hidden_columns_show';
  const CONTEXTMENU_ITEM_HIDE = 'hidden_columns_hide';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
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

            expect(getSelected()).toEqual([[-1, 3, 1, 3]]);
            expect(getSelectedRangeLast().highlight.row).toBe(0);
            expect(getSelectedRangeLast().highlight.col).toBe(3);
            expect(getSelectedRangeLast().from.row).toBe(-1);
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

            expect(getSelected()).toEqual([[-1, 8, 1, 8]]);
            expect(getSelectedRangeLast().highlight.row).toBe(0);
            expect(getSelectedRangeLast().highlight.col).toBe(8);
            expect(getSelectedRangeLast().from.row).toBe(-1);
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

            expect(getSelected()).toEqual([[-1, 2, 1, 2]]);
            expect(getSelectedRangeLast().highlight.row).toBe(0);
            expect(getSelectedRangeLast().highlight.col).toBe(2);
            expect(getSelectedRangeLast().from.row).toBe(-1);
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

            expect(getSelected()).toEqual([[-1, 4, 1, 4]]);
            expect(getSelectedRangeLast().highlight.row).toBe(0);
            expect(getSelectedRangeLast().highlight.col).toBe(4);
            expect(getSelectedRangeLast().from.row).toBe(-1);
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
          |===|
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
          expect(getSelected()).toEqual([[-1, 0, 1, 4]]);
          expect(getSelectedRangeLast().highlight.row).toBe(0);
          expect(getSelectedRangeLast().highlight.col).toBe(0);
          expect(getSelectedRangeLast().from.row).toBe(-1);
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
          expect(getSelected()).toEqual([[-1, 0, 1, 2]]);
          expect(getSelectedRangeLast().highlight.row).toBe(0);
          expect(getSelectedRangeLast().highlight.col).toBe(0);
          expect(getSelectedRangeLast().from.row).toBe(-1);
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
          expect(getSelected()).toEqual([[-1, 2, 1, 4]]);
          expect(getSelectedRangeLast().highlight.row).toBe(0);
          expect(getSelectedRangeLast().highlight.col).toBe(2);
          expect(getSelectedRangeLast().from.row).toBe(-1);
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
          expect(getSelected()).toEqual([[-1, -1, 1, 4]]);
          expect(getSelectedRangeLast().highlight.row).toBe(0);
          expect(getSelectedRangeLast().highlight.col).toBe(0);
          expect(getSelectedRangeLast().from.row).toBe(-1);
          expect(getSelectedRangeLast().from.col).toBe(-1);
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
          expect(getSelected()).toEqual([[-1, 0, 1, 2]]);
          expect(getSelectedRangeLast().highlight.row).toBe(0);
          expect(getSelectedRangeLast().highlight.col).toBe(0);
          expect(getSelectedRangeLast().from.row).toBe(-1);
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
          expect(getSelected()).toEqual([[-1, 0, 1, 2]]);
          expect(getSelectedRangeLast().highlight.row).toBe(0);
          expect(getSelectedRangeLast().highlight.col).toBe(0);
          expect(getSelectedRangeLast().from.row).toBe(-1);
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

            expect(getSelected()).toEqual([[1, -1, 1, 3]]);
            expect(getSelectedRangeLast().highlight.row).toBe(1);
            expect(getSelectedRangeLast().highlight.col).toBe(1);
            expect(getSelectedRangeLast().from.row).toBe(1);
            expect(getSelectedRangeLast().from.col).toBe(-1);
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

            expect(getSelected()).toEqual([[1, -1, 1, 3]]);
            expect(getSelectedRangeLast().highlight.row).toBe(1);
            expect(getSelectedRangeLast().highlight.col).toBe(0);
            expect(getSelectedRangeLast().from.row).toBe(1);
            expect(getSelectedRangeLast().from.col).toBe(-1);
            expect(getSelectedRangeLast().to.row).toBe(1);
            expect(getSelectedRangeLast().to.col).toBe(3);
            expect(`
            |   |
            |===|
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

            expect(getSelected()).toEqual([[0, -1, 0, 3]]);
            expect(getSelectedRangeLast().highlight.row).toBe(0);
            expect(getSelectedRangeLast().highlight.col).toBe(1);
            expect(getSelectedRangeLast().from.row).toBe(0);
            expect(getSelectedRangeLast().from.col).toBe(-1);
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

            expect(getSelected()).toEqual([[0, -1, 0, 3]]);
            expect(getSelectedRangeLast().highlight.row).toBe(0);
            expect(getSelectedRangeLast().highlight.col).toBe(0);
            expect(getSelectedRangeLast().from.row).toBe(0);
            expect(getSelectedRangeLast().from.col).toBe(-1);
            expect(getSelectedRangeLast().to.row).toBe(0);
            expect(getSelectedRangeLast().to.col).toBe(3);
            expect(`
            |   |
            |===|
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
});

describe('HiddenRows', () => {
  const id = 'testContainer';

  const {
    CONTEXTMENU_ITEMS_SHOW_ROW,
    CONTEXTMENU_ITEMS_HIDE_ROW,
    CONTEXTMENU_ITEMS_NO_ITEMS
  } = Handsontable.languages.dictionaryKeys;
  const MENU_NO_ITEMS = Handsontable.languages.getTranslatedPhrase('en-US', CONTEXTMENU_ITEMS_NO_ITEMS);
  const MENU_ITEM_SHOW_ROW = Handsontable.languages.getTranslatedPhrase('en-US', CONTEXTMENU_ITEMS_SHOW_ROW);
  const MENU_ITEM_SHOW_ROWS = Handsontable.languages.getTranslatedPhrase('en-US', CONTEXTMENU_ITEMS_SHOW_ROW, 1);
  const MENU_ITEM_HIDE_ROW = Handsontable.languages.getTranslatedPhrase('en-US', CONTEXTMENU_ITEMS_HIDE_ROW);
  const MENU_ITEM_HIDE_ROWS = Handsontable.languages.getTranslatedPhrase('en-US', CONTEXTMENU_ITEMS_HIDE_ROW, 1);
  const CONTEXTMENU_ITEM_SHOW = 'hidden_rows_show';
  const CONTEXTMENU_ITEM_HIDE = 'hidden_rows_hide';

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
        it('should not render context menu item for hiding if no row is selected', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_HIDE],
            hiddenRows: true,
          });

          selectCell(0, 0);
          contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toBe(MENU_NO_ITEMS);
        });

        it('should render proper context menu item for hiding if only one row is selected', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_HIDE],
            hiddenRows: true,
          });

          const $header = $(getCell(0, -1));

          $header.simulate('mousedown');
          $header.simulate('mouseup');
          contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_HIDE_ROW);
        });

        it('should render proper context menu item for hiding a few selected rows', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_HIDE],
            hiddenRows: true,
          });

          const start = getCell(0, -1);
          const end = getCell(2, -1);

          mouseDown(start);
          mouseOver(end);
          mouseUp(end);

          contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_HIDE_ROWS);
        });
      });

      describe('unhiding', () => {
        it('should not render context menu item for unhiding if no row is selected', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: true,
          });

          selectCell(0, 0);
          contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toBe(MENU_NO_ITEMS);
        });

        it('should not render context menu item for unhiding if the first visible row is selected and no row before is hidden', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [1, 2, 3]
            },
          });

          const header = getCell(0, -1);

          mouseDown(header);
          mouseUp(header);
          contextMenu(header);

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toBe(MENU_NO_ITEMS);
        });

        it('should not render context menu item for unhiding if the last visible row is selected and no row after is hidden', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [1, 2, 3],
            },
          });

          const header = getCell(4, -1);

          mouseDown(header);
          mouseUp(header);
          contextMenu(header);

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toBe(MENU_NO_ITEMS);
        });

        it('should not render context menu item for unhiding if selected row is not the first one and is not the last one', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [1, 3],
            },
          });

          const header = getCell(2, -1);

          mouseDown(header);
          mouseUp(header);
          contextMenu(header);

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toBe(MENU_NO_ITEMS);
        });

        it('should render proper context menu item for unhiding if the first visible row is selected and every row before is hidden', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [0, 1],
            },
          });

          const $header = $(getCell(2, -1));

          $header.simulate('mousedown');
          $header.simulate('mouseup');
          contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_SHOW_ROWS);
        });

        it('should render proper context menu item for unhiding if the last visible row is selected and every row after is hidden', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [3, 4],
            },
          });

          const $header = $(getCell(2, -1));

          $header.simulate('mousedown');
          $header.simulate('mouseup');
          contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_SHOW_ROWS);
        });

        it('should render proper context menu item for unhiding if all rows are hidden', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            rowHeaders: true,
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [0, 1, 2, 3, 4],
            },
          });

          const $header = getTopLeftClone().find('thead tr th');

          contextMenu($header);

          const actions = $('.htContextMenu tbody td').not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_SHOW_ROWS);
        });

        it('should render proper context menu item for unhiding a few rows', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [1, 3],
            },
          });

          const start = getCell(0, -1);
          const end = getCell(4, -1);

          mouseDown(start);
          mouseOver(end);
          mouseUp(end);

          contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_SHOW_ROWS);
        });

        it('should render proper context menu item for unhiding only one row', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [1],
            },
          });

          const start = getCell(0, -1);
          const end = getCell(4, -1);

          mouseDown(start);
          mouseOver(end);
          mouseUp(end);

          contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_SHOW_ROW);
        });

        it('should render proper context menu item for unhiding one row placed before trimmed row', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [1],
            },
            trimRows: [2],
          });

          const start = getCell(0, -1);
          const end = getCell(2, -1);

          mouseDown(start);
          mouseOver(end);
          mouseUp(end);

          contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_SHOW_ROW);
        });

        it('should render proper context menu item for unhiding one row placed after trimmed row', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [1],
            },
            trimRows: [1],
          });

          const start = getCell(0, -1);
          const end = getCell(2, -1);

          mouseDown(start);
          mouseOver(end);
          mouseUp(end);

          contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_SHOW_ROW);
        });
      });
    });

    describe('commands', () => {
      describe('hiding', () => {
        describe('should hide selected rows', () => {
          describe('(selected from the left to the right)', () => {
            it('hiding from a row "at the start" to the next row', () => {
              handsontable({
                data: Handsontable.helper.createSpreadsheetData(5, 5),
                rowHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenRows: true,
              });

              selectRows(0, 1);

              getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

              expect(spec().$container.find('.ht_master tr').length).toBe(3);
              expect(getCell(0, 0)).toBe(null);
              expect(getCell(1, 0)).toBe(null);
              expect(getCell(2, 0).innerText).toBe('A3');
              expect(getCell(3, 0).innerText).toBe('A4');
              expect(getCell(4, 0).innerText).toBe('A5');
            });

            it('hiding from a row "in the middle" to the next row', () => {
              handsontable({
                data: Handsontable.helper.createSpreadsheetData(5, 5),
                rowHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenRows: true,
              });

              selectRows(2, 3);

              getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

              expect(spec().$container.find('.ht_master tr').length).toBe(3);
              expect(getCell(0, 0).innerText).toBe('A1');
              expect(getCell(1, 0).innerText).toBe('A2');
              expect(getCell(2, 0)).toBe(null);
              expect(getCell(3, 0)).toBe(null);
              expect(getCell(4, 0).innerText).toBe('A5');
            });

            it('hiding rows at the end', () => {
              handsontable({
                data: Handsontable.helper.createSpreadsheetData(5, 5),
                rowHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenRows: true,
              });

              selectRows(3, 4);

              getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

              expect(spec().$container.find('.ht_master tr').length).toBe(3);
              expect(getCell(0, 0).innerText).toBe('A1');
              expect(getCell(1, 0).innerText).toBe('A2');
              expect(getCell(2, 0).innerText).toBe('A3');
              expect(getCell(3, 0)).toBe(null);
              expect(getCell(4, 0)).toBe(null);
            });

            it('hiding all rows', () => {
              handsontable({
                data: Handsontable.helper.createSpreadsheetData(5, 5),
                rowHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenRows: true,
              });

              selectRows(0, 4);

              getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

              expect(spec().$container.find('.ht_master tr').length).toBe(0);
              expect(getCell(0, 0)).toBe(null);
              expect(getCell(1, 0)).toBe(null);
              expect(getCell(2, 0)).toBe(null);
              expect(getCell(3, 0)).toBe(null);
              expect(getCell(4, 0)).toBe(null);
            });
          });

          describe('(selected from the right to the left)', () => {
            it('hiding from row "at the end" to the previous row', () => {
              handsontable({
                data: Handsontable.helper.createSpreadsheetData(5, 5),
                rowHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenRows: true,
              });

              selectRows(4, 3);

              getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

              expect(spec().$container.find('.ht_master tr').length).toBe(3);
              expect(getCell(0, 0).innerText).toBe('A1');
              expect(getCell(1, 0).innerText).toBe('A2');
              expect(getCell(2, 0).innerText).toBe('A3');
              expect(getCell(3, 0)).toBe(null);
              expect(getCell(4, 0)).toBe(null);
            });

            it('hiding from a row "in the middle" to the previous row', () => {
              handsontable({
                data: Handsontable.helper.createSpreadsheetData(5, 5),
                rowHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenRows: true,
              });

              selectRows(3, 2);

              getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

              expect(spec().$container.find('.ht_master tr').length).toBe(3);
              expect(getCell(0, 0).innerText).toBe('A1');
              expect(getCell(1, 0).innerText).toBe('A2');
              expect(getCell(2, 0)).toBe(null);
              expect(getCell(3, 0)).toBe(null);
              expect(getCell(4, 0).innerText).toBe('A5');
            });

            it('hiding rows at the start', () => {
              handsontable({
                data: Handsontable.helper.createSpreadsheetData(5, 5),
                rowHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenRows: true,
              });

              selectRows(1, 0);

              getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

              expect(spec().$container.find('.ht_master tr').length).toBe(3);
              expect(getCell(0, 0)).toBe(null);
              expect(getCell(1, 0)).toBe(null);
              expect(getCell(2, 0).innerText).toBe('A3');
              expect(getCell(3, 0).innerText).toBe('A4');
              expect(getCell(4, 0).innerText).toBe('A5');
            });

            it('hiding all rows', () => {
              handsontable({
                data: Handsontable.helper.createSpreadsheetData(5, 5),
                rowHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenRows: true,
              });

              selectRows(4, 0);

              getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

              expect(spec().$container.find('.ht_master tr').length).toBe(0);
              expect(getCell(0, 0)).toBe(null);
              expect(getCell(1, 0)).toBe(null);
              expect(getCell(2, 0)).toBe(null);
              expect(getCell(3, 0)).toBe(null);
              expect(getCell(4, 0)).toBe(null);
            });
          });
        });

        describe('should select row below after hide action when below is visible row and', () => {
          it('when there is no hidden row', () => {
            handsontable({
              data: Handsontable.helper.createSpreadsheetData(5, 2),
              colHeaders: true,
              rowHeaders: true,
              contextMenu: [CONTEXTMENU_ITEM_HIDE],
              hiddenRows: true,
            });

            selectRows(1, 2);

            getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

            expect(getSelected()).toEqual([[3, -1, 3, 1]]);
            expect(getSelectedRangeLast().highlight.row).toBe(3);
            expect(getSelectedRangeLast().highlight.col).toBe(0);
            expect(getSelectedRangeLast().from.row).toBe(3);
            expect(getSelectedRangeLast().from.col).toBe(-1);
            expect(getSelectedRangeLast().to.row).toBe(3);
            expect(getSelectedRangeLast().to.col).toBe(1);
            expect(`
              |   ║ - : - |
              |===:===:===|
              |   ║   :   |
              | * ║ A : 0 |
              |   ║   :   |
            `).toBeMatchToSelectionPattern();
          });

          it('when there are hidden rows', () => {
            handsontable({
              data: Handsontable.helper.createSpreadsheetData(10, 2),
              colHeaders: true,
              rowHeaders: true,
              contextMenu: [CONTEXTMENU_ITEM_HIDE],
              hiddenRows: {
                rows: [0, 1, 5, 6, 7]
              }
            });

            selectRows(3, 4);

            getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

            expect(getSelected()).toEqual([[8, -1, 8, 1]]);
            expect(getSelectedRangeLast().highlight.row).toBe(8);
            expect(getSelectedRangeLast().highlight.col).toBe(0);
            expect(getSelectedRangeLast().from.row).toBe(8);
            expect(getSelectedRangeLast().from.col).toBe(-1);
            expect(getSelectedRangeLast().to.row).toBe(8);
            expect(getSelectedRangeLast().to.col).toBe(1);
            expect(`
              |   ║ - : - |
              |===:===:===|
              |   ║   :   |
              | * ║ A : 0 |
              |   ║   :   |
            `).toBeMatchToSelectionPattern();
          });
        });

        describe('should select row above after hide action when below is no more visible row and', () => {
          it('there is no hidden row', () => {
            handsontable({
              data: Handsontable.helper.createSpreadsheetData(5, 2),
              colHeaders: true,
              rowHeaders: true,
              contextMenu: [CONTEXTMENU_ITEM_HIDE],
              hiddenRows: true,
            });

            selectRows(3, 4);

            getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

            expect(getSelected()).toEqual([[2, -1, 2, 1]]);
            expect(getSelectedRangeLast().highlight.row).toBe(2);
            expect(getSelectedRangeLast().highlight.col).toBe(0);
            expect(getSelectedRangeLast().from.row).toBe(2);
            expect(getSelectedRangeLast().from.col).toBe(-1);
            expect(getSelectedRangeLast().to.row).toBe(2);
            expect(getSelectedRangeLast().to.col).toBe(1);
            expect(`
              |   ║ - : - |
              |===:===:===|
              |   ║   :   |
              |   ║   :   |
              | * ║ A : 0 |
            `).toBeMatchToSelectionPattern();
          });

          it('there are hidden rows', () => {
            handsontable({
              data: Handsontable.helper.createSpreadsheetData(10, 2),
              colHeaders: true,
              rowHeaders: true,
              contextMenu: [CONTEXTMENU_ITEM_HIDE],
              hiddenRows: {
                rows: [0, 1, 5, 6, 7]
              }
            });

            selectRows(8, 9);

            getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

            expect(getSelected()).toEqual([[4, -1, 4, 1]]);
            expect(getSelectedRangeLast().highlight.row).toBe(4);
            expect(getSelectedRangeLast().highlight.col).toBe(0);
            expect(getSelectedRangeLast().from.row).toBe(4);
            expect(getSelectedRangeLast().from.col).toBe(-1);
            expect(getSelectedRangeLast().to.row).toBe(4);
            expect(getSelectedRangeLast().to.col).toBe(1);
            expect(`
              |   ║ - : - |
              |===:===:===|
              |   ║   :   |
              |   ║   :   |
              | * ║ A : 0 |
            `).toBeMatchToSelectionPattern();
          });
        });

        it('should not preserve selection after hiding all rows', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(10, 2),
            colHeaders: true,
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_HIDE],
            hiddenRows: {
              rows: [0, 1, 5, 6, 7]
            }
          });

          selectAll();

          getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

          expect(getSelectedLast()).toBeUndefined();
          expect(`
            |   ║   :   |
            |===:===:===|
          `).toBeMatchToSelectionPattern();
        });
      });

      describe('unhiding', () => {
        it('should unhide hidden rows in selection', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 2),
            colHeaders: true,
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [1, 3],
            },
          });

          expect(spec().$container.find('.ht_master tr').length).toBe(4); // + column header
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(1, 0)).toBe(null);
          expect(getCell(2, 0).innerText).toBe('A3');
          expect(getCell(3, 0)).toBe(null);
          expect(getCell(4, 0).innerText).toBe('A5');

          selectRows(0, 4);

          contextMenu();
          getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_SHOW);

          expect(spec().$container.find('.ht_master tr').length).toBe(6); // + column header
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(1, 0).innerText).toBe('A2');
          expect(getCell(2, 0).innerText).toBe('A3');
          expect(getCell(3, 0).innerText).toBe('A4');
          expect(getCell(4, 0).innerText).toBe('A5');
          expect(getSelected()).toEqual([[0, -1, 4, 1]]);
          expect(getSelectedRangeLast().highlight.row).toBe(0);
          expect(getSelectedRangeLast().highlight.col).toBe(0);
          expect(getSelectedRangeLast().from.row).toBe(0);
          expect(getSelectedRangeLast().from.col).toBe(-1);
          expect(getSelectedRangeLast().to.row).toBe(4);
          expect(getSelectedRangeLast().to.col).toBe(1);
          expect(`
            |   ║ - : - |
            |===:===:===|
            | * ║ A : 0 |
            | * ║ 0 : 0 |
            | * ║ 0 : 0 |
            | * ║ 0 : 0 |
            | * ║ 0 : 0 |
          `).toBeMatchToSelectionPattern();
        });

        it('should unhide hidden rows before the first visible and selected row', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 2),
            colHeaders: true,
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [0, 1],
            },
          });

          expect(spec().$container.find('.ht_master tr').length).toBe(4); // + column header
          expect(getCell(0, 0)).toBe(null);
          expect(getCell(1, 0)).toBe(null);
          expect(getCell(2, 0).innerText).toBe('A3');
          expect(getCell(3, 0).innerText).toBe('A4');
          expect(getCell(4, 0).innerText).toBe('A5');

          selectRows(2);

          contextMenu();
          getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_SHOW);

          expect(spec().$container.find('.ht_master tr').length).toBe(6); // + column header
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(1, 0).innerText).toBe('A2');
          expect(getCell(2, 0).innerText).toBe('A3');
          expect(getCell(3, 0).innerText).toBe('A4');
          expect(getCell(4, 0).innerText).toBe('A5');
          expect(getSelected()).toEqual([[0, -1, 2, 1]]);
          expect(getSelectedRangeLast().highlight.row).toBe(0);
          expect(getSelectedRangeLast().highlight.col).toBe(0);
          expect(getSelectedRangeLast().from.row).toBe(0);
          expect(getSelectedRangeLast().from.col).toBe(-1);
          expect(getSelectedRangeLast().to.row).toBe(2);
          expect(getSelectedRangeLast().to.col).toBe(1);
          expect(`
            |   ║ - : - |
            |===:===:===|
            | * ║ A : 0 |
            | * ║ 0 : 0 |
            | * ║ 0 : 0 |
            |   ║   :   |
            |   ║   :   |
          `).toBeMatchToSelectionPattern();
        });

        it('should unhide hidden rows after the last visible and selected row', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 2),
            colHeaders: true,
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [3, 4],
            },
          });

          expect(spec().$container.find('.ht_master tr').length).toBe(4); // + column header
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(1, 0).innerText).toBe('A2');
          expect(getCell(2, 0).innerText).toBe('A3');
          expect(getCell(3, 0)).toBe(null);
          expect(getCell(4, 0)).toBe(null);

          selectRows(2);

          contextMenu();
          getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_SHOW);

          expect(spec().$container.find('.ht_master tr').length).toBe(6); // + column header
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(1, 0).innerText).toBe('A2');
          expect(getCell(2, 0).innerText).toBe('A3');
          expect(getCell(3, 0).innerText).toBe('A4');
          expect(getCell(4, 0).innerText).toBe('A5');
          expect(getSelected()).toEqual([[2, -1, 4, 1]]);
          expect(getSelectedRangeLast().highlight.row).toBe(2);
          expect(getSelectedRangeLast().highlight.col).toBe(0);
          expect(getSelectedRangeLast().from.row).toBe(2);
          expect(getSelectedRangeLast().from.col).toBe(-1);
          expect(getSelectedRangeLast().to.row).toBe(4);
          expect(getSelectedRangeLast().to.col).toBe(1);
          expect(`
            |   ║ - : - |
            |===:===:===|
            |   ║   :   |
            |   ║   :   |
            | * ║ A : 0 |
            | * ║ 0 : 0 |
            | * ║ 0 : 0 |
          `).toBeMatchToSelectionPattern();
        });

        it('should unhide all rows when they had been hidden previously', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 2),
            colHeaders: true,
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [0, 1, 2, 3, 4],
            },
          });

          expect(spec().$container.find('.ht_master tr').length).toBe(1); // + column header
          expect(getCell(0, 0)).toBe(null);
          expect(getCell(1, 0)).toBe(null);
          expect(getCell(2, 0)).toBe(null);
          expect(getCell(3, 0)).toBe(null);
          expect(getCell(4, 0)).toBe(null);

          const header = getTopLeftClone().find('thead th:eq(0)');

          contextMenu(header);
          getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_SHOW);

          expect(spec().$container.find('.ht_master tr').length).toBe(6); // + column header
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(1, 0).innerText).toBe('A2');
          expect(getCell(2, 0).innerText).toBe('A3');
          expect(getCell(3, 0).innerText).toBe('A4');
          expect(getCell(4, 0).innerText).toBe('A5');
          expect(getSelected()).toEqual([[-1, -1, 4, 1]]);
          expect(getSelectedRangeLast().highlight.row).toBe(0);
          expect(getSelectedRangeLast().highlight.col).toBe(0);
          expect(getSelectedRangeLast().from.row).toBe(-1);
          expect(getSelectedRangeLast().from.col).toBe(-1);
          expect(getSelectedRangeLast().to.row).toBe(4);
          expect(getSelectedRangeLast().to.col).toBe(1);
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

        it('should unhide all hidden rows when some of the rows was hidden', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [1],
            },
            trimRows: [1],
          });

          expect(spec().$container.find('.ht_master tr').length).toBe(3);
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(1, 0)).toBe(null);
          expect(getCell(2, 0).innerText).toBe('A4');
          expect(getCell(3, 0).innerText).toBe('A5');
          expect(getCell(4, 0)).toBe(null);

          const start = getCell(0, -1);
          const end = getCell(2, -1);

          mouseDown(start);
          mouseOver(end);
          mouseUp(end);

          contextMenu();
          getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_SHOW);

          expect(spec().$container.find('.ht_master tr').length).toBe(4);
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(1, 0).innerText).toBe('A3');
          expect(getCell(2, 0).innerText).toBe('A4');
          expect(getCell(3, 0).innerText).toBe('A5');
          expect(getCell(4, 0)).toBe(null);
          expect(getSelected()).toEqual([[0, -1, 2, 4]]);
          expect(getSelectedRangeLast().highlight.row).toBe(0);
          expect(getSelectedRangeLast().highlight.col).toBe(0);
          expect(getSelectedRangeLast().from.row).toBe(0);
          expect(getSelectedRangeLast().from.col).toBe(-1);
          expect(getSelectedRangeLast().to.row).toBe(2);
          expect(getSelectedRangeLast().to.col).toBe(4);
          expect(`
            | * ║ A : 0 : 0 : 0 : 0 |
            | * ║ 0 : 0 : 0 : 0 : 0 |
            | * ║ 0 : 0 : 0 : 0 : 0 |
            |   ║   :   :   :   :   |
          `).toBeMatchToSelectionPattern();
        });

        it('should unhide all rows when the hidden row is placed before trimmed row', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [1],
            },
            trimRows: [2],
          });

          expect(spec().$container.find('.ht_master tr').length).toBe(3);
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(1, 0)).toBe(null);
          expect(getCell(2, 0).innerText).toBe('A4');
          expect(getCell(3, 0).innerText).toBe('A5');
          expect(getCell(4, 0)).toBe(null);

          const start = getCell(0, -1);
          const end = getCell(2, -1);

          mouseDown(start);
          mouseOver(end);
          mouseUp(end);

          contextMenu();
          getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_SHOW);

          expect(spec().$container.find('.ht_master tr').length).toBe(4);
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(1, 0).innerText).toBe('A2');
          expect(getCell(2, 0).innerText).toBe('A4');
          expect(getCell(3, 0).innerText).toBe('A5');
          expect(getCell(4, 0)).toBe(null);
          expect(getSelected()).toEqual([[0, -1, 2, 4]]);
          expect(getSelectedRangeLast().highlight.row).toBe(0);
          expect(getSelectedRangeLast().highlight.col).toBe(0);
          expect(getSelectedRangeLast().from.row).toBe(0);
          expect(getSelectedRangeLast().from.col).toBe(-1);
          expect(getSelectedRangeLast().to.row).toBe(2);
          expect(getSelectedRangeLast().to.col).toBe(4);
          expect(`
            | * ║ A : 0 : 0 : 0 : 0 |
            | * ║ 0 : 0 : 0 : 0 : 0 |
            | * ║ 0 : 0 : 0 : 0 : 0 |
            |   ║   :   :   :   :   |
          `).toBeMatchToSelectionPattern();
        });

        it('should unhide all rows when the hidden row is placed after trimmed row', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [1],
            },
            trimRows: [1],
          });

          expect(spec().$container.find('.ht_master tr').length).toBe(3);
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(1, 0)).toBe(null);
          expect(getCell(2, 0).innerText).toBe('A4');
          expect(getCell(3, 0).innerText).toBe('A5');
          expect(getCell(4, 0)).toBe(null);

          const start = getCell(0, -1);
          const end = getCell(2, -1);

          mouseDown(start);
          mouseOver(end);
          mouseUp(end);

          contextMenu();
          getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_SHOW);

          expect(spec().$container.find('.ht_master tr').length).toBe(4);
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(1, 0).innerText).toBe('A3');
          expect(getCell(2, 0).innerText).toBe('A4');
          expect(getCell(3, 0).innerText).toBe('A5');
          expect(getCell(4, 0)).toBe(null);
          expect(getSelected()).toEqual([[0, -1, 2, 4]]);
          expect(getSelectedRangeLast().highlight.row).toBe(0);
          expect(getSelectedRangeLast().highlight.col).toBe(0);
          expect(getSelectedRangeLast().from.row).toBe(0);
          expect(getSelectedRangeLast().from.col).toBe(-1);
          expect(getSelectedRangeLast().to.row).toBe(2);
          expect(getSelectedRangeLast().to.col).toBe(4);
          expect(`
            | * ║ A : 0 : 0 : 0 : 0 |
            | * ║ 0 : 0 : 0 : 0 : 0 |
            | * ║ 0 : 0 : 0 : 0 : 0 |
            |   ║   :   :   :   :   |
          `).toBeMatchToSelectionPattern();
        });
      });
    });

    describe('Changing selection after alter actions from context-menu', () => {
      describe('should keep the row selection in the same position as before inserting the row', () => {
        describe('above the selected row', () => {
          it('when the first row is hidden', () => {
            handsontable({
              data: createSpreadsheetData(4, 4),
              contextMenu: true,
              colHeaders: true,
              rowHeaders: true,
              hiddenRows: {
                rows: [0]
              },
            });

            const header = $('.ht_clone_top .htCore thead tr th').eq(1); // The first column

            simulateClick(header, 'RMB');
            contextMenu(header);

            $('.htContextMenu .ht_master .htCore')
              .find('tbody td')
              .not('.htSeparator')
              .eq(2)
              .simulate('mousedown')
              .simulate('mouseup'); // Insert column left

            expect(getSelected()).toEqual([[-1, 1, 3, 1]]);
            expect(getSelectedRangeLast().highlight.row).toBe(1);
            expect(getSelectedRangeLast().highlight.col).toBe(1);
            expect(getSelectedRangeLast().from.row).toBe(-1);
            expect(getSelectedRangeLast().from.col).toBe(1);
            expect(getSelectedRangeLast().to.row).toBe(3);
            expect(getSelectedRangeLast().to.col).toBe(1);
            expect(`
              |   ║   : * :   :   :   |
              |===:===:===:===:===:===|
              | - ║   : A :   :   :   |
              | - ║   : 0 :   :   :   |
              | - ║   : 0 :   :   :   |
            `).toBeMatchToSelectionPattern();
          });

          it('when all rows are hidden', () => {
            handsontable({
              data: createSpreadsheetData(4, 4),
              contextMenu: true,
              colHeaders: true,
              rowHeaders: true,
              hiddenRows: {
                rows: [0, 1, 2, 3],
              },
            });

            const header = $('.ht_clone_top .htCore thead tr th').eq(1); // The first column

            simulateClick(header, 'RMB');
            contextMenu(header);

            $('.htContextMenu .ht_master .htCore')
              .find('tbody td')
              .not('.htSeparator')
              .eq(2)
              .simulate('mousedown')
              .simulate('mouseup'); // Insert column left

            expect(getSelected()).toEqual([[-1, 1, 3, 1]]);
            expect(getSelectedRangeLast().highlight.row).toBe(0);
            expect(getSelectedRangeLast().highlight.col).toBe(1);
            expect(getSelectedRangeLast().from.row).toBe(-1);
            expect(getSelectedRangeLast().from.col).toBe(1);
            expect(getSelectedRangeLast().to.row).toBe(3);
            expect(getSelectedRangeLast().to.col).toBe(1);
            expect(`
              |   ║   : * :   :   :   |
              |===:===:===:===:===:===|
            `).toBeMatchToSelectionPattern();
          });
        });

        describe('below the selected row', () => {
          it('the first row is hidden', () => {
            handsontable({
              data: createSpreadsheetData(4, 4),
              contextMenu: true,
              colHeaders: true,
              rowHeaders: true,
              hiddenRows: {
                rows: [0],
              },
            });

            const header = $('.ht_clone_top .htCore thead tr th').eq(1); // The first column

            simulateClick(header, 'RMB');
            contextMenu(header);

            $('.htContextMenu .ht_master .htCore')
              .find('tbody td')
              .not('.htSeparator')
              .eq(3)
              .simulate('mousedown')
              .simulate('mouseup'); // Insert column right

            expect(getSelected()).toEqual([[-1, 0, 3, 0]]);
            expect(getSelectedRangeLast().highlight.row).toBe(1);
            expect(getSelectedRangeLast().highlight.col).toBe(0);
            expect(getSelectedRangeLast().from.row).toBe(-1);
            expect(getSelectedRangeLast().from.col).toBe(0);
            expect(getSelectedRangeLast().to.row).toBe(3);
            expect(getSelectedRangeLast().to.col).toBe(0);
            expect(`
              |   ║ * :   :   :   :   |
              |===:===:===:===:===:===|
              | - ║ A :   :   :   :   |
              | - ║ 0 :   :   :   :   |
              | - ║ 0 :   :   :   :   |
            `).toBeMatchToSelectionPattern();
          });

          it('when all rows are hidden', () => {
            handsontable({
              data: createSpreadsheetData(4, 4),
              contextMenu: true,
              colHeaders: true,
              rowHeaders: true,
              hiddenRows: {
                rows: [0, 1, 2, 3],
              },
            });

            const header = $('.ht_clone_top .htCore thead tr th').eq(1); // The first column

            simulateClick(header, 'RMB');
            contextMenu(header);

            $('.htContextMenu .ht_master .htCore')
              .find('tbody td')
              .not('.htSeparator')
              .eq(3)
              .simulate('mousedown')
              .simulate('mouseup'); // Insert column right

            expect(getSelected()).toEqual([[-1, 0, 3, 0]]);
            expect(getSelectedRangeLast().highlight.row).toBe(0);
            expect(getSelectedRangeLast().highlight.col).toBe(0);
            expect(getSelectedRangeLast().from.row).toBe(-1);
            expect(getSelectedRangeLast().from.col).toBe(0);
            expect(getSelectedRangeLast().to.row).toBe(3);
            expect(getSelectedRangeLast().to.col).toBe(0);
            expect(`
              |   ║ * :   :   :   :   |
              |===:===:===:===:===:===|
            `).toBeMatchToSelectionPattern();
          });
        });
      });
    });
  });
});

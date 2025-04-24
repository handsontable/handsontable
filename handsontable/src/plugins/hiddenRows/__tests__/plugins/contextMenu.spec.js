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
        it('should not render context menu item for hiding if no row is selected', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_HIDE],
            hiddenRows: true,
          });

          await selectCell(0, 0);
          await contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toBe(MENU_NO_ITEMS);
        });

        it('should render proper context menu item for hiding if only one row is selected', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_HIDE],
            hiddenRows: true,
          });

          const $header = $(getCell(0, -1));

          $header.simulate('mousedown');
          $header.simulate('mouseup');
          await contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_HIDE_ROW);
        });

        it('should render proper context menu item for hiding a few selected rows', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_HIDE],
            hiddenRows: true,
          });

          const start = getCell(0, -1);
          const end = getCell(2, -1);

          await mouseDown(start);
          await mouseOver(end);
          await mouseUp(end);

          await contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_HIDE_ROWS);
        });
      });

      describe('unhiding', () => {
        it('should not render context menu item for unhiding if no row is selected', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: true,
          });

          await selectCell(0, 0);
          await contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toBe(MENU_NO_ITEMS);
        });

        it('should not render context menu item for unhiding if the first visible row is selected and no row before is hidden', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [1, 2, 3]
            },
          });

          const header = getCell(0, -1);

          await mouseDown(header);
          await mouseUp(header);
          await contextMenu(header);

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toBe(MENU_NO_ITEMS);
        });

        it('should not render context menu item for unhiding if the last visible row is selected and no row after is hidden', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [1, 2, 3],
            },
          });

          const header = getCell(4, -1);

          await mouseDown(header);
          await mouseUp(header);
          await contextMenu(header);

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toBe(MENU_NO_ITEMS);
        });

        it('should not render context menu item for unhiding if selected row is not the first one and is not the last one', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [1, 3],
            },
          });

          const header = getCell(2, -1);

          await mouseDown(header);
          await mouseUp(header);
          await contextMenu(header);

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toBe(MENU_NO_ITEMS);
        });

        it('should render proper context menu item for unhiding if the first visible row is selected and every row before is hidden', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [0, 1],
            },
          });

          const $header = $(getCell(2, -1));

          $header.simulate('mousedown');
          $header.simulate('mouseup');
          await contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_SHOW_ROWS);
        });

        it('should render proper context menu item for unhiding if the last visible row is selected and every row after is hidden', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [3, 4],
            },
          });

          const $header = $(getCell(2, -1));

          $header.simulate('mousedown');
          $header.simulate('mouseup');
          await contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_SHOW_ROWS);
        });

        it('should render proper context menu item for unhiding if all rows are hidden', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            rowHeaders: true,
            colHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [0, 1, 2, 3, 4],
            },
          });

          const $header = getTopInlineStartClone().find('thead tr th');

          await contextMenu($header);

          const actions = $('.htContextMenu tbody td').not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_SHOW_ROWS);
        });

        it('should render proper context menu item for unhiding a few rows', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [1, 3],
            },
          });

          const start = getCell(0, -1);
          const end = getCell(4, -1);

          await mouseDown(start);
          await mouseOver(end);
          await mouseUp(end);

          await contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_SHOW_ROWS);
        });

        it('should render proper context menu item for unhiding only one row', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [1],
            },
          });

          const start = getCell(0, -1);
          const end = getCell(4, -1);

          await mouseDown(start);
          await mouseOver(end);
          await mouseUp(end);

          await contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_SHOW_ROW);
        });

        it('should render proper context menu item for unhiding one row placed before trimmed row', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [1],
            },
            trimRows: [2],
          });

          const start = getCell(0, -1);
          const end = getCell(2, -1);

          await mouseDown(start);
          await mouseOver(end);
          await mouseUp(end);

          await contextMenu();

          const items = $('.htContextMenu tbody td');
          const actions = items.not('.htSeparator');

          expect(actions.text()).toEqual(MENU_ITEM_SHOW_ROW);
        });

        it('should render proper context menu item for unhiding one row placed after trimmed row', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_SHOW],
            hiddenRows: {
              rows: [1],
            },
            trimRows: [1],
          });

          const start = getCell(0, -1);
          const end = getCell(2, -1);

          await mouseDown(start);
          await mouseOver(end);
          await mouseUp(end);

          await contextMenu();

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
            it('hiding from a row "at the start" to the next row', async() => {
              handsontable({
                data: createSpreadsheetData(5, 5),
                rowHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenRows: true,
              });

              await selectRows(0, 1);

              getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

              expect(spec().$container.find('.ht_master tr').length).toBe(3);
              expect(getCell(0, 0)).toBe(null);
              expect(getCell(1, 0)).toBe(null);
              expect(getCell(2, 0).innerText).toBe('A3');
              expect(getCell(3, 0).innerText).toBe('A4');
              expect(getCell(4, 0).innerText).toBe('A5');
            });

            it('hiding from a row "in the middle" to the next row', async() => {
              handsontable({
                data: createSpreadsheetData(5, 5),
                rowHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenRows: true,
              });

              await selectRows(2, 3);

              getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

              expect(spec().$container.find('.ht_master tr').length).toBe(3);
              expect(getCell(0, 0).innerText).toBe('A1');
              expect(getCell(1, 0).innerText).toBe('A2');
              expect(getCell(2, 0)).toBe(null);
              expect(getCell(3, 0)).toBe(null);
              expect(getCell(4, 0).innerText).toBe('A5');
            });

            it('hiding rows at the end', async() => {
              handsontable({
                data: createSpreadsheetData(5, 5),
                rowHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenRows: true,
              });

              await selectRows(3, 4);

              getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

              expect(spec().$container.find('.ht_master tr').length).toBe(3);
              expect(getCell(0, 0).innerText).toBe('A1');
              expect(getCell(1, 0).innerText).toBe('A2');
              expect(getCell(2, 0).innerText).toBe('A3');
              expect(getCell(3, 0)).toBe(null);
              expect(getCell(4, 0)).toBe(null);
            });

            it('hiding all rows', async() => {
              handsontable({
                data: createSpreadsheetData(5, 5),
                rowHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenRows: true,
              });

              await selectRows(0, 4);

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
            it('hiding from row "at the end" to the previous row', async() => {
              handsontable({
                data: createSpreadsheetData(5, 5),
                rowHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenRows: true,
              });

              await selectRows(4, 3);

              getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

              expect(spec().$container.find('.ht_master tr').length).toBe(3);
              expect(getCell(0, 0).innerText).toBe('A1');
              expect(getCell(1, 0).innerText).toBe('A2');
              expect(getCell(2, 0).innerText).toBe('A3');
              expect(getCell(3, 0)).toBe(null);
              expect(getCell(4, 0)).toBe(null);
            });

            it('hiding from a row "in the middle" to the previous row', async() => {
              handsontable({
                data: createSpreadsheetData(5, 5),
                rowHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenRows: true,
              });

              await selectRows(3, 2);

              getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

              expect(spec().$container.find('.ht_master tr').length).toBe(3);
              expect(getCell(0, 0).innerText).toBe('A1');
              expect(getCell(1, 0).innerText).toBe('A2');
              expect(getCell(2, 0)).toBe(null);
              expect(getCell(3, 0)).toBe(null);
              expect(getCell(4, 0).innerText).toBe('A5');
            });

            it('hiding rows at the start', async() => {
              handsontable({
                data: createSpreadsheetData(5, 5),
                rowHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenRows: true,
              });

              await selectRows(1, 0);

              getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

              expect(spec().$container.find('.ht_master tr').length).toBe(3);
              expect(getCell(0, 0)).toBe(null);
              expect(getCell(1, 0)).toBe(null);
              expect(getCell(2, 0).innerText).toBe('A3');
              expect(getCell(3, 0).innerText).toBe('A4');
              expect(getCell(4, 0).innerText).toBe('A5');
            });

            it('hiding all rows', async() => {
              handsontable({
                data: createSpreadsheetData(5, 5),
                rowHeaders: true,
                contextMenu: [CONTEXTMENU_ITEM_HIDE],
                hiddenRows: true,
              });

              await selectRows(4, 0);

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
          it('when there is no hidden row', async() => {
            handsontable({
              data: createSpreadsheetData(5, 2),
              colHeaders: true,
              rowHeaders: true,
              contextMenu: [CONTEXTMENU_ITEM_HIDE],
              hiddenRows: true,
            });

            await selectRows(1, 2);

            getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

            expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,-1 to: 3,1']);
            expect(`
              |   ║ - : - |
              |===:===:===|
              |   ║   :   |
              | * ║ A : 0 |
              |   ║   :   |
            `).toBeMatchToSelectionPattern();
          });

          it('when there are hidden rows', async() => {
            handsontable({
              data: createSpreadsheetData(10, 2),
              colHeaders: true,
              rowHeaders: true,
              contextMenu: [CONTEXTMENU_ITEM_HIDE],
              hiddenRows: {
                rows: [0, 1, 5, 6, 7]
              }
            });

            await selectRows(3, 4);

            getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

            expect(getSelectedRange()).toEqualCellRange(['highlight: 8,0 from: 8,-1 to: 8,1']);
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
          it('there is no hidden row', async() => {
            handsontable({
              data: createSpreadsheetData(5, 2),
              colHeaders: true,
              rowHeaders: true,
              contextMenu: [CONTEXTMENU_ITEM_HIDE],
              hiddenRows: true,
            });

            await selectRows(3, 4);

            getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);
            expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,-1 to: 2,1']);
            expect(`
              |   ║ - : - |
              |===:===:===|
              |   ║   :   |
              |   ║   :   |
              | * ║ A : 0 |
            `).toBeMatchToSelectionPattern();
          });

          it('there are hidden rows', async() => {
            handsontable({
              data: createSpreadsheetData(10, 2),
              colHeaders: true,
              rowHeaders: true,
              contextMenu: [CONTEXTMENU_ITEM_HIDE],
              hiddenRows: {
                rows: [0, 1, 5, 6, 7]
              }
            });

            await selectRows(8, 9);

            getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

            expect(getSelectedRange()).toEqualCellRange(['highlight: 4,0 from: 4,-1 to: 4,1']);
            expect(`
              |   ║ - : - |
              |===:===:===|
              |   ║   :   |
              |   ║   :   |
              | * ║ A : 0 |
            `).toBeMatchToSelectionPattern();
          });
        });

        it('should not preserve selection after hiding all rows', async() => {
          handsontable({
            data: createSpreadsheetData(10, 2),
            colHeaders: true,
            rowHeaders: true,
            contextMenu: [CONTEXTMENU_ITEM_HIDE],
            hiddenRows: {
              rows: [0, 1, 5, 6, 7]
            }
          });

          await selectAll();

          getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_HIDE);

          expect(getSelectedLast()).toBeUndefined();
          expect(`
            |   ║   :   |
            |===:===:===|
          `).toBeMatchToSelectionPattern();
        });
      });

      describe('unhiding', () => {
        it('should unhide hidden rows in selection', async() => {
          handsontable({
            data: createSpreadsheetData(5, 2),
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

          await selectRows(0, 4);

          await contextMenu();
          getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_SHOW);

          expect(spec().$container.find('.ht_master tr').length).toBe(6); // + column header
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(1, 0).innerText).toBe('A2');
          expect(getCell(2, 0).innerText).toBe('A3');
          expect(getCell(3, 0).innerText).toBe('A4');
          expect(getCell(4, 0).innerText).toBe('A5');
          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,-1 to: 4,1']);
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

        it('should unhide hidden rows before the first visible and selected row', async() => {
          handsontable({
            data: createSpreadsheetData(5, 2),
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

          await selectRows(2);

          await contextMenu();
          getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_SHOW);

          expect(spec().$container.find('.ht_master tr').length).toBe(6); // + column header
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(1, 0).innerText).toBe('A2');
          expect(getCell(2, 0).innerText).toBe('A3');
          expect(getCell(3, 0).innerText).toBe('A4');
          expect(getCell(4, 0).innerText).toBe('A5');
          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,-1 to: 2,1']);
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

        it('should unhide hidden rows after the last visible and selected row', async() => {
          handsontable({
            data: createSpreadsheetData(5, 2),
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

          await selectRows(2);

          await contextMenu();
          getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_SHOW);

          expect(spec().$container.find('.ht_master tr').length).toBe(6); // + column header
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(1, 0).innerText).toBe('A2');
          expect(getCell(2, 0).innerText).toBe('A3');
          expect(getCell(3, 0).innerText).toBe('A4');
          expect(getCell(4, 0).innerText).toBe('A5');
          expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,-1 to: 4,1']);
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

        it('should unhide all rows when they had been hidden previously', async() => {
          handsontable({
            data: createSpreadsheetData(5, 2),
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

          const header = getTopInlineStartClone().find('thead th:eq(0)');

          await contextMenu(header);
          getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_SHOW);

          expect(spec().$container.find('.ht_master tr').length).toBe(6); // + column header
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(1, 0).innerText).toBe('A2');
          expect(getCell(2, 0).innerText).toBe('A3');
          expect(getCell(3, 0).innerText).toBe('A4');
          expect(getCell(4, 0).innerText).toBe('A5');
          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,-1 to: 4,1']);
          expect(`
            |   ║ - : - |
            |===:===:===|
            | - ║ A : 0 |
            | - ║ 0 : 0 |
            | - ║ 0 : 0 |
            | - ║ 0 : 0 |
            | - ║ 0 : 0 |
          `).toBeMatchToSelectionPattern();
        });

        it('should unhide all hidden rows when some of the rows was hidden', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
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

          await mouseDown(start);
          await mouseOver(end);
          await mouseUp(end);

          await contextMenu();
          getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_SHOW);

          expect(spec().$container.find('.ht_master tr').length).toBe(4);
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(1, 0).innerText).toBe('A3');
          expect(getCell(2, 0).innerText).toBe('A4');
          expect(getCell(3, 0).innerText).toBe('A5');
          expect(getCell(4, 0)).toBe(null);
          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,-1 to: 2,4']);
          expect(`
            | * ║ A : 0 : 0 : 0 : 0 |
            | * ║ 0 : 0 : 0 : 0 : 0 |
            | * ║ 0 : 0 : 0 : 0 : 0 |
            |   ║   :   :   :   :   |
          `).toBeMatchToSelectionPattern();
        });

        it('should unhide all rows when the hidden row is placed before trimmed row', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
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

          await mouseDown(start);
          await mouseOver(end);
          await mouseUp(end);

          await contextMenu();
          getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_SHOW);

          expect(spec().$container.find('.ht_master tr').length).toBe(4);
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(1, 0).innerText).toBe('A2');
          expect(getCell(2, 0).innerText).toBe('A4');
          expect(getCell(3, 0).innerText).toBe('A5');
          expect(getCell(4, 0)).toBe(null);
          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,-1 to: 2,4']);
          expect(`
            | * ║ A : 0 : 0 : 0 : 0 |
            | * ║ 0 : 0 : 0 : 0 : 0 |
            | * ║ 0 : 0 : 0 : 0 : 0 |
            |   ║   :   :   :   :   |
          `).toBeMatchToSelectionPattern();
        });

        it('should unhide all rows when the hidden row is placed after trimmed row', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
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

          await mouseDown(start);
          await mouseOver(end);
          await mouseUp(end);

          await contextMenu();
          getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_SHOW);

          expect(spec().$container.find('.ht_master tr').length).toBe(4);
          expect(getCell(0, 0).innerText).toBe('A1');
          expect(getCell(1, 0).innerText).toBe('A3');
          expect(getCell(2, 0).innerText).toBe('A4');
          expect(getCell(3, 0).innerText).toBe('A5');
          expect(getCell(4, 0)).toBe(null);
          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,-1 to: 2,4']);
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
          it('when the first row is hidden', async() => {
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

            await simulateClick(header, 'RMB');
            await selectContextMenuOption('Insert column left');

            expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: -1,1 to: 3,1']);
            expect(`
              |   ║   : * :   :   :   |
              |===:===:===:===:===:===|
              | - ║   : A :   :   :   |
              | - ║   : 0 :   :   :   |
              | - ║   : 0 :   :   :   |
            `).toBeMatchToSelectionPattern();
          });

          it('when all rows are hidden', async() => {
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

            await simulateClick(header, 'RMB');
            await selectContextMenuOption('Insert column left');

            expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 3,1']);
            expect(`
              |   ║   : * :   :   :   |
              |===:===:===:===:===:===|
            `).toBeMatchToSelectionPattern();
          });
        });

        describe('below the selected row', () => {
          it('the first row is hidden', async() => {
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

            await simulateClick(header, 'RMB');
            await selectContextMenuOption('Insert column right');

            expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: -1,0 to: 3,0']);
            expect(`
              |   ║ * :   :   :   :   |
              |===:===:===:===:===:===|
              | - ║ A :   :   :   :   |
              | - ║ 0 :   :   :   :   |
              | - ║ 0 :   :   :   :   |
            `).toBeMatchToSelectionPattern();
          });

          it('when all rows are hidden', async() => {
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

            await simulateClick(header, 'RMB');
            await selectContextMenuOption('Insert column right');

            expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,0 to: 3,0']);
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

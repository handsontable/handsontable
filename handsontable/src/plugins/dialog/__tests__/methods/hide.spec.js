describe('Dialog - hide method', () => {
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

  it('should hide dialog when closable is true', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        closable: true,
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);

    dialogPlugin.hide();

    expect(dialogPlugin.isVisible()).toBe(false);
    expect(getDialogContainerElement()).toBeDefined();
  });

  it('should hide dialog when closable is false', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        closable: false,
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);

    dialogPlugin.hide();

    expect(dialogPlugin.isVisible()).toBe(false);
    expect(getDialogContainerElement()).not.toHaveClass('ht-dialog--show');
  });

  it('should not hide dialog when not visible', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        closable: true,
      },
    });

    const dialogPlugin = getPlugin('dialog');

    expect(dialogPlugin.isVisible()).toBe(false);

    dialogPlugin.hide();

    expect(dialogPlugin.isVisible()).toBe(false);
  });

  it('should remove show class when hiding dialog', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        closable: true,
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(getDialogContainerElement()).toHaveClass('ht-dialog--show');

    dialogPlugin.hide();

    expect(getDialogContainerElement()).not.toHaveClass('ht-dialog--show');
  });

  it('should restore selection when dialog is hidden', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      colHeaders: true,
      rowHeaders: true,
      dialog: true,
    });

    await selectRows(2);
    await keyDown('meta');
    await selectColumns(3);
    await keyUp('meta');

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();
    dialogPlugin.hide();

    expect(`
      |   ║ - : - : - : * : - |
      |===:===:===:===:===:===|
      | - ║   :   :   : A :   |
      | - ║   :   :   : 0 :   |
      | * ║ 0 : 0 : 0 : 1 : 0 |
      | - ║   :   :   : 0 :   |
      | - ║   :   :   : 0 :   |
    `).toBeMatchToSelectionPattern();
    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 2,0 from: 2,-1 to: 2,4',
      'highlight: 0,3 from: -1,3 to: 4,3',
    ]);

    await selectCells([[0, 0, 2, 2], [2, 2, 4, 4]]);
    await keyDownUp(['shift', 'tab']); // move focus to the C3

    dialogPlugin.show();
    dialogPlugin.hide();

    expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
      | - ║ 0 : 0 : 0 :   :   |
      | - ║ 0 : 0 : 0 :   :   |
      | - ║ 0 : 0 : B : 0 : 0 |
      | - ║   :   : 0 : 0 : 0 |
      | - ║   :   : 0 : 0 : 0 |
    `).toBeMatchToSelectionPattern();
    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 2,2 from: 0,0 to: 2,2',
      'highlight: 2,2 from: 2,2 to: 4,4',
    ]);
  });
});

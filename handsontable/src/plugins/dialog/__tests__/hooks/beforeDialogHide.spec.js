describe('Dialog - beforeDialogHide hook', () => {
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

  it('should run beforeDialogHide hook', async() => {
    const beforeDialogHideSpy = jasmine.createSpy('beforeDialogHide');

    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        closable: true,
      },
      beforeDialogHide: beforeDialogHideSpy,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();
    dialogPlugin.hide();

    expect(beforeDialogHideSpy).toHaveBeenCalledTimes(1);
  });

  it('should run beforeDialogHide before afterDialogHide', async() => {
    const beforeDialogHideSpy = jasmine.createSpy('beforeDialogHide');
    const afterDialogHideSpy = jasmine.createSpy('afterDialogHide');

    handsontable({
      dialog: {
        closable: true,
      },
      data: createSpreadsheetData(5, 5),
      beforeDialogHide: beforeDialogHideSpy,
      afterDialogHide: afterDialogHideSpy,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();
    dialogPlugin.hide();

    expect(beforeDialogHideSpy).toHaveBeenCalledBefore(afterDialogHideSpy);
  });
});

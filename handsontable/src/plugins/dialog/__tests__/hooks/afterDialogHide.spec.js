describe('Dialog - afterDialogHide hook', () => {
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

  it('should run afterDialogHide hook', async() => {
    const afterDialogHideSpy = jasmine.createSpy('afterDialogHide');

    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        closable: true,
      },
      afterDialogHide: afterDialogHideSpy,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();
    dialogPlugin.hide();

    expect(afterDialogHideSpy).toHaveBeenCalledTimes(1);
  });
});

describe('Dialog - beforeDialogShow hook', () => {
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

  it('should run beforeDialogShow hook', async() => {
    const beforeDialogShowSpy = jasmine.createSpy('beforeDialogShow');

    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
      beforeDialogShow: beforeDialogShowSpy,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test content',
    });

    expect(beforeDialogShowSpy).toHaveBeenCalledTimes(1);
  });

  it('should run beforeDialogShow before afterDialogShow', async() => {
    const beforeDialogShowSpy = jasmine.createSpy('beforeDialogShow');
    const afterDialogShowSpy = jasmine.createSpy('afterDialogShow');

    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
      beforeDialogShow: beforeDialogShowSpy,
      afterDialogShow: afterDialogShowSpy,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(beforeDialogShowSpy).toHaveBeenCalledBefore(afterDialogShowSpy);
  });
});

describe('Dialog - afterDialogShow hook', () => {
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

  it('should run afterDialogShow hook', async() => {
    const afterDialogShowSpy = jasmine.createSpy('afterDialogShow');

    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
      afterDialogShow: afterDialogShowSpy,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test content',
    });

    expect(afterDialogShowSpy).toHaveBeenCalledTimes(1);
  });
});

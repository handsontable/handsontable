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
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      beforeDialogShow: beforeDialogShowSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test content',
    });

    expect(beforeDialogShowSpy).toHaveBeenCalledTimes(1);
  });

  it('should run beforeDialogShow before afterDialogShow', async() => {
    const beforeDialogShowSpy = jasmine.createSpy('beforeDialogShow');
    const afterDialogShowSpy = jasmine.createSpy('afterDialogShow');
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      beforeDialogShow: beforeDialogShowSpy,
      afterDialogShow: afterDialogShowSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show();

    expect(beforeDialogShowSpy).toHaveBeenCalledBefore(afterDialogShowSpy);
  });
});

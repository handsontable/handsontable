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
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: {
        closable: true,
      },
      afterDialogHide: afterDialogHideSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show();
    dialogPlugin.hide();

    expect(afterDialogHideSpy).toHaveBeenCalled();
  });
});

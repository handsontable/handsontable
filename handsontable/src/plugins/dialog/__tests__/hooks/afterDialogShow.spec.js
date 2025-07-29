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
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      afterDialogShow: afterDialogShowSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test content',
    });

    expect(afterDialogShowSpy).toHaveBeenCalledWith({
      content: 'Test content',
      customClassName: '',
      background: 'solid',
      contentBackground: false,
      contentDirections: 'row',
      animation: true,
      closable: false,
    });
  });
});

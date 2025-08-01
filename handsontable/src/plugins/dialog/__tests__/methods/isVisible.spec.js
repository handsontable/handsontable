describe('Dialog - isVisible method', () => {
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

  it('should return false when dialog is not shown', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    expect(dialogPlugin.isVisible()).toBe(false);
  });

  it('should return true when dialog is shown', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
  });

  it('should return false when dialog is hidden', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: {
        closable: true,
      },
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show();
    expect(dialogPlugin.isVisible()).toBe(true);

    dialogPlugin.hide();
    expect(dialogPlugin.isVisible()).toBe(false);
  });

  it('should return false when plugin is disabled', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: false,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    expect(dialogPlugin.isVisible()).toBe(false);
  });
});

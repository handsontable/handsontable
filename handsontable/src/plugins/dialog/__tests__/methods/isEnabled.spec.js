describe('Dialog - isEnabled method', () => {
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

  it('should return false when dialog plugin is disabled', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: false,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    expect(dialogPlugin.isEnabled()).toBe(false);
  });

  it('should return true when dialog option is set to true', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    expect(dialogPlugin.isEnabled()).toBe(true);
  });

  it('should return true when dialog option is set to object', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: {
        content: 'Test dialog',
      },
    });

    const dialogPlugin = hot.getPlugin('dialog');

    expect(dialogPlugin.isEnabled()).toBe(true);
  });

  it('should return false by default when dialog option is not specified', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
    });

    const dialogPlugin = hot.getPlugin('dialog');

    expect(dialogPlugin.isEnabled()).toBe(false);
  });
});

describe('Dialog', () => {
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

  it('should be disabled by default', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
    });

    const dialogPlugin = hot.getPlugin('dialog');

    expect(dialogPlugin.isEnabled()).toBe(false);
  });

  it('should be enabled when dialog option is set to true', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    expect(dialogPlugin.isEnabled()).toBe(true);
  });

  it('should be enabled when dialog option is set to object', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: {
        content: 'Test dialog',
      },
    });

    const dialogPlugin = hot.getPlugin('dialog');

    expect(dialogPlugin.isEnabled()).toBe(true);
  });

  it('should not be visible by default', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    expect(dialogPlugin.isVisible()).toBe(false);
  });

  it('should destroy dialog elements when plugin is destroyed', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test content',
    });

    expect($('.ht-dialog').length).toBe(1);

    destroy();

    expect($('.ht-dialog').length).toBe(0);
  });

  it('should update dialog via updateSettings', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
    });

    await updateSettings({
      dialog: false,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    expect(dialogPlugin.isEnabled()).toBe(false);

    await updateSettings({
      dialog: true,
    });

    expect(dialogPlugin.isEnabled()).toBe(true);
  });
});

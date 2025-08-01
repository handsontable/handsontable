describe('Dialog - animation option', () => {
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

  it('should have animation enabled by default', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.ht-dialog').hasClass('ht-dialog--animation')).toBe(true);
  });

  it('should apply animation when set to true', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: {
        animation: true,
      },
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.ht-dialog').hasClass('ht-dialog--animation')).toBe(true);
  });

  it('should not apply animation when set to false', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: {
        animation: false,
      },
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.ht-dialog').hasClass('ht-dialog--animation')).toBe(false);
  });

  it('should update animation when using show method', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: {
        animation: false,
      },
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      animation: true,
    });

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.ht-dialog').hasClass('ht-dialog--animation')).toBe(true);
  });

  it('should update animation when using update method', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: {
        animation: false,
      },
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show();
    expect($('.ht-dialog').hasClass('ht-dialog--animation')).toBe(false);

    dialogPlugin.update({
      animation: true,
    });

    expect($('.ht-dialog').hasClass('ht-dialog--animation')).toBe(true);
  });

  it('should maintain animation when changing other options', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: {
        animation: false,
        content: 'Initial content',
      },
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show();
    expect($('.ht-dialog').hasClass('ht-dialog--animation')).toBe(false);

    dialogPlugin.update({
      content: 'Updated content',
      background: 'semi-transparent',
    });

    expect($('.ht-dialog').hasClass('ht-dialog--animation')).toBe(false);
    expect($('.ht-dialog .ht-dialog__content').text()).toEqual('Updated content');
  });
});


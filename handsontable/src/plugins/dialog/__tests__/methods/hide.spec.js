describe('Dialog - hide method', () => {
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

  it('should hide dialog when closable is true', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: {
        closable: true,
      },
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);

    dialogPlugin.hide();

    expect(dialogPlugin.isVisible()).toBe(false);
    expect($('.ht-dialog').length).toBe(1);
  });

  it('should not hide dialog when closable is false', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: {
        closable: false,
      },
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);

    dialogPlugin.hide();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.ht-dialog').hasClass('ht-dialog--show')).toBe(true);
  });

  it('should not hide dialog when not visible', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: {
        closable: true,
      },
    });

    const dialogPlugin = hot.getPlugin('dialog');

    expect(dialogPlugin.isVisible()).toBe(false);

    dialogPlugin.hide();

    expect(dialogPlugin.isVisible()).toBe(false);
  });

  it('should remove show class when hiding dialog', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: {
        closable: true,
      },
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show();

    expect($('.ht-dialog').hasClass('ht-dialog--show')).toBe(true);

    dialogPlugin.hide();

    expect($('.ht-dialog').hasClass('ht-dialog--show')).toBe(false);
  });
});

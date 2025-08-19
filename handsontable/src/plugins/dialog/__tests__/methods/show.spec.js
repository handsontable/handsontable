describe('Dialog - show method', () => {
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

  it('should show dialog with default configuration', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.ht-dialog').length).toBe(1);
    expect(dialogPlugin.getSetting()).toEqual({
      content: '',
      customClassName: '',
      background: 'solid',
      contentBackground: false,
      contentDirections: 'row',
      animation: true,
      closable: false,
    });
  });

  it('should show dialog with custom content', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: 'Custom dialog content',
    });

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.ht-dialog .ht-dialog__content').text()).toEqual('Custom dialog content');
  });

  it('should show dialog with HTML content', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: '<h2>Title</h2><p>Paragraph</p>',
    });

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.ht-dialog .ht-dialog__content h2').text()).toBe('Title');
    expect($('.ht-dialog .ht-dialog__content p').text()).toBe('Paragraph');
  });

  it('should not show dialog when plugin is disabled', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: false,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test content',
    });

    expect(dialogPlugin.isVisible()).toBe(false);
    expect($('.ht-dialog').length).toBe(0);
  });

  it('should not show dialog when already visible', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);

    dialogPlugin.show({
      content: 'New content',
    });

    expect(dialogPlugin.isVisible()).toBe(true);
  });

  it('should run beforeDialogShow and afterDialogShow hooks', async() => {
    const beforeDialogShowSpy = jasmine.createSpy('beforeDialogShow');
    const afterDialogShowSpy = jasmine.createSpy('afterDialogShow');

    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      beforeDialogShow: beforeDialogShowSpy,
      afterDialogShow: afterDialogShowSpy,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test content',
    });

    expect(beforeDialogShowSpy).toHaveBeenCalled();
    expect(afterDialogShowSpy).toHaveBeenCalled();
  });

  it('should update the width of the dialog container to the same size as the table', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
      width: 300,
      height: 300,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.ht-dialog').outerWidth()).toBe(hot.view.getWorkspaceWidth());
  });

  it('should deselect all cells when dialog is shown', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: true,
    });

    hot.selectCell(0, 0);

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show();

    expect(hot.getSelected()).toEqual(undefined);
  });
});

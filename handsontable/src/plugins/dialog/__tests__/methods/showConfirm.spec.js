describe('Dialog - showConfirm method', () => {
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

  it('should internally call `show` method with correct configuration (no message)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    spyOn(dialogPlugin, 'show').and.callThrough();

    dialogPlugin.showConfirm();

    expect(dialogPlugin.show).toHaveBeenCalledWith({
      template: {
        type: 'confirm',
        title: 'Confirm',
        description: undefined,
        buttons: [
          { text: 'Cancel', type: 'secondary', callback: jasmine.any(Function) },
          { text: 'OK', type: 'primary', callback: jasmine.any(Function) },
        ],
      },
      contentBackground: true,
      background: 'semi-transparent',
      animation: true,
      closable: false,
    });
  });

  it('should internally call `show` method with correct configuration (message as string)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    spyOn(dialogPlugin, 'show').and.callThrough();

    dialogPlugin.showConfirm('My Confirm');

    expect(dialogPlugin.show).toHaveBeenCalledWith({
      template: {
        type: 'confirm',
        title: 'My Confirm',
        description: undefined,
        buttons: [
          { text: 'Cancel', type: 'secondary', callback: jasmine.any(Function) },
          { text: 'OK', type: 'primary', callback: jasmine.any(Function) },
        ],
      },
      contentBackground: true,
      background: 'semi-transparent',
      animation: true,
      closable: false,
    });
  });

  it('should internally call `show` method with correct configuration (message as object)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    spyOn(dialogPlugin, 'show').and.callThrough();

    dialogPlugin.showConfirm({
      title: 'My Confirm',
      description: 'This is a description',
    });

    expect(dialogPlugin.show).toHaveBeenCalledWith({
      template: {
        type: 'confirm',
        title: 'My Confirm',
        description: 'This is a description',
        buttons: [
          { text: 'Cancel', type: 'secondary', callback: jasmine.any(Function) },
          { text: 'OK', type: 'primary', callback: jasmine.any(Function) },
        ],
      },
      contentBackground: true,
      background: 'semi-transparent',
      animation: true,
      closable: false,
    });
  });

  it('should call the callback when the OK button is clicked', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');
    const okCallback = jasmine.createSpy('callback');
    const cancelCallback = jasmine.createSpy('callback');

    dialogPlugin.showConfirm('My Confirm', okCallback, cancelCallback);

    await simulateClick(getDialogPrimaryButtonElement());

    expect(okCallback).toHaveBeenCalledOnceWith(jasmine.any(MouseEvent));
    expect(cancelCallback).not.toHaveBeenCalled();
  });

  it('should call the callback when the Cancel button is clicked', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');
    const okCallback = jasmine.createSpy('callback');
    const cancelCallback = jasmine.createSpy('callback');

    dialogPlugin.showConfirm('My Confirm', okCallback, cancelCallback);

    await simulateClick(getDialogSecondaryButtonElement());

    expect(okCallback).not.toHaveBeenCalled();
    expect(cancelCallback).toHaveBeenCalledOnceWith(jasmine.any(MouseEvent));
  });
});

describe('Dialog - showAlert method', () => {
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

    dialogPlugin.showAlert();

    expect(dialogPlugin.show).toHaveBeenCalledWith({
      template: {
        type: 'confirm',
        title: 'Alert',
        description: undefined,
        buttons: [{ text: 'OK', type: 'primary', callback: jasmine.any(Function) }],
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

    dialogPlugin.showAlert('My Alert');

    expect(dialogPlugin.show).toHaveBeenCalledWith({
      template: {
        type: 'confirm',
        title: 'My Alert',
        description: undefined,
        buttons: [{ text: 'OK', type: 'primary', callback: jasmine.any(Function) }],
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

    dialogPlugin.showAlert({
      title: 'My Alert',
      description: 'This is a description',
    });

    expect(dialogPlugin.show).toHaveBeenCalledWith({
      template: {
        type: 'confirm',
        title: 'My Alert',
        description: 'This is a description',
        buttons: [{ text: 'OK', type: 'primary', callback: jasmine.any(Function) }],
      },
      contentBackground: true,
      background: 'semi-transparent',
      animation: true,
      closable: false,
    });
  });

  it('should call the callback when the button is clicked', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');
    const callback = jasmine.createSpy('callback');

    dialogPlugin.showAlert('My Alert', callback);

    await simulateClick(getDialogPrimaryButtonElement());

    expect(callback).toHaveBeenCalledOnceWith(jasmine.any(MouseEvent));
  });
});

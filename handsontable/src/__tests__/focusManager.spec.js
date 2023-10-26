describe('Focus Manager', () => {
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

  it('should set it\'s internal `focusMode` property to "cell" after HOT initialization with `imeFastEdit` not' +
    ' defined', () => {
    const hot = handsontable({});

    expect(hot.getFocusManager().getFocusMode()).toEqual('cell');
  });

  it('should set it\'s internal `focusMode` property to "mixed" after HOT initialization with `imeFastEdit` enabled', () => {
    const hot = handsontable({
      imeFastEdit: true,
    });

    expect(hot.getFocusManager().getFocusMode()).toEqual('mixed');
  });

  it('should set it\'s internal `focusMode` property to "mixed" after HOT initialization with `imeFastEdit` disabled', () => {
    const hot = handsontable({
      imeFastEdit: false,
    });

    expect(hot.getFocusManager().getFocusMode()).toEqual('cell');
  });

  it('should update it\'s internal `focusMode` config after calling `updateSettings` containing `imeFastEdit`', () => {
    const hot = handsontable({});

    expect(hot.getFocusManager().getFocusMode()).toEqual('cell');

    updateSettings({
      imeFastEdit: true,
    });

    expect(hot.getFocusManager().getFocusMode()).toEqual('mixed');

    updateSettings({
      imeFastEdit: false,
    });

    expect(hot.getFocusManager().getFocusMode()).toEqual('cell');
  });

  it('should be able to get and set the current `focusMode` with appropriate API options', () => {
    const hot = handsontable({});

    expect(hot.getFocusManager().getFocusMode()).toEqual('cell');

    hot.getFocusManager().setFocusMode('mixed');

    expect(hot.getFocusManager().getFocusMode()).toEqual('mixed');
  });

  it('should display a warning when trying to set an invalid `focusMode`', () => {
    spyOn(console, 'warn');

    const hot = handsontable({});

    hot.getFocusManager().setFocusMode('test');

    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith('"test" is not a valid focus mode.');
  });
});

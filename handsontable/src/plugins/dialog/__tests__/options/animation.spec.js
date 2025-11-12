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

  function getTableTransitionDuration() {
    // the classic stylesheet has no animation duration, so we use 10ms as a fallback
    return spec().loadedTheme !== 'classic' ?
      Number.parseFloat(getComputedStyle(hot().rootElement).getPropertyValue('--ht-table-transition')) * 1000 : 10;
  }

  it('should have animation enabled by default', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContainerElement()).toHaveClass('ht-dialog--animation');
  });

  it('should apply animation when set to true', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        animation: true,
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContainerElement()).toHaveClass('ht-dialog--animation');
  });

  it('should not apply animation when set to false', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        animation: false,
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContainerElement()).not.toHaveClass('ht-dialog--animation');
  });

  it('should update animation when using show method', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        animation: false,
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      animation: true,
    });

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContainerElement()).toHaveClass('ht-dialog--animation');
  });

  it('should update animation when using update method', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        animation: false,
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(getDialogContainerElement()).not.toHaveClass('ht-dialog--animation');

    dialogPlugin.update({
      animation: true,
    });

    expect(getDialogContainerElement()).toHaveClass('ht-dialog--animation');
  });

  it('should maintain animation when changing other options', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        animation: false,
        content: 'Initial content',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(getDialogContainerElement()).not.toHaveClass('ht-dialog--animation');

    dialogPlugin.update({
      content: 'Updated content',
      background: 'semi-transparent',
    });

    expect(getDialogContainerElement()).not.toHaveClass('ht-dialog--animation');
    expect(getDialogContentHTML()).toEqual('Updated content');
  });

  it('should close the dialog when it is opened and closed instantly (animation is disabled)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        animation: false,
        content: 'Test content',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();
    dialogPlugin.hide();

    expect(getDialogContainerElement()).not.toBeVisible();
  });

  it('should close the dialog when it is opened and closed instantly (animation is enabled)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        animation: true,
        content: 'Test content',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();
    dialogPlugin.hide();

    expect(getDialogContainerElement()).not.toBeVisible();
  });

  it('should close the dialog when it is opened and closed faster than the animation duration (animation is enabled)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        animation: true,
        content: 'Test content',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    await sleep(getTableTransitionDuration() / 2);

    dialogPlugin.hide();

    await sleep(getTableTransitionDuration());

    expect(getDialogContainerElement()).not.toBeVisible();
  });

  it('should close the dialog when it is opened and closed a bit longer than the animation duration (animation is enabled)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        animation: true,
        content: 'Test content',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    await sleep(getTableTransitionDuration() * 2);

    dialogPlugin.hide();

    await sleep(getTableTransitionDuration() + 100);

    expect(getDialogContainerElement()).not.toBeVisible();
  });

  it('should open the dialog when it is opened instantly right after it was closed (animation is disabled)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        animation: false,
        content: 'Test content',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();
    dialogPlugin.hide();
    dialogPlugin.show();

    expect(getDialogContainerElement()).toBeVisible();
  });

  it('should open the dialog when it is opened instantly right after it was closed (animation is enabled)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        animation: true,
        content: 'Test content',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();
    dialogPlugin.hide();
    dialogPlugin.show();

    expect(getDialogContainerElement()).toBeVisible();
  });

  it('should open the dialog when it is opened before the previous animation ends (animation is enabled)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        animation: true,
        content: 'Test content',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    await sleep(getTableTransitionDuration() / 2);

    dialogPlugin.hide();

    await sleep(getTableTransitionDuration() / 2);

    dialogPlugin.show();

    expect(getDialogContainerElement()).toBeVisible();
  });

  it('should open the dialog when it is opened a bit after the previous animation ends (animation is enabled)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        animation: true,
        content: 'Test content',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    await sleep(getTableTransitionDuration() * 2);

    dialogPlugin.hide();

    await sleep(getTableTransitionDuration() * 2);

    dialogPlugin.show();

    expect(getDialogContainerElement()).toBeVisible();
  });
});

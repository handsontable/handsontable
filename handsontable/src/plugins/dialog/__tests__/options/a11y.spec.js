describe('Dialog - a11y option', () => {
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

  it('should have default accessibility attributes', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test dialog content',
    });

    const dialogElement = getDialogContainerElement();

    expect(dialogElement.getAttribute('role')).toBe('dialog');
  });

  it('should set custom aria-label', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        a11y: {
          ariaLabel: 'Custom Dialog Label',
        },
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test dialog content',
    });

    const dialogElement = getDialogContainerElement();

    expect(dialogElement.getAttribute('aria-label')).toBe('Custom Dialog Label');
  });

  it('should set custom aria-labelledby', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        a11y: {
          ariaLabelledby: 'dialog-title',
        },
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: '<p id="dialog-title">Dialog Title</p>',
    });

    const dialogElement = getDialogContainerElement();

    expect(dialogElement.getAttribute('aria-labelledby')).toBe('dialog-title');
  });

  it('should set custom aria-describedby', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        a11y: {
          ariaDescribedby: 'dialog-description',
        },
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: '<p id="dialog-description">Dialog Description</p>',
    });

    const dialogElement = getDialogContainerElement();

    expect(dialogElement.getAttribute('aria-describedby')).toBe('dialog-description');
  });

  it('should set role to alertdialog', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        a11y: {
          role: 'alertdialog',
        },
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test dialog content',
    });

    const dialogElement = getDialogContainerElement();

    expect(dialogElement.getAttribute('role')).toBe('alertdialog');
  });

  it('should set role to dialog by default', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        a11y: {
          role: 'dialog',
        },
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test dialog content',
    });

    const dialogElement = getDialogContainerElement();

    expect(dialogElement.getAttribute('role')).toBe('dialog');
  });

  it('should update accessibility attributes when using show method', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: '<p id="dialog-title">Title</p><p id="dialog-description">Description</p>',
      a11y: {
        role: 'alertdialog',
        ariaLabel: 'Dynamic Dialog',
        ariaLabelledby: 'dialog-title',
        ariaDescribedby: 'dialog-description',
      },
    });

    const dialogElement = getDialogContainerElement();

    expect(dialogElement.getAttribute('role')).toBe('alertdialog');
    expect(dialogElement.getAttribute('aria-label')).toBe(null);
    expect(dialogElement.getAttribute('aria-labelledby')).toBe('dialog-title');
    expect(dialogElement.getAttribute('aria-describedby')).toBe('dialog-description');
  });

  it('should update accessibility attributes when using update method', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: '<p id="dialog-title">Title</p><p id="dialog-description">Description</p>',
    });

    dialogPlugin.update({
      a11y: {
        role: 'alertdialog',
        ariaLabel: 'Updated Dialog',
        ariaLabelledby: 'dialog-title',
        ariaDescribedby: 'dialog-description',
      },
    });

    const dialogElement = getDialogContainerElement();

    expect(dialogElement.getAttribute('role')).toBe('alertdialog');
    expect(dialogElement.getAttribute('aria-label')).toBe(null);
    expect(dialogElement.getAttribute('aria-labelledby')).toBe('dialog-title');
    expect(dialogElement.getAttribute('aria-describedby')).toBe('dialog-description');
  });

  it('should remove accessibility attributes when using update method with empty values', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test dialog content',
    });

    dialogPlugin.update({
      a11y: {
        role: 'alertdialog',
        ariaLabel: '',
        ariaLabelledby: '',
        ariaDescribedby: '',
      },
    });

    const dialogElement = getDialogContainerElement();

    expect(dialogElement.getAttribute('role')).toBe('alertdialog');
    expect(dialogElement.getAttribute('aria-label')).toBe(null);
    expect(dialogElement.getAttribute('aria-labelledby')).toBe(null);
    expect(dialogElement.getAttribute('aria-describedby')).toBe(null);
  });

  it('should maintain accessibility attributes when changing other options', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        a11y: {
          role: 'alertdialog',
          ariaLabel: 'Persistent Dialog',
          ariaLabelledby: 'dialog-title',
          ariaDescribedby: 'dialog-description',
        },
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test dialog content',
    });

    dialogPlugin.update({
      content: 'Updated content',
      customClassName: 'custom-class',
    });

    const dialogElement = getDialogContainerElement();

    expect(dialogElement.getAttribute('role')).toBe('alertdialog');
    expect(dialogElement.getAttribute('aria-label')).toBe(null);
    expect(dialogElement.getAttribute('aria-labelledby')).toBe('dialog-title');
    expect(dialogElement.getAttribute('aria-describedby')).toBe('dialog-description');
  });

  it('should override accessibility attributes when using show method', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        a11y: {
          role: 'dialog',
          ariaLabel: 'Initial Label',
          ariaLabelledby: 'dialog-title',
          ariaDescribedby: 'dialog-description',
        },
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test dialog content',
      a11y: {
        role: 'alertdialog',
        ariaLabel: 'Overridden Label',
        ariaLabelledby: 'dialog-title',
        ariaDescribedby: 'dialog-description',
      },
    });

    const dialogElement = getDialogContainerElement();

    expect(dialogElement.getAttribute('role')).toBe('alertdialog');
    expect(dialogElement.getAttribute('aria-label')).toBe(null);
    expect(dialogElement.getAttribute('aria-labelledby')).toBe('dialog-title');
    expect(dialogElement.getAttribute('aria-describedby')).toBe('dialog-description');
  });

  it('should preserve accessibility attributes when dialog is hidden and shown again', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        a11y: {
          role: 'alertdialog',
          ariaLabel: 'Persistent Dialog',
          ariaLabelledby: 'dialog-title',
          ariaDescribedby: 'dialog-description',
        },
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test dialog content',
    });

    dialogPlugin.hide();
    dialogPlugin.show();

    const dialogElement = getDialogContainerElement();

    expect(dialogElement.getAttribute('role')).toBe('alertdialog');
    expect(dialogElement.getAttribute('aria-label')).toBe(null);
    expect(dialogElement.getAttribute('aria-labelledby')).toBe('dialog-title');
    expect(dialogElement.getAttribute('aria-describedby')).toBe('dialog-description');
  });
});

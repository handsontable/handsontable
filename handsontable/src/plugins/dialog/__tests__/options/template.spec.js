describe('Dialog - template option', () => {
  const id = 'testContainer';

  beforeEach(function() {
    spec().matchersConfig = {
      toMatchHTML: {
        keepAttributes: ['class']
      }
    };

    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should throw an error when `template` and `content` are provided together', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        template: {
          type: 'confirm',
          title: 'Confirm',
        },
        content: 'Simple dialog content',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    expect(() => {
      dialogPlugin.show();
    }).toThrowError('The `template` option cannot be used together with the `content` option.');
    expect(() => {
      dialogPlugin.show({
        template: {
          type: 'confirm',
          title: 'Confirm',
        },
        content: 'Simple dialog content',
      });
    }).toThrowError('The `template` option cannot be used together with the `content` option.');
  });

  it('should print a warning when `template` has missing required fields', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        template: {
          type: 'confirm',
        },
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(warnSpy).toHaveBeenCalledWith('Dialog Plugin: "template" option is not valid and it will be ignored.');
  });

  it('should show dialog with custom title', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        template: {
          type: 'confirm',
          title: 'Custom title',
        },
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContentHTML()).toMatchHTML(`
      <div class="ht-dialog__content">
        <h2 class="ht-dialog__title">Custom title</h2>
        <p class="ht-dialog__description"></p>
      </div>
      `);
  });

  it('should show dialog with custom title with stripped HTML parts', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        template: {
          type: 'confirm',
          title: 'Custom title <strong>bold</strong>',
        },
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContentHTML()).toMatchHTML(`
      <div class="ht-dialog__content">
        <h2 class="ht-dialog__title">Custom title bold</h2>
        <p class="ht-dialog__description"></p>
      </div>
      `);
  });

  it('should show dialog with custom description', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        template: {
          type: 'confirm',
          title: 'Custom title',
          description: 'Custom description',
        },
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContentHTML()).toMatchHTML(`
      <div class="ht-dialog__content">
        <h2 class="ht-dialog__title">Custom title</h2>
        <p class="ht-dialog__description">Custom description</p>
      </div>
      `);
  });

  it('should show dialog with custom description with stripped HTML parts', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        template: {
          type: 'confirm',
          title: 'Custom title',
          description: 'Custom description <strong>bold</strong>',
        },
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContentHTML()).toMatchHTML(`
      <div class="ht-dialog__content">
        <h2 class="ht-dialog__title">Custom title</h2>
        <p class="ht-dialog__description">Custom description bold</p>
      </div>
      `);
  });

  it('should show dialog with custom button', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        template: {
          type: 'confirm',
          title: 'Custom title',
          description: 'Custom description',
          buttons: [
            {
              text: 'Custom button',
              type: 'primary',
              callback: () => {},
            },
          ],
        },
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContentHTML()).toMatchHTML(`
      <div class="ht-dialog__content">
        <h2 class="ht-dialog__title">Custom title</h2>
        <p class="ht-dialog__description">Custom description</p>
      </div>
      <div class="ht-dialog__buttons">
        <button class="ht-button ht-button--primary">Custom button</button>
      </div>
      `);
  });

  it('should show dialog with custom button with stripped HTML parts', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        template: {
          type: 'confirm',
          title: 'Custom title',
          description: 'Custom description',
          buttons: [
            {
              text: 'Custom button <strong>bold</strong>',
              type: 'primary',
              callback: () => {},
            },
          ],
        },
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContentHTML()).toMatchHTML(`
      <div class="ht-dialog__content">
        <h2 class="ht-dialog__title">Custom title</h2>
        <p class="ht-dialog__description">Custom description</p>
      </div>
      <div class="ht-dialog__buttons">
        <button class="ht-button ht-button--primary">Custom button bold</button>
      </div>
      `);
  });

  it('should show dialog with custom buttons', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        template: {
          type: 'confirm',
          title: 'Custom title',
          description: 'Custom description',
          buttons: [
            {
              text: 'Custom secondary button',
              type: 'secondary',
              callback: () => {},
            },
            {
              text: 'Custom primary button',
              type: 'primary',
              callback: () => {},
            },
          ],
        },
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContentHTML()).toMatchHTML(`
      <div class="ht-dialog__content">
        <h2 class="ht-dialog__title">Custom title</h2>
        <p class="ht-dialog__description">Custom description</p>
      </div>
      <div class="ht-dialog__buttons">
        <button class="ht-button ht-button--secondary">Custom secondary button</button>
        <button class="ht-button ht-button--primary">Custom primary button</button>
      </div>
      `);
  });

  it('should update dialog with custom title', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        template: {
          type: 'confirm',
          title: 'Initial title',
        },
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();
    dialogPlugin.update({
      template: {
        type: 'confirm',
        title: 'Custom title',
      },
    });

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContentHTML()).toMatchHTML(`
      <div class="ht-dialog__content">
        <h2 class="ht-dialog__title">Custom title</h2>
        <p class="ht-dialog__description"></p>
      </div>
      `);
  });

  it('should update dialog with custom description', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        template: {
          type: 'confirm',
          title: 'Initial title',
          description: 'Initial description',
        },
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();
    dialogPlugin.update({
      template: {
        type: 'confirm',
        title: 'Custom title',
        description: 'Custom description',
      },
    });

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContentHTML()).toMatchHTML(`
      <div class="ht-dialog__content">
        <h2 class="ht-dialog__title">Custom title</h2>
        <p class="ht-dialog__description">Custom description</p>
      </div>
      `);
  });

  it('should update dialog with custom button', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        template: {
          type: 'confirm',
          title: 'Initial title',
          buttons: [
            {
              text: 'Initial button',
              type: 'primary',
              callback: () => {},
            },
          ],
        },
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();
    dialogPlugin.update({
      template: {
        type: 'confirm',
        title: 'Custom title',
        buttons: [
          {
            text: 'Custom button',
            type: 'primary',
            callback: () => {},
          },
        ],
      },
    });

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContentHTML()).toMatchHTML(`
      <div class="ht-dialog__content">
        <h2 class="ht-dialog__title">Custom title</h2>
        <p class="ht-dialog__description"></p>
      </div>
      <div class="ht-dialog__buttons">
        <button class="ht-button ht-button--primary">Custom button</button>
      </div>
      `);
  });

  it('should set default a11y options for the `confirm` template', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        template: {
          type: 'confirm',
          title: 'My title',
          description: 'My description',
          buttons: [
            {
              text: 'OK',
              type: 'primary',
              callback: () => {},
            },
          ],
        },
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(getDialogContainerElement().getAttribute('role')).toBe('alertdialog');
    expect(getDialogContainerElement().getAttribute('aria-labelledby'))
      .toBe(`${hot().guid}-dialog-confirm-title`);
    expect(getDialogContainerElement().getAttribute('aria-describedby'))
      .toBe(`${hot().guid}-dialog-confirm-description`);
    expect(getDialogTitleElement().id).toBe(`${hot().guid}-dialog-confirm-title`);
    expect(getDialogDescriptionElement().id).toBe(`${hot().guid}-dialog-confirm-description`);
  });

  it('should not be possible to override the a11y options for the template', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        template: {
          type: 'confirm',
          title: 'My title',
          description: 'My description',
          buttons: [
            {
              text: 'OK',
              type: 'primary',
              callback: () => {},
            },
          ],
        },
        a11y: {
          role: 'dialog',
          ariaLabelledby: 'custom-dialog-title',
          ariaDescribedby: 'custom-dialog-description',
        },
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(getDialogContainerElement().getAttribute('role')).toBe('alertdialog');
    expect(getDialogContainerElement().getAttribute('aria-labelledby'))
      .toBe(`${hot().guid}-dialog-confirm-title`);
    expect(getDialogContainerElement().getAttribute('aria-describedby'))
      .toBe(`${hot().guid}-dialog-confirm-description`);
    expect(getDialogTitleElement().id).toBe(`${hot().guid}-dialog-confirm-title`);
    expect(getDialogDescriptionElement().id).toBe(`${hot().guid}-dialog-confirm-description`);
  });
});

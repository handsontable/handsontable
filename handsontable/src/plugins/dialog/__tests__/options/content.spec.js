describe('Dialog - content option', () => {
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

  it('should show dialog with empty content by default', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContentHTML()).toEqual('');
  });

  it('should show dialog with string content', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        content: 'Simple dialog content',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContentHTML()).toEqual('Simple dialog content');
  });

  it('should show dialog with HTML content', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        content: '<h2>Title</h2><p>This is a paragraph with <strong>bold</strong> text.</p>',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContentHTML())
      .toEqual('<h2>Title</h2><p>This is a paragraph with <strong>bold</strong> text.</p>');
  });

  it('should show dialog with HTMLElement content', async() => {
    const contentElement = document.createElement('div');

    contentElement.innerHTML = '<span>Custom element content</span>';

    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        content: contentElement,
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(contentElement instanceof HTMLElement).toBe(true);
    expect(getDialogContentHTML()).toEqual('<div><span>Custom element content</span></div>');
  });

  it('should show dialog with DocumentFragment content', async() => {
    const contentElement = document.createDocumentFragment();

    const span = document.createElement('span');

    span.textContent = 'Custom element content';

    contentElement.appendChild(span);

    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        content: contentElement,
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(contentElement instanceof DocumentFragment).toBe(true);
    expect(getDialogContentHTML()).toEqual('<span>Custom element content</span>');
  });

  it('should update content when showing dialog with new content', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        content: 'Initial content',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Updated content',
    });

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContentHTML()).toEqual('Updated content');
  });

  it('should update content when using update method', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        content: 'Initial content',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(getDialogContentHTML()).toEqual('Initial content');

    dialogPlugin.update({
      content: 'Updated content via update method',
    });

    expect(getDialogContentHTML()).toEqual('Updated content via update method');
  });

  it('should handle complex HTML content with multiple elements', async() => {
    const content = `
      <div class="header">
        <h1>Main Title</h1>
        <p class="subtitle">Subtitle text</p>
      </div>
      <div class="body">
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
      </div>
      <div class="footer">
        <button>Action Button</button>
      </div>
    `;

    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        content,
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContentHTML()).toEqual(content.replace(/\n/g, '').trim());
  });

  it('should handle content with special characters', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        content: 'Content with special chars: &lt;&gt;&amp;&quot;&#39;',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContentHTML()).toEqual('Content with special chars: &lt;&gt;&amp;"\'');
  });

  it('should handle very long content', async() => {
    const longContent = 'A'.repeat(1000);

    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        content: longContent,
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContentHTML()).toEqual(longContent);
  });
});

describe('Dialog keyboard shortcut', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      Array.from(document.querySelectorAll('#topInput, #bottomInput'))
        .map(el => el.remove());

      destroy();
      this.$container.remove();
    }
  });

  function createTestInputs() {
    const topInput = $('<input type="text" id="topInput">');
    const bottomInput = $('<input type="text" id="bottomInput">');

    document.body.firstElementChild.before(topInput[0]);
    document.body.lastElementChild.after(bottomInput[0]);

    return {
      topInput,
      bottomInput,
    };
  }

  describe('"Tab"', () => {
    it('should move the focus through the dialog component (no focusable elements inside)', async() => {
      const { topInput, bottomInput } = createTestInputs();

      handsontable({
        data: createSpreadsheetData(10, 10),
        dialog: {
          content: 'Hello',
          animation: false,
        },
      });

      getPlugin('dialog').show();

      await keyDownUp('tab');

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:dialog');
      expect(document.activeElement).toBe(topInput[0]);

      await keyDownUp('tab');

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:dialog');
      expect(document.activeElement).toBe(getDialogFirstFocusCatcherElement());

      await keyDownUp('tab');

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:dialog');
      expect(document.activeElement).toBe(bottomInput[0]);
    });

    it('should move the focus through the dialog component (focusable elements inside)', async() => {
      const { topInput, bottomInput } = createTestInputs();
      const content = `
        <div>
          <h6>Hello world</h6><p>Lorem ipsum</p>
          <button>Close modal</button>
          <input type="text" id="testInput" />
        </div>
      `;

      handsontable({
        data: createSpreadsheetData(10, 10),
        dialog: {
          content,
          animation: false,
        },
      });

      getPlugin('dialog').show();

      await keyDownUp('tab');

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:dialog');
      expect(document.activeElement).toBe(topInput[0]);

      await keyDownUp('tab');

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:dialog');
      expect(document.activeElement).toBe(getDialogFirstFocusCatcherElement());

      await keyDownUp('tab');

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:dialog');
      expect(document.activeElement).toBe(getDialogContentContainerElement().querySelector('button'));

      await keyDownUp('tab');

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:dialog');
      expect(document.activeElement).toBe(getDialogContentContainerElement().querySelector('input'));

      await keyDownUp('tab');

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:dialog');
      expect(document.activeElement).toBe(bottomInput[0]);
    });

    it('should continue moving the focus starting from the clicked element', async() => {
      const { bottomInput } = createTestInputs();
      const content = `
        <div>
          <h6>Hello world</h6><p>Lorem ipsum</p>
          <button>Close modal</button>
          <input type="text" id="testInput" />
        </div>
      `;

      handsontable({
        data: createSpreadsheetData(10, 10),
        dialog: {
          content,
          animation: false,
        },
      });

      getPlugin('dialog').show();

      await simulateClick(getDialogContentContainerElement().querySelector('button'));
      await keyDownUp('tab');

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:dialog');
      expect(document.activeElement).toBe(getDialogContentContainerElement().querySelector('input'));

      await keyDownUp('tab');

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:dialog');
      expect(document.activeElement).toBe(bottomInput[0]);
    });
  });
});

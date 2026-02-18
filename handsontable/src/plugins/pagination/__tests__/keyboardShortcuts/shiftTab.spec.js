describe('Pagination keyboard shortcut', () => {
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

  describe('"Shift" + "Tab"', () => {
    using('configuration object', [
      { uiContainer: null },
      { uiContainer: true },
    ], ({ uiContainer }) => {
      beforeEach(() => {
        if (uiContainer) {
          spec().$container.after('<div id="uiContainer"></div>');
        }
      });

      afterEach(() => {
        if (uiContainer) {
          document.getElementById('uiContainer').remove();
        }
      });

      it('should move the focus through the pagination component when all sections are visible', async() => {
        createTestInputs();

        handsontable({
          data: createSpreadsheetData(10, 3),
          pagination: {
            pageSize: 3,
            initialPage: 2,
            showNavigation: true,
            showPageSize: true,
            showCounter: true,
            uiContainer: uiContainer ? document.getElementById('uiContainer') : null,
          },
        });

        await keyDownUp(['shift', 'tab']);
        await keyDownUp(['shift', 'tab']); // switches focus context to pagination

        const focusableElements = getPaginationFocusableElements().reverse();

        expect(isListening()).toBe(true);
        expect(getShortcutManager().getActiveContextName()).toBe('plugin:pagination');
        expect(focusableElements.length).toBe(5);

        for await (const element of focusableElements) {
          expect(document.activeElement).toBe(element);

          await keyDownUp(['shift', 'tab']);
        }

        expect(isListening()).toBe(true);
        expect(getShortcutManager().getActiveContextName()).toBe('grid');
        expect(getSelectedRange()).toEqualCellRange(['highlight: 5,2 from: 5,2 to: 5,2']);
      });

      it('should move the focus through the pagination component when navigation section is only visible', async() => {
        handsontable({
          data: createSpreadsheetData(10, 5),
          pagination: {
            pageSize: 3,
            showNavigation: true,
            showPageSize: false,
            showCounter: false,
          },
        });

        await keyDownUp(['shift', 'tab']);

        const focusableElements = getPaginationFocusableElements().reverse();

        expect(isListening()).toBe(true);
        expect(getShortcutManager().getActiveContextName()).toBe('plugin:pagination');
        expect(focusableElements.length).toBe(2);

        for await (const element of focusableElements) {
          expect(document.activeElement).toBe(element);

          await keyDownUp(['shift', 'tab']);
        }

        expect(isListening()).toBe(true);
        expect(getShortcutManager().getActiveContextName()).toBe('grid');
        expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: 2,4 to: 2,4']);
      });

      it('should move the focus through the pagination component when page size section is only visible', async() => {
        handsontable({
          data: createSpreadsheetData(10, 5),
          pagination: {
            pageSize: 3,
            showNavigation: false,
            showPageSize: true,
            showCounter: false,
          },
        });

        await keyDownUp(['shift', 'tab']);

        const focusableElements = getPaginationFocusableElements().reverse();

        expect(isListening()).toBe(true);
        expect(getShortcutManager().getActiveContextName()).toBe('plugin:pagination');
        expect(focusableElements.length).toBe(1);

        for await (const element of focusableElements) {
          expect(document.activeElement).toBe(element);

          await keyDownUp(['shift', 'tab']);
        }

        expect(isListening()).toBe(true);
        expect(getShortcutManager().getActiveContextName()).toBe('grid');
        expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: 2,4 to: 2,4']);
      });

      it('should move the focus through the pagination component when all focusable sections are hidden', async() => {
        handsontable({
          data: createSpreadsheetData(10, 5),
          pagination: {
            pageSize: 3,
            showNavigation: false,
            showPageSize: false,
            showCounter: true,
          },
        });

        await keyDownUp(['shift', 'tab']);

        expect(isListening()).toBe(true);
        expect(getShortcutManager().getActiveContextName()).toBe('grid');
        expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: 2,4 to: 2,4']);
      });

      it('should skip focusing the pagination component when all sections are hidden', async() => {
        handsontable({
          data: createSpreadsheetData(10, 5),
          pagination: {
            pageSize: 3,
            showNavigation: false,
            showPageSize: false,
            showCounter: false,
          },
        });

        await keyDownUp(['shift', 'tab']);

        expect(isListening()).toBe(true);
        expect(getShortcutManager().getActiveContextName()).toBe('grid');
        expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: 2,4 to: 2,4']);
      });
    });

    it('should move the focus through the pagination when the element within is clicked', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        pagination: {
          pageSize: 3,
          initialPage: 3,
        },
      });

      await simulateClick(getPaginationPagePrevButton());

      expect(isListening()).toBe(true);
      expect(getShortcutManager().getActiveContextName()).toBe('plugin:pagination');

      await keyDownUp(['shift', 'tab']);

      expect(document.activeElement).toBe(getPaginationPageFirstButton());

      await keyDownUp(['shift', 'tab']);

      expect(document.activeElement).toBe(getPaginationPagePageSizeSelect());

      await keyDownUp(['shift', 'tab']);

      expect(isListening()).toBe(true);
      expect(getShortcutManager().getActiveContextName()).toBe('grid');
      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,9 from: 5,9 to: 5,9']);
    });

    describe('cooperation with Dialog plugin', () => {
      it('should move the focus through the grid component (dialog is hidden)', async() => {
        const { topInput, bottomInput } = createTestInputs();

        handsontable({
          data: createSpreadsheetData(10, 10),
          dialog: true,
          pagination: {
            pageSize: 3,
          },
          tabNavigation: false,
        });

        bottomInput.focus();

        await keyDownUp(['shift', 'tab']);

        const focusableElements = getPaginationFocusableElements().reverse();

        expect(isListening()).toBe(true);
        expect(getShortcutManager().getActiveContextName()).toBe('plugin:pagination');
        expect(focusableElements.length).toBe(3);

        for await (const element of focusableElements) {
          expect(document.activeElement).toBe(element);

          await keyDownUp(['shift', 'tab']);
        }

        expect(getShortcutManager().getActiveContextName()).toBe('grid');

        await keyDownUp(['shift', 'tab']);

        expect(isListening()).toBe(false);
        expect(getShortcutManager().getActiveContextName()).toBe('grid');
        expect(document.activeElement).toBe(topInput[0]);
      });

      it('should move the focus through the grid component (dialog is hidden and initialized later)', async() => {
        const { topInput, bottomInput } = createTestInputs();

        handsontable({
          data: createSpreadsheetData(10, 10),
          pagination: {
            pageSize: 3,
          },
          tabNavigation: false,
        });

        await updateSettings({
          dialog: true,
        });

        bottomInput.focus();

        await keyDownUp(['shift', 'tab']);

        const focusableElements = getPaginationFocusableElements().reverse();

        expect(isListening()).toBe(true);
        expect(getShortcutManager().getActiveContextName()).toBe('plugin:pagination');
        expect(focusableElements.length).toBe(3);

        for await (const element of focusableElements) {
          expect(document.activeElement).toBe(element);

          await keyDownUp(['shift', 'tab']);
        }

        expect(getShortcutManager().getActiveContextName()).toBe('grid');

        await keyDownUp(['shift', 'tab']);

        expect(isListening()).toBe(false);
        expect(getShortcutManager().getActiveContextName()).toBe('grid');
        expect(document.activeElement).toBe(topInput[0]);
      });

      it('should move the focus through the grid component (dialog is opened)', async() => {
        const { topInput, bottomInput } = createTestInputs();

        handsontable({
          data: createSpreadsheetData(10, 10),
          dialog: {
            content: 'test',
            animation: false,
            background: 'semi-transparent',
          },
          pagination: {
            pageSize: 3,
          },
          tabNavigation: false,
        });

        getPlugin('dialog').show();
        bottomInput.focus();

        await keyDownUp(['shift', 'tab']);

        expect(getShortcutManager().getActiveContextName()).toBe('plugin:dialog');
        expect(document.activeElement).toBe(getDialogLastFocusCatcherElement());

        await keyDownUp(['shift', 'tab']);

        expect(isListening()).toBe(false);
        expect(getShortcutManager().getActiveContextName()).toBe('plugin:dialog');
        expect(document.activeElement).toBe(topInput[0]);
      });

      it('should move the focus through the grid component (dialog is opened and initialized later)', async() => {
        const { topInput, bottomInput } = createTestInputs();

        handsontable({
          data: createSpreadsheetData(10, 10),
          pagination: {
            pageSize: 3,
          },
          tabNavigation: false,
        });

        await updateSettings({
          dialog: {
            content: 'test',
            animation: false,
            background: 'semi-transparent',
          },
        });

        getPlugin('dialog').show();
        bottomInput.focus();

        await keyDownUp(['shift', 'tab']);

        expect(getShortcutManager().getActiveContextName()).toBe('plugin:dialog');
        expect(document.activeElement).toBe(getDialogLastFocusCatcherElement());

        await keyDownUp(['shift', 'tab']);

        expect(isListening()).toBe(false);
        expect(getShortcutManager().getActiveContextName()).toBe('plugin:dialog');
        expect(document.activeElement).toBe(topInput[0]);
      });

      it('should move the focus through the grid component (dialog is opened and pagination UI is detached)', async() => {
        const { topInput, bottomInput } = createTestInputs();

        spec().$container.after('<div><br/><div id="uiContainer"></div></div>');

        handsontable({
          data: createSpreadsheetData(10, 10),
          dialog: {
            content: 'Hello! <button id="okButton">Ok</button> <button id="cancelButton">Cancel</button>',
            animation: false,
            background: 'semi-transparent',
            closable: true,
          },
          pagination: {
            pageSize: 3,
            uiContainer: document.getElementById('uiContainer'),
          },
          tabNavigation: false,
        });

        getPlugin('dialog').show();
        bottomInput.focus();

        await keyDownUp(['shift', 'tab']);

        const focusableElements = getPaginationFocusableElements().reverse();

        expect(isListening()).toBe(true);
        expect(getShortcutManager().getActiveContextName()).toBe('plugin:pagination');
        expect(focusableElements.length).toBe(3);

        for await (const element of focusableElements) {
          expect(document.activeElement).toBe(element);

          await keyDownUp(['shift', 'tab']);
        }

        expect(getShortcutManager().getActiveContextName()).toBe('plugin:dialog');
        expect(document.activeElement).toBe(getDialogLastFocusCatcherElement());

        await keyDownUp(['shift', 'tab']);

        expect(getShortcutManager().getActiveContextName()).toBe('plugin:dialog');
        expect(document.activeElement).toBe(getDialogContentContainerElement().querySelector('#cancelButton'));

        await keyDownUp(['shift', 'tab']);

        expect(getShortcutManager().getActiveContextName()).toBe('plugin:dialog');
        expect(document.activeElement).toBe(getDialogContentContainerElement().querySelector('#okButton'));

        await keyDownUp(['shift', 'tab']);

        expect(isListening()).toBe(false);
        expect(getShortcutManager().getActiveContextName()).toBe('plugin:dialog');
        expect(document.activeElement).toBe(topInput[0]);

        document.getElementById('uiContainer').parentElement.remove();
      });
    });
  });
});

describe('EmptyDataState keyboard shortcut', () => {
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
    it('should move the focus through the emptyDataState component (no focusable elements inside, no headers)', async() => {
      const { topInput, bottomInput } = createTestInputs();

      handsontable({
        data: [[]],
        emptyDataState: true,
      });

      await keyDownUp(['shift', 'tab']);

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:emptyDataState');
      expect(document.activeElement).toBe(bottomInput[0]);

      await keyDownUp(['shift', 'tab']);

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:emptyDataState');
      expect(document.activeElement).toBe(getEmptyDataStateContentElement());

      await keyDownUp(['shift', 'tab']);

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:emptyDataState');
      expect(document.activeElement).toBe(topInput[0]);
    });

    it('should move the focus through the emptyDataState component (no focusable elements inside, with headers)', async() => {
      const { topInput, bottomInput } = createTestInputs();

      handsontable({
        data: [[]],
        emptyDataState: true,
        navigableHeaders: true,
        colHeaders: true,
        rowHeaders: true,
      });

      await keyDownUp(['shift', 'tab']);

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:emptyDataState');
      expect(document.activeElement).toBe(bottomInput[0]);

      await keyDownUp(['shift', 'tab']);

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:emptyDataState');
      expect(document.activeElement).toBe(getEmptyDataStateContentElement());

      await keyDownUp(['shift', 'tab']);

      expect(getShortcutManager().getActiveContextName()).toBe('grid');
      expect(document.activeElement).toBe(getCell(0, -1, true));

      await keyDownUp(['shift', 'tab']);

      expect(getShortcutManager().getActiveContextName()).toBe('grid');
      expect(document.activeElement).toBe(topInput[0]);
    });

    it('should move the focus through the emptyDataState component (focusable elements inside, no headers)', async() => {
      const { topInput, bottomInput } = createTestInputs();

      handsontable({
        data: createSpreadsheetData(10, 10),
        emptyDataState: true,
        filters: true,
      });

      getPlugin('filters').addCondition(1, 'eq', ['John']); // filter all rows
      getPlugin('filters').filter();

      await keyDownUp(['shift', 'tab']);

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:emptyDataState');
      expect(document.activeElement).toBe(bottomInput[0]);

      await keyDownUp(['shift', 'tab']);

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:emptyDataState');
      expect(document.activeElement).toBe(getEmptyDataStateButtonElement());

      await keyDownUp(['shift', 'tab']);

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:emptyDataState');
      expect(document.activeElement).toBe(topInput[0]);
    });

    it('should move the focus through the emptyDataState component (focusable elements inside, with headers)', async() => {
      const { topInput, bottomInput } = createTestInputs();

      handsontable({
        data: createSpreadsheetData(10, 10),
        emptyDataState: true,
        filters: true,
        navigableHeaders: true,
        tabNavigation: false,
        colHeaders: true,
        rowHeaders: true,
      });

      getPlugin('filters').addCondition(1, 'eq', ['John']); // filter all rows
      getPlugin('filters').filter();

      await keyDownUp(['shift', 'tab']);

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:emptyDataState');
      expect(document.activeElement).toBe(bottomInput[0]);

      await keyDownUp(['shift', 'tab']);

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:emptyDataState');
      expect(document.activeElement).toBe(getEmptyDataStateButtonElement());

      await keyDownUp(['shift', 'tab']);

      expect(getShortcutManager().getActiveContextName()).toBe('grid');
      expect(document.activeElement).toBe(getCell(-1, 9, true));

      await keyDownUp(['shift', 'tab']);

      expect(getShortcutManager().getActiveContextName()).toBe('grid');
      expect(document.activeElement).toBe(topInput[0]);
    });

    it('should activate the overlay first, when the corner is only rendered (no data, navigableHeaders is disabled)', async() => {
      createTestInputs();

      handsontable({
        data: createSpreadsheetData(0, 0),
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: false,
        emptyDataState: true,
      });

      await keyDownUp(['shift', 'tab']); // focused bottom input

      expect(isListening()).toBe(false);

      await keyDownUp(['shift', 'tab']);

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:emptyDataState');
      expect(document.activeElement).toBe(getEmptyDataStateContentElement());

      await keyDownUp(['shift', 'tab']); // focused top input

      expect(getSelectedRange()).toBeUndefined();
      expect(isListening()).toBe(false);
    });

    it('should activate the overlay first, when the corner is only rendered (no data, navigableHeaders is enabled)', async() => {
      createTestInputs();

      handsontable({
        data: createSpreadsheetData(0, 0),
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
        emptyDataState: true,
      });

      await keyDownUp(['shift', 'tab']); // focused bottom input

      expect(isListening()).toBe(false);

      await keyDownUp(['shift', 'tab']);

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:emptyDataState');
      expect(document.activeElement).toBe(getEmptyDataStateContentElement());

      await keyDownUp(['shift', 'tab']); // focused top input

      expect(getSelectedRange()).toBeUndefined();
      expect(isListening()).toBe(false);
    });
  });
});

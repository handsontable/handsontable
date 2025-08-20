
describe('Dialog Plugin - Editor Interactions', () => {
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

  describe('AutocompleteEditor', () => {
    it('should close autocomplete editor when dialog is shown', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        dialog: true,
        columns: [
          { type: 'autocomplete', source: ['Option 1', 'Option 2', 'Option 3'] },
          { type: 'text' }
        ],
      });

      const dialogPlugin = getPlugin('dialog');

      await selectCell(0, 0);
      await keyDown('enter');

      expect(getActiveEditor()._opened).toBe(true);

      dialogPlugin.show({
        content: 'Test dialog content',
        closable: true,
        animation: false,
      });

      expect(getActiveEditor()._opened).toBe(false);
      expect(dialogPlugin.isVisible()).toBe(true);
    });
  });

  describe('DateEditor', () => {
    it('should close date editor when dialog is shown', async() => {
      handsontable({
        data: [['2023-01-01', 'B1'], ['2023-01-02', 'B2']],
        dialog: true,
        columns: [
          { type: 'date', dateFormat: 'YYYY-MM-DD' },
          { type: 'text' }
        ],
      });

      const dialogPlugin = getPlugin('dialog');

      await selectCell(0, 0);
      await keyDown('enter');

      expect(getActiveEditor()._opened).toBe(true);

      dialogPlugin.show({
        content: 'Test dialog content',
        closable: true,
      });

      expect(getActiveEditor()._opened).toBe(false);
      expect(dialogPlugin.isVisible()).toBe(true);
    });
  });

  describe('HandsontableEditor', () => {
    it('should close handsontable editor when dialog is shown', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        dialog: true,
        columns: [
          {
            type: 'handsontable',
            handsontable: {
              data: [['Sub A1', 'Sub B1'], ['Sub A2', 'Sub B2']],
              colHeaders: ['Col 1', 'Col 2'],
              rowHeaders: false
            }
          },
          { type: 'text' }
        ],
      });

      const dialogPlugin = getPlugin('dialog');

      await selectCell(0, 0);
      await keyDown('enter');

      expect(getActiveEditor()._opened).toBe(true);

      dialogPlugin.show({
        content: 'Test dialog content',
        closable: true,
      });

      expect(getActiveEditor()._opened).toBe(false);
      expect(dialogPlugin.isVisible()).toBe(true);
    });
  });

  describe('Multiple Editors', () => {
    it('should close all open editors when dialog is shown', async() => {
      handsontable({
        data: [['A1', '2023-01-01', 'C1'], ['A2', '2023-01-02', 'C2']],
        dialog: true,
        columns: [
          { type: 'autocomplete', source: ['Option 1', 'Option 2', 'Option 3'] },
          { type: 'date', dateFormat: 'YYYY-MM-DD' },
          {
            type: 'handsontable',
            handsontable: {
              data: [['Sub A1', 'Sub B1'], ['Sub A2', 'Sub B2']],
              colHeaders: ['Col 1', 'Col 2'],
              rowHeaders: false
            }
          }
        ],
      });

      const dialogPlugin = getPlugin('dialog');

      await selectCell(0, 0);
      await keyDown('enter');

      expect(getActiveEditor()._opened).toBe(true);

      await selectCell(0, 1);
      await keyDown('enter');

      expect(getActiveEditor()._opened).toBe(true);

      await selectCell(0, 2);
      await keyDown('enter');

      expect(getActiveEditor()._opened).toBe(true);

      dialogPlugin.show({
        content: 'Test dialog content',
        closable: true,
      });

      expect(getActiveEditor()._opened).toBe(false);
      expect(dialogPlugin.isVisible()).toBe(true);
    });
  });
});

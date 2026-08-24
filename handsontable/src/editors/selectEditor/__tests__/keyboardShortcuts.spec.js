describe('keyboard navigation', () => {
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

  describe('"Tab"', () => {
    it('should select the next cell when the editor is opened in full edit mode triggered by Enter', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        type: 'select',
      });

      await selectCell(1, 1);
      await keyDownUp('enter');
      await keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 1,2']);
    });

    it('should select the next cell when the editor is opened in fast edit mode triggered by Space', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        type: 'select',
      });

      await selectCell(1, 1);
      await keyDownUp('space');
      await keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 1,2']);
    });
  });

  describe('"Shift + Tab"', () => {
    it('should select the previous cell when the editor is opened in full edit mode triggered by Enter', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        type: 'select',
      });

      await selectCell(1, 1);
      await keyDownUp('enter');
      await keyDownUp(['shift', 'tab']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);
    });

    it('should select the previous cell when the editor is opened in fast edit mode triggered by Space', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        type: 'select',
      });

      await selectCell(1, 1);
      await keyDownUp('space');
      await keyDownUp(['shift', 'tab']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);
    });
  });

  describe('"ArrowUp"', () => {
    it('should select the previous option when the editor is opened in full edit mode', async() => {
      handsontable({
        data: [['Kia'], ['Nissan'], ['Toyota']],
        columns: [{
          type: 'select',
          selectOptions: ['Kia', 'Nissan', 'Toyota', 'Honda', 'Mazda'],
        }],
      });

      await selectCell(1, 0);
      await keyDownUp('enter');
      await keyDownUp('arrowup');

      expect(getActiveEditor().select.value).toBe('Kia');
    });

    it('should not change the option when the first option is already selected', async() => {
      handsontable({
        data: [['Kia'], ['Nissan'], ['Toyota']],
        columns: [{
          type: 'select',
          selectOptions: ['Kia', 'Nissan', 'Toyota', 'Honda', 'Mazda'],
        }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await keyDownUp('arrowup');

      expect(getActiveEditor().select.value).toBe('Kia');
    });
  });

  describe('"ArrowDown"', () => {
    it('should select the next option when the editor is opened in full edit mode', async() => {
      handsontable({
        data: [['Kia'], ['Nissan'], ['Toyota']],
        columns: [{
          type: 'select',
          selectOptions: ['Kia', 'Nissan', 'Toyota', 'Honda', 'Mazda'],
        }],
      });

      await selectCell(1, 0);
      await keyDownUp('enter');
      await keyDownUp('arrowdown');

      expect(getActiveEditor().select.value).toBe('Toyota');
    });

    it('should not change the option when the last option is already selected', async() => {
      handsontable({
        data: [['Kia'], ['Nissan'], ['Mazda']],
        columns: [{
          type: 'select',
          selectOptions: ['Kia', 'Nissan', 'Toyota', 'Honda', 'Mazda'],
        }],
      });

      await selectCell(2, 0);
      await keyDownUp('enter');
      await keyDownUp('arrowdown');

      expect(getActiveEditor().select.value).toBe('Mazda');
    });
  });
});

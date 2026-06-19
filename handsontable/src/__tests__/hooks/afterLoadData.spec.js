describe('Hook', () => {
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

  describe('afterLoadData', () => {
    it('should not throw when setSourceDataAtCell() is called inside the hook during init', async() => {
      expect(() => {
        handsontable({
          data: [['a', 'b'], ['c', 'd']],
          afterLoadData() {
            this.setSourceDataAtCell(0, 0, 'x');
          },
        });
      }).not.toThrow();
    });

    it('should update the source data when setSourceDataAtCell() is called inside the hook during init', async() => {
      handsontable({
        data: [['a', 'b'], ['c', 'd']],
        afterLoadData() {
          this.setSourceDataAtCell(0, 0, 'modified');
        },
      });

      expect(getDataAtCell(0, 0)).toBe('modified');
    });

    it('should allow getActiveEditor() to return undefined safely during init phase', async() => {
      let editorDuringInit;

      handsontable({
        data: createSpreadsheetData(3, 3),
        afterLoadData() {
          editorDuringInit = this.getActiveEditor();
        },
      });

      expect(editorDuringInit).toBeUndefined();
    });

    it('should return the active editor after init completes and a cell is selected', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(3, 3),
      });

      await selectCell(0, 0);

      const editor = hot.getActiveEditor();

      expect(editor).toBeDefined();
    });

    it('should not throw when setSourceDataAtCell() is called inside afterLoadData during loadData', async() => {
      const hot = handsontable({
        data: [['a', 'b'], ['c', 'd']],
      });

      expect(() => {
        hot.addHook('afterLoadData', function() {
          this.setSourceDataAtCell(0, 0, 'updated');
        });
        hot.loadData([['p', 'q'], ['r', 's']]);
      }).not.toThrow();
    });
  });
});

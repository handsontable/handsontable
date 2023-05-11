describe('Focus handling', () => {
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

  describe('`imeFastEdit` disabled (default behavior)', () => {
    it('should disable the `imeFastEdit` option by default', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
      });

      expect(hot.getSettings().imeFastEdit).toBe(false);
    });

    it('should focus the browser on the last selection\'s `highlight` cell element after selection', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
      });

      expect(document.activeElement).toEqual(document.body);

      hot.selectCell(2, 2);

      expect(document.activeElement).toEqual(hot.getCell(2, 2, true));

      hot.selectCells([[1, 1, 3, 3]]);

      expect(document.activeElement).toEqual(hot.getCell(
        hot.getSelectedRangeLast().highlight.row,
        hot.getSelectedRangeLast().highlight.col,
        true
      ));

      hot.selectCells([[1, 1, 3, 3], [4, 4, 2, 2]]);

      expect(document.activeElement).toEqual(hot.getCell(
        hot.getSelectedRangeLast().highlight.row,
        hot.getSelectedRangeLast().highlight.col,
        true
      ));
    });
  });

  describe('`imeFastEdit` enabled', () => {
    it('should refocus the browser on the active editor\'s `TEXTAREA` element after a delay specified in the focus' +
      ' manager', async() => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        imeFastEdit: true,
      });

      expect(document.activeElement).toEqual(document.body);

      hot.selectCell(2, 2);

      expect(document.activeElement).toEqual(hot.getCell(
        hot.getSelectedRangeLast().highlight.row,
        hot.getSelectedRangeLast().highlight.col,
        true
      ));

      await sleep(hot.getFocusManager().getRefocusDelay());

      expect(document.activeElement).toEqual(hot.getActiveEditor().TEXTAREA);

      hot.selectCells([[1, 1, 3, 3], [4, 4, 2, 2]]);

      expect(document.activeElement).toEqual(hot.getCell(
        hot.getSelectedRangeLast().highlight.row,
        hot.getSelectedRangeLast().highlight.col,
        true
      ));

      await sleep(hot.getFocusManager().getRefocusDelay());

      expect(document.activeElement).toEqual(hot.getActiveEditor().TEXTAREA);
    });

    it('should not refocus the browser if the active editor doesn\'t contain a `TEXTAREA` element', async() => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        imeFastEdit: true,
        type: 'checkbox'
      });

      expect(document.activeElement).toEqual(document.body);

      hot.selectCell(2, 2);

      expect(document.activeElement).toEqual(hot.getCell(
        hot.getSelectedRangeLast().highlight.row,
        hot.getSelectedRangeLast().highlight.col,
        true
      ));

      await sleep(hot.getFocusManager().getRefocusDelay());

      expect(document.activeElement).toEqual(hot.getCell(
        hot.getSelectedRangeLast().highlight.row,
        hot.getSelectedRangeLast().highlight.col,
        true
      ));
    });

    it('should be possible to force refocusing on a different element than active editor\'s `TEXTAREA` by providing' +
      ' a refocus element getter', async() => {

      class CustomEditor extends Handsontable.editors.TextEditor {
        createElements() {
          super.createElements();

          this.TEXTAREA_ALTERNATIVE = this.hot.rootDocument.createElement('input');
          this.TEXTAREA_PARENT.appendChild(this.TEXTAREA_ALTERNATIVE);
        }
      }

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        imeFastEdit: true,
        editor: CustomEditor
      });

      expect(document.activeElement).toEqual(document.body);

      hot.getFocusManager().setRefocusElementGetter(() => hot.getActiveEditor().TEXTAREA_ALTERNATIVE);

      hot.selectCell(2, 2);

      expect(document.activeElement).toEqual(hot.getCell(
        hot.getSelectedRangeLast().highlight.row,
        hot.getSelectedRangeLast().highlight.col,
        true
      ));

      await sleep(hot.getFocusManager().getRefocusDelay());

      expect(document.activeElement).toEqual(hot.getActiveEditor().TEXTAREA_ALTERNATIVE);
    });

    it('should be possible to modify the delay between refocusing the elements', async() => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        imeFastEdit: true,
      });

      const defaultDelay = hot.getFocusManager().getRefocusDelay();

      hot.getFocusManager().setRefocusDelay(defaultDelay * 2);

      expect(document.activeElement).toEqual(document.body);

      hot.selectCell(2, 2);

      expect(document.activeElement).toEqual(hot.getCell(
        hot.getSelectedRangeLast().highlight.row,
        hot.getSelectedRangeLast().highlight.col,
        true
      ));

      await sleep(defaultDelay);

      expect(document.activeElement).toEqual(hot.getCell(
        hot.getSelectedRangeLast().highlight.row,
        hot.getSelectedRangeLast().highlight.col,
        true
      ));

      await sleep(defaultDelay);

      expect(document.activeElement).toEqual(hot.getActiveEditor().TEXTAREA);
    });
  });
});

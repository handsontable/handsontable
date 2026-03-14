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
    it('should disable the `imeFastEdit` option by default', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      expect(getSettings().imeFastEdit).toBe(false);
    });

    it('should focus the browser on the last selection\'s `highlight` cell/header element after selection', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        navigableHeaders: true,
        rowHeaders: true,
        colHeaders: true
      });

      expect(document.activeElement).toEqual(document.body);

      await selectCell(2, 2);

      expect(document.activeElement).toEqual(getCell(2, 2, true));

      await selectCells([[1, 1, 3, 3]]);

      expect(document.activeElement).toEqual(getCell(
        getSelectedRangeLast().highlight.row,
        getSelectedRangeLast().highlight.col,
        true
      ));

      await selectCells([[1, 1, 3, 3], [4, 4, 2, 2]]);

      expect(document.activeElement).toEqual(getCell(
        getSelectedRangeLast().highlight.row,
        getSelectedRangeLast().highlight.col,
        true
      ));

      await selectCells([[0, -1, 0, -1]]);

      expect(document.activeElement).toEqual(getCell(
        getSelectedRangeLast().highlight.row,
        getSelectedRangeLast().highlight.col,
        true
      ));

      await selectCells([[-1, 0, -1, 0]]);

      expect(document.activeElement).toEqual(getCell(
        getSelectedRangeLast().highlight.row,
        getSelectedRangeLast().highlight.col,
        true
      ));
    });

    it('should focus the correct TD element after changing the focus position within a range', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        navigableHeaders: true,
        rowHeaders: true,
        colHeaders: true
      });

      expect(document.activeElement).toEqual(document.body);

      await selectCells([[1, 1, 3, 3]]);

      selection().setRangeFocus(cellCoords(2, 2));

      expect(document.activeElement).toEqual(getCell(
        getSelectedRangeLast().highlight.row,
        getSelectedRangeLast().highlight.col,
        true
      ));

      selection().transformFocus(1, 1);

      expect(document.activeElement).toEqual(getCell(
        getSelectedRangeLast().highlight.row,
        getSelectedRangeLast().highlight.col,
        true
      ));
    });

    it('should correctly focus the cell element that was previously not rendered in the viewport', async() => {
      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 100,
        height: 100,
        rowHeaders: true,
        colHeaders: true
      });

      expect(document.activeElement).toEqual(document.body);

      await selectCell(90, 40);

      expect(document.activeElement).toEqual(getCell(
        getSelectedRangeLast().highlight.row,
        getSelectedRangeLast().highlight.col,
        true
      ));
    });
  });

  describe('`imeFastEdit` enabled', () => {
    it('should refocus the browser on the active editor\'s `TEXTAREA` element after a delay specified in the focus' +
      ' manager', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        imeFastEdit: true,
      });

      expect(document.activeElement).toEqual(document.body);

      await selectCell(2, 2);

      expect(document.activeElement).toEqual(getCell(
        getSelectedRangeLast().highlight.row,
        getSelectedRangeLast().highlight.col,
        true
      ));

      await sleep(getFocusManager().getRefocusDelay());

      expect(document.activeElement).toEqual(getActiveEditor().TEXTAREA);

      await selectCells([[1, 1, 3, 3], [4, 4, 2, 2]]);

      expect(document.activeElement).toEqual(getCell(
        getSelectedRangeLast().highlight.row,
        getSelectedRangeLast().highlight.col,
        true
      ));

      await sleep(getFocusManager().getRefocusDelay());

      expect(document.activeElement).toEqual(getActiveEditor().TEXTAREA);
    });

    it('should not refocus the browser if the active editor doesn\'t contain a `TEXTAREA` element', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        imeFastEdit: true,
        type: 'checkbox'
      });

      expect(document.activeElement).toEqual(document.body);

      await selectCell(2, 2);

      expect(document.activeElement).toEqual(getCell(
        getSelectedRangeLast().highlight.row,
        getSelectedRangeLast().highlight.col,
        true
      ));

      await sleep(getFocusManager().getRefocusDelay());

      expect(document.activeElement).toEqual(getCell(
        getSelectedRangeLast().highlight.row,
        getSelectedRangeLast().highlight.col,
        true
      ));
    });

    it('should not refocus the browser if the selected element is a header', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        navigableHeaders: true,
        rowHeaders: true,
        colHeaders: true,
        imeFastEdit: true,
      });

      expect(document.activeElement).toEqual(document.body);

      await selectCell(0, -1);

      expect(document.activeElement).toEqual(getCell(
        getSelectedRangeLast().highlight.row,
        getSelectedRangeLast().highlight.col,
        true
      ));

      await sleep(getFocusManager().getRefocusDelay());

      expect(document.activeElement).toEqual(getCell(
        getSelectedRangeLast().highlight.row,
        getSelectedRangeLast().highlight.col,
        true
      ));

      await selectCell(-1, 0);

      expect(document.activeElement).toEqual(getCell(
        getSelectedRangeLast().highlight.row,
        getSelectedRangeLast().highlight.col,
        true
      ));

      await sleep(getFocusManager().getRefocusDelay());

      expect(document.activeElement).toEqual(getCell(
        getSelectedRangeLast().highlight.row,
        getSelectedRangeLast().highlight.col,
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

      handsontable({
        data: createSpreadsheetData(10, 10),
        imeFastEdit: true,
        editor: CustomEditor
      });

      expect(document.activeElement).toEqual(document.body);

      getFocusManager().setRefocusElementGetter(() => getActiveEditor().TEXTAREA_ALTERNATIVE);

      await selectCell(2, 2);

      expect(document.activeElement).toEqual(getCell(
        getSelectedRangeLast().highlight.row,
        getSelectedRangeLast().highlight.col,
        true
      ));

      await sleep(getFocusManager().getRefocusDelay());

      expect(document.activeElement).toEqual(getActiveEditor().TEXTAREA_ALTERNATIVE);
    });

    it('should be possible to modify the delay between refocusing the elements', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        imeFastEdit: true,
      });

      const defaultDelay = getFocusManager().getRefocusDelay();

      getFocusManager().setRefocusDelay(defaultDelay * 2);

      expect(document.activeElement).toEqual(document.body);

      await selectCell(2, 2);

      expect(document.activeElement).toEqual(getCell(
        getSelectedRangeLast().highlight.row,
        getSelectedRangeLast().highlight.col,
        true
      ));

      await sleep(defaultDelay);

      expect(document.activeElement).toEqual(getCell(
        getSelectedRangeLast().highlight.row,
        getSelectedRangeLast().highlight.col,
        true
      ));

      await sleep(defaultDelay);

      expect(document.activeElement).toEqual(getActiveEditor().TEXTAREA);
    });

    it('should not throw an error after scrolling the viewport (#dev-2163)', async() => {
      const spy = jasmine.createSpyObj('error', ['test']);
      const prevError = window.onerror;

      window.onerror = function() {
        spy.test();

        return true;
      };

      handsontable({
        data: createSpreadsheetData(100, 100),
        colHeaders: true,
        width: 100,
        height: 100,
        imeFastEdit: true,
      });

      await selectColumns(0);
      await scrollViewportTo({ row: 99 });
      await selectColumns(90);

      expect(spy.test.calls.count()).toBe(0);

      window.onerror = prevError;
    });
  });
});

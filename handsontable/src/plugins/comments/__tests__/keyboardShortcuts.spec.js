describe('Comments keyboard shortcut', () => {
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

  describe('"Ctrl" + "Alt" + "M"', () => {
    it('should open and create a new comment, make it active, and ready for typing', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        rowHeaders: true,
        colHeaders: true,
        comments: true,
      });

      await selectCell(1, 1);
      await keyDownUp(['control', 'alt', 'm']);
      await sleep(10);

      const plugin = getPlugin('comments');
      const editor = plugin.getEditorInputElement();

      expect(editor.parentNode.style.display).toBe('block');
      expect(editor.value).toBe('');
      expect(document.activeElement).toBe(editor);
      expect(plugin.range).toEqualCellRange('highlight: 1,1 from: 1,1 to: 1,1');

      await keyDownUp(['m']); // typing printable characters should not trigger cell editor

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:comments');
      expect(document.activeElement).toBe(editor);
    });

    it('should open and create a new comment for different focus position in different selection layer', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        comments: true,
      });

      await selectCells([
        [1, 1, 2, 2],
        [3, 3, 4, 5],
        [6, 6, 6, 6],
      ]);

      await keyDownUp('enter'); // moves focus to the next selection layer
      await keyDownUp(['control', 'alt', 'm']);
      await sleep(10);

      const plugin = getPlugin('comments');
      const editor = plugin.getEditorInputElement();

      expect(editor.parentNode.style.display).toBe('block');
      expect(editor.value).toBe('');
      expect(document.activeElement).toBe(editor);
      expect(plugin.range).toEqualCellRange('highlight: 1,1 from: 1,1 to: 2,2');

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:comments');
      expect(document.activeElement).toBe(editor);

      await keyDownUp('escape');

      await keyDownUp('enter');
      await keyDownUp('enter');
      await keyDownUp('enter');
      await keyDownUp('enter'); // moves focus to the next selection layer
      await keyDownUp('enter');
      await keyDownUp('enter');
      await keyDownUp('enter'); // places the focus in the middle of the selection range

      await keyDownUp(['control', 'alt', 'm']);
      await sleep(10);

      expect(plugin.range).toEqualCellRange('highlight: 4,4 from: 3,3 to: 4,5');
      expect(getShortcutManager().getActiveContextName()).toBe('plugin:comments');
      expect(document.activeElement).toBe(editor);
    });

    it('should scroll the viewport, open and create a new comment when the focused cell is outside the table', async() => {
      handsontable({
        data: createSpreadsheetData(500, 50),
        width: 300,
        height: 300,
        colWidths: 50,
        rowHeaders: true,
        colHeaders: true,
        comments: true,
      });

      await selectCell(400, 40);
      await scrollViewportTo({
        row: 0,
        col: 0,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      await keyDownUp(['control', 'alt', 'm']);

      const plugin = getPlugin('comments');
      const editor = plugin.getEditorInputElement();

      expect(editor.parentNode.style.display).toBe('block');
      expect(editor.value).toBe('');
      expect(document.activeElement).toBe(editor);
      expect(plugin.range).toEqualCellRange('highlight: 400,40 from: 400,40 to: 400,40');

      // 2050 column width - 250 viewport width + 15 scrollbar compensation + 1 header border compensation
      expect(inlineStartOverlay().getScrollPosition()).toBe(1816);
      expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(8966);
        main.toBe(11375);
        horizon.toBe(14591);
      });
    });

    it('should open and edit a comment, make it active, and ready for typing', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        rowHeaders: true,
        colHeaders: true,
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'Hello world!' } }
        ],
      });

      await selectCell(1, 1);
      await keyDownUp(['control', 'alt', 'm']);
      await sleep(10);

      const plugin = getPlugin('comments');
      const editor = plugin.getEditorInputElement();

      expect(editor.parentNode.style.display).toBe('block');
      expect(editor.value).toBe('Hello world!');
      expect(document.activeElement).toBe(editor);
      expect(plugin.range).toEqualCellRange('highlight: 1,1 from: 1,1 to: 1,1');

      await keyDownUp(['m']); // typing printable characters should not trigger cell editor

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:comments');
      expect(document.activeElement).toBe(editor);
    });

    it('should refocus the comment for the cell with already opened a comment', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        rowHeaders: true,
        colHeaders: true,
        comments: {
          displayDelay: 10
        },
        cell: [
          { row: 1, col: 1, comment: { value: 'Hello world!' } }
        ],
      });

      await selectCell(1, 1);

      $(getCell(1, 1)).simulate('mouseover', {
        clientX: Handsontable.dom.offset(getCell(1, 1)).left + 5,
        clientY: Handsontable.dom.offset(getCell(1, 1)).top + 5,
      });

      await sleep(50);
      await keyDownUp(['control', 'alt', 'm']);
      await sleep(10);

      const plugin = getPlugin('comments');
      const editor = plugin.getEditorInputElement();

      expect(editor.parentNode.style.display).toBe('block');
      expect(document.activeElement).toBe(editor);
    });

    it('should open the comment when the multiple cells are selected', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        rowHeaders: true,
        colHeaders: true,
        comments: true,
      });

      await selectCells([[3, 3, 2, 1]]);
      await keyDownUp(['control', 'alt', 'm']);
      await sleep(10);

      const plugin = getPlugin('comments');
      const editor = plugin.getEditorInputElement();

      expect(editor.parentNode.style.display).toBe('block');
      expect(editor.value).toBe('');
      expect(document.activeElement).toBe(editor);
      expect(plugin.range).toEqualCellRange('highlight: 3,3 from: 3,3 to: 2,1');

      await keyDownUp(['m']); // typing printable characters should not trigger cell editor

      expect(getShortcutManager().getActiveContextName()).toBe('plugin:comments');
      expect(document.activeElement).toBe(editor);
    });

    it('should not open the comment when the column header is selected', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        comments: true,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(-1, 1);
      await keyDownUp(['control', 'alt', 'm']);
      await sleep(10);

      const plugin = getPlugin('comments');
      const editor = plugin.getEditorInputElement();

      expect(editor.parentNode.style.display).toBe('none');
      expect(document.activeElement).not.toBe(editor);
      expect(getShortcutManager().getActiveContextName()).toBe('grid');
    });

    it('should not open the comment when the row header is selected', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        comments: true,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(1, -1);
      await keyDownUp(['control', 'alt', 'm']);
      await sleep(10);

      const plugin = getPlugin('comments');
      const editor = plugin.getEditorInputElement();

      expect(editor.parentNode.style.display).toBe('none');
      expect(document.activeElement).not.toBe(editor);
      expect(getShortcutManager().getActiveContextName()).toBe('grid');
    });

    it('should not open the comment when the corner header is selected', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        comments: true,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(-1, -1);
      await keyDownUp(['control', 'alt', 'm']);

      await sleep(10);

      const plugin = getPlugin('comments');
      const editor = plugin.getEditorInputElement();

      expect(editor.parentNode.style.display).toBe('none');
      expect(document.activeElement).not.toBe(editor);
      expect(getShortcutManager().getActiveContextName()).toBe('grid');
    });
  });

  describe('"Cmd/Ctrl" + "Enter"', () => {
    it('should close the comment and save the value (comment opened by keyboard shortcut)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        rowHeaders: true,
        colHeaders: true,
        comments: true,
      });

      await selectCell(1, 1);
      await keyDownUp(['control', 'alt', 'm']);
      await sleep(10);

      getPlugin('comments').getEditorInputElement().value = 'Test comment';

      await keyDownUp(['control/meta', 'enter']);
      await sleep(50);

      expect(getCellMeta(1, 1).comment.value).toBe('Test comment');
    });

    it('should close the comment and save the value (comment opened by keyboard shortcut) - multiple cells', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        comments: true,
      });

      await selectCells([
        [1, 1, 2, 2],
        [3, 3, 4, 5],
        [6, 6, 6, 6],
      ]);

      await keyDownUp('enter');
      await keyDownUp('enter');
      await keyDownUp('enter');
      await keyDownUp('enter');
      await keyDownUp('enter');
      await keyDownUp('enter');
      await keyDownUp('enter');
      await keyDownUp('enter');
      await keyDownUp(['control', 'alt', 'm']);
      await sleep(10);

      getPlugin('comments').getEditorInputElement().value = 'Test comment';

      await keyDownUp(['control/meta', 'enter']);
      await sleep(50);

      expect(getCellMeta(4, 4).comment.value).toBe('Test comment');
    });

    it('should close the comment and save the value (comment opened through the context menu)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        rowHeaders: true,
        colHeaders: true,
        comments: true,
        contextMenu: true,
      });

      await selectCell(1, 1);
      await contextMenu();
      await selectContextMenuOption('Add comment');

      getPlugin('comments').getEditorInputElement().value = 'Test comment';

      await deselectCell();
      await keyDownUp(['control/meta', 'enter']);
      await sleep(50);

      expect(getCellMeta(1, 1).comment.value).toBe('Test comment');
    });
  });

  describe('"Escape"', () => {
    it('should close the comment without saving the value (a new comment)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        rowHeaders: true,
        colHeaders: true,
        comments: true,
      });

      await selectCell(1, 1);
      await keyDownUp(['escape']);

      getPlugin('comments').getEditorInputElement().value = 'Test comment';

      await keyDownUp(['control/meta', 'enter']);
      await sleep(50);

      expect(getCellMeta(1, 1).comment).toBeUndefined();
    });

    it('should close the comment without saving the value (edit a comment)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        rowHeaders: true,
        colHeaders: true,
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'Hello world!' } }
        ],
      });

      await selectCell(1, 1);
      await keyDownUp(['escape']);

      getPlugin('comments').getEditorInputElement().value = 'Test comment';

      await keyDownUp(['control/meta', 'enter']);
      await sleep(50);

      expect(getCellMeta(1, 1).comment.value).toBe('Hello world!');
    });
  });

  describe('"TAB"', () => {
    it('should close the comment, save the value and move the selection to the next cell (grid default for TAB)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        rowHeaders: true,
        colHeaders: true,
        comments: true,
      });

      await selectCell(1, 1);
      await keyDownUp(['control', 'alt', 'm']);
      await sleep(50);

      const plugin = getPlugin('comments');
      const commentsInput = plugin.getEditorInputElement();

      expect(commentsInput.parentNode.style.display).toEqual('block');

      commentsInput.value = 'Test comment';

      await keyDownUp(['TAB']);
      await sleep(50);

      expect(getCellMeta(1, 1).comment).toEqual({ value: 'Test comment' });
      expect(commentsInput.parentNode.style.display).toEqual('none');
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 1,2']);
      expect(document.activeElement).toBe(getCell(1, 2));
    });

    it('should close the comment, save the value and move the selection to the next cell (grid default for TAB) - multiple cells', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        comments: true,
      });

      await selectCells([
        [1, 1, 2, 3],
        [3, 3, 4, 5],
        [6, 6, 6, 6],
      ]);

      await keyDownUp('tab');
      await keyDownUp('tab');
      await keyDownUp('tab');
      await keyDownUp('tab');
      await keyDownUp('tab'); // select C3
      await keyDownUp(['control', 'alt', 'm']);
      await sleep(50);

      const plugin = getPlugin('comments');
      const commentsInput = plugin.getEditorInputElement();

      expect(commentsInput.parentNode.style.display).toEqual('block');

      commentsInput.value = 'Test comment';

      await keyDownUp(['tab']);
      await sleep(50);

      expect(getCellMeta(2, 2).comment).toEqual({ value: 'Test comment' });
      expect(commentsInput.parentNode.style.display).toEqual('none');
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 2,3 from: 1,1 to: 2,3',
        'highlight: 3,3 from: 3,3 to: 4,5',
        'highlight: 6,6 from: 6,6 to: 6,6',
      ]);
      expect(document.activeElement).toBe(getCell(2, 3));
    });
  });

  describe('"Shift + TAB"', () => {
    it('should close the comment, save the value and move the selection to the previous cell (grid default for TAB)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        rowHeaders: true,
        colHeaders: true,
        comments: true,
      });

      await selectCell(1, 1);
      await keyDownUp(['control', 'alt', 'm']);
      await sleep(50);

      const plugin = getPlugin('comments');
      const commentsInput = plugin.getEditorInputElement();

      expect(commentsInput.parentNode.style.display).toEqual('block');
      commentsInput.value = 'Test comment';

      await keyDownUp(['SHIFT', 'TAB']);
      await sleep(50);

      expect(getCellMeta(1, 1).comment).toEqual({ value: 'Test comment' });
      expect(commentsInput.parentNode.style.display).toEqual('none');
      expect(getSelectedLast()).toEqual([1, 0, 1, 0]);
      expect(document.activeElement).toBe(getCell(1, 0));
    });

    it('should close the comment, save the value and move the selection to the previous cell (grid default for TAB) - multiple cells', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        comments: true,
      });

      await selectCells([
        [1, 1, 2, 3],
        [3, 3, 4, 5],
        [6, 6, 6, 6],
      ]);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // select E5
      await keyDownUp(['control', 'alt', 'm']);
      await sleep(50);

      const plugin = getPlugin('comments');
      const commentsInput = plugin.getEditorInputElement();

      expect(commentsInput.parentNode.style.display).toEqual('block');

      commentsInput.value = 'Test comment';

      await keyDownUp(['shift', 'tab']);
      await sleep(50);

      expect(getCellMeta(4, 4).comment).toEqual({ value: 'Test comment' });
      expect(commentsInput.parentNode.style.display).toEqual('none');
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 1,1 from: 1,1 to: 2,3',
        'highlight: 4,3 from: 3,3 to: 4,5',
        'highlight: 6,6 from: 6,6 to: 6,6',
      ]);
      expect(document.activeElement).toBe(getCell(4, 3));
    });
  });
});

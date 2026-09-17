describe('TextEditor keyboard shortcut', () => {
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

  describe('"Home"', () => {
    it('should move the caret position to the beginning of the line', async() => {
      handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const editorElement = getActiveEditor().TEXTAREA;

      Handsontable.dom.setCaretPosition(editorElement, 2);

      await keyDownUp('home');

      expect(Handsontable.dom.getCaretPosition(editorElement)).toBe(0);
    });
  });

  describe('"End"', () => {
    it('should move the caret position to the end of the line', async() => {
      handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const editorElement = getActiveEditor().TEXTAREA;

      Handsontable.dom.setCaretPosition(editorElement, 2);

      await keyDownUp('end');

      expect(Handsontable.dom.getCaretPosition(editorElement)).toBe(8);
    });
  });

  describe('"Enter + Alt"', () => {
    it('should exceed the editor height only for one line', async() => {
      handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await keyDownUp(['alt', 'enter']);

      const editorTextarea = getActiveEditor().TEXTAREA;
      const editorComputedStyle = getComputedStyle(editorTextarea);
      const editorTextareaLineHeight = parseInt(editorComputedStyle.lineHeight, 10);
      const editorTextareaTopPadding = parseInt(editorComputedStyle.paddingTop, 10);
      const editorTextareaBottomPadding = parseInt(editorComputedStyle.paddingBottom, 10);
      const editorTextareaHeight = parseInt(editorComputedStyle.height, 10);

      expect(editorTextareaHeight).toBe(
        (2 * editorTextareaLineHeight)
        + editorTextareaTopPadding
        + editorTextareaBottomPadding
        - 1 // Subtracted by the `autoResize` plugin, not sure why.
      );
    });
  });

  describe('"Enter + Control"', () => {
    it('should exceed the editor height only for one line', async() => {
      handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await keyDownUp(['control', 'enter']);

      const editorTextarea = getActiveEditor().TEXTAREA;
      const editorComputedStyle = getComputedStyle(editorTextarea);
      const editorTextareaLineHeight = parseInt(editorComputedStyle.lineHeight, 10);
      const editorTextareaPaddingTop = parseInt(editorComputedStyle.paddingTop, 10);
      const editorTextareaPaddingBottom = parseInt(editorComputedStyle.paddingBottom, 10);
      const editorTextareaHeight = parseInt(editorComputedStyle.height, 10);

      expect(editorTextareaHeight).toBe(
        (2 * editorTextareaLineHeight)
        + editorTextareaPaddingTop
        + editorTextareaPaddingBottom
        - 1 // Subtracted by the `autoResize` plugin, not sure why.
      );
    });
  });

  describe('"Enter + Command"', () => {
    it('should exceed the editor height only for one line', async() => {
      handsontable({
        data: [
          ['Maserati', 'Mazda'],
          ['Honda', 'Mini']
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await keyDownUp(['meta', 'enter']);

      const editorTextarea = getActiveEditor().TEXTAREA;
      const editorComputedStyle = getComputedStyle(editorTextarea);
      const editorTextareaLineHeight = parseInt(editorComputedStyle.lineHeight, 10);
      const editorTextareaPaddingTop = parseInt(editorComputedStyle.paddingTop, 10);
      const editorTextareaPaddingBottom = parseInt(editorComputedStyle.paddingBottom, 10);
      const editorTextareaHeight = parseInt(editorComputedStyle.height, 10);

      expect(editorTextareaHeight).toBe(
        (2 * editorTextareaLineHeight)
        + editorTextareaPaddingTop
        + editorTextareaPaddingBottom
        - 1 // Subtracted by the `autoResize` plugin, not sure why.
      );
    });

    it('should do nothing when no selection is present', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await listen();
      await keyDownUp(['meta', 'enter']);

      expect(getSelectedRange()).toBeUndefined();
      expect(getActiveEditor()).toBeUndefined();
    });
  });

  // The chord is answered by three gates that each used to read only the ACTIVE selection layer, so
  // a second layer was invisible to all of them: the editor's insert-a-line-break shortcut, the
  // unchanged-edit guard in `finishEditing()`, and `saveValue()` itself (DEV-103).
  //
  // `Enter` cannot open the editor here - over several layers it moves the focus between them
  // instead - so these open with `F2`, which has no such rule.
  describe('"Enter + Control/Meta" over more than one selection layer', () => {
    it('should populate the edited value into every layer, not only the active one', async() => {
      handsontable({
        data: createSpreadsheetData(6, 6),
      });

      await selectCells([[0, 0, 1, 1], [3, 3, 4, 4]]);
      await keyDownUp('f2');

      getActiveEditor().setValue('filled');

      await keyDownUp(['control/meta', 'enter']);

      expect(getDataAtCell(0, 0)).toBe('filled');
      expect(getDataAtCell(0, 1)).toBe('filled');
      expect(getDataAtCell(1, 0)).toBe('filled');
      expect(getDataAtCell(1, 1)).toBe('filled');
      expect(getDataAtCell(3, 3)).toBe('filled');
      expect(getDataAtCell(3, 4)).toBe('filled');
      expect(getDataAtCell(4, 3)).toBe('filled');
      expect(getDataAtCell(4, 4)).toBe('filled');
      // A cell between the two layers must not be dragged into the fill.
      expect(getDataAtCell(2, 2)).toBe('C3');
    });

    it('should populate every layer when the active layer holds a single cell', async() => {
      handsontable({
        data: createSpreadsheetData(6, 6),
      });

      await selectCells([[0, 0, 1, 1], [4, 4, 4, 4]]);
      await keyDownUp('f2');

      getActiveEditor().setValue('filled');

      await keyDownUp(['control/meta', 'enter']);

      // The active layer is single, but the other layer still has cells to fill - so the chord is a
      // population, not a line break, and the editor closes instead of staying open with a `\n`.
      expect(isEditorVisible()).toBe(false);
      expect(getDataAtCell(0, 0)).toBe('filled');
      expect(getDataAtCell(0, 1)).toBe('filled');
      expect(getDataAtCell(1, 0)).toBe('filled');
      expect(getDataAtCell(1, 1)).toBe('filled');
      expect(getDataAtCell(4, 4)).toBe('filled');
      // The layers survive the save. `moveSelectionAfterEnter()` used to ask the active layer alone
      // whether the selection was multiple, and a single-cell active layer sent it down the branch
      // that lays a fresh selection - silently discarding A1:B2.
      expect(getSelectedRange().length).toBe(2);
    });

    it('should keep every selection layer after the fill', async() => {
      handsontable({
        data: createSpreadsheetData(6, 6),
      });

      await selectCells([[0, 0, 1, 1], [3, 3, 4, 4]]);
      await keyDownUp('f2');

      getActiveEditor().setValue('filled');

      await keyDownUp(['control/meta', 'enter']);

      expect(getSelectedRange().length).toBe(2);
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 1,1',
        'highlight: 4,3 from: 3,3 to: 4,4',
      ]);
    });

    it('should translate a merged cell in a layer other than the active one', async() => {
      handsontable({
        data: createSpreadsheetData(6, 6),
        mergeCells: [{ row: 3, col: 3, rowspan: 2, colspan: 2 }],
      });

      await selectCells([[3, 3, 4, 4], [0, 0, 0, 1]]);
      await keyDownUp('f2');

      getActiveEditor().setValue('filled');

      await keyDownUp(['control/meta', 'enter']);

      // The merged area reports its parent's coordinates, so each layer needs its own translation.
      // Translating once for the whole call would describe only whichever layer came first.
      expect(getDataAtCell(3, 3)).toBe('filled');
      expect(getDataAtCell(0, 0)).toBe('filled');
      expect(getDataAtCell(0, 1)).toBe('filled');
    });

    it('should not overwrite a cell whose value is an object', async() => {
      handsontable({
        data: [
          ['A1', 'B1'],
          [{ id: 1, label: 'kept' }, 'B2'],
        ],
        renderer(instance, td, row, col, prop, value) {
          td.textContent = value && typeof value === 'object' ? value.label : value;
        },
      });

      await selectCell(0, 0, 1, 1);
      await keyDownUp('f2');

      getActiveEditor().setValue('filled');

      await keyDownUp(['control/meta', 'enter']);

      // A cell holding an object holds a record a renderer displays, not a displayable value, so a
      // typed string must not replace it - the rule `populateFromArray()` applies at `core.ts`. The
      // rest of the selection still fills.
      expect(getDataAtCell(1, 0)).toEqual({ id: 1, label: 'kept' });
      expect(getDataAtCell(0, 0)).toBe('filled');
      expect(getDataAtCell(0, 1)).toBe('filled');
      expect(getDataAtCell(1, 1)).toBe('filled');
    });

    it('should insert a line break when every other selected cell is read-only', async() => {
      handsontable({
        data: createSpreadsheetData(6, 6),
        cell: [
          { row: 3, col: 3, readOnly: true },
          { row: 3, col: 4, readOnly: true },
          { row: 4, col: 3, readOnly: true },
          { row: 4, col: 4, readOnly: true },
        ],
      });

      // The editable cell is selected last, so it is the one the editor opens on.
      await selectCells([[3, 3, 4, 4], [0, 0, 0, 0]]);
      await keyDownUp('f2');
      await keyDownUp(['control/meta', 'enter']);

      // A second layer that offers no writable cell is not "other cells to fill". Counting layers
      // instead would close the editor here and write nothing.
      expect(isEditorVisible()).toBe(true);
      expect(getActiveEditor().getValue()).toBe('A1\n');
      expect(getDataAtCell(3, 3)).toBe('D4');
    });

    it('should revert the whole fill with a single undo step', async() => {
      handsontable({
        data: createSpreadsheetData(6, 6),
      });

      await selectCells([[0, 0, 1, 1], [3, 3, 4, 4]]);
      await keyDownUp('f2');

      getActiveEditor().setValue('filled');

      await keyDownUp(['control/meta', 'enter']);

      // Asserted before the undo on purpose: without it this test passes on a grid that filled only
      // the active layer, because a layer that was never written reverts to its original value on
      // its own.
      expect(getDataAtCell(0, 0)).toBe('filled');
      expect(getDataAtCell(4, 4)).toBe('filled');

      await keyDownUp(['control/meta', 'z']);

      // One gesture is one undo step. Filling the layers one call at a time would leave the first
      // layer still holding `filled` here.
      expect(getDataAtCell(0, 0)).toBe('A1');
      expect(getDataAtCell(1, 1)).toBe('B2');
      expect(getDataAtCell(3, 3)).toBe('D4');
      expect(getDataAtCell(4, 4)).toBe('E5');
    });

    it('should skip a `readOnly` cell and fill the rest of the layers', async() => {
      handsontable({
        data: createSpreadsheetData(6, 6),
        cell: [{ row: 0, col: 1, readOnly: true }],
      });

      await selectCells([[0, 0, 1, 1], [3, 3, 4, 4]]);
      await keyDownUp('f2');

      getActiveEditor().setValue('filled');

      await keyDownUp(['control/meta', 'enter']);

      expect(getDataAtCell(0, 1)).toBe('B1');
      expect(getDataAtCell(0, 0)).toBe('filled');
      expect(getDataAtCell(1, 1)).toBe('filled');
      expect(getDataAtCell(3, 3)).toBe('filled');
    });

    it('should write a cell shared by two layers only once', async() => {
      let editChangesCount = null;

      handsontable({
        data: createSpreadsheetData(6, 6),
        afterChange(changes, source) {
          if (source === 'edit') {
            editChangesCount = changes.length;
          }
        },
      });

      // The layers overlap on B2 - four cells each, seven distinct cells between them.
      await selectCells([[0, 0, 1, 1], [1, 1, 2, 2]]);
      await keyDownUp('f2');

      getActiveEditor().setValue('filled');

      await keyDownUp(['control/meta', 'enter']);

      expect(editChangesCount).toBe(7);
      expect(getDataAtCell(1, 1)).toBe('filled');
    });

    it('should still fill a single multi-cell layer', async() => {
      handsontable({
        data: createSpreadsheetData(6, 6),
      });

      await selectCell(0, 0, 1, 1);
      await keyDownUp('f2');

      getActiveEditor().setValue('filled');

      await keyDownUp(['control/meta', 'enter']);

      expect(getDataAtCell(0, 0)).toBe('filled');
      expect(getDataAtCell(0, 1)).toBe('filled');
      expect(getDataAtCell(1, 0)).toBe('filled');
      expect(getDataAtCell(1, 1)).toBe('filled');
      expect(getDataAtCell(0, 2)).toBe('C1');
    });

    it('should insert a line break when the only selected cell is a merged one', async() => {
      handsontable({
        data: createSpreadsheetData(6, 6),
        mergeCells: [{ row: 1, col: 1, rowspan: 2, colspan: 2 }],
      });

      await selectCell(1, 1);
      await keyDownUp('enter');
      await keyDownUp(['control/meta', 'enter']);

      // A merged area is ONE cell to the user, so this fills nothing and the chord keeps its
      // line-break meaning. Reading the area's own covered cells as "other cells to fill" closed the
      // editor and wrote the value into cells the merge hides.
      expect(isEditorVisible()).toBe(true);
      expect(getActiveEditor().getValue()).toBe('B2\n');
      // The covered cells hold `null` because merging clears them, and they must stay that way. The
      // tell for the bug is the parent's own value leaking into them.
      expect(getDataAtCell(1, 2)).toBe(null);
      expect(getDataAtCell(2, 1)).toBe(null);
      expect(getDataAtCell(2, 2)).toBe(null);
    });

    it('should still fill from a merged cell when another layer has cells to write', async() => {
      handsontable({
        data: createSpreadsheetData(6, 6),
        mergeCells: [{ row: 1, col: 1, rowspan: 2, colspan: 2 }],
      });

      await selectCells([[4, 4, 4, 5], [1, 1, 2, 2]]);
      await keyDownUp('f2');

      getActiveEditor().setValue('filled');

      await keyDownUp(['control/meta', 'enter']);

      // Skipping the edited merged area must not disarm the fill itself - the other layer is still
      // work to do.
      expect(isEditorVisible()).toBe(false);
      expect(getDataAtCell(4, 4)).toBe('filled');
      expect(getDataAtCell(4, 5)).toBe('filled');
    });

    it('should judge an object cell by the record it is about to write, after sorting', async() => {
      handsontable({
        data: [
          ['banana', 'B1'],
          ['apple', 'B2'],
          [{ id: 3, label: 'kept' }, 'B3'],
        ],
        columnSorting: true,
        renderer(instance, td, row, col, prop, value) {
          td.textContent = value && typeof value === 'object' ? value.label : value;
        },
      });

      // Sorting makes the visual and physical rows disagree. `getSourceDataAtCell()` takes a
      // PHYSICAL row, so reading it with the visual one judged a different record: the object cell
      // was either overwritten or spared depending on which row happened to line up.
      getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

      await selectCell(0, 0, 2, 1);
      await keyDownUp('f2');

      getActiveEditor().setValue('filled');

      await keyDownUp(['control/meta', 'enter']);

      expect(getSourceDataAtCell(2, 0)).toEqual({ id: 3, label: 'kept' });
    });

    it('should keep the line break when a hook returns a translation with no area', async() => {
      handsontable({
        data: createSpreadsheetData(6, 6),
      });

      // `modifyGetCellCoords` may answer with `[row, column]` instead of a four-corner area. Reading
      // the last two off that shorter result left the skip area undefined, so the edited cell counted
      // as a cell to fill and the chord stopped inserting a line break.
      addHook('modifyGetCellCoords', (row, column) => [row, column]);

      await selectCell(0, 0);
      await keyDownUp('enter');
      await keyDownUp(['control/meta', 'enter']);

      expect(isEditorVisible()).toBe(true);
      expect(getActiveEditor().getValue()).toBe('A1\n');
      expect(getDataAtCell(0, 0)).toBe('A1');
    });

    it('should still insert a line break when the selection has nothing else to fill', async() => {
      handsontable({
        data: createSpreadsheetData(6, 6),
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await keyDownUp(['control/meta', 'enter']);

      // One cell in one layer fills nothing else, so the chord keeps its line-break meaning.
      expect(isEditorVisible()).toBe(true);
      expect(getActiveEditor().getValue()).toBe('A1\n');
      expect(getDataAtCell(0, 0)).toBe('A1');
    });
  });

  describe('"PageUp"', () => {
    it('should move the selection to the first cell in a row while cell editing', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(2, 0);
      await keyDownUp('enter');
      await keyDownUp('pageup');

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    });
  });

  describe('"PageUp + Shift"', () => {
    it('should not move the selection while cell editing', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(2, 0);
      await keyDownUp('enter');
      await keyDownUp(['shift', 'pageup']);

      expect(getActiveEditor().isOpened()).toBe(true);
      expect(getSelected()).toEqual([[2, 0, 2, 0]]);
    });
  });

  describe('"PageDown"', () => {
    it('should move the selection to the last cell in a row while cell editing', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(2, 0);
      await keyDownUp('enter');
      await keyDownUp('pagedown');

      expect(getSelected()).toEqual([[4, 0, 4, 0]]);
    });
  });

  describe('"PageDown + Shift"', () => {
    it('should not move the selection while cell editing', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(2, 0);
      await keyDownUp('enter');
      await keyDownUp(['shift', 'pagedown']);

      expect(getActiveEditor().isOpened()).toBe(true);
      expect(getSelected()).toEqual([[2, 0, 2, 0]]);
    });
  });

  describe('"Tab"', () => {
    it('should move the selection to the next cell in the a while cell editing', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(2, 0);
      await keyDownUp('enter');
      await keyDownUp('tab');

      expect(getSelected()).toEqual([[2, 1, 2, 1]]);
    });
  });

  describe('"Tab + Shift"', () => {
    it('should move the selection to the previous cell in a row while cell editing', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(2, 2);
      await keyDownUp('enter');
      await keyDownUp(['shift', 'tab']);

      expect(getSelected()).toEqual([[2, 1, 2, 1]]);
    });
  });

  describe('"Z + Cmd/Ctrl"', () => {
    // Moved tests to the visual ones
    // https://github.com/handsontable/handsontable/blob/develop/visual-tests/tests/editors/textEditor/undo.spec.ts
    // https://github.com/handsontable/handsontable/blob/develop/visual-tests/tests/editors/textEditor/undo-multiline-text.spec.ts
  });

  describe('"Z + Shift + Cmd/Ctrl"', () => {
    // Moved tests to the visual ones
    // https://github.com/handsontable/handsontable/blob/develop/visual-tests/tests/editors/textEditor/redo.spec.ts
    // https://github.com/handsontable/handsontable/blob/develop/visual-tests/tests/editors/textEditor/redo-multiline-text.spec.ts
  });
});

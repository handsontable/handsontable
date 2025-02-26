describe('Comments', () => {
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

  describe('Enabling the plugin', () => {
    it('should enable the plugin in the initial config', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 4),
        comments: true,
      });

      expect(hot.getPlugin('comments').isEnabled()).toBe(true);
    });

    it('should enable the plugin using updateSettings', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 4)
      });

      expect(hot.getPlugin('comments').isEnabled()).toBe(false);

      updateSettings({
        comments: true
      });

      expect(hot.getPlugin('comments').isEnabled()).toBe(true);
    });
  });

  describe('updateSettings', () => {
    it('should change delay, after which comment is showed #4323', async() => {
      const rows = 10;
      const columns = 10;
      const hot = handsontable({
        data: createSpreadsheetData(rows, columns),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        comments: true,
        columns() {
          return {
            comment: {
              value: 'test'
            }
          };
        },
      });

      const plugin = hot.getPlugin('comments');
      const editor = plugin.getEditorInputElement();

      updateSettings({
        comments: {
          displayDelay: 100
        }
      });

      $(getCell(1, 1)).simulate('mouseover', {
        clientX: Handsontable.dom.offset(getCell(1, 1)).left + 5,
        clientY: Handsontable.dom.offset(getCell(1, 1)).top + 5,
      });

      await sleep(400);

      expect(editor.parentNode.style.display).toEqual('block');
    });
  });

  describe('Styling', () => {
    using('configuration object', [
      { htmlDir: 'ltr', layoutDirection: 'inherit' },
      { htmlDir: 'rtl', layoutDirection: 'ltr' },
    ], ({ htmlDir, layoutDirection }) => {
      beforeEach(() => {
        $('html').attr('dir', htmlDir);
      });

      afterEach(() => {
        $('html').attr('dir', 'ltr');
      });

      it('should display comment indicators in the appropriate cells', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(4, 10),
          comments: true,
          cell: [
            { row: 1, col: 1, comment: { value: 'test' } },
            { row: 2, col: 2, comment: { value: 'test' } }
          ],
        });

        expect(getCell(1, 1).classList.contains('htCommentCell')).toBeTrue();
        expect(getComputedStyle(getCell(1, 1), ':after').left).toBe('43px');
        expect(getComputedStyle(getCell(1, 1), ':after').right).toBe('0px');
        expect(getComputedStyle(getCell(1, 1), ':after').borderLeftWidth).toBe('6px');
        expect(getComputedStyle(getCell(1, 1), ':after').borderRightWidth).toBe('0px');
        expect(getCell(2, 2).classList.contains('htCommentCell')).toBeTrue();
        expect(getComputedStyle(getCell(1, 1), ':after').left).toBe('43px');
        expect(getComputedStyle(getCell(1, 1), ':after').right).toBe('0px');
        expect(getComputedStyle(getCell(2, 2), ':after').borderLeftWidth).toBe('6px');
        expect(getComputedStyle(getCell(2, 2), ':after').borderRightWidth).toBe('0px');
      });

      it('should display the comment editor on the right of the cell when the viewport is not scrolled (the Window object is a scrollable element)', () => {
        // For this configuration object "{ htmlDir: 'rtl', layoutDirection: 'ltr'}" it's necessary to force
        // always RTL on document, otherwise the horizontal scrollbar won't appear and test fail.
        if (htmlDir === 'rtl' && layoutDirection === 'ltr') {
          $('html').attr('dir', 'ltr');
        }

        handsontable({
          layoutDirection,
          data: createSpreadsheetData(4, 10),
          comments: true,
        });

        const plugin = getPlugin('comments');
        const $editor = $(plugin.getEditorInputElement());

        plugin.showAtCell(0, 1);

        const cellOffset = $(getCell(0, 2)).offset();
        const editorOffset = $editor.offset();

        expect(editorOffset.top).toBeCloseTo(cellOffset.top, 0);
        expect(editorOffset.left).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(cellOffset.left, 0);
          main.toBeCloseTo(cellOffset.left - 1, 0); // border compensation?
        });
      });

      it('should display the comment editor on the right of the cell when the viewport is scrolled (the Window object is a scrollable element)', async() => {
        // For this configuration object "{ htmlDir: 'rtl', layoutDirection: 'ltr'}" it's necessary to force
        // always RTL on document, otherwise the horizontal scrollbar won't appear and test fail.
        if (htmlDir === 'rtl' && layoutDirection === 'ltr') {
          $('html').attr('dir', 'ltr');
        }

        handsontable({
          layoutDirection,
          data: createSpreadsheetData(100, 100),
          comments: true,
        });

        scrollViewportTo({
          row: countRows() - 1,
          col: countCols() - 1,
          verticalSnap: 'top',
          horizontalSnap: 'start',
        });

        const plugin = getPlugin('comments');
        const $editor = $(plugin.getEditorInputElement());

        await sleep(10);

        plugin.showAtCell(countRows() - 10, countCols() - 10);

        const cellOffset = $(getCell(countRows() - 10, countCols() - 9)).offset();
        const editorOffset = $editor.offset();

        expect(editorOffset.top).toBeCloseTo(cellOffset.top, 0);
        expect(editorOffset.left).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(cellOffset.left, 0);
          main.toBeCloseTo(cellOffset.left - 1, 0); // border compensation?
        });
      });

      it.forTheme('classic')('should display the comment editor on the right of the cell when the ' +
        'viewport is not scrolled (the Window object is not a scrollable element)', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(30, 20),
          comments: true,
          width: 300,
          height: 200,
        });

        const plugin = getPlugin('comments');
        const $editor = $(plugin.getEditorInputElement());

        plugin.showAtCell(0, 1);

        const cellOffset = $(getCell(0, 2)).offset();
        const editorOffset = $editor.offset();

        expect(editorOffset.top).toBeCloseTo(cellOffset.top, 0);
        expect(editorOffset.left).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(cellOffset.left, 0);
          main.toBeCloseTo(cellOffset.left - 1, 0); // border compensation?
        });
      });

      it.forTheme('main')('should display the comment editor on the right of the cell when the ' +
        'viewport is not scrolled (the Window object is not a scrollable element)', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(30, 20),
          comments: true,
          width: 500,
          height: 200,
        });

        const plugin = getPlugin('comments');
        const $editor = $(plugin.getEditorInputElement());

        plugin.showAtCell(0, 1);

        const cellOffset = $(getCell(0, 2)).offset();
        const editorOffset = $editor.offset();

        expect(editorOffset.top).toBeCloseTo(cellOffset.top, 0);
        expect(editorOffset.left).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(cellOffset.left, 0);
          main.toBeCloseTo(cellOffset.left - 1, 0); // border compensation?
        });
      });

      it.forTheme('classic')('should display the comment editor on the right of the cell when the ' +
        'viewport is scrolled (the Window object is not a scrollable element)', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(30, 20),
          comments: true,
          width: 300,
          height: 200,
        });

        scrollViewportTo({
          row: countRows() - 1,
          col: countCols() - 1,
          verticalSnap: 'top',
          horizontalSnap: 'start',
        });

        const plugin = getPlugin('comments');
        const $editor = $(plugin.getEditorInputElement());

        await sleep(10);

        plugin.showAtCell(countRows() - 2, countCols() - 5);

        const cellOffset = $(getCell(countRows() - 2, countCols() - 4)).offset();
        const editorOffset = $editor.offset();

        expect(editorOffset.top).toBeCloseTo(cellOffset.top, 0);
        expect(editorOffset.left).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(cellOffset.left, 0);
          main.toBeCloseTo(cellOffset.left - 1, 0); // border compensation?
        });
      });

      it.forTheme('main')('should display the comment editor on the right of the cell when the ' +
        'viewport is scrolled (the Window object is not a scrollable element)', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(30, 20),
          comments: true,
          width: 500,
          height: 250,
        });

        scrollViewportTo({
          row: countRows() - 1,
          col: countCols() - 1,
          verticalSnap: 'top',
          horizontalSnap: 'start',
        });

        const plugin = getPlugin('comments');
        const $editor = $(plugin.getEditorInputElement());

        await sleep(10);

        plugin.showAtCell(countRows() - 2, countCols() - 8);

        const cellOffset = $(getCell(countRows() - 2, countCols() - 7)).offset();
        const editorOffset = $editor.offset();

        expect(editorOffset.top).toBeCloseTo(cellOffset.top, 0);
        expect(editorOffset.left).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(cellOffset.left, 0);
          main.toBeCloseTo(cellOffset.left - 1, 0); // border compensation?
        });
      });

      it('should display the comment editor on the left of the cell when there is not enough space left on the right', async() => {
        // For this configuration object "{ htmlDir: 'rtl', layoutDirection: 'ltr'}" it's necessary to force
        // always RTL on document, otherwise the horizontal scrollbar won't appear and test fail.
        if (htmlDir === 'rtl' && layoutDirection === 'ltr') {
          $('html').attr('dir', 'ltr');
        }

        handsontable({
          layoutDirection,
          data: createSpreadsheetData(100, 100),
          comments: true,
        });

        scrollViewportTo({
          row: countRows() - 1,
          col: countCols() - 1,
          verticalSnap: 'top',
          horizontalSnap: 'start',
        });

        const plugin = getPlugin('comments');
        const $editor = $(plugin.getEditorInputElement());

        await sleep(10);

        plugin.showAtCell(countRows() - 5, countCols() - 2);

        const cellOffset = $(getCell(countRows() - 5, countCols() - 2)).offset();
        const editorOffset = $editor.offset();
        const editorWidth = $editor.outerWidth();

        expect(editorOffset.top).toBeCloseTo(cellOffset.top, 0);
        expect(editorOffset.left).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(cellOffset.left - editorWidth - 1, 0);
          main.toBeCloseTo(cellOffset.left - editorWidth - 2, 0); // border compensation?
        });
      });

      it('should display the comment editor on the top-left of the cell when there is not enough space of the' +
        ' bottom-right', async() => {
        // For this configuration object "{ htmlDir: 'rtl', layoutDirection: 'ltr'}" it's necessary to force
        // always RTL on document, otherwise the horizontal scrollbar won't appear and test fail.
        if (htmlDir === 'rtl' && layoutDirection === 'ltr') {
          $('html').attr('dir', 'ltr');
        }

        handsontable({
          layoutDirection,
          data: createSpreadsheetData(100, 100),
          comments: true,
        });

        scrollViewportTo({
          row: countRows() - 1,
          col: countCols() - 1,
          verticalSnap: 'top',
          horizontalSnap: 'start',
        });

        const plugin = getPlugin('comments');
        const $editor = $(plugin.getEditorInputElement());

        await sleep(10);

        plugin.showAtCell(countRows() - 2, countCols() - 2);

        const $cell = $(getCell(countRows() - 2, countCols() - 2));
        const cellOffset = $cell.offset();
        const editorOffset = $editor.offset();
        const cellHeight = $cell.outerHeight();
        const editorWidth = $editor.outerWidth();
        const editorHeight = $editor.outerHeight();

        expect(editorOffset.top).toBeCloseTo(cellOffset.top - editorHeight + cellHeight - 1, 0);
        expect(editorOffset.left).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(cellOffset.left - editorWidth - 1, 0);
          main.toBeCloseTo(cellOffset.left - editorWidth - 2, 0); // border compensation?
        });
      });

      it('should display the comment editor on the top-right of the cell when on the bottom there is no left space', async() => {
        // For this configuration object "{ htmlDir: 'rtl', layoutDirection: 'ltr'}" it's necessary to force
        // always RTL on document, otherwise the horizontal scrollbar won't appear and test fail.
        if (htmlDir === 'rtl' && layoutDirection === 'ltr') {
          $('html').attr('dir', 'ltr');
        }

        handsontable({
          layoutDirection,
          data: createSpreadsheetData(100, 100),
          comments: true,
        });

        scrollViewportTo({
          row: countRows() - 1,
          col: 0,
          verticalSnap: 'top',
          horizontalSnap: 'start',
        });

        const plugin = getPlugin('comments');
        const $editor = $(plugin.getEditorInputElement());

        await sleep(10);

        plugin.showAtCell(countRows() - 1, 0);

        const cell = $(getCell(countRows() - 1, 1));
        const cellOffset = cell.offset();
        const cellHeight = cell.outerHeight();
        const editorOffset = $editor.offset();
        const editorHeight = $editor.outerHeight();

        expect(editorOffset.top).toBeCloseTo(cellOffset.top - editorHeight + cellHeight - 1, 0);
        expect(editorOffset.left).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(cellOffset.left, 0);
          main.toBeCloseTo(cellOffset.left - 1, 0); // border compensation?
        });
      });
    });
  });

  describe('Displaying comment after `mouseover` event', () => {
    it('should display comment after predefined delay when custom `displayDelay` option of `comments` plugin is not set', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        comments: true,
        columns() {
          return {
            comment: {
              value: 'test'
            }
          };
        },
      });

      $(getCell(1, 1)).simulate('mouseover', {
        clientX: Handsontable.dom.offset(getCell(1, 1)).left + 5,
        clientY: Handsontable.dom.offset(getCell(1, 1)).top + 5,
      });

      await sleep(300);

      const editor = getPlugin('comments').getEditorInputElement();

      expect(editor.parentNode.style.display).toBe('block');
    });

    it('should display comment after defined delay when custom `displayDelay` option of `comments` plugin is set', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        comments: {
          displayDelay: 400
        },
        columns() {
          return {
            comment: {
              value: 'test'
            }
          };
        }
      });

      $(getCell(1, 1)).simulate('mouseover', {
        clientX: Handsontable.dom.offset(getCell(1, 1)).left + 5,
        clientY: Handsontable.dom.offset(getCell(1, 1)).top + 5,
      });

      await sleep(300);

      const editorStyle = document.querySelector('.htComments').style;

      expect(editorStyle.display).toBe('none');

      await sleep(150);

      expect(editorStyle.display).toBe('block');
    });

    it('should display in the right position when the table is initialized within the scrollable parent element', async() => {
      const testContainer = $(`
        <div style="width: 250px; height: 200px; overflow: scroll;">
          <div style="width: 2000px; height: 2000px;">
            <div id="hot-container"></div>
          </div>
        </div>
      `).appendTo(spec().$container);

      const hot = new Handsontable(testContainer.find('#hot-container')[0], {
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 150,
        rowHeaders: true,
        colHeaders: true,
        comments: {
          displayDelay: 1
        },
        cell: [
          { row: 1, col: 1, comment: { value: 'Some comment' } },
        ]
      });

      testContainer
        .scrollLeft(10)
        .scrollTop(10);

      const cell = $(hot.getCell(1, 1));

      cell.simulate('mouseover', {
        clientX: cell.offset().left + 5,
        clientY: cell.offset().top + 5,
      });

      await sleep(10);

      const commentEditorOffset = $(hot.getPlugin('comments').getEditorInputElement()).offset();

      expect({
        top: commentEditorOffset.top,
        left: commentEditorOffset.left - cell.outerWidth(),
      }).forThemes(({ classic, main }) => {
        classic.toEqual(cell.offset());
        main.toEqual({
          top: cell.offset().top,
          left: cell.offset().left - 1, // border compensation?
        });
      });

      hot.destroy();
    });
  });

  it('should display the comment editor properly, when comment had been added on fixed column and some scrolling was performed', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 20),
      comments: true,
      cell: [
        { row: 0, col: 0, comment: { value: 'test' } },
      ],
      width: 300,
      height: 200,
      fixedColumnsStart: 5,
    });

    scrollViewportTo({
      row: 0,
      col: 19,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    await sleep(10);

    const plugin = hot.getPlugin('comments');
    const editor = plugin.getEditorInputElement();

    expect(plugin.getCommentAtCell(0, 0)).toEqual('test');

    plugin.showAtCell(0, 0);

    expect(editor.parentNode.style.display).toEqual('block');
  });

  describe('API', () => {
    it('should return the comment from a proper cell, when using the getCommentAtCell method', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 4),
        comments: {
          displayDelay: 400
        },
        cell: [
          { row: 1, col: 1, comment: { value: 'test' } },
          { row: 2, col: 2, comment: { value: 'another test' } }
        ]
      });

      const plugin = hot.getPlugin('comments');

      expect(plugin.getCommentAtCell(1, 1)).toEqual('test');
      expect(plugin.getCommentAtCell(2, 2)).toEqual('another test');
    });

    it('should return the comment from a proper cell, when using the setRange and getComment methods', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 4),
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'test' } },
          { row: 2, col: 2, comment: { value: 'another test' } }
        ],
      });

      const plugin = hot.getPlugin('comments');

      plugin.setRange({ from: { row: 1, col: 1 } });
      expect(plugin.getComment()).toEqual('test');
      plugin.setRange({ from: { row: 2, col: 2 } });
      expect(plugin.getComment()).toEqual('another test');
    });

    it('should allow inserting comments using the `setCommentAtCell` method', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 4),
        comments: true,
      });

      const plugin = hot.getPlugin('comments');

      expect(getCellMeta(1, 1).comment).toEqual(undefined);

      plugin.setCommentAtCell(1, 1, 'test comment');

      expect(getCellMeta(1, 1).comment.value).toEqual('test comment');
    });

    it('should not allow inserting comments using the `setCommentAtCell` method if `beforeSetCellMeta` returned false', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 4),
        comments: true,
        beforeSetCellMeta: () => false,
      });

      const plugin = hot.getPlugin('comments');

      expect(getCellMeta(1, 1).comment).toEqual(undefined);

      plugin.setCommentAtCell(1, 1, 'test comment');

      expect(getCellMeta(1, 1).comment).toEqual(undefined);
    });

    it('should trigger `afterSetCellMeta` callback when `setCommentAtCell` function is invoked', () => {
      const afterSetCellMeta = jasmine.createSpy('afterSetCellMeta');
      const hot = handsontable({
        data: createSpreadsheetData(4, 4),
        comments: true,
        afterSetCellMeta,
      });

      const plugin = hot.getPlugin('comments');

      plugin.setCommentAtCell(1, 1, 'Added comment');
      expect(afterSetCellMeta).toHaveBeenCalledWith(1, 1, 'comment', { value: 'Added comment' });
    });

    it('should allow removing comments using the `removeCommentAtCell` method', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 4),
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'test' } }
        ],
      });

      const plugin = hot.getPlugin('comments');

      expect(getCellMeta(1, 1).comment.value).toEqual('test');

      plugin.removeCommentAtCell(1, 1);

      expect(getCellMeta(1, 1).comment).toEqual(undefined);
    });

    it('should not allow removing comments using the `removeCommentAtCell` method if `beforeSetCellMeta` returned false', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 4),
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'test' } }
        ],
      });

      hot.updateSettings({ beforeSetCellMeta: () => false });

      const plugin = hot.getPlugin('comments');

      plugin.removeCommentAtCell(1, 1);

      expect(getCellMeta(1, 1).comment.value).toEqual('test');
    });

    it('should trigger `afterSetCellMeta` callback when `removeCommentAtCell` function is invoked', () => {
      const afterSetCellMeta = jasmine.createSpy('afterSetCellMeta');
      const hot = handsontable({
        data: createSpreadsheetData(4, 4),
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'test' } }
        ],
        afterSetCellMeta,
      });

      const plugin = hot.getPlugin('comments');

      plugin.removeCommentAtCell(1, 1);
      expect(afterSetCellMeta).toHaveBeenCalledWith(1, 1, 'comment');
    });

    it('should allow opening the comment editor using the `showAtCell` method', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 4),
        comments: true,
      });

      const plugin = hot.getPlugin('comments');
      const editor = plugin.getEditorInputElement();

      expect(editor.parentNode.style.display).toEqual('none');

      plugin.showAtCell(1, 1);

      expect(editor.parentNode.style.display).toEqual('block');
    });

    it('should allow closing the comment editor using the `hide` method', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 4),
        comments: true,
      });

      const plugin = hot.getPlugin('comments');
      const editor = plugin.getEditorInputElement();

      plugin.showAtCell(1, 1);
      expect(editor.parentNode.style.display).toEqual('block');

      plugin.hide();

      expect(editor.parentNode.style.display).toEqual('none');
    });
  });

  it('`updateCommentMeta` & `setComment` functions should extend cellMetaObject properly', () => {
    const hot = handsontable({
      data: createSpreadsheetData(4, 4),
      comments: true,
    });
    const plugin = hot.getPlugin('comments');
    let readOnly;
    let comment;

    setCellMeta(0, 0, 'comment', { readOnly: true });
    plugin.updateCommentMeta(0, 0, { value: 'Test' });

    comment = getCellMeta(0, 0).comment;
    readOnly = comment && comment.readOnly;

    expect(readOnly).toEqual(true);

    plugin.setRange({ from: { row: 0, col: 0 }, to: { row: 0, col: 0 } });
    plugin.setComment('Test2');

    comment = getCellMeta(0, 0).comment;
    readOnly = comment && comment.readOnly;

    expect(readOnly).toEqual(true);
  });

  it('should not close the comment editor immediately after opening #4323', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      contextMenu: true,
      comments: true,
    });

    selectCell(1, 1);
    contextMenu();

    const addCommentButton = $('.htContextMenu .ht_master .htCore tbody td:contains(Add comment)');

    $(addCommentButton)
      .simulate('mouseenter')
      .simulate('mouseover', {
        clientX: addCommentButton.offset().left + 5,
        clientY: addCommentButton.offset().top + 5,
      })
      .simulate('mousedown')
      .simulate('mouseup');
    // Mouse over on documentElement emulates the behavior of the context menu where clicking the menu
    // action triggers the "mouseover" event with not the TD element of the menu but mentioned
    // documentElement. It is caused that the menu is closed right after the "mouseup" event.
    $(document.documentElement)
      .simulate('mouseover', {
        clientX: 1,
        clientY: 1,
      });

    const editor = getPlugin('comments').getEditorInputElement();

    await sleep(400);

    expect(editor.parentNode.style.display).toBe('block');
  });

  it('should set the table active and switch the keyboard shortcuts context to plugin when the comment is triggered ' +
      'by LMB to inactive (unlisten) table', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(4, 4),
      contextMenu: true,
      comments: true,
      cell: [
        { row: 1, col: 1, comment: { value: 'Hello world!' } }
      ],
    });

    $(getCell(1, 1)).simulate('mouseover', {
      clientX: Handsontable.dom.offset(getCell(1, 1)).left + 5,
      clientY: Handsontable.dom.offset(getCell(1, 1)).top + 5,
    });

    await sleep(400);

    $(getPlugin('comments').getEditorInputElement())
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click');
    getPlugin('comments').getEditorInputElement().focus();

    await sleep(50);

    expect(hot.isListening()).toBe(true);
    expect(getShortcutManager().getActiveContextName()).toBe('plugin:comments');
  });

  it('should be possible to edit a cell (trigger fast edit mode) when a comment is shown', async() => {
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

    selectCell(1, 1);
    $(getCell(1, 1)).simulate('mouseover', {
      clientX: Handsontable.dom.offset(getCell(1, 1)).left + 5,
      clientY: Handsontable.dom.offset(getCell(1, 1)).top + 5,
    });

    await sleep(50);

    keyDownUp(['m']); // typing printable characters should trigger cell editor

    expect(getActiveEditor().isOpened()).toBe(true);
  });

  it('should not deselect the currently selected cell after clicking on the Comments\' editor element', async() => {
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

    selectCell(1, 1);
    $(getCell(1, 1)).simulate('mouseover', {
      clientX: Handsontable.dom.offset(getCell(1, 1)).left + 5,
      clientY: Handsontable.dom.offset(getCell(1, 1)).top + 5,
    });

    await sleep(50);

    $(getPlugin('comments').getEditorInputElement())
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click');
    getPlugin('comments').getEditorInputElement().focus();

    await sleep(50);

    expect(getSelected()).toEqual([[1, 1, 1, 1]]);
  });

  describe('Using the Context Menu', () => {
    it('should open the comment editor when clicking the "Add comment" entry', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        comments: true,
      });

      selectCell(1, 1);
      contextMenu();
      selectContextMenuOption('Add comment');

      const editor = hot.getPlugin('comments').getEditorInputElement();

      expect($(editor).parents('.htComments')[0].style.display).toEqual('block');
    });

    it('should remove the comment from a cell after clicking the "Delete comment" entry', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'Test comment' } }
        ],
      });

      expect(getCellMeta(1, 1).comment.value).toEqual('Test comment');

      selectCell(1, 1);
      contextMenu();
      selectContextMenuOption('Delete comment');

      expect(getCellMeta(1, 1).comment).toEqual(undefined);
    });

    it('should remove the comments from multiple cells after clicking the "Delete comment" entry (selection from top-left to bottom-right)', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'Test comment 1' } },
          { row: 2, col: 2, comment: { value: 'Test comment 2' } },
          { row: 3, col: 3, comment: { value: 'Test comment 3' } },
        ],
      });

      selectCell(1, 1, 3, 3);
      contextMenu();
      selectContextMenuOption('Delete comment');

      expect(getCellMeta(1, 1).comment).toEqual(undefined);
      expect(getCellMeta(2, 2).comment).toEqual(undefined);
      expect(getCellMeta(3, 3).comment).toEqual(undefined);
    });

    it('Should remove the comments from multiple cells after clicking the "Delete comment" entry (selection from bottom-right to top-left)', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'Test comment 1' } },
          { row: 2, col: 2, comment: { value: 'Test comment 2' } },
          { row: 3, col: 3, comment: { value: 'Test comment 3' } },
        ],
      });

      selectCell(3, 3, 1, 1);
      contextMenu();
      selectContextMenuOption('Delete comment');

      expect(getCellMeta(1, 1).comment).toEqual(undefined);
      expect(getCellMeta(2, 2).comment).toEqual(undefined);
      expect(getCellMeta(3, 3).comment).toEqual(undefined);
    });

    it('should make the comment editor\'s textarea read-only after clicking the "Read-only comment" entry', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'Test comment' } }
        ],
      });

      selectCell(1, 1);
      contextMenu();

      const editor = getPlugin('comments').getEditorInputElement();

      expect(editor.readOnly).toBe(false);

      selectContextMenuOption('Read-only comment');

      $(getCell(1, 1)).simulate('mouseover', {
        clientX: Handsontable.dom.offset(getCell(1, 1)).left + 5,
        clientY: Handsontable.dom.offset(getCell(1, 1)).top + 5,
      });

      await sleep(550);

      expect(editor.readOnly).toBe(true);
    });

    it('should make multiple comment editor\'s textarea read-only after clicking the "Read-only comment" ' +
       'entry  (selection from top-left to bottom-right)', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'Test comment 1' } },
          { row: 2, col: 2, comment: { value: 'Test comment 2' } },
          { row: 3, col: 3, comment: { value: 'Test comment 3' } },
        ],
      });

      selectCell(1, 1, 3, 3);
      contextMenu();

      const editor = hot.getPlugin('comments').getEditorInputElement();

      expect($(editor)[0].readOnly).toBe(false);

      selectContextMenuOption('Read-only comment');

      expect(getCellMeta(1, 1).comment.readOnly).toBe(true);
      expect(getCellMeta(2, 2).comment.readOnly).toBe(true);
      expect(getCellMeta(3, 3).comment.readOnly).toBe(true);
    });

    it('should make multiple comment editor\'s textarea read-only after clicking the "Read-only comment" ' +
       'entry  (selection from bottom-right to top-left)', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'Test comment 1' } },
          { row: 2, col: 2, comment: { value: 'Test comment 2' } },
          { row: 3, col: 3, comment: { value: 'Test comment 3' } },
        ],
      });

      selectCell(3, 3, 1, 1);
      contextMenu();

      const editor = hot.getPlugin('comments').getEditorInputElement();

      expect($(editor)[0].readOnly).toBe(false);

      selectContextMenuOption('Read-only comment');

      expect(getCellMeta(1, 1).comment.readOnly).toBe(true);
      expect(getCellMeta(2, 2).comment.readOnly).toBe(true);
      expect(getCellMeta(3, 3).comment.readOnly).toBe(true);
    });
  });

  describe('Hooks invoked after changing cell meta', () => {
    it('should trigger `afterSetCellMeta` callback after resizing the comment', async() => {
      const afterSetCellMeta = jasmine.createSpy('afterSetCellMeta');

      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        comments: true,
        columns() {
          return {
            comment: {
              value: 'test'
            }
          };
        },
        afterSetCellMeta,
      });

      selectCell(1, 1);
      contextMenu();
      selectContextMenuOption('Edit comment');

      await sleep(50);

      $('.htCommentTextArea').width(300).height(50);

      await sleep(50);

      expect(afterSetCellMeta).forThemes(({ classic, main }) => {
        classic.toHaveBeenCalledWith(1, 1, 'comment', jasmine.objectContaining({
          style: { width: 313, height: 60 }
        }));
        main.toHaveBeenCalledWith(1, 1, 'comment', jasmine.objectContaining({
          style: { width: 318, height: 60 }
        }));
      });
    });

    it('should trigger `afterSetCellMeta` callback after deleting comment by context menu', () => {
      const afterSetCellMeta = jasmine.createSpy('afterSetCellMeta');

      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        comments: true,
        columns() {
          return {
            comment: {
              value: 'test'
            }
          };
        },
        afterSetCellMeta,
      });

      expect(afterSetCellMeta).not.toHaveBeenCalled();

      selectCell(1, 1);
      contextMenu();
      selectContextMenuOption('Delete comment');

      expect(afterSetCellMeta).toHaveBeenCalledWith(1, 1, 'comment');
    });

    it('should not deleting comment by context menu if `beforeSetCellMeta` returned false', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        comments: true,
        columns() {
          return {
            comment: {
              value: 'test'
            }
          };
        },
        beforeSetCellMeta: () => false,
      });

      expect(getCellMeta(1, 1).comment.value).toEqual('test');

      selectCell(1, 1);
      contextMenu();
      selectContextMenuOption('Delete comment');

      expect(getCellMeta(1, 1).comment.value).toEqual('test');
    });

    it('should trigger `afterSetCellMeta` callback after editing comment by context menu', async() => {
      const afterSetCellMeta = jasmine.createSpy('afterSetCellMeta');

      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        comments: true,
        columns() {
          return {
            comment: {
              value: 'test'
            }
          };
        },
        afterSetCellMeta,
      });

      selectCell(0, 0);
      contextMenu();
      selectContextMenuOption('Edit comment');

      const textarea = spec().$container[0].parentNode.querySelector('.htCommentTextArea');

      textarea.focus();
      textarea.value = 'Edited comment';

      await sleep(300);

      $('body').simulate('mousedown');
      $('body').simulate('mouseup');
      textarea.blur();

      await sleep(1000);

      expect(afterSetCellMeta).toHaveBeenCalledWith(0, 0, 'comment', { value: 'Edited comment' });
    });

    it('should not editing comment by context menu if `beforeSetCellMeta` returned false', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        comments: true,
        columns() {
          return {
            comment: {
              value: 'test'
            }
          };
        },
        beforeSetCellMeta: () => false,
      });

      selectCell(0, 0);
      contextMenu();
      selectContextMenuOption('Edit comment');

      const textarea = spec().$container[0].parentNode.querySelector('.htCommentTextArea');

      textarea.focus();
      textarea.value = 'Edited comment';

      await sleep(100);

      $('body').simulate('mousedown');
      $('body').simulate('mouseup');
      textarea.blur();

      await sleep(400);

      expect(getCellMeta(0, 0).comment.value).toEqual('test');
    });
  });

  describe('hidden row an column integration', () => {
    it('should display the comment editor in the correct place, when the active cell is past hidden rows/columns', () => {
      const hot = handsontable({
        data: createSpreadsheetData(10, 10),
        comments: true,
        hiddenColumns: {
          columns: [0, 1, 4, 8, 9],
          indicators: true
        },
        hiddenRows: {
          rows: [0, 1, 4, 8, 9],
          indicators: true
        },
      });

      const plugin = hot.getPlugin('comments');
      const editor = plugin.getEditorInputElement();

      plugin.showAtCell(0, 0);

      expect($(editor.parentNode).offset().top).toBeCloseTo($(hot.rootElement).offset().top, 0);
      expect($(editor.parentNode).offset().left).toBeCloseTo($(hot.rootElement).offset().left, 0);

      plugin.showAtCell(1, 1);

      expect($(editor.parentNode).offset().top).toBeCloseTo($(hot.rootElement).offset().top, 0);
      expect($(editor.parentNode).offset().left).toBeCloseTo($(hot.rootElement).offset().left, 0);

      plugin.showAtCell(2, 2);

      expect($(editor.parentNode).offset().top).toBeCloseTo($(getCell(2, 3)).offset().top, 0);
      expect($(editor.parentNode).offset().left).toBeCloseTo($(getCell(2, 3)).offset().left, 0);

      plugin.showAtCell(3, 3);

      expect($(editor.parentNode).offset().top).toBeCloseTo($(getCell(3, 5)).offset().top, 0);
      expect($(editor.parentNode).offset().left).toBeCloseTo($(getCell(3, 5)).offset().left, 0);

      plugin.showAtCell(4, 4);

      expect($(editor.parentNode).offset().top).toBeCloseTo($(getCell(5, 5)).offset().top, 0);
      expect($(editor.parentNode).offset().left).toBeCloseTo($(getCell(5, 5)).offset().left, 0);

      plugin.showAtCell(5, 5);

      expect($(editor.parentNode).offset().top).toBeCloseTo($(getCell(5, 6)).offset().top, 0);
      expect($(editor.parentNode).offset().left).toBeCloseTo($(getCell(5, 6)).offset().left, 0);

      plugin.showAtCell(7, 7);

      expect($(editor.parentNode).offset().top).toBeCloseTo($(getCell(7, 7)).offset().top, 0);
      expect($(editor.parentNode).offset().left)
        .toBeCloseTo($(getCell(7, 7)).offset().left + $(getCell(7, 7)).outerWidth(), 0);

      plugin.showAtCell(8, 8);

      expect($(editor.parentNode).offset().top)
        .toBeCloseTo($(getCell(7, 7)).offset().top + $(getCell(7, 7)).outerHeight(), 0);
      expect($(editor.parentNode).offset().left)
        .toBeCloseTo($(getCell(7, 7)).offset().left + $(getCell(7, 7)).outerWidth(), 0);

      plugin.showAtCell(9, 9);

      expect($(editor.parentNode).offset().top)
        .toBeCloseTo($(getCell(7, 7)).offset().top + $(getCell(7, 7)).outerHeight(), 0);
      expect($(editor.parentNode).offset().left)
        .toBeCloseTo($(getCell(7, 7)).offset().left + $(getCell(7, 7)).outerWidth(), 0);
    });

    it('should display the correct values in the comment editor, for cells placed past hidden rows/columns', () => {
      const hot = handsontable({
        data: createSpreadsheetData(6, 6),
        comments: true,
        hiddenColumns: {
          columns: [0, 1, 4],
          indicators: true
        },
        hiddenRows: {
          rows: [0, 1, 4],
          indicators: true
        },
        cell: [
          { row: 2, col: 2, comment: { value: 'Foo' } },
          { row: 5, col: 5, comment: { value: 'Bar' } },
        ],
      });

      const plugin = hot.getPlugin('comments');
      const editor = plugin.getEditorInputElement();

      plugin.showAtCell(2, 2);
      expect($(editor).val()).toEqual('Foo');
      expect(plugin.getCommentMeta(2, 2, 'value')).toEqual('Foo');
      expect(plugin.getCommentAtCell(2, 2)).toEqual('Foo');
      selectCell(2, 2);
      expect(plugin.getComment()).toEqual('Foo');

      plugin.showAtCell(5, 5);
      expect($(editor).val()).toEqual('Bar');
      expect(plugin.getCommentMeta(5, 5, 'value')).toEqual('Bar');
      expect(plugin.getCommentAtCell(5, 5)).toEqual('Bar');
      selectCell(5, 5);
      expect(plugin.getComment()).toEqual('Bar');
    });
  });

  describe('Destroying the plugin with two instances of Handsontable', () => {
    it('should create two containers for comments for two HOT instances', () => {
      const container1 = $('<div id="hot1"></div>').appendTo(spec().$container).handsontable({
        data: createSpreadsheetData(6, 6),
        cell: [
          { row: 1, col: 1, comment: { value: 'Hello world!' } },
          { row: 1, col: 2, comment: { value: 'Yes!' } }
        ],
        rowHeaders: true,
        colHeaders: true,
        comments: true,
      });

      const container2 = $('<div id="hot2"></div>').appendTo(spec().$container).handsontable({
        data: createSpreadsheetData(6, 6),
        cell: [{ row: 1, col: 1, comment: { value: 'Hello world!' } }],
        rowHeaders: true,
        colHeaders: true,
        comments: true,
      });

      let commentContainersLength = document.querySelectorAll('.htCommentsContainer').length;

      expect(commentContainersLength).toEqual(2);

      // cleanup first HOT instance
      container1.handsontable('destroy');
      commentContainersLength = document.querySelectorAll('.htCommentsContainer').length;
      expect(commentContainersLength).toEqual(1);

      // cleanup second HOT instance
      container2.handsontable('destroy');
      commentContainersLength = document.querySelectorAll('.htCommentsContainer').length;
      expect(commentContainersLength).toEqual(0);
    });

    it('should delete one container when one HOT instance is destroyed', () => {
      const container1 = $('<div id="hot1"></div>').appendTo(spec().$container).handsontable({
        data: createSpreadsheetData(6, 6),
        cell: [
          { row: 1, col: 1, comment: { value: 'Hello world!' } },
          { row: 1, col: 2, comment: { value: 'Yes!' } }
        ],
        rowHeaders: true,
        colHeaders: true,
        comments: true,
      });

      const container2 = $('<div id="hot2"></div>').appendTo(spec().$container).handsontable({
        data: createSpreadsheetData(6, 6),
        cell: [{ row: 1, col: 1, comment: { value: 'Hello world!' } }],
        rowHeaders: true,
        colHeaders: true,
        comments: true,
      });

      container2.handsontable('destroy');

      let commentContainersLength = document.querySelectorAll('.htCommentsContainer').length;

      expect(commentContainersLength).toEqual(1);

      // cleanup HOT instance
      container1.handsontable('destroy');
      commentContainersLength = document.querySelectorAll('.htCommentsContainer').length;
      expect(commentContainersLength).toEqual(0);
    });
  });
});

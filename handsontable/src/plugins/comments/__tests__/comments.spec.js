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
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true
      });

      expect(hot.getPlugin('comments').isEnabled()).toBe(true);
    });

    it('should enable the plugin using updateSettings', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4)
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
        data: Handsontable.helper.createSpreadsheetData(rows, columns),
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
        }
      });

      const plugin = hot.getPlugin('comments');
      const editor = plugin.editor.getInputElement();

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
    it('should display comment indicators in the appropriate cells', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'test' } },
          { row: 2, col: 2, comment: { value: 'test' } }
        ]
      });

      expect(getCell(1, 1).className.indexOf('htCommentCell')).toBeGreaterThan(-1);
      expect(getCell(2, 2).className.indexOf('htCommentCell')).toBeGreaterThan(-1);
    });

    it('should display the comment editor in the correct place', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
      });

      const plugin = hot.getPlugin('comments');
      const editor = plugin.editor.getInputElement();

      plugin.showAtCell(0, 1);

      expect($(editor.parentNode).offset().top).toBeCloseTo($(getCell(0, 2)).offset().top, 0);
      expect($(editor.parentNode).offset().left).toBeCloseTo($(getCell(0, 2)).offset().left, 0);
    });
  });

  describe('Displaying comment after `mouseover` event', () => {
    it('should display comment after predefined delay when custom `displayDelay` ' +
      'option of `comments` plugin wasn\'t set', (done) => {
      const rows = 10;
      const columns = 10;
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(rows, columns),
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
        }
      });

      $(getCell(1, 1)).simulate('mouseover', {
        clientX: Handsontable.dom.offset(getCell(1, 1)).left + 5,
        clientY: Handsontable.dom.offset(getCell(1, 1)).top + 5,
      });

      const plugin = hot.getPlugin('comments');
      const editor = plugin.editor.getInputElement();

      setTimeout(() => {
        expect(editor.parentNode.style.display).toEqual('block');
        done();
      }, 300);
    });

    it('should display comment after defined delay when custom `displayDelay` ' +
      'option of `comments` plugin was set', (done) => {
      const rows = 10;
      const columns = 10;
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(rows, columns),
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

      const plugin = hot.getPlugin('comments');
      const editor = plugin.editor.getInputElement();

      setTimeout(() => {
        expect(editor.parentNode.style.display).toEqual('none');
      }, 300);

      setTimeout(() => {
        expect(editor.parentNode.style.display).toEqual('block');
        done();
      }, 450);
    });
  });

  describe('API', () => {
    it('should return the comment from a proper cell, when using the getCommentAtCell method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
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
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'test' } },
          { row: 2, col: 2, comment: { value: 'another test' } }
        ]
      });

      const plugin = hot.getPlugin('comments');

      plugin.setRange({ from: { row: 1, col: 1 } });
      expect(plugin.getComment()).toEqual('test');
      plugin.setRange({ from: { row: 2, col: 2 } });
      expect(plugin.getComment()).toEqual('another test');
    });

    it('should allow inserting comments using the `setCommentAtCell` method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true
      });

      const plugin = hot.getPlugin('comments');

      expect(getCellMeta(1, 1).comment).toEqual(void 0);

      plugin.setCommentAtCell(1, 1, 'test comment');

      expect(getCellMeta(1, 1).comment.value).toEqual('test comment');
    });

    it('should not allow inserting comments using the `setCommentAtCell` method if `beforeSetCellMeta` returned false', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
        beforeSetCellMeta: () => false
      });

      const plugin = hot.getPlugin('comments');

      expect(getCellMeta(1, 1).comment).toEqual(void 0);

      plugin.setCommentAtCell(1, 1, 'test comment');

      expect(getCellMeta(1, 1).comment).toEqual(void 0);
    });

    it('should trigger `afterSetCellMeta` callback when `setCommentAtCell` function is invoked', () => {
      const afterSetCellMetaCallback = jasmine.createSpy('afterSetCellMetaCallback');
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
        afterSetCellMeta: afterSetCellMetaCallback
      });

      const plugin = hot.getPlugin('comments');

      plugin.setCommentAtCell(1, 1, 'Added comment');
      expect(afterSetCellMetaCallback)
        .toHaveBeenCalledWith(1, 1, 'comment', { value: 'Added comment' });
    });

    it('should allow removing comments using the `removeCommentAtCell` method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'test' } }
        ]
      });

      const plugin = hot.getPlugin('comments');

      expect(getCellMeta(1, 1).comment.value).toEqual('test');

      plugin.removeCommentAtCell(1, 1);

      expect(getCellMeta(1, 1).comment).toEqual(void 0);
    });

    it('should not allow removing comments using the `removeCommentAtCell` method if `beforeSetCellMeta` returned false', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'test' } }
        ]
      });

      hot.updateSettings({ beforeSetCellMeta: () => false });

      const plugin = hot.getPlugin('comments');

      plugin.removeCommentAtCell(1, 1);

      expect(getCellMeta(1, 1).comment.value).toEqual('test');
    });

    it('should trigger `afterSetCellMeta` callback when `removeCommentAtCell` function is invoked', () => {
      const afterSetCellMetaCallback = jasmine.createSpy('afterSetCellMetaCallback');
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'test' } }
        ],
        afterSetCellMeta: afterSetCellMetaCallback
      });

      const plugin = hot.getPlugin('comments');

      plugin.removeCommentAtCell(1, 1);
      expect(afterSetCellMetaCallback).toHaveBeenCalledWith(1, 1, 'comment');
    });

    it('should allow opening the comment editor using the `showAtCell` method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
      });

      const plugin = hot.getPlugin('comments');
      const editor = plugin.editor.getInputElement();

      expect(editor.parentNode.style.display).toEqual('none');

      plugin.showAtCell(1, 1);

      expect(editor.parentNode.style.display).toEqual('block');
    });

    it('should allow closing the comment editor using the `hide` method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
      });

      const plugin = hot.getPlugin('comments');
      const editor = plugin.editor.getInputElement();

      plugin.showAtCell(1, 1);
      expect(editor.parentNode.style.display).toEqual('block');

      plugin.hide();

      expect(editor.parentNode.style.display).toEqual('none');
    });
  });

  it('`updateCommentMeta` & `setComment` functions should extend cellMetaObject properly', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      comments: true
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
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      comments: {
        displayDelay: 0
      }
    });

    selectCell(1, 1);
    contextMenu();

    const addCommentButton = $('.htItemWrapper').filter(function() {
      return $(this).text() === 'Add comment';
    })[0];

    $(addCommentButton).simulate('mouseover', {
      clientX: Handsontable.dom.offset(addCommentButton).left + 5,
      clientY: Handsontable.dom.offset(addCommentButton).top + 5,
    });

    $(addCommentButton).simulate('mousedown').simulate('mouseup');

    const editor = hot.getPlugin('comments').editor.getInputElement();

    await sleep(300);

    expect($(editor).parents('.htComments')[0].style.display).toEqual('block');

    // Call manually blur event on comment input. This prevents auto-triggering blur event
    // when the instance is destroyed, which causes to call `getCellMeta` on the destroyed instance.
    editor.blur();
  });

  describe('Using the Context Menu', () => {
    it('should open the comment editor when clicking the "Add comment" entry', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        comments: true
      });

      selectCell(1, 1);
      contextMenu();

      const addCommentButton = $('.htItemWrapper').filter(function() {
        return $(this).text() === 'Add comment';
      })[0];

      $(addCommentButton).simulate('mousedown').simulate('mouseup');

      const editor = hot.getPlugin('comments').editor.getInputElement();

      expect($(editor).parents('.htComments')[0].style.display).toEqual('block');
    });

    it('should remove the comment from a cell after clicking the "Delete comment" entry', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'Test comment' } }
        ]
      });

      expect(getCellMeta(1, 1).comment.value).toEqual('Test comment');

      selectCell(1, 1);
      contextMenu();

      const deleteCommentButton = $('.htItemWrapper').filter(function() {
        return $(this).text() === 'Delete comment';
      })[0];

      $(deleteCommentButton).simulate('mousedown').simulate('mouseup');

      expect(getCellMeta(1, 1).comment).toEqual(void 0);
    });

    it('should remove the comments from multiple cells after clicking the "Delete comment" entry (selection from top-left to bottom-right)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'Test comment 1' } },
          { row: 2, col: 2, comment: { value: 'Test comment 2' } },
          { row: 3, col: 3, comment: { value: 'Test comment 3' } },
        ]
      });

      selectCell(1, 1, 3, 3);
      contextMenu();

      const deleteCommentButton = $('.htItemWrapper').filter(function() {
        return $(this).text() === 'Delete comment';
      })[0];

      $(deleteCommentButton).simulate('mousedown').simulate('mouseup');

      expect(getCellMeta(1, 1).comment).toEqual(void 0);
      expect(getCellMeta(2, 2).comment).toEqual(void 0);
      expect(getCellMeta(3, 3).comment).toEqual(void 0);
    });

    it('Should remove the comments from multiple cells after clicking the "Delete comment" entry (selection from bottom-right to top-left)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'Test comment 1' } },
          { row: 2, col: 2, comment: { value: 'Test comment 2' } },
          { row: 3, col: 3, comment: { value: 'Test comment 3' } },
        ]
      });

      selectCell(3, 3, 1, 1);
      contextMenu();

      const deleteCommentButton = $('.htItemWrapper').filter(function() {
        return $(this).text() === 'Delete comment';
      })[0];

      $(deleteCommentButton).simulate('mousedown').simulate('mouseup');

      expect(getCellMeta(1, 1).comment).toEqual(void 0);
      expect(getCellMeta(2, 2).comment).toEqual(void 0);
      expect(getCellMeta(3, 3).comment).toEqual(void 0);
    });

    it('should make the comment editor\'s textarea read-only after clicking the "Read-only comment" entry', (done) => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'Test comment' } }
        ]
      });

      selectCell(1, 1);
      contextMenu();

      const editor = hot.getPlugin('comments').editor.getInputElement();

      expect($(editor)[0].readOnly).toBe(false);

      const readOnlyComment = $('.htItemWrapper').filter(function() {
        return $(this).text() === 'Read-only comment';
      })[0];

      $(readOnlyComment).simulate('mousedown').simulate('mouseup');
      $(document).simulate('mouseup');

      $(getCell(1, 1)).simulate('mouseover', {
        clientX: Handsontable.dom.offset(getCell(1, 1)).left + 5,
        clientY: Handsontable.dom.offset(getCell(1, 1)).top + 5,
      });

      setTimeout(() => {
        expect($(editor)[0].readOnly).toBe(true);
        done();
      }, 550);
    });

    it('should make multiple comment editor\'s textarea read-only after clicking the "Read-only comment" ' +
       'entry  (selection from top-left to bottom-right)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'Test comment 1' } },
          { row: 2, col: 2, comment: { value: 'Test comment 2' } },
          { row: 3, col: 3, comment: { value: 'Test comment 3' } },
        ]
      });

      selectCell(1, 1, 3, 3);
      contextMenu();

      const editor = hot.getPlugin('comments').editor.getInputElement();

      expect($(editor)[0].readOnly).toBe(false);

      const readOnlyComment = $('.htItemWrapper').filter(function() {
        return $(this).text() === 'Read-only comment';
      })[0];

      $(readOnlyComment).simulate('mousedown').simulate('mouseup');

      expect(getCellMeta(1, 1).comment.readOnly).toBe(true);
      expect(getCellMeta(2, 2).comment.readOnly).toBe(true);
      expect(getCellMeta(3, 3).comment.readOnly).toBe(true);
    });

    it('should make multiple comment editor\'s textarea read-only after clicking the "Read-only comment" ' +
       'entry  (selection from bottom-right to top-left)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'Test comment 1' } },
          { row: 2, col: 2, comment: { value: 'Test comment 2' } },
          { row: 3, col: 3, comment: { value: 'Test comment 3' } },
        ]
      });

      selectCell(3, 3, 1, 1);
      contextMenu();

      const editor = hot.getPlugin('comments').editor.getInputElement();

      expect($(editor)[0].readOnly).toBe(false);

      const readOnlyComment = $('.htItemWrapper').filter(function() {
        return $(this).text() === 'Read-only comment';
      })[0];

      $(readOnlyComment).simulate('mousedown').simulate('mouseup');

      expect(getCellMeta(1, 1).comment.readOnly).toBe(true);
      expect(getCellMeta(2, 2).comment.readOnly).toBe(true);
      expect(getCellMeta(3, 3).comment.readOnly).toBe(true);
    });
  });

  describe('Hooks invoked after changing cell meta', () => {
    it('should trigger `afterSetCellMeta` callback after deleting comment by context menu', () => {
      const afterSetCellMetaCallback = jasmine.createSpy('afterSetCellMetaCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
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
        afterSetCellMeta: afterSetCellMetaCallback
      });

      expect(afterSetCellMetaCallback).not.toHaveBeenCalled();

      selectCell(1, 1);
      contextMenu();

      const deleteCommentButton = $('.htItemWrapper').filter(function() {
        return $(this).text() === 'Delete comment';
      })[0];

      $(deleteCommentButton).simulate('mousedown').simulate('mouseup');

      expect(afterSetCellMetaCallback).toHaveBeenCalledWith(1, 1, 'comment');
    });

    it('should not deleting comment by context menu if `beforeSetCellMeta` returned false', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
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
        beforeSetCellMeta: () => false
      });

      expect(getCellMeta(1, 1).comment.value).toEqual('test');

      selectCell(1, 1);
      contextMenu();

      const deleteCommentButton = $('.htItemWrapper').filter(function() {
        return $(this).text() === 'Delete comment';
      })[0];

      $(deleteCommentButton).simulate('mousedown').simulate('mouseup');

      expect(getCellMeta(1, 1).comment.value).toEqual('test');
    });

    it('should trigger `afterSetCellMeta` callback after editing comment by context menu', async() => {
      const afterSetCellMetaCallback = jasmine.createSpy('afterSetCellMetaCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
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
        afterSetCellMeta: afterSetCellMetaCallback
      });

      selectCell(0, 0);
      contextMenu();

      const editCommentButton = $('.htItemWrapper').filter(function() {
        return $(this).text() === 'Edit comment';
      })[0];

      $(editCommentButton).simulate('mousedown');
      $(editCommentButton).simulate('mouseup');

      const textarea = spec().$container[0].parentNode.querySelector('.htCommentTextArea');

      textarea.focus();
      textarea.value = 'Edited comment';

      await sleep(300);

      $('body').simulate('mousedown');
      $('body').simulate('mouseup');
      textarea.blur();

      await sleep(1000);

      expect(afterSetCellMetaCallback)
        .toHaveBeenCalledWith(0, 0, 'comment', { value: 'Edited comment' });
    });

    it('should not editing comment by context menu if `beforeSetCellMeta` returned false', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
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
        beforeSetCellMeta: () => false
      });

      selectCell(0, 0);
      contextMenu();

      const editCommentButton = $('.htItemWrapper').filter(function() {
        return $(this).text() === 'Edit comment';
      })[0];

      $(editCommentButton).simulate('mousedown');
      $(editCommentButton).simulate('mouseup');

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
        data: Handsontable.helper.createSpreadsheetData(10, 10),
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
      const editor = plugin.editor.getInputElement();

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
        data: Handsontable.helper.createSpreadsheetData(6, 6),
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
      const editor = plugin.editor.getInputElement();

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
        data: Handsontable.helper.createSpreadsheetData(6, 6),
        cell: [
          { row: 1, col: 1, comment: { value: 'Hello world!' } },
          { row: 1, col: 2, comment: { value: 'Yes!' } }
        ],
        rowHeaders: true,
        colHeaders: true,
        comments: true,
        licenseKey: 'non-commercial-and-evaluation'
      });

      const container2 = $('<div id="hot2"></div>').appendTo(spec().$container).handsontable({
        data: Handsontable.helper.createSpreadsheetData(6, 6),
        cell: [{ row: 1, col: 1, comment: { value: 'Hello world!' } }],
        rowHeaders: true,
        colHeaders: true,
        comments: true,
        licenseKey: 'non-commercial-and-evaluation'
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
        data: Handsontable.helper.createSpreadsheetData(6, 6),
        cell: [
          { row: 1, col: 1, comment: { value: 'Hello world!' } },
          { row: 1, col: 2, comment: { value: 'Yes!' } }
        ],
        rowHeaders: true,
        colHeaders: true,
        comments: true,
        licenseKey: 'non-commercial-and-evaluation'
      });

      const container2 = $('<div id="hot2"></div>').appendTo(spec().$container).handsontable({
        data: Handsontable.helper.createSpreadsheetData(6, 6),
        cell: [{ row: 1, col: 1, comment: { value: 'Hello world!' } }],
        rowHeaders: true,
        colHeaders: true,
        comments: true,
        licenseKey: 'non-commercial-and-evaluation'
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

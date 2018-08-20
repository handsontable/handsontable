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

      await sleep(300);

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

    it('should trigger `afterSetCellMeta` callback when `setCommentAtCell` function is invoked', () => {
      const afterSetCellMetaCallback = jasmine.createSpy('afterSetCellMetaCallback');
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
        afterSetCellMeta: afterSetCellMetaCallback
      });

      const plugin = hot.getPlugin('comments');

      plugin.setCommentAtCell(1, 1, 'Added comment');
      expect(afterSetCellMetaCallback).toHaveBeenCalledWith(1, 1, 'comment', { value: 'Added comment' }, undefined, undefined);
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
      expect(afterSetCellMetaCallback).toHaveBeenCalledWith(1, 1, 'comment', undefined, undefined, undefined);
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

    $(addCommentButton).simulate('mousedown');

    const editor = hot.getPlugin('comments').editor.getInputElement();

    await sleep(300);

    expect($(editor).parents('.htComments')[0].style.display).toEqual('block');
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

      $(addCommentButton).simulate('mousedown');

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

      $(deleteCommentButton).simulate('mousedown');

      expect(getCellMeta(1, 1).comment).toEqual(void 0);
    });

    it('should remove comments from a selected group of cells after clicking the "Delete comment" entry', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'Test comment' } },
          { row: 2, col: 2, comment: { value: 'Test comment 2' } }
        ]
      });

      expect(getCellMeta(1, 1).comment.value).toEqual('Test comment');
      expect(getCellMeta(2, 2).comment.value).toEqual('Test comment 2');

      selectCell(1, 1, 2, 2);
      contextMenu();

      const deleteCommentButton = $('.htItemWrapper').filter(function() {
        return $(this).text() === 'Delete comment';
      })[0];

      $(deleteCommentButton).simulate('mousedown');

      expect(getCellMeta(1, 1).comment).toEqual(void 0);
      expect(getCellMeta(2, 2).comment).toEqual(void 0);
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

      $(readOnlyComment).simulate('mousedown');
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

      $(deleteCommentButton).simulate('mousedown');

      expect(afterSetCellMetaCallback).toHaveBeenCalledWith(1, 1, 'comment', undefined, undefined, undefined);
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

      await sleep(100);

      $('body').simulate('mousedown');
      $('body').simulate('mouseup');
      textarea.blur();

      await sleep(400);

      expect(afterSetCellMetaCallback).toHaveBeenCalledWith(0, 0, 'comment', { value: 'Edited comment' }, undefined, undefined);
    });
  });
});

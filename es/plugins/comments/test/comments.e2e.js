function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

describe('Comments', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('Enabling the plugin', function () {
    it('should enable the plugin in the initial config', function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true
      });

      expect(hot.getPlugin('comments').isEnabled()).toBe(true);
    });

    it('should enable the plugin using updateSettings', function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4)
      });

      expect(hot.getPlugin('comments').isEnabled()).toBe(false);

      updateSettings({
        comments: true
      });

      expect(hot.getPlugin('comments').isEnabled()).toBe(true);
    });
  });

  describe('updateSettings', function () {
    it('should change delay, after which comment is showed #4323', _asyncToGenerator(function* () {
      var rows = 10;
      var columns = 10;
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(rows, columns),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        comments: true,
        columns: function columns() {
          return {
            comment: {
              value: 'test'
            }
          };
        }
      });

      var plugin = hot.getPlugin('comments');
      var editor = plugin.editor.getInputElement();

      updateSettings({
        comments: {
          displayDelay: 100
        }
      });

      $(getCell(1, 1)).simulate('mouseover', {
        clientX: Handsontable.dom.offset(getCell(1, 1)).left + 5,
        clientY: Handsontable.dom.offset(getCell(1, 1)).top + 5
      });

      yield sleep(300);

      expect(editor.parentNode.style.display).toEqual('block');
    }));
  });

  describe('Styling', function () {
    it('should display comment indicators in the appropriate cells', function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
        cell: [{ row: 1, col: 1, comment: { value: 'test' } }, { row: 2, col: 2, comment: { value: 'test' } }]
      });

      expect(getCell(1, 1).className.indexOf('htCommentCell')).toBeGreaterThan(-1);
      expect(getCell(2, 2).className.indexOf('htCommentCell')).toBeGreaterThan(-1);
    });
  });

  describe('Displaying comment after `mouseover` event', function () {
    it('should display comment after predefined delay when custom `displayDelay` ' + 'option of `comments` plugin wasn\'t set', function (done) {
      var rows = 10;
      var columns = 10;
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(rows, columns),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        comments: true,
        columns: function columns() {
          return {
            comment: {
              value: 'test'
            }
          };
        }
      });

      $(getCell(1, 1)).simulate('mouseover', {
        clientX: Handsontable.dom.offset(getCell(1, 1)).left + 5,
        clientY: Handsontable.dom.offset(getCell(1, 1)).top + 5
      });

      var plugin = hot.getPlugin('comments');
      var editor = plugin.editor.getInputElement();

      setTimeout(function () {
        expect(editor.parentNode.style.display).toEqual('block');
        done();
      }, 300);
    });

    it('should display comment after defined delay when custom `displayDelay` ' + 'option of `comments` plugin was set', function (done) {
      var rows = 10;
      var columns = 10;
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(rows, columns),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        comments: {
          displayDelay: 400
        },
        columns: function columns() {
          return {
            comment: {
              value: 'test'
            }
          };
        }
      });

      $(getCell(1, 1)).simulate('mouseover', {
        clientX: Handsontable.dom.offset(getCell(1, 1)).left + 5,
        clientY: Handsontable.dom.offset(getCell(1, 1)).top + 5
      });

      var plugin = hot.getPlugin('comments');
      var editor = plugin.editor.getInputElement();

      setTimeout(function () {
        expect(editor.parentNode.style.display).toEqual('none');
      }, 300);

      setTimeout(function () {
        expect(editor.parentNode.style.display).toEqual('block');
        done();
      }, 450);
    });
  });

  describe('API', function () {
    it('should return the comment from a proper cell, when using the getCommentAtCell method', function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: {
          displayDelay: 400
        },
        cell: [{ row: 1, col: 1, comment: { value: 'test' } }, { row: 2, col: 2, comment: { value: 'another test' } }]
      });

      var plugin = hot.getPlugin('comments');

      expect(plugin.getCommentAtCell(1, 1)).toEqual('test');
      expect(plugin.getCommentAtCell(2, 2)).toEqual('another test');
    });

    it('should return the comment from a proper cell, when using the setRange and getComment methods', function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
        cell: [{ row: 1, col: 1, comment: { value: 'test' } }, { row: 2, col: 2, comment: { value: 'another test' } }]
      });

      var plugin = hot.getPlugin('comments');

      plugin.setRange({ from: { row: 1, col: 1 } });
      expect(plugin.getComment()).toEqual('test');
      plugin.setRange({ from: { row: 2, col: 2 } });
      expect(plugin.getComment()).toEqual('another test');
    });

    it('should allow inserting comments using the `setCommentAtCell` method', function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true
      });

      var plugin = hot.getPlugin('comments');

      expect(getCellMeta(1, 1).comment).toEqual(void 0);

      plugin.setCommentAtCell(1, 1, 'test comment');

      expect(getCellMeta(1, 1).comment.value).toEqual('test comment');
    });

    it('should trigger `afterSetCellMeta` callback when `setCommentAtCell` function is invoked', function () {
      var afterSetCellMetaCallback = jasmine.createSpy('afterSetCellMetaCallback');
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
        afterSetCellMeta: afterSetCellMetaCallback
      });

      var plugin = hot.getPlugin('comments');

      plugin.setCommentAtCell(1, 1, 'Added comment');
      expect(afterSetCellMetaCallback).toHaveBeenCalledWith(1, 1, 'comment', { value: 'Added comment' }, undefined, undefined);
    });

    it('should allow removing comments using the `removeCommentAtCell` method', function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
        cell: [{ row: 1, col: 1, comment: { value: 'test' } }]
      });

      var plugin = hot.getPlugin('comments');

      expect(getCellMeta(1, 1).comment.value).toEqual('test');

      plugin.removeCommentAtCell(1, 1);

      expect(getCellMeta(1, 1).comment).toEqual(void 0);
    });

    it('should trigger `afterSetCellMeta` callback when `removeCommentAtCell` function is invoked', function () {
      var afterSetCellMetaCallback = jasmine.createSpy('afterSetCellMetaCallback');
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
        cell: [{ row: 1, col: 1, comment: { value: 'test' } }],
        afterSetCellMeta: afterSetCellMetaCallback
      });

      var plugin = hot.getPlugin('comments');

      plugin.removeCommentAtCell(1, 1);
      expect(afterSetCellMetaCallback).toHaveBeenCalledWith(1, 1, 'comment', undefined, undefined, undefined);
    });

    it('should allow opening the comment editor using the `showAtCell` method', function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true
      });

      var plugin = hot.getPlugin('comments');
      var editor = plugin.editor.getInputElement();

      expect(editor.parentNode.style.display).toEqual('none');

      plugin.showAtCell(1, 1);

      expect(editor.parentNode.style.display).toEqual('block');
    });

    it('should allow closing the comment editor using the `hide` method', function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true
      });

      var plugin = hot.getPlugin('comments');
      var editor = plugin.editor.getInputElement();
      plugin.showAtCell(1, 1);
      expect(editor.parentNode.style.display).toEqual('block');

      plugin.hide();

      expect(editor.parentNode.style.display).toEqual('none');
    });
  });

  it('`updateCommentMeta` & `setComment` functions should extend cellMetaObject properly', function () {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      comments: true
    });
    var plugin = hot.getPlugin('comments');
    var readOnly = void 0;
    var comment = void 0;

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

  it('should not close the comment editor immediately after opening #4323', _asyncToGenerator(function* () {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      comments: {
        displayDelay: 0
      }
    });

    selectCell(1, 1);
    contextMenu();

    var addCommentButton = $('.htItemWrapper').filter(function () {
      return $(this).text() === 'Add comment';
    })[0];

    $(addCommentButton).simulate('mouseover', {
      clientX: Handsontable.dom.offset(addCommentButton).left + 5,
      clientY: Handsontable.dom.offset(addCommentButton).top + 5
    });

    $(addCommentButton).simulate('mousedown');

    var editor = hot.getPlugin('comments').editor.getInputElement();

    yield sleep(300);

    expect($(editor).parents('.htComments')[0].style.display).toEqual('block');
  }));

  describe('Using the Context Menu', function () {
    it('should open the comment editor when clicking the "Add comment" entry', function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        comments: true
      });

      selectCell(1, 1);
      contextMenu();

      var addCommentButton = $('.htItemWrapper').filter(function () {
        return $(this).text() === 'Add comment';
      })[0];

      $(addCommentButton).simulate('mousedown');

      var editor = hot.getPlugin('comments').editor.getInputElement();

      expect($(editor).parents('.htComments')[0].style.display).toEqual('block');
    });

    it('should remove the comment from a cell after clicking the "Delete comment" entry', function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        comments: true,
        cell: [{ row: 1, col: 1, comment: { value: 'Test comment' } }]
      });

      expect(getCellMeta(1, 1).comment.value).toEqual('Test comment');

      selectCell(1, 1);
      contextMenu();

      var deleteCommentButton = $('.htItemWrapper').filter(function () {
        return $(this).text() === 'Delete comment';
      })[0];

      $(deleteCommentButton).simulate('mousedown');

      expect(getCellMeta(1, 1).comment).toEqual(void 0);
    });

    it('should remove comments from a selected group of cells after clicking the "Delete comment" entry', function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        comments: true,
        cell: [{ row: 1, col: 1, comment: { value: 'Test comment' } }, { row: 2, col: 2, comment: { value: 'Test comment 2' } }]
      });

      expect(getCellMeta(1, 1).comment.value).toEqual('Test comment');
      expect(getCellMeta(2, 2).comment.value).toEqual('Test comment 2');

      selectCell(1, 1, 2, 2);
      contextMenu();

      var deleteCommentButton = $('.htItemWrapper').filter(function () {
        return $(this).text() === 'Delete comment';
      })[0];

      $(deleteCommentButton).simulate('mousedown');

      expect(getCellMeta(1, 1).comment).toEqual(void 0);
      expect(getCellMeta(2, 2).comment).toEqual(void 0);
    });

    it('should make the comment editor\'s textarea read-only after clicking the "Read-only comment" entry', function (done) {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        comments: true,
        cell: [{ row: 1, col: 1, comment: { value: 'Test comment' } }]
      });

      selectCell(1, 1);
      contextMenu();

      var editor = hot.getPlugin('comments').editor.getInputElement();

      expect($(editor)[0].readOnly).toBe(false);

      var readOnlyComment = $('.htItemWrapper').filter(function () {
        return $(this).text() === 'Read-only comment';
      })[0];

      $(readOnlyComment).simulate('mousedown');
      $(document).simulate('mouseup');

      $(getCell(1, 1)).simulate('mouseover', {
        clientX: Handsontable.dom.offset(getCell(1, 1)).left + 5,
        clientY: Handsontable.dom.offset(getCell(1, 1)).top + 5
      });

      setTimeout(function () {
        expect($(editor)[0].readOnly).toBe(true);
        done();
      }, 550);
    });
  });

  describe('Hooks invoked after changing cell meta', function () {
    it('should trigger `afterSetCellMeta` callback after deleting comment by context menu', function () {
      var afterSetCellMetaCallback = jasmine.createSpy('afterSetCellMetaCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        comments: true,
        columns: function columns() {
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

      var deleteCommentButton = $('.htItemWrapper').filter(function () {
        return $(this).text() === 'Delete comment';
      })[0];

      $(deleteCommentButton).simulate('mousedown');

      expect(afterSetCellMetaCallback).toHaveBeenCalledWith(1, 1, 'comment', undefined, undefined, undefined);
    });

    it('should trigger `afterSetCellMeta` callback after editing comment by context menu', _asyncToGenerator(function* () {
      var afterSetCellMetaCallback = jasmine.createSpy('afterSetCellMetaCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        comments: true,
        columns: function columns() {
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

      var editCommentButton = $('.htItemWrapper').filter(function () {
        return $(this).text() === 'Edit comment';
      })[0];

      $(editCommentButton).simulate('mousedown');
      $(editCommentButton).simulate('mouseup');

      var textarea = spec().$container[0].parentNode.querySelector('.htCommentTextArea');
      textarea.focus();
      textarea.value = 'Edited comment';

      yield sleep(100);

      $('body').simulate('mousedown');
      $('body').simulate('mouseup');
      textarea.blur();

      yield sleep(400);

      expect(afterSetCellMetaCallback).toHaveBeenCalledWith(0, 0, 'comment', { value: 'Edited comment' }, undefined, undefined);
    }));
  });
});
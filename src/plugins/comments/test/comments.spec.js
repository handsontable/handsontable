describe('Comments', function() {
  var id = 'testContainer';

  beforeEach(function() {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('Enabling the plugin', function() {
    it('should enable the plugin in the initial config', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true
      });

      expect(hot.getPlugin('comments').isEnabled()).toBe(true);
    });

    it('should enable the plugin using updateSettings', function() {
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

  describe('Styling', function() {
    it('should display comment indicators in the appropriate cells', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
        cell: [
          {row: 1, col: 1, comment: {value: 'test'}},
          {row: 2, col: 2, comment: {value: 'test'}}
        ]
      });

      expect(getCell(1, 1).className.indexOf('htCommentCell')).toBeGreaterThan(-1);
      expect(getCell(2, 2).className.indexOf('htCommentCell')).toBeGreaterThan(-1);
    });
  });

  describe('API', function() {
    it('should allow inserting comments using the `setCommentAtCell` method', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true
      });

      var plugin = hot.getPlugin('comments');

      expect(getCellMeta(1, 1).comment).toEqual(void 0);

      plugin.setCommentAtCell(1, 1, 'test comment');

      expect(getCellMeta(1, 1).comment.value).toEqual('test comment');
    });

    it('should trigger `afterSetCellMeta` callback when `setCommentAtCell` function is invoked', function() {
      var afterSetCellMetaCallback = jasmine.createSpy('afterSetCellMetaCallback');
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
        afterSetCellMeta: afterSetCellMetaCallback
      });

      var plugin = hot.getPlugin('comments');

      plugin.setCommentAtCell(1, 1, 'Added comment');
      expect(afterSetCellMetaCallback).toHaveBeenCalledWith(1, 1, 'comment', {value: 'Added comment'}, undefined, undefined);
    });

    it('should allow removing comments using the `removeCommentAtCell` method', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
        cell: [
          {row: 1, col: 1, comment: {value: 'test'}}
        ]
      });

      var plugin = hot.getPlugin('comments');

      expect(getCellMeta(1, 1).comment.value).toEqual('test');

      plugin.removeCommentAtCell(1, 1);

      expect(getCellMeta(1, 1).comment).toEqual(void 0);
    });

    it('should trigger `afterSetCellMeta` callback when `removeCommentAtCell` function is invoked', function() {
      var afterSetCellMetaCallback = jasmine.createSpy('afterSetCellMetaCallback');
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
        cell: [
          {row: 1, col: 1, comment: {value: 'test'}}
        ],
        afterSetCellMeta: afterSetCellMetaCallback
      });

      var plugin = hot.getPlugin('comments');

      plugin.removeCommentAtCell(1, 1);
      expect(afterSetCellMetaCallback).toHaveBeenCalledWith(1, 1, 'comment', undefined, undefined, undefined);
    });

    it('should allow opening the comment editor using the `showAtCell` method', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
      });

      var plugin = hot.getPlugin('comments');
      var editor = plugin.editor.getInputElement();

      expect(editor.parentNode.style.display).toEqual('none');

      plugin.showAtCell(1, 1);

      expect(editor.parentNode.style.display).toEqual('block');
    });

    it('should allow closing the comment editor using the `hide` method', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
      });

      var plugin = hot.getPlugin('comments');
      var editor = plugin.editor.getInputElement();
      plugin.showAtCell(1, 1);
      expect(editor.parentNode.style.display).toEqual('block');

      plugin.hide();

      expect(editor.parentNode.style.display).toEqual('none');
    });
  });

  it('`updateCommentMeta` & `setComment` functions should extend cellMetaObject properly', function() {
    var comment, readOnly;
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      comments: true
    });
    var plugin = hot.getPlugin('comments');

    setCellMeta(0, 0, 'comment', {readOnly: true});
    plugin.updateCommentMeta(0, 0, {value: 'Test'});

    comment = getCellMeta(0, 0).comment;
    readOnly = comment && comment.readOnly;

    expect(readOnly).toEqual(true);

    plugin.setRange({from: {row: 0, col: 0}, to: {row: 0, col: 0}});
    plugin.setComment('Test2');

    comment = getCellMeta(0, 0).comment;
    readOnly = comment && comment.readOnly;

    expect(readOnly).toEqual(true);
  });

  describe('Using the Context Menu', function() {
    it('should open the comment editor when clicking the "Add comment" entry', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        comments: true
      });

      selectCell(1, 1);
      contextMenu();

      var addCommentButton = $('.htItemWrapper').filter(function() {
        return $(this).text() === 'Add comment';
      })[0];

      $(addCommentButton).simulate('mousedown');

      var editor = hot.getPlugin('comments').editor.getInputElement();

      expect($(editor).parents('.htComments')[0].style.display).toEqual('block');
    });

    it('should remove the comment from a cell after clicking the "Delete comment" entry', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        comments: true,
        cell: [
          {row: 1, col: 1, comment: {value: 'Test comment'}}
        ]
      });

      expect(getCellMeta(1, 1).comment.value).toEqual('Test comment');

      selectCell(1, 1);
      contextMenu();

      var deleteCommentButton = $('.htItemWrapper').filter(function() {
        return $(this).text() === 'Delete comment';
      })[0];

      $(deleteCommentButton).simulate('mousedown');

      expect(getCellMeta(1, 1).comment).toEqual(void 0);
    });

    it('should remove comments from a selected group of cells after clicking the "Delete comment" entry', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        comments: true,
        cell: [
          {row: 1, col: 1, comment: {value: 'Test comment'}},
          {row: 2, col: 2, comment: {value: 'Test comment 2'}}
        ]
      });

      expect(getCellMeta(1, 1).comment.value).toEqual('Test comment');
      expect(getCellMeta(2, 2).comment.value).toEqual('Test comment 2');

      selectCell(1, 1, 2, 2);
      contextMenu();

      var deleteCommentButton = $('.htItemWrapper').filter(function() {
        return $(this).text() === 'Delete comment';
      })[0];

      $(deleteCommentButton).simulate('mousedown');

      expect(getCellMeta(1, 1).comment).toEqual(void 0);
      expect(getCellMeta(2, 2).comment).toEqual(void 0);
    });

    it('should make the comment editor\'s textarea read-only after clicking the "Read only comment" entry', function(done) {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        comments: true,
        cell: [
          {row: 1, col: 1, comment: {value: 'Test comment'}}
        ]
      });

      selectCell(1, 1);
      contextMenu();

      var editor = hot.getPlugin('comments').editor.getInputElement();

      expect($(editor)[0].readOnly).toBe(false);

      var readOnlyComment = $('.htItemWrapper').filter(function() {
        return $(this).text() === 'Read only comment';
      })[0];

      $(readOnlyComment).simulate('mousedown');
      $(document).simulate('mouseup');

      $(getCell(1, 1)).simulate('mouseover', {
        clientX: Handsontable.Dom.offset(getCell(1, 1)).left + 5,
        clientY: Handsontable.Dom.offset(getCell(1, 1)).top + 5,
      });

      setTimeout(function() {
        expect($(editor)[0].readOnly).toBe(true);
        done();
      }, 550);
    });
  });

  describe('Hooks invoked after changing cell meta', function() {
    it('should trigger `afterSetCellMeta` callback after deleting comment by context menu', function() {
      var afterSetCellMetaCallback = jasmine.createSpy('afterSetCellMetaCallback');
      var rows = 10, columns = 10;

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(rows, columns),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        comments: true,
        columns: function () {
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

    // Don't work in PhantomJS
    // It will work probably when #3961 will be fixed

    xit('should trigger `afterSetCellMeta` callback after editing comment by context menu', function (done) {
      var afterSetCellMetaCallback = jasmine.createSpy('afterSetCellMetaCallback');
      var rows = 10, columns = 10;

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(rows, columns),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        comments: true,
        columns: function () {
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

      setTimeout(function () {
        $('.htCommentTextArea').val('Edited comment');

        // changing focus

        $('body').simulate('mousedown');

        setTimeout(function () {
          expect(afterSetCellMetaCallback).toHaveBeenCalledWith(0, 0, 'comment', {value: 'Edited comment'}, undefined, undefined);
          done();
        }, 100);
      }, 100);
    });
  });
});

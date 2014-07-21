function Comments(instance) {

  var doSaveComment = function (row, col, comment, instance) {
      instance.setCellMeta(row, col, 'comment', comment);
      instance.render();
    },
    saveComment = function (range, comment, instance) {
      //LIKE IN EXCEL (TOP LEFT CELL)
      doSaveComment(range.from.row, range.from.col, comment, instance);
    },
    hideCommentTextArea = function (commentBox) {
      commentBox.style.display = 'none';
      document.getElementsByClassName('htCommentTextArea')[0].value = '';
    },
    bindMouseEvent = function (range, commentBox) {
      function commentsListener(event) {
        if (!(event.target.className == 'htCommentTextArea' || event.target.innerHTML.indexOf('Comment') != -1)) {
          var value = document.getElementsByClassName('htCommentTextArea')[0].value; // $(commentBox).find('textarea').val();
          if (value.trim().length > 1) {
            saveComment(range, value, instance);
          }
          unBindMouseEvent();
          hideCommentTextArea(commentBox);
        }
      }

      $(document).on('mousedown.htCommment', Handsontable.helper.proxy(commentsListener));
    },
    unBindMouseEvent = function () {
      $(document).off('mousedown.htCommment');
    },
    placeCommentBox = function (range, commentBox) {
      var TD = instance.view.wt.wtTable.getCell(range.from),
        offset = instance.view.wt.wtDom.offset(TD),
        lastColWidth = instance.getColWidth(range.to.col);

      commentBox.style.position = 'absolute';
      commentBox.style.left = offset.left + lastColWidth + 'px';
      commentBox.style.top = offset.top + 'px';
      commentBox.style.zIndex = 2;
      bindMouseEvent(range, commentBox);
    },
    createCommentBox = function (value) {
      var comments = document.getElementsByClassName('htComments')[0];

      if (!comments) {
        comments = document.createElement('DIV');

        var textArea = document.createElement('TEXTAREA');
        Handsontable.Dom.addClass(textArea, 'htCommentTextArea');
        textArea.style.backgroundColor = '#FFFACD';
        textArea.style.boxShadow = '1px 1px 2px #bbb';
        textArea.style.fontFamily = 'Arial';
        comments.appendChild(textArea);

        Handsontable.Dom.addClass(comments, 'htComments');
        document.getElementsByTagName('body')[0].appendChild(comments);
      }

      if (value) {
        document.getElementsByClassName('htCommentTextArea')[0].value = value;
      }
      var tA = document.getElementsByClassName('htCommentTextArea')[0];
      tA.focus();
      return comments;
    }

    ;

  return {
    showComment: function (range) {
      var meta = instance.getCellMeta(range.from.row, range.from.col),
        value = '';

      if (meta.comment) {
        value = meta.comment;
      }
      var commentBox = createCommentBox(value);
      commentBox.style.display = 'block';
      placeCommentBox(range, commentBox);
    },

    removeComment: function (row, col) {
      instance.removeCellMeta(row, col, 'comment');
      instance.render();
    },


    checkSelectionCommentsConsistency : function () {
      var hasComment = false;
      // IN EXCEL THERE IS COMMENT ONLY FOR TOP LEFT CELL IN SELECTION
      var cell = instance.getSelectedRange().from;

      if(instance.getCellMeta(cell.row,cell.col).comment) {
        hasComment = true;
      }
      return hasComment;
    }

  };
}


var init = function () {
    var instance = this;
    var commentsSetting = instance.getSettings().comments;

    if (commentsSetting) {
      Handsontable.Comments = new Comments(instance);
    }
  },
  addCommentsActionsToContextMenu = function (defaultOptions) {
    var instance = this;
    if (!instance.getSettings().comments) {
      return;
    }

    defaultOptions.items.commentsCellsSeparator = Handsontable.ContextMenu.SEPARATOR;

    defaultOptions.items.commentsAddEdit = {
      name: function () {
        var hasComment = Handsontable.Comments.checkSelectionCommentsConsistency();  //contextMenu.checkSelectionCommentsConsistency(this);
        return hasComment ? "Edit Comment" : "Add Comment";

      },
      callback: function (key, selection, event) {
        Handsontable.Comments.showComment(this.getSelectedRange());
      },
      disabled: function () {
        return false;
      }
    };

    defaultOptions.items.commentsRemove = {
      name: function () {
        return "Delete Comment"
      },
      callback: function (key, selection, event) {
        Handsontable.Comments.removeComment(selection.start.row, selection.start.col);
      },
      disabled: function () {
        var hasComment = Handsontable.Comments.checkSelectionCommentsConsistency();  //contextMenu.checkSelectionCommentsConsistency(this);
        //var hasComment = contextMenu.checkSelectionCommentsConsistency(this);
        return !hasComment;
      }
    }
  };

Handsontable.hooks.add('beforeInit', init);
Handsontable.hooks.add('afterContextMenuDefaultOptions', addCommentsActionsToContextMenu);

import * as dom from './../../dom.js';
import {eventManager as eventManagerObject} from './../../eventManager.js';
import {WalkontableCellCoords} from './../../3rdparty/walkontable/src/cellCoords.js';
import {registerPlugin, getPlugin} from './../../plugins.js';
import BasePlugin from './../_base.js';

/**
 * @class Comments
 * @plugin
 */
class Comments extends BasePlugin {
  /**
   * @param {Object} hotInstance
   */
  constructor (hotInstance) {
    super (hotInstance);

    this.hot.addHook('afterContextMenuDefaultOptions', (options) => this.addToContextMenu(options));
    this.hot.addHook('afterRenderer', (TD, row, col, prop, value, cellProperties) => Comments.afterRenderer(TD, row, col, prop, value, cellProperties));

    let eventManager = eventManagerObject(this);

    eventManager.addEventListener(document, 'mouseover', (event) => this.bindMouseOverCommentListener(event));
  }

  /***
   * Hide placeholder for comment't textarea and clear value
   */
  hideCommentTextArea () {
    let commentBox = Comments.createCommentBox();
    commentBox.style.display = 'none';
    commentBox.value = '';
  }


  /***
   * Listen for mouse over comment event
   *
   * @param event
   * @param range
   */
  commentsListener(event, range) {
    let commentPlugin = getPlugin(this.hot, 'Comments'),
      eventManager = eventManagerObject(commentPlugin);

    eventManager.removeEventListener(document, 'mouseover');

    if (!(event.target.className == 'htCommentTextArea' || event.target.innerHTML.indexOf('Comment') != -1)) {
      let value = document.querySelector('.htCommentTextArea').value;

      if (value.trim().length > 1) {
        commentPlugin.saveComment(range.from.row, range.from.col, value);
      }

      commentPlugin.unBindMouseEvent();
      commentPlugin.hideCommentTextArea();
    }
  }

  /***
   * Bind mouse events
   *
   * @param range
   */
  bindEvents (range) {
    let commentPlugin = getPlugin(this.hot, 'Comments'),
      eventManager = eventManagerObject(commentPlugin);

    eventManager.addEventListener(document, 'mousedown', (event) => this.commentsListener(event, range));
  }

  /***
   * Unbind mouse events
   */
  unBindMouseEvent () {
    let commentPlugin = getPlugin(this.hot, 'Comments'),
      eventManager = eventManagerObject(commentPlugin);

    eventManager.removeEventListener(document, 'mousedown');
    eventManager.addEventListener(document, 'mouseover', (event) => this.bindMouseOverCommentListener(event));
  }


  /***
   * Bind mouse over commented cell event
   *
   * @param event
   */
  bindMouseOverCommentListener (event) {
    if (event.target.className.indexOf('htCommentCell') != -1) {
      this.unBindMouseEvent();
      let coords = this.hot.view.wt.wtTable.getCoords(event.target),
        range = {
          from: new WalkontableCellCoords(coords.row, coords.col)
        };

      this.showComment(range);
    } else if (event.target.className != 'htCommentTextArea') {
      this.hideCommentTextArea();
    }
  }

  /***
   * Save comment for cell
   *
   * @param row
   * @param col
   * @param comment
   */
  saveComment (row, col, comment) {
    this.hot.setCellMeta(row, col, 'comment', comment);
    this.hot.render();
  }

  /***
   * Remove comment
   *
   * @param row
   * @param col
   */
  removeComment (row, col) {
    this.hot.removeCellMeta(row, col, 'comment');
    this.hot.render();
  }

  /***
   * Place comment textarea in proper place
   *
   * @param range
   * @param commentBox
   */
  placeCommentBox (range, commentBox) {
    let TD = this.hot.view.wt.wtTable.getCell(range.from),
      offset = dom.offset(TD),
      lastColWidth = this.hot.getColWidth(range.from.col);

    //console.log(this.hot.view);

    //tableOffsetTop = this.hot.view.wt.wtTable.tableOffset.top;

    commentBox.style.position = 'absolute';
    commentBox.style.left = offset.left + lastColWidth + 'px'; // TODO - scroll
    commentBox.style.top = offset.top + 'px'; // TODO - scroll

    commentBox.style.zIndex = 2;

    this.bindEvents(range, commentBox);
  }

  /***
   * Create placeholder for comment's textarea
   *
   * @param value
   * @returns {Element}
   */
  static createCommentBox (value) {
    let comments = document.querySelector('.htComments');

    if (!comments) {
      comments = document.createElement('DIV');

      let textArea = document.createElement('TEXTAREA');
      dom.addClass(textArea, 'htCommentTextArea');
      comments.appendChild(textArea);

      dom.addClass(comments, 'htComments');
      document.getElementsByTagName('body')[0].appendChild(comments);
    }

    value = value || '';

    document.querySelector('.htCommentTextArea').value = value;

    return comments;
  }

  /***
   * Show comment for selected range
   *
   * @param range
   */
  showComment (range) {
    let meta = this.hot.getCellMeta(range.from.row, range.from.col),
      value = '',
      commentBox;

    if (meta.comment) {
      value = meta.comment;
    }

    commentBox = Comments.createCommentBox(value);
    commentBox.style.display = 'block';
    this.placeCommentBox(range, commentBox);
  }


  static afterRenderer(TD, row, col, prop, value, cellProperties) {
    if (cellProperties.comment) {
      dom.addClass(TD, cellProperties.commentedCellClassName);
    }
  }


  /***
   * Check if there is a comment for selected range
   *
   * @returns {boolean}
   */
  checkSelectionCommentsConsistency () {
      let hasComment = false,
      // IN EXCEL THERE IS COMMENT ONLY FOR TOP LEFT CELL IN SELECTION
        cell = this.hot.getSelectedRange().from;

      if (this.hot.getCellMeta(cell.row, cell.col).comment) {
        hasComment = true;
      }
      return hasComment;
    }

  /**
   * Add Comments to context menu
   *
   * @param defaultOptions
   */
  addToContextMenu(defaultOptions) {
    if (!this.hot.getSettings().comments) {
      return;
    }

    defaultOptions.items.push(
      Handsontable.ContextMenu.SEPARATOR,
      {
        key: 'commentsAddEdit',
        name: () => {
          return this.checkSelectionCommentsConsistency() ? "Edit Comment" : "Add Comment";
        },
        callback: () => {
          this.showComment(this.hot.getSelectedRange());
        },
        disabled: function() {
          return false;
        }
      },
      {
        key: 'commentsRemove',
        name: function() {
          return "Delete Comment";
        },
        callback: (key, selection) => {
          this.removeComment(selection.start.row, selection.start.col);
        },
        disabled: () => {
          return !this.checkSelectionCommentsConsistency();
        }
      }
    );
  }
}

export {Comments};

registerPlugin('Comments', Comments);

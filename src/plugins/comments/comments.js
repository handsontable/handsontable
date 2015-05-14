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
  constructor(hotInstance) {
    super(hotInstance);

    if (!this.hot.getSettings().comments) {
      return;
    }

    this.hot.addHook('afterInit', () => this.bindMouseOverEvent());
    this.hot.addHook('afterContextMenuDefaultOptions', (options) => this.addToContextMenu(options));
    this.hot.addHook('afterRenderer', (TD, row, col, prop, value, cellProperties) => {
        Comments.afterRenderer(TD, cellProperties);
      }
    );
  }

  /***
   * Save comment listener
   *
   * @param event
   * @param range
   */
  saveCommentListener(event, range) {
    let commentPlugin = getPlugin(this.hot, 'Comments'),
      eventManager = eventManagerObject(commentPlugin);

    if (!(event.target.className === 'htCommentTextArea' || event.target.innerHTML.indexOf('Comment') != -1)) {
      eventManager.removeEventListener(document, 'mouseover');
      let value = this.getCommentValue(range);

      this.saveComment(range.from.row, range.from.col, value);
      Comments.hideCommentTextArea(range);
    }
  }



  /***
   * Bind mouse over event
   */
  bindMouseOverEvent() {
    let commentPlugin = getPlugin(this.hot, 'Comments'),
      eventManager = eventManagerObject(commentPlugin);

    eventManager.addEventListener(document, 'mousedown', (event) => {
      if (!(event.target.innerHTML.indexOf('Comment') !== -1 || event.target.className === 'htCommentTextArea')){
        Comments.hideCommentTextAreas();
      }
    });

    eventManager.addEventListener(this.hot.view.wt.wtTable.TABLE, 'mouseover', (event) => this.bindMouseOverListener(event));
  }

  /***
   * Bind action when mouse is over textarea
   * @param range
   * @param commentBox
   */
  bindOverTextArea(range, commentBox) {
    let commentPlugin = getPlugin(this.hot, 'Comments'),
      eventManager = eventManagerObject(commentPlugin);

    eventManager.addEventListener(commentBox, 'mouseover', () => {
      eventManager.removeEventListener(document, 'mouseover');
      eventManager.removeEventListener(commentBox, 'mouseover');

      eventManager.addEventListener(document, 'mouseover', (event) => this.saveCommentListener(event, range));
    });

  }

  /***
   * Mouse over listener
   *
   * @param event
   */
  bindMouseOverListener(event) {
    if (event.target.className.indexOf('htCommentCell') != -1) {
      let coordinates = this.hot.view.wt.wtTable.getCoords(event.target),
        range = {
          from: new WalkontableCellCoords(coordinates.row, coordinates.col)
        };

      this.showComment(range);
    }
  }


  /***
   * Save comment for cell
   *
   * @param row
   * @param col
   * @param comment
   */
  saveComment(row, col, comment) {
    this.hot.setCellMeta(row, col, 'comment', comment);
    this.hot.render();
  }

  /***
   * Remove comment
   *
   * @param row
   * @param col
   */
  removeComment(row, col) {
    this.hot.removeCellMeta(row, col, 'comment');
    this.hot.render();
  }


  /***
   * Place comment textarea in proper place
   *
   * @param range
   * @param commentBox
   */
  placeCommentBox(range, commentBox) {
    let TD = this.hot.view.wt.wtTable.getCell(range.from),
      offset = dom.offset(TD),
      lastColWidth = this.hot.getColWidth(range.from.col),
      cellTopOffset = offset.top - this.hot.view.wt.wtOverlays.topOverlay.getScrollPosition(),
      cellLeftOffset = offset.left - this.hot.view.wt.wtOverlays.leftOverlay.getScrollPosition();

    commentBox.style.display = 'block';
    commentBox.style.position = 'absolute';
    commentBox.style.left = cellLeftOffset + lastColWidth + 'px';
    commentBox.style.top = cellTopOffset + 'px';
    commentBox.style.zIndex = 2;

    this.bindOverTextArea(range, commentBox);
  }

  /***
   * Create placeholder for comment's textarea
   *
   * @returns {Element}
   */
  static createCommentBox(range) {
    let comments = document.querySelector('.comment_' + range.from.row + '_' + range.from.col);

    if (!comments) {
      comments = document.createElement('DIV');
      dom.addClass(comments, 'htComments');
      dom.addClass(comments, 'comment_' + range.from.row + '_' + range.from.col);

      let textArea = document.createElement('TEXTAREA');
      dom.addClass(textArea, 'htCommentTextArea');

      comments.appendChild(textArea);

      document.body.appendChild(comments);
    }
    return comments;
  }

  /***
   * Set comment value
   *
   * @param value
   */
  static setCommentValue(commentBox, value) {
    value = value || '';
    commentBox.querySelector('.htCommentTextArea').value = value;
  }

  getCommentValue(range) {
    let comments = document.querySelector('.comment_' + range.from.row + '_' + range.from.col);
    if (comments) {
      return comments.querySelector('.htCommentTextArea').value;
    }
  }

  static hideCommentTextAreas () {
    let textAreas = document.querySelectorAll('.htComments');

    for (var i = 0, len = textAreas.length; i < len; i++) {
      document.body.removeChild(textAreas[i]);
    }
  }

  /***
   * Hide placeholder for comment't textarea and clear value
   */
  static hideCommentTextArea(range) {
    let comments = document.querySelector('.comment_' + range.from.row + '_' + range.from.col);

    if (comments) {
      document.body.removeChild(comments);
    }

    //let commentBox = Comments.createCommentBox();
    //commentBox.style.display = 'none';
    //Comments.setCommentValue();
  }

  /***
   * Show comment for selected range
   *
   * @param range
   */
  showComment(range) {
    let meta = this.hot.getCellMeta(range.from.row, range.from.col),
      commentBox = Comments.createCommentBox(range);

    Comments.setCommentValue(commentBox,meta.comment);

    this.placeCommentBox(range, commentBox);
  }

  static afterRenderer(TD, cellProperties) {
    if (cellProperties.comment) {
      dom.addClass(TD, cellProperties.commentedCellClassName);
    }
  }

  /***
   * Check if there is a comment for selected range
   *
   * @returns {boolean}
   */
  checkSelectionCommentsConsistency() {
    let hasComment = false,
      cell = this.hot.getSelectedRange().from; // IN EXCEL THERE IS COMMENT ONLY FOR TOP LEFT CELL IN SELECTION

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
        disabled: function () {
          return false;
        }
      },
      {
        key: 'commentsRemove',
        name: function () {
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

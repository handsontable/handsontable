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

    if (!this.hot.getSettings().comments) {
      return;
    }

    this.hot.addHook('afterInit', () => this.bindMouseOverEvent());
    this.hot.addHook('afterContextMenuDefaultOptions', (options) => this.addToContextMenu(options));
    this.hot.addHook('afterRenderer', (TD, row, col, prop, value, cellProperties) => {
      Comments.afterRenderer(TD, cellProperties);
    }
  );

    this.eventManager = eventManagerObject(this);
    this.TEXTAREA = null;
  }

  /***
   * Save comment listener
   *
   * @param event
   * @param range
   */
  saveCommentListener(event, range) {
    if (event.target.className !== 'htCommentTextArea') {
      let value = document.querySelector('.htCommentTextArea').value;
      this.saveComment(range.from.row, range.from.col, value);
      this.unBindMouseDownEvent();
      Comments.hideCommentTextArea();
    }
  }

  /***
   * Bind mouse down event
   *
   * @param range
   */
  bindMouseDownEvents (range) {
    this.eventManager.addEventListener(document, 'mousedown', (event) => this.saveCommentListener(event, range));
  }

  /***
   * Unbind mouse down event
   */
  unBindMouseDownEvent () {
    this.eventManager.removeEventListener(document, 'mousedown');
    this.bindMouseOverEvent();
  }

  /***
   * Bind mouse over event
   */
  bindMouseOverEvent() {
    this.eventManager.addEventListener(this.hot.view.wt.wtTable.TABLE, 'mouseover', (event) => this.bindMouseOverListener(event));
  }

  /***
   * Unbind mouse over event
   */
  unBindMouseOverEvent () {
    this.eventManager.removeEventListener(this.hot.view.wt.wtTable.TABLE, 'mouseover');
  }

  /***
   * Mouse over listener
   *
   * @param event
   */
  bindMouseOverListener (event) {
    if (event.target.className.indexOf('htCommentCell') != -1) {
      this.unBindMouseOverEvent();
      let coordinates = this.hot.view.wt.wtTable.getCoords(event.target),
        range = {
          from: new WalkontableCellCoords(coordinates.row, coordinates.col)
        };

      this.showComment(range);
    } else if (event.target.className != 'htCommentTextArea') {
      Comments.hideCommentTextArea();
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
    console.log('saveComment', row, col, comment);
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
      lastColWidth = this.hot.getColWidth(range.from.col),
      cellTopOffset = offset.top - this.hot.view.wt.wtOverlays.topOverlay.getScrollPosition(),
      cellLeftOffset = offset.left - this.hot.view.wt.wtOverlays.leftOverlay.getScrollPosition();

    commentBox.style.display = 'block';
    commentBox.style.position = 'absolute';
    commentBox.style.left = cellLeftOffset + lastColWidth + 'px';
    commentBox.style.top = cellTopOffset + 'px';
    commentBox.style.zIndex = 2;

    //this.bindTextAreaClickEvent(range);
    this.bindMouseDownEvents(range);
  }

  /***
   * Create placeholder for comment's textarea
   *
   * @returns {Element}
   */
  static createCommentBox () {
    let comments = document.querySelector('.htComments');

    if (!comments) {
      comments = document.createElement('DIV');
      dom.addClass(comments, 'htComments');

      let textArea = document.createElement('TEXTAREA');
      dom.addClass(textArea, 'htCommentTextArea');

      comments.appendChild(textArea);

      this.TEXTAREA = textArea;
      document.body.appendChild(comments);
    }
    return comments;
  }

  /***
   * Set comment value
   *
   * @param value
   */
  static setCommentValue (value) {
    value = value || '';
    this.TEXTAREA.value = value;
  }

  /***
   * Hide placeholder for comment't textarea and clear value
   */
  static hideCommentTextArea () {
    let commentBox = Comments.createCommentBox();
    commentBox.style.display = 'none';
    Comments.setCommentValue();
  }

  /***
   * Show comment for selected range
   *
   * @param range
   */
  showComment (range) {
    let meta = this.hot.getCellMeta(range.from.row, range.from.col),
      commentBox = Comments.createCommentBox();

    Comments.setCommentValue(meta.comment);

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
  checkSelectionCommentsConsistency () {
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
          this.unBindMouseOverEvent();
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

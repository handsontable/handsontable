import * as dom from './../../dom.js';
import {eventManager as eventManagerObject} from './../../eventManager.js';
import {WalkontableCellCoords} from './../../3rdparty/walkontable/src/cell/coords.js';
import {registerPlugin, getPlugin} from './../../plugins.js';
import BasePlugin from './../_base.js';

/**
 * @class Comments
 * @plugin
 */
class Comments extends BasePlugin {

  /**
   * @param {Handsontable} hotInstance
   */
  constructor(hotInstance) {
    super(hotInstance);

    if (!this.hot.getSettings().comments) {
      return;
    }

    this.hot.addHook('afterInit', () => this.registerListeners());
    this.hot.addHook('afterContextMenuDefaultOptions', (options) => this.addToContextMenu(options));
    this.hot.addHook('afterRenderer', (TD, row, col, prop, value, cellProperties) => {
        Comments.afterRenderer(TD, cellProperties);
      }
    );
    this.eventManager = eventManagerObject(this);
    this.range = {};
    this.contextMenuEvent = false;
  }

  /***
   * Register all listeners
   */
  registerListeners() {
    this.eventManager.addEventListener(document, 'mousedown', (event) => this.bindMouseDownListener(event));
    this.eventManager.addEventListener(this.hot.view.wt.wtTable.TABLE, 'mouseover', (event) => this.bindMouseOverListener(event));
  }

  /***
   * Set current cell for save commetn
   * @param range
   */
  setRange(range) {
    this.range = range;
  }

  /***
   * Clear current cell position for comments
   */
  clearRange () {
    this.range = {};
  }

  /***
   * Check if event target is context menu comment button
   * @param event
   * @returns {boolean}
   */
  static targetIsCommentButton (event) {
    return event.target.innerHTML.indexOf('Comment') != -1;
  }

  /***
   * Check if event target is cell with comment
   * @param event
   * @returns {boolean}
   */
  static targetIsCellWithComment (event) {
    return event.target.className.indexOf('htCommentCell') != -1;
  }

  /***
   * Check if event target is comment textarea
   * @param event
   * @returns {boolean}
   */
  static targetIsCommentTextArea (event) {
    return event.target.className === 'htCommentTextArea';
  }

  /***
   * Save comment listener
   *
   * @param {DOMEvent} event
   */
  bindMouseDownListener(event) {
    if (!this.hot.view || !this.hot.view.wt) {
      return;
    }
    if (Comments.targetIsCommentButton(event)){
      this.contextMenuEvent = true;
    } else if (Comments.targetIsCommentTextArea(event)) {
      this.contextMenuEvent = false;
    } else  {
      this.saveComment();
      Comments.hideCommentTextArea();
    }
  }



  /***
   * Mouse over listener
   *
   * @param event
   */
  bindMouseOverListener(event) {
    if (!this.contextMenuEvent){
      if (Comments.targetIsCellWithComment(event)) {
        let coordinates = this.hot.view.wt.wtTable.getCoords(event.target),
          range = {
            from: new WalkontableCellCoords(coordinates.row, coordinates.col)
          };

        this.setRange(range);
        this.showComment(range);

      } else if (!Comments.targetIsCommentTextArea(event)) {
        this.saveComment();
        Comments.hideCommentTextArea();
      }
    }

  }

  /***
   * Save comment for cell
   *
   */
  saveComment() {
    if (this.range.from) {
      let comment = document.querySelector('.htCommentTextArea').value,
        row = this.range.from.row,
        col = this.range.from.col;

      this.hot.setCellMeta(row, col, 'comment', comment);
      this.hot.render();
      this.clearRange();
      this.contextMenuEvent = false;
    }
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
  }

  /***
   * Create placeholder for comment's textarea
   *
   * @returns {Element}
   */
  static createCommentBox() {
    let comments = document.querySelector('.htComments');

    if (!comments) {
      comments = document.createElement('DIV');
      dom.addClass(comments, 'htComments');

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
  static setCommentValue(value) {
    value = value || '';
    document.querySelector('.htCommentTextArea').value = value;
  }

  /***
   * Hide placeholder for comment's textarea and clear value
   */
  static hideCommentTextArea() {
    let commentBox = Comments.createCommentBox();
    commentBox.style.display = 'none';
    Comments.setCommentValue();
  }

  /***
   * Show comment for selected range
   */
  showComment() {
    let meta = this.hot.getCellMeta(this.range.from.row, this.range.from.col),
      commentBox = Comments.createCommentBox();

    Comments.setCommentValue(meta.comment);

    this.placeCommentBox(this.range, commentBox);
  }

  /***
   * After renderer HOOK
   * @param TD
   * @param cellProperties
   */
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
          var coords = this.hot.getSelectedRange();
          var range = {
            from: coords.from
          };

          this.setRange(range);
          this.showComment();
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

  /**
   * Destroy plugin instance
   */
  destroy() {
    if (this.eventManager) {
      this.eventManager.clear();
    }
    super.destroy();
  }
}

export {Comments};

registerPlugin('Comments', Comments);

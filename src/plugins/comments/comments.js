import * as dom from './../../dom.js';
import {EventManager} from './../../eventManager.js';
import {WalkontableCellCoords} from './../../3rdparty/walkontable/src/cell/coords.js';
import {registerPlugin, getPlugin} from './../../plugins.js';
import BasePlugin from './../_base.js';
import {CommentEditor} from './commentEditor.js';

/**
 * @class Comments
 * @plugin
 *
 * @description
 * With option `comments: true`, you can manage cell comments programmatically or through the context menu.
 * To initialize Handsontable with predefined comments, provide comment cell
 * property: `{row: 1, col: 1, comment: "Test comment"}`
 *
 * @example
 *
 * ```js
 * ...
 * var hot = new Handsontable(document.getElementById('example'), {
 *   date: getData(),
 *   comments: true,
 *   cell: [
 *     {row: 1, col: 1, comment: 'Foo'},
 *     {row: 2, col: 2, comment: 'Bar'}
 *   ]
 * });
 * // Access to comments plugin instance:
 * var commentsPlugin = hot.getPlugin('comments');
 *
 * // Managing comments programmatically:
 * commentsPlugin.editor.setValue('Cell comment text');
 * commentsPlugin.showAtCell(1, 6);
 * commentsPlugin.saveCommentAtCell(1, 6);
 * commentsPlugin.removeCommentAtCell(1, 6);
 * ...
 * // You can also set range once and use proper methods:
 * commentsPlugin.setRange({row: 1, col: 6});
 * commentsPlugin.editor.setValue('Cell comment text');
 *
 * commentsPlugin.show();
 * commentsPlugin.saveComment();
 * commentsPlugin.removeComment();
 * ...
 * ```
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
    /**
     * Instance of {@link CommentEditor}
     *
     * @type {CommentEditor}
     */
    this.editor = new CommentEditor();

    /**
     * Instance of {@link EventManager}
     *
     * @private
     * @type {EventManager}
     */
    this.eventManager = new EventManager(this);

    /**
     * Current cell range
     *
     * @type {Object}
     */
    this.range = {};

    /**
     * @private
     * @type {Boolean}
     */
    this.mouseDown = false;

    /**
     * @private
     * @type {Boolean}
     */
    this.contextMenuEvent = false;

    /**
     * @private
     * @type {*}
     */
    this.timer = null;

    this.hot.addHook('afterInit', () => this.registerListeners());
    this.hot.addHook('afterContextMenuDefaultOptions', (options) => this.addToContextMenu(options));
    this.hot.addHook('afterRenderer', (TD, row, col, prop, value, cellProperties) => this.onAfterRenderer(TD, cellProperties));
    this.hot.addHook('afterScrollVertically', () => this.refreshEditorPosition());
    this.hot.addHook('afterColumnResize', () => this.refreshEditorPosition());
    this.hot.addHook('afterRowResize', () => this.refreshEditorPosition());
  }

  /**
   * Register all necessary DOM listeners.
   *
   * @private
   */
  registerListeners() {
    this.eventManager.addEventListener(document, 'mouseover', (event) => this.onMouseOver(event));
    this.eventManager.addEventListener(document, 'mousedown', (event) => this.onMouseDown(event));
    this.eventManager.addEventListener(document, 'mousemove', (event) => this.onMouseMove(event));
    this.eventManager.addEventListener(document, 'mouseup', (event) => this.onMouseUp(event));
    this.eventManager.addEventListener(this.editor.getInputElement(), 'blur', (event) => this.onEditorBlur(event));
  }

  /**
   * Set current cell range to be able to use general methods like {@link Comments#saveComment},
   * {@link Comments#removeComment}, {@link Comments#show}.
   *
   * @param {Object} range Object with `row` and `col` properties.
   */
  setRange(range) {
    this.range = range;
  }

  /**
   * Clear current selected cell.
   */
  clearRange() {
    this.range = {};
  }

  /**
   * Check if event target is cell with comment.
   *
   * @param {Event} event DOM event
   * @returns {Boolean}
   */
  targetIsCellWithComment(event) {
    return dom.hasClass(event.target, 'htCommentCell') && dom.closest(event.target, [this.hot.rootElement]) ? true : false;
  }

  /**
   * Check if event target is comment textarea.
   *
   * @param {Event} event DOM event
   * @returns {Boolean}
   */
  targetIsCommentTextArea(event) {
    return this.editor.getInputElement() === event.target;
  }

  /**
   * Save comment for cell according to previously set range (see {@link Comments#setRange}).
   */
  saveComment() {
    if (!this.range.from) {
      throw new Error('Before using this method, first set cell range (hot.getPlugin("comment").setRange())');
    }
    let comment = this.editor.getValue();
    let row = this.range.from.row;
    let col = this.range.from.col;

    this.hot.setCellMeta(row, col, 'comment', comment);
    this.hot.render();
  }

  /**
   * Save comment for cell.
   *
   * @param {Number} row Row index
   * @param {Number} col Column index
   */
  saveCommentAtCell(row, col) {
    this.setRange({
      from: new WalkontableCellCoords(row, col)
    });
    this.saveComment();
  }

  /**
   * Remove comment for cell according to previously set range (see {@link Comments#setRange}).
   */
  removeComment() {
    if (!this.range.from) {
      throw new Error('Before using this method, first set cell range (hot.getPlugin("comment").setRange())');
    }
    this.hot.removeCellMeta(this.range.from.row, this.range.from.col, 'comment');
    this.hot.render();
    this.hide();
  }

  /**
   * Remove comment.
   *
   * @param {Number} row Row index
   * @param {Number} col Column index
   */
  removeCommentAtCell(row, col) {
    this.setRange({
      from: new WalkontableCellCoords(row, col)
    });
    this.removeComment();
  }

  /**
   * Show comment editor according to previously set range (see {@link Comments#setRange}).
   *
   * @returns {Boolean} Returns `true` if comment editor was showed
   */
  show() {
    if (!this.range.from) {
      throw new Error('Before using this method, first set cell range (hot.getPlugin("comment").setRange())');
    }
    let meta = this.hot.getCellMeta(this.range.from.row, this.range.from.col);

    this.refreshEditorPosition(true);
    this.editor.setValue(meta.comment || '');
    this.editor.show();

    return true;
  }

  /**
   * Show comment editor according to cell coordinates.
   *
   * @param {Number} row Row index
   * @param {Number} col Column index
   * @returns {Boolean} Returns `true` if comment editor was showed
   */
  showAtCell(row, col) {
    this.setRange({
      from: new WalkontableCellCoords(row, col)
    });

    return this.show();
  }

  /**
   * Hide all comments input editors.
   */
  hide() {
    this.editor.hide();
  }

  /**
   * Refresh comment editor position
   *
   * @param {Boolean} [force=false] If `true` then recalculation will be trigger forced.
   */
  refreshEditorPosition(force = false) {
    if (!force && (!this.range.from || !this.editor.isVisible())) {
      return;
    }
    let TD = this.hot.view.wt.wtTable.getCell(this.range.from);
    let offset = dom.offset(TD);
    let lastColWidth = this.hot.getColWidth(this.range.from.col);
    let cellTopOffset = offset.top;
    let cellLeftOffset = offset.left;
    let verticalCompensation = 0;
    let horizontalCompensation = 0;

    if (this.hot.view.wt.wtViewport.hasVerticalScroll()) {
      cellTopOffset = cellTopOffset - this.hot.view.wt.wtOverlays.topOverlay.getScrollPosition();
      verticalCompensation = 20;
    }
    if (this.hot.view.wt.wtViewport.hasHorizontalScroll()) {
      cellLeftOffset = cellLeftOffset - this.hot.view.wt.wtOverlays.leftOverlay.getScrollPosition();
      horizontalCompensation = 20;
    }
    let x = cellLeftOffset + lastColWidth;
    let y = cellTopOffset;

    let rect = this.hot.view.wt.wtTable.holder.getBoundingClientRect();
    let holderPos = {
      left: rect.left + dom.getWindowScrollLeft() + horizontalCompensation,
      right: rect.right + dom.getWindowScrollLeft() - 15,
      top: rect.top + dom.getWindowScrollTop() + verticalCompensation,
      bottom: rect.bottom + dom.getWindowScrollTop()
    };

    if (x <= holderPos.left || x > holderPos.right || y <= holderPos.top || y > holderPos.bottom) {
      this.hide();
    } else {
      this.editor.setPosition(x, y);
    }
  }

  /**
   * Mouse down DOM listener.
   *
   * @private
   * @param {Event} event
   */
  onMouseDown(event) {
    this.mouseDown = true;

    if (!this.hot.view || !this.hot.view.wt) {
      return;
    }
    if (!this.contextMenuEvent && !this.targetIsCommentTextArea(event) && !this.targetIsCellWithComment(event)) {
      this.hide();
    }
    this.contextMenuEvent = false;
  }

  /**
   * Mouse over DOM listener.
   *
   * @private
   * @param {Event} event
   */
  onMouseOver(event) {
    if (this.mouseDown || this.editor.isFocused()) {
      return;
    }
    if (this.targetIsCellWithComment(event)) {
      let coordinates = this.hot.view.wt.wtTable.getCoords(event.target);
      let range = {
        from: new WalkontableCellCoords(coordinates.row, coordinates.col)
      };
      this.setRange(range);
      this.show();

    } else if (!this.targetIsCommentTextArea(event) && !this.editor.isFocused()) {
      this.hide();
    }
  }

  /**
   * Mouse move DOM listener.
   *
   * @private
   * @param {Event} event
   */
  onMouseMove(event) {
    // Fix for Chrome issues about not firing mousedown events on textarea corner handler
    // https://code.google.com/p/chromium/issues/detail?id=453023
    if (this.targetIsCommentTextArea(event)) {
      this.mouseDown = true;

      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.mouseDown = false;
      }, 200);
    }
  }

  /**
   * Mouse up DOM listener.
   *
   * @private
   * @param {Event} event
   */
  onMouseUp(event) {
    this.mouseDown = false;
  }

  /***
   * After renderer Handsontable hook listener.
   *
   * @private
   * @param {HTMLTableCellElement} TD
   * @param {Object} cellProperties
   */
  onAfterRenderer(TD, cellProperties) {
    if (cellProperties.comment) {
      dom.addClass(TD, cellProperties.commentedCellClassName);
    }
  }

  /**
   * Comment input blur DOM event listener
   *
   * @private
   * @param {Event} event
   */
  onEditorBlur(event) {
    this.saveComment();
  }

  /**
   * Check if there is a comment for selected range.
   *
   * @private
   * @returns {Boolean}
   */
  checkSelectionCommentsConsistency() {
    let hasComment = false;
    let cell = this.hot.getSelectedRange().from; // IN EXCEL THERE IS COMMENT ONLY FOR TOP LEFT CELL IN SELECTION

    if (this.hot.getCellMeta(cell.row, cell.col).comment) {
      hasComment = true;
    }

    return hasComment;
  }

  /**
   * Listen on context menu add/edit comment action.
   *
   * @private
   */
  onContextMenuAddComment() {
    let coords = this.hot.getSelectedRange();

    this.contextMenuEvent = true;
    this.setRange({
      from: coords.from
    });
    this.show();
    setTimeout(() => {
      if (this.hot) {
        this.hot.deselectCell();
        this.editor.focus();
      }
    }, 10);
  }

  /**
   * Listen on context menu remove comment action.
   *
   * @private
   * @param {String} key
   * @param {Array} selection
   */
  onContextMenuRemoveComment(key, selection) {
    this.contextMenuEvent = true;
    this.removeCommentAtCell(selection.start.row, selection.start.col);
  }

  /**
   * Add Comments to context menu.
   *
   * @private
   * @param {Object} defaultOptions
   */
  addToContextMenu(defaultOptions) {
    defaultOptions.items.push(
      Handsontable.ContextMenu.SEPARATOR,
      {
        key: 'commentsAddEdit',
        name: () => {
          return this.checkSelectionCommentsConsistency() ? 'Edit Comment' : 'Add Comment';
        },
        callback: () => this.onContextMenuAddComment(),
        disabled: function () {
          return false;
        }
      },
      {
        key: 'commentsRemove',
        name: function () {
          return 'Delete Comment';
        },
        callback: (key, selection) => this.onContextMenuRemoveComment(key, selection),
        disabled: () => {
          return !this.checkSelectionCommentsConsistency();
        }
      }
    );
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    if (this.eventManager) {
      this.eventManager.clear();
    }
    if (this.editor) {
      this.editor.destroy();
    }
    super.destroy();
  }
}

export {Comments};

registerPlugin('comments', Comments);

import Handsontable from './../../browser';
import {
  addClass,
  closest,
  isChildOf,
  getWindowScrollLeft,
  getWindowScrollTop,
  hasClass,
  offset,
  outerWidth,
  outerHeight
} from './../../helpers/dom/element';
import {
  debounce
} from './../../helpers/function';
import {EventManager} from './../../eventManager';
import {WalkontableCellCoords} from './../../3rdparty/walkontable/src/cell/coords';
import {registerPlugin} from './../../plugins';
import BasePlugin from './../_base';
import {CommentEditor} from './commentEditor';
import {checkSelectionConsistency, markLabelAsSelected} from './../contextMenu/utils';

const privatePool = new WeakMap();
const META_COMMENT = 'comment';
const META_STYLE = 'commentStyle';
const META_READONLY = 'commentReadOnly';

/**
 * @plugin Comments
 *
 * @description
 * This plugin allows setting and managing cell comments by either an option in the context menu or with the use of the API.
 *
 * To enable the plugin, you'll need to set the comments property of the config object to `true`:
 * ```js
 * ...
 * comments: true
 * ...
 * ```
 *
 * To add comments at the table initialization, define the `comment` property in the `cell` config array.
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
 *
 * // Access to the Comments plugin instance:
 * var commentsPlugin = hot.getPlugin('comments');
 *
 * // Manage comments programmatically:
 * commentsPlugin.editor.setCommentAtCell(1, 6, 'Comment contents');
 * commentsPlugin.showAtCell(1, 6);
 * commentsPlugin.removeCommentAtCell(1, 6);
 *
 * // You can also set range once and use proper methods:
 * commentsPlugin.setRange({row: 1, col: 6});
 * commentsPlugin.setComment('Comment contents');
 * commentsPlugin.show();
 * commentsPlugin.removeComment();
 * ...
 * ```
 */
class Comments extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Instance of {@link CommentEditor}.
     *
     * @type {CommentEditor}
     */
    this.editor = null;
    /**
     * Instance of {@link EventManager}.
     *
     * @private
     * @type {EventManager}
     */
    this.eventManager = null;
    /**
     * Current cell range.
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
    /**
     * Delay used when showing/hiding the comments (in milliseconds).
     *
     * @type {Number}
     */
    this.displayDelay = 250;

    privatePool.set(this, {
      tempEditorDimensions: {},
    });
  }

  /**
   * Check if the plugin is enabled in the Handsontable settings.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().comments;
  }

  /**
   * Enable plugin for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    if (!this.editor) {
      this.editor = new CommentEditor();
    }

    if (!this.eventManager) {
      this.eventManager = new EventManager(this);
    }

    this.addHook('afterContextMenuDefaultOptions', (options) => this.addToContextMenu(options));
    this.addHook('afterRenderer', (TD, row, col, prop, value, cellProperties) => this.onAfterRenderer(TD, cellProperties));
    this.addHook('afterScrollHorizontally', () => this.hide());
    this.addHook('afterScrollVertically', () => this.hide());

    this.addHook('afterBeginEditing', (args) => this.onAfterBeginEditing(args));

    this.registerListeners();

    super.enablePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  /**
   * Register all necessary DOM listeners.
   *
   * @private
   */
  registerListeners() {
    this.eventManager.addEventListener(document, 'mouseover', (event) => this.onMouseOver(event));
    this.eventManager.addEventListener(document, 'mousedown', (event) => this.onMouseDown(event));
    this.eventManager.addEventListener(document, 'mouseup', (event) => this.onMouseUp(event));
    this.eventManager.addEventListener(this.editor.getInputElement(), 'blur', (event) => this.onEditorBlur(event));
    this.eventManager.addEventListener(this.editor.getInputElement(), 'mousedown', (event) => this.onEditorMouseDown(event));
    this.eventManager.addEventListener(this.editor.getInputElement(), 'mouseup', (event) => this.onEditorMouseUp(event));
  }

  /**
   * Set current cell range to be able to use general methods like {@link Comments#setComment},
   * {@link Comments#removeComment}, {@link Comments#show}.
   *
   * @param {Object} range Object with `row` and `col` properties.
   */
  setRange(range) {
    this.range = range;
  }

  /**
   * Clear the currently selected cell.
   */
  clearRange() {
    this.range = {};
  }

  /**
   * Check if the event target is a cell containing a comment.
   *
   * @param {Event} event DOM event
   * @returns {Boolean}
   */
  targetIsCellWithComment(event) {
    const closestCell = closest(event.target, 'TD', 'TBODY');

    return closestCell && hasClass(closestCell, 'htCommentCell') && closest(closestCell, [this.hot.rootElement]) ? true : false;
  }

  /**
   * Check if the event target is a comment textarea.
   *
   * @param {Event} event DOM event.
   * @returns {Boolean}
   */
  targetIsCommentTextArea(event) {
    return this.editor.getInputElement() === event.target;
  }

  /**
   * Set a comment for a cell according to the previously set range (see {@link Comments#setRange}).
   *
   * @param {String} value Comment contents.
   */
  setComment(value) {
    if (!this.range.from) {
      throw new Error('Before using this method, first set cell range (hot.getPlugin("comment").setRange())');
    }
    const editorValue = this.editor.getValue();
    let comment = '';

    if (value != null) {
      comment = value;
    } else if (editorValue != null) {
      comment = editorValue;
    }

    let row = this.range.from.row;
    let col = this.range.from.col;

    this.hot.setCellMeta(row, col, META_COMMENT, comment);
    this.hot.render();
  }

  /**
   * Set a comment for a cell.
   *
   * @param {Number} row Row index.
   * @param {Number} col Column index.
   * @param {String} value Comment contents.
   */
  setCommentAtCell(row, col, value) {
    this.setRange({
      from: new WalkontableCellCoords(row, col)
    });
    this.setComment(value);
  }

  /**
   * Remove a comment from a cell according to previously set range (see {@link Comments#setRange}).
   */
  removeComment() {
    if (!this.range.from) {
      throw new Error('Before using this method, first set cell range (hot.getPlugin("comment").setRange())');
    }

    this.hot.removeCellMeta(this.range.from.row, this.range.from.col, META_COMMENT);
    this.hot.removeCellMeta(this.range.from.row, this.range.from.col, META_READONLY);
    this.hot.removeCellMeta(this.range.from.row, this.range.from.col, META_STYLE);
    this.hot.render();
    this.hide();
  }

  /**
   * Remove comment from a cell.
   *
   * @param {Number} row Row index.
   * @param {Number} col Column index.
   */
  removeCommentAtCell(row, col) {
    this.setRange({
      from: new WalkontableCellCoords(row, col)
    });
    this.removeComment();
  }

  /**
   * Get comment from a cell at the predefined range.
   */
  getComment() {

  }

  /**
   * Get comment from a cell at the provided coordinates.
   *
   * @param {Number} row Row index.
   * @param {Number} column Column index.
   */
  getCommentAtCell(row, column) {

  }

  /**
   * Show the comment editor accordingly to the previously set range (see {@link Comments#setRange}).
   *
   * @returns {Boolean} Returns `true` if comment editor was shown.
   */
  show() {
    if (!this.range.from) {
      throw new Error('Before using this method, first set cell range (hot.getPlugin("comment").setRange())');
    }
    let meta = this.hot.getCellMeta(this.range.from.row, this.range.from.col);

    this.refreshEditor(true);
    this.editor.setValue(meta.comment || '');

    if (this.editor.hidden) {
      this.editor.show();
    }

    return true;
  }

  /**
   * Show comment editor according to cell coordinates.
   *
   * @param {Number} row Row index.
   * @param {Number} col Column index.
   * @returns {Boolean} Returns `true` if comment editor was shown.
   */
  showAtCell(row, col) {
    this.setRange({
      from: new WalkontableCellCoords(row, col)
    });

    return this.show();
  }

  /**
   * Hide the comment editor.
   */
  hide() {
    if (!this.editor.hidden) {
      this.editor.hide();
    }
  }

  /**
   * Refresh comment editor position and styling.
   *
   * @param {Boolean} [force=false] If `true` then recalculation will be forced.
   */
  refreshEditor(force = false) {
    if (!force && (!this.range.from || !this.editor.isVisible())) {
      return;
    }
    let TD = this.hot.view.wt.wtTable.getCell(this.range.from);
    let cellOffset = offset(TD);
    let row = this.range.from.row;
    let column = this.range.from.col;
    let lastColWidth = this.hot.view.wt.wtTable.getStretchedColumnWidth(column);
    let cellTopOffset = cellOffset.top < 0 ? 0 : cellOffset.top;
    let cellLeftOffset = cellOffset.left;
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
      left: rect.left + getWindowScrollLeft() + horizontalCompensation,
      right: rect.right + getWindowScrollLeft() - 15,
      top: rect.top + getWindowScrollTop() + verticalCompensation,
      bottom: rect.bottom + getWindowScrollTop()
    };

    if (x > holderPos.right) {
      x = holderPos.right;
    }

    const cellMeta = this.hot.getCellMeta(row, column);
    const commentStyle = cellMeta.commentStyle;
    const readOnly = cellMeta.commentReadOnly;

    if (commentStyle) {
      this.editor.setSize(commentStyle.width, commentStyle.height);
    } else {
      this.editor.resetSize();
    }

    this.editor.setReadOnlyState(readOnly);

    this.editor.setPosition(x, y);
  }

  /**
   * Check if there is a comment for selected range.
   *
   * @private
   * @returns {Boolean}
   */
  checkSelectionCommentsConsistency() {
    const selected = this.hot.getSelectedRange();

    if (!selected) {
      return false;
    }
    let hasComment = false;
    let cell = selected.from; // IN EXCEL THERE IS COMMENT ONLY FOR TOP LEFT CELL IN SELECTION

    if (this.hot.getCellMeta(cell.row, cell.col).comment) {
      hasComment = true;
    }

    return hasComment;
  }

  /**
   * `mousedown` event callback.
   *
   * @private
   * @param {MouseEvent} event The `mousedown` event.
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
   * `mouseover` event callback.
   *
   * @private
   * @param {MouseEvent} event The `mouseover` event.
   */
  onMouseOver(event) {
    if (this.mouseDown || this.editor.isFocused()) {
      return;
    }

    debounce(() => {
      if (this.targetIsCellWithComment(event)) {
        let coordinates = this.hot.view.wt.wtTable.getCoords(event.target);
        let range = {
          from: new WalkontableCellCoords(coordinates.row, coordinates.col)
        };

        this.setRange(range);
        this.show();

      } else if (isChildOf(event.target, document) && !this.targetIsCommentTextArea(event) && !this.editor.isFocused()) {
        this.hide();
      }
    }, this.displayDelay)();
  }

  /**
   * `mouseup` event callback.
   *
   * @private
   * @param {MouseEvent} event The `mouseup` event.
   */
  onMouseUp(event) {
    this.mouseDown = false;
  }

  /***
   * The `afterRenderer` hook callback..
   *
   * @private
   * @param {HTMLTableCellElement} TD The rendered `TD` element.
   * @param {Object} cellProperties The rendered cell's property object.
   */
  onAfterRenderer(TD, cellProperties) {
    if (cellProperties.comment) {
      addClass(TD, cellProperties.commentedCellClassName);
    }
  }

  /**
   * `blur` event callback for the comment editor.
   *
   * @private
   * @param {Event} event The `blur` event.
   */
  onEditorBlur(event) {
    this.setComment();
  }

  /**
   * `mousedown` hook. Along with `onEditorMouseUp` used to simulate the textarea resizing event.
   *
   * @private
   * @param {MouseEvent} event The `mousedown` event.
   */
  onEditorMouseDown(event) {
    const priv = privatePool.get(this);

    priv.tempEditorDimensions = {
      width: outerWidth(event.target),
      height: outerHeight(event.target)
    };
  }

  /**
   * `mouseup` hook. Along with `onEditorMouseDown` used to simulate the textarea resizing event.
   *
   * @private
   * @param {MouseEvent} event The `mouseup` event.
   */
  onEditorMouseUp(event) {
    const priv = privatePool.get(this);
    const currentWidth = outerWidth(event.target);
    const currentHeight = outerHeight(event.target);

    if (currentWidth !== priv.tempEditorDimensions.width + 1 || currentHeight !== priv.tempEditorDimensions.height + 2) {
      this.hot.setCellMeta(this.range.from.row, this.range.from.col, META_STYLE, {
        width: currentWidth,
        height: currentHeight
      });
    }
  }

  /**
   * Context Menu's "Add comment" callback. Results in showing the comment editor.
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
   * Context Menu's "remove comment" callback.
   *
   * @private
   * @param {Object} selection The current selection.
   */
  onContextMenuRemoveComment(selection) {
    this.contextMenuEvent = true;

    for (let i = selection.start.row; i <= selection.end.row; i++) {
      for (let j = selection.start.col; j <= selection.end.col; j++) {
        this.removeCommentAtCell(i, j);
      }
    }
  }

  /**
   * Context Menu's "make comment read-only" callback.
   *
   * @private
   * @param {Object} selection The current selection.
   */
  onContextMenuMakeReadOnly(selection) {
    this.contextMenuEvent = true;

    for (let i = selection.start.row; i <= selection.end.row; i++) {
      for (let j = selection.start.col; j <= selection.end.col; j++) {
        let currentState = !!this.hot.getCellMeta(i, j).commentReadOnly;

        this.hot.setCellMeta(i, j, META_READONLY, !currentState);
      }
    }
  }

  /**
   * Add Comments plugin options to the Context Menu.
   *
   * @private
   * @param {Object} defaultOptions
   */
  addToContextMenu(defaultOptions) {
    defaultOptions.items.push(
      Handsontable.plugins.ContextMenu.SEPARATOR,
      {
        key: 'commentsAddEdit',
        name: () => {
          return this.checkSelectionCommentsConsistency() ? 'Edit comment' : 'Add comment';
        },
        callback: () => this.onContextMenuAddComment(),
        disabled: function() {
          return this.getSelected() && !this.selection.selectedHeader.corner ? false : true;
        }
      },
      {
        key: 'commentsRemove',
        name: function() {
          return 'Delete comment';
        },
        callback: (key, selection) => this.onContextMenuRemoveComment(selection),
        disabled: () => {
          return this.hot.selection.selectedHeader.corner;
        }
      },
      {
        key: 'commentsReadOnly',
        name: function() {
          let label = 'Read only comment';
          let hasProperty = checkSelectionConsistency(this.getSelectedRange(), (row, col) => {
            let readOnlyProperty = this.getCellMeta(row, col).commentReadOnly;

            if (readOnlyProperty) {
              return true;
            }
          });

          if (hasProperty) {
            label = markLabelAsSelected(label);
          }

          return label;
        },
        callback: (key, selection) => this.onContextMenuMakeReadOnly(selection),
        disabled: () => {
          return this.hot.selection.selectedHeader.corner || !this.checkSelectionCommentsConsistency();
        }
      }
    );
  }

  /**
   * `afterBeginEditing` hook callback.
   *
   * @private
   * @param {Number} row Row index of the currently edited cell.
   * @param {Number} column Column index of the currently edited cell.
   */
  onAfterBeginEditing(row, column) {
    this.hide();
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    if (this.editor) {
      this.editor.destroy();
    }
    super.destroy();
  }
}

export {Comments};

registerPlugin('comments', Comments);

import {
  addClass,
  closest,
  isChildOf,
  hasClass,
  offset,
  outerWidth,
  outerHeight,
  getScrollableElement
} from './../../helpers/dom/element';
import {deepClone, deepExtend, isObject} from './../../helpers/object';
import EventManager from './../../eventManager';
import {CellCoords} from './../../3rdparty/walkontable/src';
import {registerPlugin, getPlugin} from './../../plugins';
import BasePlugin from './../_base';
import CommentEditor from './commentEditor';
import {checkSelectionConsistency, markLabelAsSelected} from './../contextMenu/utils';
import DisplaySwitch from './displaySwitch';

import './comments.css';

const privatePool = new WeakMap();
const META_COMMENT = 'comment';
const META_COMMENT_VALUE = 'value';
const META_STYLE = 'style';
const META_READONLY = 'readOnly';

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
 * or object with extra predefined plugin config:
 *
 * ```js
 * ...
 * comments: {
 *   displayDelay: 1000
 * }
 * ...
 * ```
 *
 * To add comments at the table initialization, define the `comment` property in the `cell` config array as in an example below.
 *
 * @example
 *
 * ```js
 * ...
 * var hot = new Handsontable(document.getElementById('example'), {
 *   date: getData(),
 *   comments: true,
 *   cell: [
 *     {row: 1, col: 1, comment: {value: 'Foo'}},
 *     {row: 2, col: 2, comment: {value: 'Bar'}}
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
     * Instance of {@link DisplaySwitch}.
     *
     * @type {DisplaySwitch}
     */
    this.displaySwitch = null;
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

    privatePool.set(this, {
      tempEditorDimensions: {},
      cellBelowCursor: null
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

    if (!this.displaySwitch) {
      this.displaySwitch = new DisplaySwitch(this.getDisplayDelaySetting());
    }

    this.addHook('afterContextMenuDefaultOptions', (options) => this.addToContextMenu(options));
    this.addHook('afterRenderer', (TD, row, col, prop, value, cellProperties) => this.onAfterRenderer(TD, cellProperties));
    this.addHook('afterScrollHorizontally', () => this.hide());
    this.addHook('afterScrollVertically', () => this.hide());
    this.addHook('afterBeginEditing', (args) => this.onAfterBeginEditing(args));

    this.displaySwitch.addLocalHook('hide', () => this.hide());
    this.displaySwitch.addLocalHook('show', (row, col) => this.showAtCell(row, col));

    this.registerListeners();

    super.enablePlugin();
  }

  /**
   * Update plugin for this Handsontable instance.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();
    super.updatePlugin();

    this.displaySwitch.updateDelay(this.getDisplayDelaySetting());
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
   * @param {Object} range Object with `from` and `to` properties, each with `row` and `col` properties.
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

    return !!(closestCell && hasClass(closestCell, 'htCommentCell') && closest(closestCell, [this.hot.rootElement]));
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

    this.updateCommentMeta(row, col, {[META_COMMENT_VALUE]: comment});
    this.hot.render();
  }

  /**
   * Set a comment for a cell.
   *
   * @param {Number} row Visual row index.
   * @param {Number} col Visual column index.
   * @param {String} value Comment contents.
   */
  setCommentAtCell(row, col, value) {
    this.setRange({
      from: new CellCoords(row, col)
    });
    this.setComment(value);
  }

  /**
   * Remove a comment from a cell according to previously set range (see {@link Comments#setRange}).
   *
   * @param {Boolean} [forceRender = true] If set to `true`, the table will be re-rendered at the end of the operation.
   */
  removeComment(forceRender = true) {
    if (!this.range.from) {
      throw new Error('Before using this method, first set cell range (hot.getPlugin("comment").setRange())');
    }

    this.hot.setCellMeta(this.range.from.row, this.range.from.col, META_COMMENT, void 0);

    if (forceRender) {
      this.hot.render();
    }

    this.hide();
  }

  /**
   * Remove comment from a cell.
   *
   * @param {Number} row Visual row index.
   * @param {Number} col Visual column index.
   * @param {Boolean} [forceRender = true] If `true`, the table will be re-rendered at the end of the operation.
   */
  removeCommentAtCell(row, col, forceRender = true) {
    this.setRange({
      from: new CellCoords(row, col)
    });
    this.removeComment(forceRender);
  }

  /**
   * Get comment from a cell at the predefined range.
   */
  getComment() {
    const row = this.range.from.row;
    const column = this.range.from.col;

    return this.getCommentMeta(row, column, META_COMMENT_VALUE);
  }

  /**
   * Get comment from a cell at the provided coordinates.
   *
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   */
  getCommentAtCell(row, column) {
    return this.getCommentMeta(row, column, META_COMMENT_VALUE);
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
    this.editor.setValue(meta[META_COMMENT] ? meta[META_COMMENT][META_COMMENT_VALUE] : null || '');

    if (this.editor.hidden) {
      this.editor.show();
    }

    return true;
  }

  /**
   * Show comment editor according to cell coordinates.
   *
   * @param {Number} row Visual row index.
   * @param {Number} col Visual column index.
   * @returns {Boolean} Returns `true` if comment editor was shown.
   */
  showAtCell(row, col) {
    this.setRange({
      from: new CellCoords(row, col)
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
    const scrollableElement = getScrollableElement(this.hot.view.wt.wtTable.TABLE);
    const TD = this.hot.view.wt.wtTable.getCell(this.range.from);
    const row = this.range.from.row;
    const column = this.range.from.col;
    let cellOffset = offset(TD);
    let lastColWidth = this.hot.view.wt.wtTable.getStretchedColumnWidth(column);
    let cellTopOffset = cellOffset.top < 0 ? 0 : cellOffset.top;
    let cellLeftOffset = cellOffset.left;

    if (this.hot.view.wt.wtViewport.hasVerticalScroll() && scrollableElement !== window) {
      cellTopOffset -= this.hot.view.wt.wtOverlays.topOverlay.getScrollPosition();
    }

    if (this.hot.view.wt.wtViewport.hasHorizontalScroll() && scrollableElement !== window) {
      cellLeftOffset -= this.hot.view.wt.wtOverlays.leftOverlay.getScrollPosition();
    }

    let x = cellLeftOffset + lastColWidth;
    let y = cellTopOffset;

    const commentStyle = this.getCommentMeta(row, column, META_STYLE);
    const readOnly = this.getCommentMeta(row, column, META_READONLY);

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

    if (this.getCommentMeta(cell.row, cell.col, META_COMMENT_VALUE)) {
      hasComment = true;
    }

    return hasComment;
  }

  /**
   * Set or update the comment-related cell meta.
   *
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @param {Object} metaObject Object defining all the comment-related meta information.
   */
  updateCommentMeta(row, column, metaObject) {
    const oldComment = this.hot.getCellMeta(row, column)[META_COMMENT];
    let newComment;

    if (oldComment) {
      newComment = deepClone(oldComment);
      deepExtend(newComment, metaObject);
    } else {
      newComment = metaObject;
    }

    this.hot.setCellMeta(row, column, META_COMMENT, newComment);
  }

  /**
   * Get the comment related meta information.
   *
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @param {String} property Cell meta property.
   * @returns {Mixed}
   */
  getCommentMeta(row, column, property) {
    const cellMeta = this.hot.getCellMeta(row, column);

    if (!cellMeta[META_COMMENT]) {
      return void 0;
    }

    return cellMeta[META_COMMENT][property];
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

    if (!this.contextMenuEvent && !this.targetIsCommentTextArea(event)) {
      const eventCell = closest(event.target, 'TD', 'TBODY');
      let coordinates = null;

      if (eventCell) {
        coordinates = this.hot.view.wt.wtTable.getCoords(eventCell);
      }

      if (!eventCell || ((this.range.from && coordinates) && (this.range.from.row !== coordinates.row || this.range.from.col !== coordinates.col))) {
        this.hide();
      }
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
    const priv = privatePool.get(this);

    priv.cellBelowCursor = document.elementFromPoint(event.clientX, event.clientY);

    if (this.mouseDown || this.editor.isFocused() || hasClass(event.target, 'wtBorder')
        || priv.cellBelowCursor !== event.target || !this.editor) {
      return;
    }

    if (this.targetIsCellWithComment(event)) {
      const coordinates = this.hot.view.wt.wtTable.getCoords(event.target);
      const range = {
        from: new CellCoords(coordinates.row, coordinates.col)
      };

      this.displaySwitch.show(range);

    } else if (isChildOf(event.target, document) && !this.targetIsCommentTextArea(event)) {
      this.displaySwitch.hide();
    }
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

  /** *
   * The `afterRenderer` hook callback..
   *
   * @private
   * @param {HTMLTableCellElement} TD The rendered `TD` element.
   * @param {Object} cellProperties The rendered cell's property object.
   */
  onAfterRenderer(TD, cellProperties) {
    if (cellProperties[META_COMMENT] && cellProperties[META_COMMENT][META_COMMENT_VALUE]) {
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
      this.updateCommentMeta(this.range.from.row, this.range.from.col, {
        [META_STYLE]: {
          width: currentWidth,
          height: currentHeight
        }
      });
    }
  }

  /**
   * Context Menu's "Add comment" callback. Results in showing the comment editor.
   *
   * @private
   */
  onContextMenuAddComment() {
    this.displaySwitch.cancelHiding();
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
        this.removeCommentAtCell(i, j, false);
      }
    }

    this.hot.render();
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
        let currentState = !!this.getCommentMeta(i, j, META_READONLY);

        this.updateCommentMeta(i, j, {[META_READONLY]: !currentState});
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
      {
        name: '---------',
      },
      {
        key: 'commentsAddEdit',
        name: () => (this.checkSelectionCommentsConsistency() ? 'Edit comment' : 'Add comment'),
        callback: () => this.onContextMenuAddComment(),
        disabled() {
          return !(this.getSelected() && !this.selection.selectedHeader.corner);
        }
      },
      {
        key: 'commentsRemove',
        name() {
          return 'Delete comment';
        },
        callback: (key, selection) => this.onContextMenuRemoveComment(selection),
        disabled: () => this.hot.selection.selectedHeader.corner
      },
      {
        key: 'commentsReadOnly',
        name() {
          let label = 'Read only comment';
          let hasProperty = checkSelectionConsistency(this.getSelectedRange(), (row, col) => {
            let readOnlyProperty = this.getCellMeta(row, col)[META_COMMENT];
            if (readOnlyProperty) {
              readOnlyProperty = readOnlyProperty[META_READONLY];
            }

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
        disabled: () => this.hot.selection.selectedHeader.corner || !this.checkSelectionCommentsConsistency()
      }
    );
  }

  /**
   * Get `displayDelay` setting of comment plugin.
   *
   * @returns {Number|undefined}
   */
  getDisplayDelaySetting() {
    const commentSetting = this.hot.getSettings().comments;

    if (isObject(commentSetting)) {
      return commentSetting.displayDelay;
    }

    return void 0;
  }

  /**
   * `afterBeginEditing` hook callback.
   *
   * @private
   * @param {Number} row Visual row index of the currently edited cell.
   * @param {Number} column Visual column index of the currently edited cell.
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

    if (this.displaySwitch) {
      this.displaySwitch.destroy();
    }

    super.destroy();
  }
}

registerPlugin('comments', Comments);

export default Comments;

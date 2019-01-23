import {
  addClass,
  closest,
  isChildOf,
  hasClass,
  offset,
  outerWidth,
  outerHeight
} from './../../helpers/dom/element';
import { deepClone, deepExtend, isObject } from './../../helpers/object';
import EventManager from './../../eventManager';
import { CellCoords } from './../../3rdparty/walkontable/src';
import { registerPlugin } from './../../plugins';
import BasePlugin from './../_base';
import CommentEditor from './commentEditor';
import { checkSelectionConsistency, markLabelAsSelected } from './../contextMenu/utils';
import DisplaySwitch from './displaySwitch';
import * as C from './../../i18n/constants';

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
 * This plugin allows setting and managing cell comments by either an option in the context menu or with the use of
 * the API.
 *
 * To enable the plugin, you'll need to set the comments property of the config object to `true`:
 * ```js
 * comments: true
 * ```
 *
 * or an object with extra predefined plugin config:
 *
 * ```js
 * comments: {
 *   displayDelay: 1000
 * }
 * ```
 *
 * To add comments at the table initialization, define the `comment` property in the `cell` config array as in an example below.
 *
 * @example
 *
 * ```js
 * const hot = new Handsontable(document.getElementById('example'), {
 *   date: getData(),
 *   comments: true,
 *   cell: [
 *     {row: 1, col: 1, comment: {value: 'Foo'}},
 *     {row: 2, col: 2, comment: {value: 'Bar'}}
 *   ]
 * });
 *
 * // Access to the Comments plugin instance:
 * const commentsPlugin = hot.getPlugin('comments');
 *
 * // Manage comments programmatically:
 * commentsPlugin.setCommentAtCell(1, 6, 'Comment contents');
 * commentsPlugin.showAtCell(1, 6);
 * commentsPlugin.removeCommentAtCell(1, 6);
 *
 * // You can also set range once and use proper methods:
 * commentsPlugin.setRange({from: {row: 1, col: 6}});
 * commentsPlugin.setComment('Comment contents');
 * commentsPlugin.show();
 * commentsPlugin.removeComment();
 * ```
 */
class Comments extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Instance of {@link CommentEditor}.
     *
     * @private
     * @type {CommentEditor}
     */
    this.editor = null;
    /**
     * Instance of {@link DisplaySwitch}.
     *
     * @private
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
     * Current cell range, an object with `from` property, with `row` and `col` properties (e.q. `{from: {row: 1, col: 6}}`).
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
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link Comments#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().comments;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    if (!this.editor) {
      this.editor = new CommentEditor(this.hot.rootDocument);
    }

    if (!this.eventManager) {
      this.eventManager = new EventManager(this);
    }

    if (!this.displaySwitch) {
      this.displaySwitch = new DisplaySwitch(this.getDisplayDelaySetting());
    }

    this.addHook('afterContextMenuDefaultOptions', options => this.addToContextMenu(options));
    this.addHook('afterRenderer', (TD, row, col, prop, value, cellProperties) => this.onAfterRenderer(TD, cellProperties));
    this.addHook('afterScrollHorizontally', () => this.hide());
    this.addHook('afterScrollVertically', () => this.hide());
    this.addHook('afterBeginEditing', () => this.onAfterBeginEditing());

    this.displaySwitch.addLocalHook('hide', () => this.hide());
    this.displaySwitch.addLocalHook('show', (row, col) => this.showAtCell(row, col));

    this.registerListeners();

    super.enablePlugin();
  }

  /**
   * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();
    super.updatePlugin();

    this.displaySwitch.updateDelay(this.getDisplayDelaySetting());
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  /**
   * Registers all necessary DOM listeners.
   *
   * @private
   */
  registerListeners() {
    const { rootDocument } = this.hot;

    this.eventManager.addEventListener(rootDocument, 'mouseover', event => this.onMouseOver(event));
    this.eventManager.addEventListener(rootDocument, 'mousedown', event => this.onMouseDown(event));
    this.eventManager.addEventListener(rootDocument, 'mouseup', () => this.onMouseUp());
    this.eventManager.addEventListener(this.editor.getInputElement(), 'blur', () => this.onEditorBlur());
    this.eventManager.addEventListener(this.editor.getInputElement(), 'mousedown', event => this.onEditorMouseDown(event));
    this.eventManager.addEventListener(this.editor.getInputElement(), 'mouseup', event => this.onEditorMouseUp(event));
  }

  /**
   * Sets the current cell range to be able to use general methods like {@link Comments#setComment}, {@link Comments#removeComment}, {@link Comments#show}.
   *
   * @param {Object} range Object with `from` property, each with `row` and `col` properties.
   */
  setRange(range) {
    this.range = range;
  }

  /**
   * Clears the currently selected cell.
   */
  clearRange() {
    this.range = {};
  }

  /**
   * Checks if the event target is a cell containing a comment.
   *
   * @private
   * @param {Event} event DOM event
   * @returns {Boolean}
   */
  targetIsCellWithComment(event) {
    const closestCell = closest(event.target, 'TD', 'TBODY');

    return !!(closestCell && hasClass(closestCell, 'htCommentCell') && closest(closestCell, [this.hot.rootElement]));
  }

  /**
   * Checks if the event target is a comment textarea.
   *
   * @private
   * @param {Event} event DOM event.
   * @returns {Boolean}
   */
  targetIsCommentTextArea(event) {
    return this.editor.getInputElement() === event.target;
  }

  /**
   * Sets a comment for a cell according to the previously set range (see {@link Comments#setRange}).
   *
   * @param {String} value Comment contents.
   */
  setComment(value) {
    if (!this.range.from) {
      throw new Error('Before using this method, first set cell range (hot.getPlugin("comment").setRange())');
    }
    const editorValue = this.editor.getValue();
    let comment = '';

    if (value !== null && value !== void 0) {
      comment = value;
    } else if (editorValue !== null && editorValue !== void 0) {
      comment = editorValue;
    }

    const row = this.range.from.row;
    const col = this.range.from.col;

    this.updateCommentMeta(row, col, { [META_COMMENT_VALUE]: comment });
    this.hot.render();
  }

  /**
   * Sets a comment for a specified cell.
   *
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @param {String} value Comment contents.
   */
  setCommentAtCell(row, column, value) {
    this.setRange({
      from: new CellCoords(row, column)
    });
    this.setComment(value);
  }

  /**
   * Removes a comment from a cell according to previously set range (see {@link Comments#setRange}).
   *
   * @param {Boolean} [forceRender=true] If set to `true`, the table will be re-rendered at the end of the operation.
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
   * Removes a comment from a specified cell.
   *
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @param {Boolean} [forceRender=true] If `true`, the table will be re-rendered at the end of the operation.
   */
  removeCommentAtCell(row, column, forceRender = true) {
    this.setRange({
      from: new CellCoords(row, column)
    });
    this.removeComment(forceRender);
  }

  /**
   * Gets comment from a cell according to previously set range (see {@link Comments#setRange}).
   *
   * @returns {String|undefined} Returns a content of the comment.
   */
  getComment() {
    const row = this.range.from.row;
    const column = this.range.from.col;

    return this.getCommentMeta(row, column, META_COMMENT_VALUE);
  }

  /**
   * Gets comment from a cell at the provided coordinates.
   *
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @returns {String|undefined} Returns a content of the comment.
   */
  getCommentAtCell(row, column) {
    return this.getCommentMeta(row, column, META_COMMENT_VALUE);
  }

  /**
   * Shows the comment editor accordingly to the previously set range (see {@link Comments#setRange}).
   *
   * @returns {Boolean} Returns `true` if comment editor was shown.
   */
  show() {
    if (!this.range.from) {
      throw new Error('Before using this method, first set cell range (hot.getPlugin("comment").setRange())');
    }
    const meta = this.hot.getCellMeta(this.range.from.row, this.range.from.col);

    this.refreshEditor(true);
    this.editor.setValue(meta[META_COMMENT] ? meta[META_COMMENT][META_COMMENT_VALUE] : null || '');

    if (this.editor.hidden) {
      this.editor.show();
    }

    return true;
  }

  /**
   * Shows comment editor according to cell coordinates.
   *
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @returns {Boolean} Returns `true` if comment editor was shown.
   */
  showAtCell(row, column) {
    this.setRange({
      from: new CellCoords(row, column)
    });

    return this.show();
  }

  /**
   * Hides the comment editor.
   */
  hide() {
    if (!this.editor.hidden) {
      this.editor.hide();
    }
  }

  /**
   * Refreshes comment editor position and styling.
   *
   * @param {Boolean} [force=false] If `true` then recalculation will be forced.
   */
  refreshEditor(force = false) {
    if (!force && (!this.range.from || !this.editor.isVisible())) {
      return;
    }
    const { rootWindow } = this.hot;
    const { wtTable, wtOverlays, wtViewport } = this.hot.view.wt;
    const scrollableElement = wtOverlays.scrollableElement;
    const TD = wtTable.getCell(this.range.from);
    const row = this.range.from.row;
    const column = this.range.from.col;
    const cellOffset = offset(TD);
    const lastColWidth = wtTable.getStretchedColumnWidth(column);
    let cellTopOffset = cellOffset.top < 0 ? 0 : cellOffset.top;
    let cellLeftOffset = cellOffset.left;

    if (wtViewport.hasVerticalScroll() && scrollableElement !== rootWindow) {
      cellTopOffset -= wtOverlays.topOverlay.getScrollPosition();
    }

    if (wtViewport.hasHorizontalScroll() && scrollableElement !== rootWindow) {
      cellLeftOffset -= wtOverlays.leftOverlay.getScrollPosition();
    }

    const x = cellLeftOffset + lastColWidth;
    const y = cellTopOffset;

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
   * Checks if there is a comment for selected range.
   *
   * @private
   * @returns {Boolean}
   */
  checkSelectionCommentsConsistency() {
    const selected = this.hot.getSelectedRangeLast();

    if (!selected) {
      return false;
    }
    let hasComment = false;
    const cell = selected.from; // IN EXCEL THERE IS COMMENT ONLY FOR TOP LEFT CELL IN SELECTION

    if (this.getCommentMeta(cell.row, cell.col, META_COMMENT_VALUE)) {
      hasComment = true;
    }

    return hasComment;
  }

  /**
   * Sets or update the comment-related cell meta.
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
   * Gets the comment related meta information.
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
    const { rootDocument } = this.hot;

    priv.cellBelowCursor = rootDocument.elementFromPoint(event.clientX, event.clientY);

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

    } else if (isChildOf(event.target, rootDocument) && !this.targetIsCommentTextArea(event)) {
      this.displaySwitch.hide();
    }
  }

  /**
   * `mouseup` event callback.
   *
   * @private
   */
  onMouseUp() {
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
   */
  onEditorBlur() {
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
    const coords = this.hot.getSelectedRangeLast();

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
   */
  onContextMenuRemoveComment() {
    const { from, to } = this.hot.getSelectedRangeLast();

    this.contextMenuEvent = true;

    for (let i = from.row; i <= to.row; i++) {
      for (let j = from.col; j <= to.col; j++) {
        this.removeCommentAtCell(i, j, false);
      }
    }

    this.hot.render();
  }

  /**
   * Context Menu's "make comment read-only" callback.
   *
   * @private
   */
  onContextMenuMakeReadOnly() {
    const { from, to } = this.hot.getSelectedRangeLast();

    this.contextMenuEvent = true;

    for (let i = from.row; i <= to.row; i++) {
      for (let j = from.col; j <= to.col; j++) {
        const currentState = !!this.getCommentMeta(i, j, META_READONLY);

        this.updateCommentMeta(i, j, { [META_READONLY]: !currentState });
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
        name: () => {
          if (this.checkSelectionCommentsConsistency()) {
            return this.hot.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_EDIT_COMMENT);
          }

          return this.hot.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ADD_COMMENT);
        },
        callback: () => this.onContextMenuAddComment(),
        disabled() {
          return !(this.getSelectedLast() && !this.selection.isSelectedByCorner());
        }
      },
      {
        key: 'commentsRemove',
        name() {
          return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_REMOVE_COMMENT);
        },
        callback: () => this.onContextMenuRemoveComment(),
        disabled: () => this.hot.selection.isSelectedByCorner()
      },
      {
        key: 'commentsReadOnly',
        name() {
          let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT);
          const hasProperty = checkSelectionConsistency(this.getSelectedRangeLast(), (row, col) => {
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
        callback: () => this.onContextMenuMakeReadOnly(),
        disabled: () => this.hot.selection.isSelectedByCorner() || !this.checkSelectionCommentsConsistency()
      }
    );
  }

  /**
   * Get `displayDelay` setting of comment plugin.
   *
   * @private
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
   */
  onAfterBeginEditing() {
    this.hide();
  }

  /**
   * Destroys the plugin instance.
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

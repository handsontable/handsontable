import {
  addClass,
  removeClass,
  closest,
  isChildOf,
  hasClass,
  outerHeight,
} from '../../helpers/dom/element';
import { stopImmediatePropagation } from '../../helpers/dom/event';
import { deepClone, deepExtend } from '../../helpers/object';
import { BasePlugin } from '../base';
import CommentEditor from './commentEditor';
import DisplaySwitch from './displaySwitch';
import { SEPARATOR } from '../contextMenu/predefinedItems';
import addEditCommentItem from './contextMenuItem/addEditComment';
import removeCommentItem from './contextMenuItem/removeComment';
import readOnlyCommentItem from './contextMenuItem/readOnlyComment';

export const PLUGIN_KEY = 'comments';
export const PLUGIN_PRIORITY = 60;
export const META_COMMENT = 'comment';
export const META_COMMENT_VALUE = 'value';
export const META_STYLE = 'style';
export const META_READONLY = 'readOnly';
const SHORTCUTS_GROUP = PLUGIN_KEY;
const SHORTCUTS_CONTEXT_NAME = `plugin:${PLUGIN_KEY}`;

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * @plugin Comments
 * @class Comments
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
 *   displayDelay: 1000,
 *   readOnly: true,
 *   style: {
 *     width: 300,
 *     height: 100
 *   }
 * }
 * ```
 *
 * To add comments at the table initialization, define the `comment` property in the `cell` config array as in an example below.
 *
 * @example
 * ::: only-for javascript
 * ```js
 * const hot = new Handsontable(document.getElementById('example'), {
 *   data: getData(),
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
 * :::
 *
 * ::: only-for react
 * ```jsx
 * const hotRef = useRef(null);
 *
 * ...
 *
 * <HotTable
 *   ref={hotRef}
 *   data={getData()}
 *   comments={true}
 *   cell={[
 *     {row: 1, col: 1, comment: {value: 'Foo'}},
 *     {row: 2, col: 2, comment: {value: 'Bar'}}
 *   ]}
 * />
 *
 * // Access to the Comments plugin instance:
 * const hot = hotRef.current.hotInstance;
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
 * :::
 */
export class Comments extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get DEFAULT_SETTINGS() {
    return {
      displayDelay: 250,
    };
  }

  /**
   * Current cell range, an object with `from` property, with `row` and `col` properties (e.q. `{from: {row: 1, col: 6}}`).
   *
   * @type {object}
   */
  range = {};
  /**
   * Instance of {@link CommentEditor}.
   *
   * @private
   * @type {CommentEditor}
   */
  #editor = null;
  /**
   * Instance of {@link DisplaySwitch}.
   *
   * @private
   * @type {DisplaySwitch}
   */
  #displaySwitch = null;
  /**
   * Prevents showing/hiding editor that reacts on the logic triggered by the "mouseover" events.
   *
   * @private
   * @type {boolean}
   */
  #preventEditorAutoSwitch = false;
  /**
   * Prevents hiding editor when the table viewport is scrolled and that scroll is triggered by the
   * keyboard shortcut that insert or edits the comment.
   *
   * @private
   * @type {boolean}
   */
  #preventEditorHiding = false;
  /**
   * The flag that allows processing mousedown event correctly when comments editor is triggered.
   *
   * @private
   * @type {boolean}
   */
  #cellBelowCursor = null;
  /**
   * Holds the comment value before it's actually saved to the cell meta.
   *
   * @private
   * @type {string}
   */
  #commentValueBeforeSave = '';

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link Comments#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    if (!this.#editor) {
      this.#editor = new CommentEditor(this.hot.rootDocument, this.hot.isRtl());
      this.#editor.addLocalHook('resize', (...args) => this.#onEditorResize(...args));
    }

    if (!this.#displaySwitch) {
      this.#displaySwitch = new DisplaySwitch(this.getSetting('displayDelay'));
    }

    this.addHook('afterContextMenuDefaultOptions', options => this.addToContextMenu(options));
    this.addHook('afterRenderer',
      (TD, row, col, prop, value, cellProperties) => this.#onAfterRenderer(TD, cellProperties));
    this.addHook('afterScroll', () => this.#onAfterScroll());
    this.addHook('afterBeginEditing', () => this.hide());
    this.addHook('afterDocumentKeyDown', event => this.#onAfterDocumentKeyDown(event));
    this.addHook('afterSetTheme', (...args) => this.#updateEditorThemeClassName(...args));

    this.#displaySwitch.addLocalHook('hide', () => this.hide());
    this.#displaySwitch.addLocalHook('show', (row, col) => this.showAtCell(row, col));

    this.registerShortcuts();
    this.registerListeners();
    super.enablePlugin();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *   - [`comments`](@/api/options.md#comments)
   */
  updatePlugin() {
    this.#displaySwitch.updateDelay(this.getSetting('displayDelay'));
    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.unregisterShortcuts();
    super.disablePlugin();
  }

  /**
   * Register shortcuts responsible for toggling context menu.
   *
   * @private
   */
  registerShortcuts() {
    const manager = this.hot.getShortcutManager();
    const gridContext = manager.getContext('grid');
    const pluginContext = manager.addContext(SHORTCUTS_CONTEXT_NAME);

    gridContext.addShortcut({
      keys: [['Control', 'Alt', 'M']],
      callback: () => {
        const range = this.hot.getSelectedRangeLast();

        this.#preventEditorHiding = true;
        this.hot.scrollToFocusedCell(() => {
          this.setRange(range);
          this.show();
          this.focusEditor();
          manager.setActiveContextName(SHORTCUTS_CONTEXT_NAME);

          this.hot._registerTimeout(() => {
            this.#preventEditorHiding = false;
          });
        });
      },
      stopPropagation: true,
      runOnlyIf: () => this.hot.getSelectedRangeLast()?.highlight.isCell(),
      group: SHORTCUTS_GROUP,
    });

    pluginContext.addShortcut({
      keys: [['Escape']],
      callback: () => {
        this.#editor.setValue(this.#commentValueBeforeSave);
        this.hide();
        manager.setActiveContextName('grid');
      },
      runOnlyIf: () => this.#editor.isVisible() && this.#editor.isFocused(),
      group: SHORTCUTS_GROUP,
    });

    pluginContext.addShortcut({
      keys: [['Control/Meta', 'Enter']],
      callback: () => {
        this.hide();
        manager.setActiveContextName('grid');
      },
      runOnlyIf: () => this.#editor.isVisible() && this.#editor.isFocused(),
      group: SHORTCUTS_GROUP,
    });

    pluginContext.addShortcut({
      keys: [['Shift', 'Tab'], ['Tab']],
      forwardToContext: manager.getContext('grid'),
      callback: () => {
        this.#editor.setValue(this.#editor.getValue());
        this.hide();
        manager.setActiveContextName('grid');
      },
      group: SHORTCUTS_GROUP,
    });
  }

  /**
   * Unregister shortcuts responsible for toggling context menu.
   *
   * @private
   */
  unregisterShortcuts() {
    this.hot.getShortcutManager()
      .getContext('grid')
      .removeShortcutsByGroup(SHORTCUTS_GROUP);
  }

  /**
   * Registers all necessary DOM listeners.
   *
   * @private
   */
  registerListeners() {
    const { rootDocument } = this.hot;
    const editorElement = this.getEditorInputElement();

    this.eventManager.addEventListener(rootDocument, 'mouseover', event => this.#onMouseOver(event));
    this.eventManager.addEventListener(rootDocument, 'mousedown', event => this.#onMouseDown(event));
    this.eventManager.addEventListener(rootDocument, 'mouseup', () => this.#onMouseUp());
    this.eventManager.addEventListener(editorElement, 'focus', () => this.#onEditorFocus());
    this.eventManager.addEventListener(editorElement, 'blur', () => this.#onEditorBlur());

    this.eventManager.addEventListener(
      this.getEditorInputElement(),
      'mousedown',
      event => this.#onInputElementMouseDown(event)
    );
  }

  /**
   * Sets the current cell range to be able to use general methods like {@link Comments#setComment}, {@link Comments#removeComment}, {@link Comments#show}.
   *
   * @param {object} range Object with `from` property, each with `row` and `col` properties.
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
   * @param {Event} event DOM event.
   * @returns {boolean}
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
   * @returns {boolean}
   */
  targetIsCommentTextArea(event) {
    return this.getEditorInputElement() === event.target;
  }

  /**
   * Sets a comment for a cell according to the previously set range (see {@link Comments#setRange}).
   *
   * @param {string} value Comment contents.
   */
  setComment(value) {
    if (!this.range.from) {
      throw new Error('Before using this method, first set cell range (hot.getPlugin("comment").setRange())');
    }
    const editorValue = this.#editor.getValue();
    let comment = '';

    if (value !== null && value !== undefined) {
      comment = value;
    } else if (editorValue !== null && editorValue !== undefined) {
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
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {string} value Comment contents.
   */
  setCommentAtCell(row, column, value) {
    this.setRange({
      from: this.hot._createCellCoords(row, column)
    });
    this.setComment(value);
  }

  /**
   * Removes a comment from a cell according to previously set range (see {@link Comments#setRange}).
   *
   * @param {boolean} [forceRender=true] If set to `true`, the table will be re-rendered at the end of the operation.
   */
  removeComment(forceRender = true) {
    if (!this.range.from) {
      throw new Error('Before using this method, first set cell range (hot.getPlugin("comment").setRange())');
    }

    this.hot.setCellMeta(this.range.from.row, this.range.from.col, META_COMMENT);

    if (forceRender) {
      this.hot.render();
    }

    this.hide();
  }

  /**
   * Removes a comment from a specified cell.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {boolean} [forceRender=true] If `true`, the table will be re-rendered at the end of the operation.
   */
  removeCommentAtCell(row, column, forceRender = true) {
    this.setRange({
      from: this.hot._createCellCoords(row, column)
    });
    this.removeComment(forceRender);
  }

  /**
   * Gets comment from a cell according to previously set range (see {@link Comments#setRange}).
   *
   * @returns {string|undefined} Returns a content of the comment.
   */
  getComment() {
    const row = this.range.from.row;
    const column = this.range.from.col;

    return this.getCommentMeta(row, column, META_COMMENT_VALUE);
  }

  /**
   * Gets comment from a cell at the provided coordinates.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {string|undefined} Returns a content of the comment.
   */
  getCommentAtCell(row, column) {
    return this.getCommentMeta(row, column, META_COMMENT_VALUE);
  }

  /**
   * Shows the comment editor accordingly to the previously set range (see {@link Comments#setRange}).
   *
   * @returns {boolean} Returns `true` if comment editor was shown.
   */
  show() {
    if (!this.range.from) {
      throw new Error('Before using this method, first set cell range (hot.getPlugin("comment").setRange())');
    }

    const { from: { row, col } } = this.range;

    if (row < 0 || row > this.hot.countSourceRows() - 1 || col < 0 || col > this.hot.countSourceCols() - 1) {
      return false;
    }

    const meta = this.hot.getCellMeta(this.range.from.row, this.range.from.col);

    this.#displaySwitch.cancelHiding();
    this.#editor.setValue((meta[META_COMMENT] ? meta[META_COMMENT][META_COMMENT_VALUE] : null) ?? '');
    this.#editor.show();
    this.refreshEditor(true);

    return true;
  }

  /**
   * Shows comment editor according to cell coordinates.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {boolean} Returns `true` if comment editor was shown.
   */
  showAtCell(row, column) {
    this.setRange({
      from: this.hot._createCellCoords(row, column)
    });

    return this.show();
  }

  /**
   * Hides the comment editor.
   */
  hide() {
    this.#editor.hide();
  }

  /**
   * Refreshes comment editor position and styling.
   *
   * @param {boolean} [force=false] If `true` then recalculation will be forced.
   */
  refreshEditor(force = false) {
    if (!force && (!this.range.from || !this.#editor.isVisible())) {
      return;
    }

    const { rowIndexMapper, columnIndexMapper } = this.hot;
    const { row: visualRow, col: visualColumn } = this.range.from;

    let renderableRow = rowIndexMapper.getRenderableFromVisualIndex(visualRow);
    let renderableColumn = columnIndexMapper.getRenderableFromVisualIndex(visualColumn);
    // Used when the requested row is hidden, and the editor needs to be positioned on the previous row's coords.
    const targetingPreviousRow = renderableRow === null;

    // Reset the editor position to (0, 0) so the opening direction calculation wouldn't be influenced by its
    // previous position
    this.#editor.setPosition(0, 0);

    if (renderableRow === null) {
      renderableRow = rowIndexMapper
        .getRenderableFromVisualIndex(rowIndexMapper.getNearestNotHiddenIndex(visualRow, -1));
    }

    if (renderableColumn === null) {
      renderableColumn = columnIndexMapper
        .getRenderableFromVisualIndex(columnIndexMapper.getNearestNotHiddenIndex(visualColumn, -1));
    }

    const isBeforeRenderedRows = renderableRow === null;
    const isBeforeRenderedColumns = renderableColumn === null;

    renderableRow = renderableRow ?? 0;
    renderableColumn = renderableColumn ?? 0;

    const { rootWindow, view: { _wt: wt } } = this.hot;
    const { wtTable } = wt;
    // TODO: Probably using `hot.getCell` would be the best. However, case for showing comment editor for hidden cell
    // potentially should be removed with that change (currently a test for it is passing).
    const TD = wt.getCell({ row: renderableRow, col: renderableColumn }, true);
    const commentStyle = this.getCommentMeta(visualRow, visualColumn, META_STYLE);

    if (commentStyle) {
      this.#editor.setSize(commentStyle.width, commentStyle.height);

    } else {
      this.#editor.resetSize();
    }

    const lastColWidth = isBeforeRenderedColumns ? 0 : wtTable.getColumnWidth(renderableColumn);
    const lastRowHeight = targetingPreviousRow && !isBeforeRenderedRows ? outerHeight(TD) : 0;

    const {
      left,
      top,
      width: cellWidth,
      height: cellHeight,
    } = TD.getBoundingClientRect();
    const {
      width: editorWidth,
      height: editorHeight,
    } = this.#editor.getSize();

    const { innerWidth, innerHeight } = this.hot.rootWindow;
    const documentElement = this.hot.rootDocument.documentElement;
    let x = left + rootWindow.scrollX + lastColWidth;
    let y = top + rootWindow.scrollY + lastRowHeight;

    if (this.hot.isRtl()) {
      x -= (editorWidth + lastColWidth);
    }

    // flip to the right or left the comments editor position when it goes out of browser viewport
    if (this.hot.isLtr() && left + cellWidth + editorWidth > innerWidth) {
      x = left + rootWindow.scrollX - editorWidth - 1;

    } else if (this.hot.isRtl() && x < -(documentElement.scrollWidth - documentElement.clientWidth)) {
      x = left + rootWindow.scrollX + lastColWidth + 1;
    }

    if (top + editorHeight > innerHeight) {
      y -= (editorHeight - cellHeight + 1);
    }

    this.#editor.setPosition(x, y);
    this.#editor.setReadOnlyState(this.getCommentMeta(visualRow, visualColumn, META_READONLY));
    this.#editor.observeSize();
  }

  /**
   * Focuses the comments editor element.
   */
  focusEditor() {
    this.#editor.focus();
  }

  /**
   * Sets or update the comment-related cell meta.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {object} metaObject Object defining all the comment-related meta information.
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
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {string} property Cell meta property.
   * @returns {Mixed}
   */
  getCommentMeta(row, column, property) {
    const cellMeta = this.hot.getCellMeta(row, column);

    if (!cellMeta[META_COMMENT]) {
      return undefined;
    }

    return cellMeta[META_COMMENT][property];
  }

  /**
   * `mousedown` event callback.
   *
   * @param {MouseEvent} event The `mousedown` event.
   */
  #onMouseDown(event) {
    if (!this.hot.view || !this.hot.view._wt) {
      return;
    }

    if (!this.#preventEditorAutoSwitch && !this.targetIsCommentTextArea(event)) {
      const eventCell = closest(event.target, 'TD', 'TBODY');
      let coordinates = null;

      if (eventCell) {
        coordinates = this.hot.getCoords(eventCell);
      }

      if (!eventCell || ((this.range.from && coordinates) &&
          (this.range.from.row !== coordinates.row || this.range.from.col !== coordinates.col))) {
        this.hide();
      }
    }
  }

  /**
   * Prevent recognizing clicking on the comment editor as clicking outside of table.
   *
   * @param {MouseEvent} event The `mousedown` event.
   */
  #onInputElementMouseDown(event) {
    event.stopPropagation();
  }

  /**
   * `mouseover` event callback.
   *
   * @param {MouseEvent} event The `mouseover` event.
   */
  #onMouseOver(event) {
    const { rootDocument } = this.hot;

    if (this.#preventEditorAutoSwitch || this.#editor.isFocused() || hasClass(event.target, 'wtBorder')
        || this.#cellBelowCursor === event.target || !this.#editor) {
      return;
    }

    this.#cellBelowCursor = rootDocument.elementFromPoint(event.clientX, event.clientY);

    if (this.targetIsCellWithComment(event)) {
      const range = this.hot._createCellRange(this.hot.getCoords(event.target));

      this.#displaySwitch.show(range);

    } else if (isChildOf(event.target, rootDocument) && !this.targetIsCommentTextArea(event)) {
      this.#displaySwitch.hide();
    }
  }

  /**
   * `mouseup` event callback.
   */
  #onMouseUp() {
    this.#preventEditorAutoSwitch = false;
  }

  /**
   * The `afterRenderer` hook callback.
   *
   * @param {HTMLTableCellElement} TD The rendered `TD` element.
   * @param {object} cellProperties The rendered cell's property object.
   */
  #onAfterRenderer(TD, cellProperties) {
    if (cellProperties[META_COMMENT] && cellProperties[META_COMMENT][META_COMMENT_VALUE]) {
      addClass(TD, cellProperties.commentedCellClassName);
    }
  }

  /**
   * Hook observer the "blur" event from the comments editor element. The hook clears the
   * editor content and gives back the keyboard shortcuts control by switching to the "grid" context.
   */
  #onEditorBlur() {
    this.#commentValueBeforeSave = '';
    this.hot.getShortcutManager().setActiveContextName('grid');
    this.setComment();
  }

  /**
   * Hook observer the "focus" event from the comments editor element. The hook takes the control of
   * the keyboard shortcuts by switching the context to plugins one.
   */
  #onEditorFocus() {
    this.#commentValueBeforeSave = this.getComment();
    this.hot.listen();
    this.hot.getShortcutManager().setActiveContextName(SHORTCUTS_CONTEXT_NAME);
  }

  /**
   * Saves the comments editor size to the cell meta.
   *
   * @param {number} width The new width of the editor.
   * @param {number} height The new height of the editor.
   */
  #onEditorResize(width, height) {
    this.updateCommentMeta(this.range.from.row, this.range.from.col, {
      [META_STYLE]: { width, height }
    });
  }

  /**
   * Observes the pressed keys and if there is already opened the comment editor prevents open
   * the table editor into the fast edit mode.
   *
   * @param {Event} event The keydown event.
   */
  #onAfterDocumentKeyDown(event) {
    if (this.#editor.isFocused()) {
      stopImmediatePropagation(event);
    }
  }

  /**
   * Observes the changes in the scroll position if triggered it hides the comment editor.
   */
  #onAfterScroll() {
    if (!this.#preventEditorHiding) {
      this.hide();
    }
  }

  /**
   * Updates the editor theme class name.
   */
  #updateEditorThemeClassName() {
    const editorElement = this.#editor.getEditorElement();

    removeClass(editorElement, /ht-theme-.*/g);
    addClass(editorElement, this.hot.getCurrentThemeName());
  }

  /**
   * Add Comments plugin options to the Context Menu.
   *
   * @private
   * @param {object} options The menu options.
   */
  addToContextMenu(options) {
    options.items.push(
      { name: SEPARATOR },
      addEditCommentItem(this),
      removeCommentItem(this),
      readOnlyCommentItem(this),
    );
  }

  /**
   * Gets the editors input element.
   *
   * @private
   * @returns {HTMLTextAreaElement}
   */
  getEditorInputElement() {
    return this.#editor.getInputElement();
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#editor?.destroy();
    this.#displaySwitch?.destroy();

    super.destroy();
  }
}

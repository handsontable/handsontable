import {
  addClass,
  clearTextSelection,
  empty,
  fastInnerHTML,
  fastInnerText,
  getScrollbarWidth,
  hasClass,
  isChildOf,
  isInput,
  isOutsideInput,
} from './helpers/dom/element';
import EventManager from './eventManager';
import { stopPropagation, isImmediatePropagationStopped, isRightClick, isLeftClick } from './helpers/dom/event';
import Walkontable from './3rdparty/walkontable/src';
import { handleMouseEvent } from './selection/mouseEventHandler';

const privatePool = new WeakMap();

/**
 * @class TableView
 * @private
 */
class TableView {
  /**
   * @param {Hanstontable} instance Instance of {@link Handsontable}
   */
  constructor(instance) {
    /**
     * Instance of {@link Handsontable}
     *
     * @private
     * @type {Handsontable}
     */
    this.instance = instance;
    /**
     * Instance of {@link EventManager}
     *
     * @private
     * @type {EventManager}
     */
    this.eventManager = new EventManager(instance);
    /**
     * Current Handsontable's GridSettings object.
     *
     * @private
     * @type {GridSettings}
     */
    this.settings = instance.getSettings();
    /**
     * Main <THEAD> element.
     *
     * @type {HTMLTableSectionElement}
     */
    this.THEAD = void 0;
    /**
     * Main <TBODY> element.
     *
     * @type {HTMLTableSectionElement}
     */
    this.TBODY = void 0;
    /**
     * Main Walkontable instance.
     *
     * @type {Walkontable}
     */
    this.wt = void 0;
    /**
     * Main Walkontable instance.
     *
     * @private
     * @type {Walkontable}
     */
    this.activeWt = void 0;

    privatePool.set(this, {
      /**
       * Defines if the text should be selected during mousemove.
       *
       * @private
       * @type {Boolean}
       */
      selectionMouseDown: false,
      /**
       * @private
       * @type {Boolean}
       */
      mouseDown: void 0,
      /**
       * Main <TABLE> element.
       *
       * @private
       * @type {HTMLTableElement}
       */
      table: void 0,
      /**
       * Cached width of the rootElement.
       *
       * @type {Number}
       */
      lastWidth: 0,
      /**
       * Cached height of the rootElement.
       *
       * @type {Number}
       */
      lastHeight: 0,
    });

    this.createElements();
    this.registerEvents();
    this.initializeWalkontable();
  }

  /**
   * Renders WalkontableUI.
   */
  render() {
    this.wt.draw(!this.instance.forceFullRender);
    this.instance.forceFullRender = false;
    this.instance.renderCall = false;
  }

  /**
   * Returns td object given coordinates
   *
   * @param {CellCoords} coords
   * @param {Boolean} topmost
   * @returns {HTMLTableCellElement|null}
   */
  getCellAtCoords(coords, topmost) {
    const td = this.wt.getCell(coords, topmost);

    if (td < 0) { // there was an exit code (cell is out of bounds)
      return null;
    }

    return td;
  }

  /**
   * Scroll viewport to a cell.
   *
   * @param {CellCoords} coords
   * @param {Boolean} [snapToTop]
   * @param {Boolean} [snapToRight]
   * @param {Boolean} [snapToBottom]
   * @param {Boolean} [snapToLeft]
   * @returns {Boolean}
   */
  scrollViewport(coords, snapToTop, snapToRight, snapToBottom, snapToLeft) {
    return this.wt.scrollViewport(coords, snapToTop, snapToRight, snapToBottom, snapToLeft);
  }

  /**
   * Scroll viewport to a column.
   *
   * @param {Number} column Visual column index.
   * @param {Boolean} [snapToLeft]
   * @param {Boolean} [snapToRight]
   * @returns {Boolean}
   */
  scrollViewportHorizontally(column, snapToRight, snapToLeft) {
    return this.wt.scrollViewportHorizontally(column, snapToRight, snapToLeft);
  }

  /**
   * Scroll viewport to a row.
   *
   * @param {Number} row Visual row index.
   * @param {Boolean} [snapToTop]
   * @param {Boolean} [snapToBottom]
   * @returns {Boolean}
   */
  scrollViewportVertically(row, snapToTop, snapToBottom) {
    return this.wt.scrollViewportVertically(row, snapToTop, snapToBottom);
  }

  /**
   * Prepares DOMElements and adds correct className to the root element.
   *
   * @private
   */
  createElements() {
    const priv = privatePool.get(this);
    const { rootElement, rootDocument } = this.instance;
    const originalStyle = rootElement.getAttribute('style');

    if (originalStyle) {
      rootElement.setAttribute('data-originalstyle', originalStyle); // needed to retrieve original style in jsFiddle link generator in HT examples. may be removed in future versions
    }

    addClass(rootElement, 'handsontable');

    priv.table = rootDocument.createElement('TABLE');
    addClass(priv.table, 'htCore');

    if (this.instance.getSettings().tableClassName) {
      addClass(priv.table, this.instance.getSettings().tableClassName);
    }

    this.THEAD = rootDocument.createElement('THEAD');
    priv.table.appendChild(this.THEAD);

    this.TBODY = rootDocument.createElement('TBODY');
    priv.table.appendChild(this.TBODY);

    this.instance.table = priv.table;

    this.instance.container.insertBefore(priv.table, this.instance.container.firstChild);
  }

  /**
   * Attaches necessary listeners.
   *
   * @private
   */
  registerEvents() {
    const priv = privatePool.get(this);
    const { rootElement, rootDocument } = this.instance;
    const documentElement = rootDocument.documentElement;

    this.eventManager.addEventListener(rootElement, 'mousedown', (event) => {
      priv.selectionMouseDown = true;

      if (!this.isTextSelectionAllowed(event.target)) {
        const { rootWindow } = this.instance;
        clearTextSelection(rootWindow);
        event.preventDefault();
        rootWindow.focus(); // make sure that window that contains HOT is active. Important when HOT is in iframe.
      }
    });

    this.eventManager.addEventListener(rootElement, 'mouseup', () => {
      priv.selectionMouseDown = false;
    });
    this.eventManager.addEventListener(rootElement, 'mousemove', (event) => {
      if (priv.selectionMouseDown && !this.isTextSelectionAllowed(event.target)) {
        // Clear selection only when fragmentSelection is enabled, otherwise clearing selection breakes the IME editor.
        if (this.settings.fragmentSelection) {
          clearTextSelection(this.instance.rootWindow);
        }
        event.preventDefault();
      }
    });

    this.eventManager.addEventListener(documentElement, 'keyup', (event) => {
      if (this.instance.selection.isInProgress() && !event.shiftKey) {
        this.instance.selection.finish();
      }
    });

    this.eventManager.addEventListener(documentElement, 'mouseup', (event) => {
      if (this.instance.selection.isInProgress() && isLeftClick(event)) { // is left mouse button
        this.instance.selection.finish();
      }

      priv.mouseDown = false;

      if (isOutsideInput(rootDocument.activeElement) || (!this.instance.selection.isSelected() && !isRightClick(event))) {
        this.instance.unlisten();
      }
    });

    this.eventManager.addEventListener(documentElement, 'contextmenu', (event) => {
      if (this.instance.selection.isInProgress() && isRightClick(event)) {
        this.instance.selection.finish();

        priv.mouseDown = false;
      }
    });

    this.eventManager.addEventListener(documentElement, 'touchend', () => {
      if (this.instance.selection.isInProgress()) {
        this.instance.selection.finish();
      }

      priv.mouseDown = false;
    });

    this.eventManager.addEventListener(documentElement, 'mousedown', (event) => {
      const originalTarget = event.target;
      const eventX = event.x || event.clientX;
      const eventY = event.y || event.clientY;
      let next = event.target;

      if (priv.mouseDown || !rootElement || !this.instance.view) {
        return; // it must have been started in a cell
      }

      // immediate click on "holder" means click on the right side of vertical scrollbar
      const { holder } = this.instance.view.wt.wtTable;

      if (next === holder) {
        const scrollbarWidth = getScrollbarWidth(rootDocument);

        if (rootDocument.elementFromPoint(eventX + scrollbarWidth, eventY) !== holder ||
          rootDocument.elementFromPoint(eventX, eventY + scrollbarWidth) !== holder) {
          return;
        }
      } else {
        while (next !== documentElement) {
          if (next === null) {
            if (event.isTargetWebComponent) {
              break;
            }
            // click on something that was a row but now is detached (possibly because your click triggered a rerender)
            return;
          }
          if (next === rootElement) {
            // click inside container
            return;
          }
          next = next.parentNode;
        }
      }

      // function did not return until here, we have an outside click!
      const outsideClickDeselects = typeof this.settings.outsideClickDeselects === 'function' ?
        this.settings.outsideClickDeselects(originalTarget) :
        this.settings.outsideClickDeselects;

      if (outsideClickDeselects) {
        this.instance.deselectCell();
      } else {
        this.instance.destroyEditor(false, false);
      }
    });

    this.eventManager.addEventListener(priv.table, 'selectstart', (event) => {
      if (this.settings.fragmentSelection || isInput(event.target)) {
        return;
      }
      // https://github.com/handsontable/handsontable/issues/160
      // Prevent text from being selected when performing drag down.
      event.preventDefault();
    });
  }

  /**
   * Defines default configuration and initializes WalkOnTable intance.
   *
   * @private
   */
  initializeWalkontable() {
    const priv = privatePool.get(this);
    const walkontableConfig = {
      debug: () => this.settings.debug,
      externalRowCalculator: this.instance.getPlugin('autoRowSize') && this.instance.getPlugin('autoRowSize').isEnabled(),
      table: priv.table,
      preventOverflow: () => this.settings.preventOverflow,
      preventWheel: () => this.settings.preventWheel,
      stretchH: () => this.settings.stretchH,
      data: this.instance.getDataAtCell,
      totalRows: () => this.instance.countRows(),
      totalColumns: () => this.instance.countCols(),
      fixedColumnsLeft: () => this.settings.fixedColumnsLeft,
      fixedRowsTop: () => this.settings.fixedRowsTop,
      fixedRowsBottom: () => this.settings.fixedRowsBottom,
      minSpareRows: () => this.settings.minSpareRows,
      renderAllRows: this.settings.renderAllRows,
      rowHeaders: () => {
        const headerRenderers = [];

        if (this.instance.hasRowHeaders()) {
          headerRenderers.push((row, TH) => this.appendRowHeader(row, TH));
        }

        this.instance.runHooks('afterGetRowHeaderRenderers', headerRenderers);

        return headerRenderers;
      },
      columnHeaders: () => {
        const headerRenderers = [];

        if (this.instance.hasColHeaders()) {
          headerRenderers.push((column, TH) => {
            this.appendColHeader(column, TH);
          });
        }

        this.instance.runHooks('afterGetColumnHeaderRenderers', headerRenderers);

        return headerRenderers;
      },
      columnWidth: this.instance.getColWidth,
      rowHeight: this.instance.getRowHeight,
      cellRenderer: (row, col, TD) => {
        const cellProperties = this.instance.getCellMeta(row, col);
        const prop = this.instance.colToProp(col);
        let value = this.instance.getDataAtRowProp(row, prop);

        if (this.instance.hasHook('beforeValueRender')) {
          value = this.instance.runHooks('beforeValueRender', value, cellProperties);
        }

        this.instance.runHooks('beforeRenderer', TD, row, col, prop, value, cellProperties);
        this.instance.getCellRenderer(cellProperties)(this.instance, TD, row, col, prop, value, cellProperties);
        this.instance.runHooks('afterRenderer', TD, row, col, prop, value, cellProperties);
      },
      selections: this.instance.selection.highlight,
      hideBorderOnMouseDownOver: () => this.settings.fragmentSelection,
      onWindowResize: () => {
        if (!this.instance || this.instance.isDestroyed) {
          return;
        }

        this.instance.refreshDimensions();
      },
      onCellMouseDown: (event, coords, TD, wt) => {
        const blockCalculations = {
          row: false,
          column: false,
          cell: false
        };

        this.instance.listen();

        this.activeWt = wt;
        priv.mouseDown = true;

        this.instance.runHooks('beforeOnCellMouseDown', event, coords, TD, blockCalculations);

        if (isImmediatePropagationStopped(event)) {
          return;
        }

        handleMouseEvent(event, {
          coords,
          selection: this.instance.selection,
          controller: blockCalculations,
        });

        this.instance.runHooks('afterOnCellMouseDown', event, coords, TD);
        this.activeWt = this.wt;
      },
      onCellContextMenu: (event, coords, TD, wt) => {
        this.activeWt = wt;
        priv.mouseDown = false;

        if (this.instance.selection.isInProgress()) {
          this.instance.selection.finish();
        }

        this.instance.runHooks('beforeOnCellContextMenu', event, coords, TD);

        if (isImmediatePropagationStopped(event)) {
          return;
        }

        this.instance.runHooks('afterOnCellContextMenu', event, coords, TD);

        this.activeWt = this.wt;
      },
      onCellMouseOut: (event, coords, TD, wt) => {
        this.activeWt = wt;
        this.instance.runHooks('beforeOnCellMouseOut', event, coords, TD);

        if (isImmediatePropagationStopped(event)) {
          return;
        }

        this.instance.runHooks('afterOnCellMouseOut', event, coords, TD);
        this.activeWt = this.wt;
      },
      onCellMouseOver: (event, coords, TD, wt) => {
        const blockCalculations = {
          row: false,
          column: false,
          cell: false
        };

        this.activeWt = wt;

        this.instance.runHooks('beforeOnCellMouseOver', event, coords, TD, blockCalculations);

        if (isImmediatePropagationStopped(event)) {
          return;
        }

        if (priv.mouseDown) {
          handleMouseEvent(event, {
            coords,
            selection: this.instance.selection,
            controller: blockCalculations,
          });
        }

        this.instance.runHooks('afterOnCellMouseOver', event, coords, TD);
        this.activeWt = this.wt;
      },
      onCellMouseUp: (event, coords, TD, wt) => {
        this.activeWt = wt;
        this.instance.runHooks('beforeOnCellMouseUp', event, coords, TD);

        if (isImmediatePropagationStopped(event)) {
          return;
        }

        this.instance.runHooks('afterOnCellMouseUp', event, coords, TD);
        this.activeWt = this.wt;
      },
      onCellCornerMouseDown: (event) => {
        event.preventDefault();
        this.instance.runHooks('afterOnCellCornerMouseDown', event);
      },
      onCellCornerDblClick: (event) => {
        event.preventDefault();
        this.instance.runHooks('afterOnCellCornerDblClick', event);
      },
      beforeDraw: (force, skipRender) => this.beforeRender(force, skipRender),
      onDraw: force => this.onDraw(force),
      onScrollVertically: () => this.instance.runHooks('afterScrollVertically'),
      onScrollHorizontally: () => this.instance.runHooks('afterScrollHorizontally'),
      onBeforeRemoveCellClassNames: () => this.instance.runHooks('beforeRemoveCellClassNames'),
      onAfterDrawSelection: (currentRow, currentColumn, cornersOfSelection, layerLevel) => this.instance.runHooks('afterDrawSelection',
        currentRow, currentColumn, cornersOfSelection, layerLevel),
      onBeforeDrawBorders: (corners, borderClassName) => this.instance.runHooks('beforeDrawBorders', corners, borderClassName),
      onBeforeTouchScroll: () => this.instance.runHooks('beforeTouchScroll'),
      onAfterMomentumScroll: () => this.instance.runHooks('afterMomentumScroll'),
      onBeforeStretchingColumnWidth: (stretchedWidth, column) => this.instance.runHooks('beforeStretchingColumnWidth', stretchedWidth, column),
      onModifyRowHeaderWidth: rowHeaderWidth => this.instance.runHooks('modifyRowHeaderWidth', rowHeaderWidth),
      onModifyGetCellCoords: (row, column, topmost) => this.instance.runHooks('modifyGetCellCoords', row, column, topmost),
      viewportRowCalculatorOverride: (calc) => {
        let viewportOffset = this.settings.viewportRowRenderingOffset;

        if (viewportOffset === 'auto' && this.settings.fixedRowsTop) {
          viewportOffset = 10;
        }

        if (viewportOffset > 0 || viewportOffset === 'auto') {
          const rows = this.instance.countRows();

          if (typeof viewportOffset === 'number') {
            calc.startRow = Math.max(calc.startRow - viewportOffset, 0);
            calc.endRow = Math.min(calc.endRow + viewportOffset, rows - 1);

          } else if (viewportOffset === 'auto') {
            const center = calc.startRow + calc.endRow - calc.startRow;
            const offset = Math.ceil(center / rows * 12);

            calc.startRow = Math.max(calc.startRow - offset, 0);
            calc.endRow = Math.min(calc.endRow + offset, rows - 1);
          }
        }
        this.instance.runHooks('afterViewportRowCalculatorOverride', calc);
      },
      viewportColumnCalculatorOverride: (calc) => {
        let viewportOffset = this.settings.viewportColumnRenderingOffset;

        if (viewportOffset === 'auto' && this.settings.fixedColumnsLeft) {
          viewportOffset = 10;
        }

        if (viewportOffset > 0 || viewportOffset === 'auto') {
          const cols = this.instance.countCols();

          if (typeof viewportOffset === 'number') {
            calc.startColumn = Math.max(calc.startColumn - viewportOffset, 0);
            calc.endColumn = Math.min(calc.endColumn + viewportOffset, cols - 1);
          }
          if (viewportOffset === 'auto') {
            const center = calc.startColumn + calc.endColumn - calc.startColumn;
            const offset = Math.ceil(center / cols * 12);

            calc.startRow = Math.max(calc.startColumn - offset, 0);
            calc.endColumn = Math.min(calc.endColumn + offset, cols - 1);
          }
        }
        this.instance.runHooks('afterViewportColumnCalculatorOverride', calc);
      },
      rowHeaderWidth: () => this.settings.rowHeaderWidth,
      columnHeaderHeight: () => {
        const columnHeaderHeight = this.instance.runHooks('modifyColumnHeaderHeight');
        return this.settings.columnHeaderHeight || columnHeaderHeight;
      }
    };

    this.instance.runHooks('beforeInitWalkontable', walkontableConfig);

    this.wt = new Walkontable(walkontableConfig);
    this.activeWt = this.wt;

    const spreader = this.wt.wtTable.spreader;
    // We have to cache width and height after Walkontable initialization.
    const { width, height } = this.instance.rootElement.getBoundingClientRect();

    this.setLastSize(width, height);

    this.eventManager.addEventListener(spreader, 'mousedown', (event) => {
      // right mouse button exactly on spreader means right click on the right hand side of vertical scrollbar
      if (event.target === spreader && event.which === 3) {
        stopPropagation(event);
      }
    });

    this.eventManager.addEventListener(spreader, 'contextmenu', (event) => {
      // right mouse button exactly on spreader means right click on the right hand side of vertical scrollbar
      if (event.target === spreader && event.which === 3) {
        stopPropagation(event);
      }
    });

    this.eventManager.addEventListener(this.instance.rootDocument.documentElement, 'click', () => {
      if (this.settings.observeDOMVisibility) {
        if (this.wt.drawInterrupted) {
          this.instance.forceFullRender = true;
          this.render();
        }
      }
    });
  }

  /**
   * Checks if it's possible to create text selection in element.
   *
   * @private
   * @param {HTMLElement} el
   * @returns {Boolean}
   */
  isTextSelectionAllowed(el) {
    if (isInput(el)) {
      return true;
    }
    const isChildOfTableBody = isChildOf(el, this.instance.view.wt.wtTable.spreader);

    if (this.settings.fragmentSelection === true && isChildOfTableBody) {
      return true;
    }
    if (this.settings.fragmentSelection === 'cell' && this.isSelectedOnlyCell() && isChildOfTableBody) {
      return true;
    }
    if (!this.settings.fragmentSelection && this.isCellEdited() && this.isSelectedOnlyCell()) {
      return true;
    }

    return false;
  }

  /**
   * Checks if user's been called mousedown.
   *
   * @private
   * @returns {Boolean}
   */
  isMouseDown() {
    return privatePool.get(this).mouseDown;
  }

  /**
   * Check if selected only one cell.
   *
   * @private
   * @returns {Boolean}
   */
  isSelectedOnlyCell() {
    const [row, col, rowEnd, colEnd] = this.instance.getSelectedLast() || [];

    return row !== void 0 && row === rowEnd && col === colEnd;
  }

  /**
   * Checks if active cell is editing.
   *
   * @private
   * @returns {Boolean}
   */
  isCellEdited() {
    const activeEditor = this.instance.getActiveEditor();

    return activeEditor && activeEditor.isOpened();
  }

  /**
   * `beforeDraw` callback.
   *
   * @private
   * @param {Boolean} force
   * @param {Boolean} skipRender
   */
  beforeRender(force, skipRender) {
    if (force) {
      // this.instance.forceFullRender = did Handsontable request full render?
      this.instance.runHooks('beforeRender', this.instance.forceFullRender, skipRender);
    }
  }

  /**
   * `onDraw` callback.
   *
   * @private
   * @param {Boolean} force
   */
  onDraw(force) {
    if (force) {
      // this.instance.forceFullRender = did Handsontable request full render?
      this.instance.runHooks('afterRender', this.instance.forceFullRender);
    }
  }

  /**
   * Append row header to a TH element
   *
   * @private
   * @param row
   * @param TH
   */
  appendRowHeader(row, TH) {
    if (TH.firstChild) {
      const container = TH.firstChild;

      if (!hasClass(container, 'relative')) {
        empty(TH);
        this.appendRowHeader(row, TH);

        return;
      }

      this.updateCellHeader(container.querySelector('.rowHeader'), row, this.instance.getRowHeader);

    } else {
      const { rootDocument, getRowHeader } = this.instance;
      const div = rootDocument.createElement('div');
      const span = rootDocument.createElement('span');

      div.className = 'relative';
      span.className = 'rowHeader';
      this.updateCellHeader(span, row, getRowHeader);

      div.appendChild(span);
      TH.appendChild(div);
    }

    this.instance.runHooks('afterGetRowHeader', row, TH);
  }

  /**
   * Append column header to a TH element
   *
   * @private
   * @param col
   * @param TH
   */
  appendColHeader(col, TH) {
    if (TH.firstChild) {
      const container = TH.firstChild;

      if (hasClass(container, 'relative')) {
        this.updateCellHeader(container.querySelector('.colHeader'), col, this.instance.getColHeader);
      } else {
        empty(TH);
        this.appendColHeader(col, TH);
      }

    } else {
      const { rootDocument } = this.instance;
      const div = rootDocument.createElement('div');
      const span = rootDocument.createElement('span');

      div.className = 'relative';
      span.className = 'colHeader';
      this.updateCellHeader(span, col, this.instance.getColHeader);

      div.appendChild(span);
      TH.appendChild(div);
    }

    this.instance.runHooks('afterGetColHeader', col, TH);
  }

  /**
   * Updates header cell content.
   *
   * @since 0.15.0-beta4
   * @param {HTMLElement} element Element to update
   * @param {Number} index Row index or column index
   * @param {Function} content Function which should be returns content for this cell
   */
  updateCellHeader(element, index, content) {
    let renderedIndex = index;
    const parentOverlay = this.wt.wtOverlays.getParentOverlay(element) || this.wt;

    // prevent wrong calculations from SampleGenerator
    if (element.parentNode) {
      if (hasClass(element, 'colHeader')) {
        renderedIndex = parentOverlay.wtTable.columnFilter.sourceToRendered(index);

      } else if (hasClass(element, 'rowHeader')) {
        renderedIndex = parentOverlay.wtTable.rowFilter.sourceToRendered(index);
      }
    }

    if (renderedIndex > -1) {
      fastInnerHTML(element, content(index));

    } else {
      // workaround for https://github.com/handsontable/handsontable/issues/1946
      fastInnerText(element, String.fromCharCode(160));
      addClass(element, 'cornerHeader');
    }
  }

  /**
   * Given a element's left position relative to the viewport, returns maximum element width until the right
   * edge of the viewport (before scrollbar)
   *
   * @private
   * @param {Number} leftOffset
   * @return {Number}
   */
  maximumVisibleElementWidth(leftOffset) {
    const workspaceWidth = this.wt.wtViewport.getWorkspaceWidth();
    const maxWidth = workspaceWidth - leftOffset;

    return maxWidth > 0 ? maxWidth : 0;
  }

  /**
   * Given a element's top position relative to the viewport, returns maximum element height until the bottom
   * edge of the viewport (before scrollbar)
   *
   * @private
   * @param {Number} topOffset
   * @return {Number}
   */
  maximumVisibleElementHeight(topOffset) {
    const workspaceHeight = this.wt.wtViewport.getWorkspaceHeight();
    const maxHeight = workspaceHeight - topOffset;

    return maxHeight > 0 ? maxHeight : 0;
  }

  /**
   * Sets new dimensions of the container.
   */
  setLastSize(width, height) {
    const priv = privatePool.get(this);

    [priv.lastWidth, priv.lastHeight] = [width, height];
  }

  /**
   * Returns cached dimensions.
   */
  getLastSize() {
    const priv = privatePool.get(this);

    return { width: priv.lastWidth, height: priv.lastHeight };
  }

  /**
   * Checks if master overlay is active.
   *
   * @private
   * @returns {Boolean}
   */
  mainViewIsActive() {
    return this.wt === this.activeWt;
  }

  /**
   * Destroyes internal WalkOnTable's instance. Detaches all of the bonded listeners.
   *
   * @private
   */
  destroy() {
    this.wt.destroy();
    this.eventManager.destroy();
  }
}

export default TableView;


import type { WalkontableInstance } from '../../types';
import type EventManager from '../../../../../eventManager';
import type { BorderInstanceSettings, CornerDefaultStyle, SelectionHandles } from './types';
import {
  addClass,
  hasClass,
  removeClass,
  getTrimmingContainer,
  innerWidth,
  innerHeight,
  offset,
  outerHeight,
  outerWidth,
  isHTMLElement,
} from '../../../../../helpers/dom/element';
import { stopImmediatePropagation } from '../../../../../helpers/dom/event';
import { isMobileBrowser } from '../../../../../helpers/browser';
import { getCornerStyle } from './utils';

const BORDER_STYLE_CLASS_PREFIX = 'ht-border-style-';
const BORDER_STYLE_VERTICAL_SUFFIX = '-vertical';
const BORDER_STYLE_HORIZONTAL_SUFFIX = '-horizontal';

/**
 *
 */
class Border {
  /**
   * @type {EventManager}
   */
  declare eventManager: EventManager;
  /**
   * @type {WalkontableInstance}
   */
  declare instance: WalkontableInstance;
  /**
   * @type {WalkontableInstance}
   */
  declare wot: WalkontableInstance;
  /**
   * @type {BorderInstanceSettings}
   */
  declare settings: BorderInstanceSettings;
  /**
   * @type {boolean}
   */
  declare mouseDown: boolean;
  /**
   * @type {HTMLDivElement | null}
   */
  declare main: HTMLDivElement | null;
  /**
   * @type {HTMLElement | null}
   */
  declare top: HTMLElement | null;
  /**
   * @type {HTMLElement | null}
   */
  declare bottom: HTMLElement | null;
  /**
   * @type {HTMLElement | null}
   */
  declare start: HTMLElement | null;
  /**
   * @type {HTMLElement | null}
   */
  declare end: HTMLElement | null;
  /**
   * @type {CSSStyleDeclaration | null}
   */
  declare topStyle: CSSStyleDeclaration | null;
  /**
   * @type {CSSStyleDeclaration | null}
   */
  declare bottomStyle: CSSStyleDeclaration | null;
  /**
   * @type {CSSStyleDeclaration | null}
   */
  declare startStyle: CSSStyleDeclaration | null;
  /**
   * @type {CSSStyleDeclaration | null}
   */
  declare endStyle: CSSStyleDeclaration | null;
  /**
   * @type {CornerDefaultStyle}
   */
  declare cornerDefaultStyle: CornerDefaultStyle;
  /**
   * @type {number}
   */
  declare cornerCenterPointOffset: number;
  /**
   * @type {HTMLElement | null}
   */
  declare corner: HTMLElement | null;
  /**
   * @type {CSSStyleDeclaration | null}
   */
  declare cornerStyle: CSSStyleDeclaration | null;
  /**
   * @type {SelectionHandles}
   */
  declare selectionHandles: SelectionHandles;
  /**
   * @type {boolean}
   */
  declare disabled: boolean;

  // TODO As this is an internal class, should be designed for using {Walkontable}. It uses the facade,
  // TODO Con. Because the class is created on place where the instance reference comes from external origin.
  // TODO Imho, the discrimination for handling both, facade and non-facade should be handled.
  /**
   * @param {WalkontableFacade} wotInstance The Walkontable instance.
   * @param {object} settings The border settings.
   */
  constructor(wotInstance: WalkontableInstance, settings: BorderInstanceSettings) {
    if (!settings) {
      return;
    }
    this.eventManager = wotInstance.eventManager;
    this.instance = wotInstance;
    this.wot = wotInstance;
    this.settings = settings;
    this.mouseDown = false;
    this.main = null;

    this.top = null;
    this.bottom = null;
    this.start = null;
    this.end = null;

    this.topStyle = null;
    this.bottomStyle = null;
    this.startStyle = null;
    this.endStyle = null;

    this.cornerDefaultStyle = getCornerStyle(this.instance);
    // Offset to moving the corner to be centered relative to the grid.
    this.cornerCenterPointOffset = -Math.ceil((parseInt(String(this.cornerDefaultStyle.width), 10) / 2));
    this.corner = null;
    this.cornerStyle = null;

    this.createBorders(settings);
    this.registerListeners();
  }

  /**
   * Register all necessary events.
   */
  registerListeners() {
    const documentBody = this.wot.rootDocument.body;

    this.eventManager.addEventListener(documentBody, 'mousedown', () => this.onMouseDown());
    this.eventManager.addEventListener(documentBody, 'mouseup', () => this.onMouseUp());

    if (this.main) {
      for (let c = 0, len = this.main.childNodes.length; c < len; c++) {
        const mainNode = this.main;
        const element = mainNode.childNodes[c];

        this.eventManager
          .addEventListener(element as Element, 'mouseenter',
            (event: MouseEvent) => this.onMouseEnter(event, mainNode.childNodes[c] as HTMLElement));
      }
    }
  }

  /**
   * Mouse down listener.
   *
   * @private
   */
  onMouseDown() {
    this.mouseDown = true;
  }

  /**
   * Mouse up listener.
   *
   * @private
   */
  onMouseUp() {
    this.mouseDown = false;
  }

  /**
   * Mouse enter listener for fragment selection functionality.
   *
   * @private
   * @param {Event} event Dom event.
   * @param {HTMLElement} parentElement Part of border element.
   */
  onMouseEnter(event: MouseEvent, parentElement: HTMLElement) {
    if (!this.mouseDown || !this.wot.getSetting('hideBorderOnMouseDownOver')) {
      return;
    }
    event.preventDefault();
    stopImmediatePropagation(event);

    const documentBody = this.wot.rootDocument.body;
    const bounds = parentElement.getBoundingClientRect();

    // Hide border to prevents selection jumping when fragmentSelection is enabled.
    parentElement.style.display = 'none';

    /**
     * @param {Event} mouseEvent The mouse event object.
     * @returns {boolean}
     */
    function isOutside(mouseEvent: MouseEvent) {
      if (mouseEvent.clientY < Math.floor(bounds.top)) {
        return true;
      }
      if (mouseEvent.clientY > Math.ceil(bounds.top + bounds.height)) {
        return true;
      }
      if (mouseEvent.clientX < Math.floor(bounds.left)) {
        return true;
      }
      if (mouseEvent.clientX > Math.ceil(bounds.left + bounds.width)) {
        return true;
      }
    }

    /**
     * @param {Event} handlerEvent The mouse event object.
     */
    const handler = (handlerEvent: MouseEvent) => {
      if (isOutside(handlerEvent)) {
        this.eventManager.removeEventListener(documentBody, 'mousemove', handler as (event: Event) => void);
        parentElement.style.display = 'block';
      }
    };

    this.eventManager.addEventListener(documentBody, 'mousemove', handler);
  }

  /**
   * Create border elements.
   *
   * @param {object} settings The border settings.
   */
  createBorders(settings: BorderInstanceSettings) {
    const { rootDocument } = this.wot;

    this.main = rootDocument.createElement('div');

    const borderDivs = ['top', 'start', 'bottom', 'end', 'corner'] as const;
    let style = this.main.style;

    style.position = 'absolute';
    style.top = '0';
    style.left = '0';

    const createdDivs: HTMLDivElement[] = [];

    for (let i = 0; i < 5; i++) {
      const position = borderDivs[i];
      const div = rootDocument.createElement('div');
      const getSettingsProperty = (property: string) => {
        const posSettings = this.settings[position];

        return (posSettings && posSettings[property])
          ? posSettings[property] : settings.border?.[property];
      };

      div.className = `wtBorder ${this.settings.className || ''}`; // + borderDivs[i];

      if (this.settings[position]?.hide) {
        div.className += ' hidden';
      }

      style = div.style;

      const borderStyle = getSettingsProperty('style');

      if (borderStyle) {
        if (['start', 'end'].includes(position)) {
          div.className += ` ${BORDER_STYLE_CLASS_PREFIX}${borderStyle}${BORDER_STYLE_VERTICAL_SUFFIX}`;
        } else {
          div.className += ` ${BORDER_STYLE_CLASS_PREFIX}${borderStyle}${BORDER_STYLE_HORIZONTAL_SUFFIX}`;
        }

        style.setProperty('--ht-custom-border-size', `${getSettingsProperty('width')}px`);
        style.setProperty('--ht-custom-border-color', String(getSettingsProperty('color') ?? ''));

      } else {
        style.backgroundColor = String(getSettingsProperty('color') ?? '');
      }

      style.height = `${getSettingsProperty('width')}px`;
      style.width = `${getSettingsProperty('width')}px`;

      createdDivs.push(div);
      this.main.appendChild(div);
    }
    this.top = createdDivs[0];
    this.start = createdDivs[1];
    this.bottom = createdDivs[2];
    this.end = createdDivs[3];

    this.topStyle = this.top.style;
    this.startStyle = this.start.style;
    this.bottomStyle = this.bottom.style;
    this.endStyle = this.end.style;

    this.corner = createdDivs[4];
    this.corner.className += ' corner';
    this.cornerStyle = this.corner.style;
    this.cornerStyle!.width = `${this.cornerDefaultStyle.width}px`;
    this.cornerStyle!.height = `${this.cornerDefaultStyle.height}px`;
    this.cornerStyle!.border = [
      `${this.cornerDefaultStyle.borderWidth}px`,
      this.cornerDefaultStyle.borderStyle,
      this.cornerDefaultStyle.borderColor
    ].join(' ');

    if (isMobileBrowser() && this.instance.getSetting('isDataViewInstance')) {
      this.createMultipleSelectorHandles();
    }
    this.disappear();

    const { wtTable } = this.wot;
    let bordersHolder = wtTable.bordersHolder;

    if (!bordersHolder) {
      bordersHolder = rootDocument.createElement('div');
      bordersHolder.className = 'htBorders';
      wtTable.bordersHolder = bordersHolder;
      wtTable.spreader.appendChild(bordersHolder);
    }
    bordersHolder.appendChild(this.main);
  }

  /**
   * Create multiple selector handler for mobile devices.
   */
  createMultipleSelectorHandles() {
    const { rootDocument, wtSettings } = this.wot;
    const stylesHandler = wtSettings.getSetting('stylesHandler');
    const cellMobileHandleSize = stylesHandler.getCSSVariableValue('cell-mobile-handle-size');
    const cellMobileHandleBorderRadius = stylesHandler.getCSSVariableValue('cell-mobile-handle-border-radius');
    const cellMobileHandleBackgroundColor = stylesHandler.getCSSVariableValue('cell-mobile-handle-background-color');
    const cellMobileHandleBackgroundOpacity =
      stylesHandler.getCSSVariableValue('cell-mobile-handle-background-opacity');
    const cellMobileHandleBorderWidth = stylesHandler.getCSSVariableValue('cell-mobile-handle-border-width');
    const cellMobileHandleBorderColor = stylesHandler.getCSSVariableValue('cell-mobile-handle-border-color');

    this.selectionHandles = {
      top: rootDocument.createElement('div'),
      topHitArea: rootDocument.createElement('div'),
      bottom: rootDocument.createElement('div'),
      bottomHitArea: rootDocument.createElement('div'),
      styles: {} as SelectionHandles['styles'],
    };
    const hitAreaWidth = 40;

    this.selectionHandles.top.className = 'topSelectionHandle topLeftSelectionHandle';
    this.selectionHandles.topHitArea.className = 'topSelectionHandle-HitArea topLeftSelectionHandle-HitArea';
    this.selectionHandles.bottom.className = 'bottomSelectionHandle bottomRightSelectionHandle';
    this.selectionHandles.bottomHitArea.className = 'bottomSelectionHandle-HitArea bottomRightSelectionHandle-HitArea';

    this.selectionHandles.styles = {
      top: this.selectionHandles.top.style,
      topHitArea: this.selectionHandles.topHitArea.style,
      bottom: this.selectionHandles.bottom.style,
      bottomHitArea: this.selectionHandles.bottomHitArea.style
    };

    const hitAreaTargets = [this.selectionHandles.styles.bottomHitArea, this.selectionHandles.styles.topHitArea];

    for (const hitAreaStyleTarget of hitAreaTargets) {
      hitAreaStyleTarget.position = 'absolute';
      hitAreaStyleTarget.height = `${hitAreaWidth}px`;
      hitAreaStyleTarget.width = `${hitAreaWidth}px`;
      hitAreaStyleTarget.borderRadius = `${parseInt(String(hitAreaWidth / 1.5), 10)}px`;
    }

    for (const handleStyleTarget of [this.selectionHandles.styles.bottom, this.selectionHandles.styles.top]) {
      handleStyleTarget.position = 'absolute';
      handleStyleTarget.height = `${cellMobileHandleSize}px`;
      handleStyleTarget.width = `${cellMobileHandleSize}px`;
      handleStyleTarget.borderRadius = `${cellMobileHandleBorderRadius}px`;
      // eslint-disable-next-line max-len
      handleStyleTarget.background = `color-mix(in srgb, ${cellMobileHandleBackgroundColor} ${cellMobileHandleBackgroundOpacity}%, transparent)`;
      handleStyleTarget.border = `${cellMobileHandleBorderWidth}px solid ${cellMobileHandleBorderColor}`;
    }
  }

  /**
   * Checks if the given coordinates are south-east of the area selection. If `true` then
   * the fill handler should be visible.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {boolean}
   */
  isSouthEastOfAreaSelection(row: number, col: number) {
    const areaSelection = this.wot.selectionManager.getAreaSelection();

    if (!areaSelection) {
      return false;
    }

    // If the area selection is empty, that means only one cell is selected.
    // In this case, the fill handler should be visible.
    if (!areaSelection.cellRange) {
      return true;
    }

    const bottomEndCorner = areaSelection.cellRange.getBottomEndCorner();

    return bottomEndCorner.row === row && bottomEndCorner.col === col;
  }

  /**
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {number} top The top position of the handler.
   * @param {number} left The left position of the handler.
   * @param {number} width The width of the handler.
   * @param {number} height The height of the handler.
   */
  updateMultipleSelectionHandlesPosition(
    row: number, col: number, top: number, left: number, width: number, height: number) {
    const isRtl = this.wot.wtSettings.getSetting('rtlMode');
    const inlinePosProperty = isRtl ? 'right' : 'left';
    const {
      top: topStyles,
      topHitArea: topHitAreaStyles,
      bottom: bottomStyles,
      bottomHitArea: bottomHitAreaStyles,
    } = this.selectionHandles.styles;

    const handleBorderSize = parseInt(topStyles.borderWidth, 10);
    const handleSize = parseInt(topStyles.width, 10);
    const hitAreaSize = parseInt(topHitAreaStyles.width, 10);
    const totalTableWidth = this.wot.wtTable.getWidth();
    const totalTableHeight = this.wot.wtTable.getHeight();

    topStyles.top = `${parseInt(String(top - handleSize - 1), 10)}px`;
    topStyles[inlinePosProperty] = `${parseInt(String(left - handleSize - 1), 10)}px`;

    topHitAreaStyles.top = `${parseInt(String(top - ((hitAreaSize / 4) * 3)), 10)}px`;
    topHitAreaStyles[inlinePosProperty] = `${parseInt(String(left - ((hitAreaSize / 4) * 3)), 10)}px`;

    const bottomHandlerInline = Math.min(
      parseInt(String(left + width), 10),
      totalTableWidth - handleSize - (handleBorderSize * 2),
    );
    const bottomHandlerAreaInline = Math.min(
      parseInt(String(left + width - (hitAreaSize / 4)), 10),
      totalTableWidth - hitAreaSize - (handleBorderSize * 2),
    );

    bottomStyles[inlinePosProperty] = `${bottomHandlerInline}px`;
    bottomHitAreaStyles[inlinePosProperty] = `${bottomHandlerAreaInline}px`;

    const bottomHandlerTop = Math.min(
      parseInt(String(top + height), 10),
      totalTableHeight - handleSize - (handleBorderSize * 2),
    );
    const bottomHandlerAreaTop = Math.min(
      parseInt(String(top + height - (hitAreaSize / 4)), 10),
      totalTableHeight - hitAreaSize - (handleBorderSize * 2),
    );

    bottomStyles.top = `${bottomHandlerTop}px`;
    bottomHitAreaStyles.top = `${bottomHandlerAreaTop}px`;

    const cornerVisible = this.settings.border?.cornerVisible;

    if (cornerVisible && typeof cornerVisible === 'function' && cornerVisible()) {
      topStyles.display = 'block';
      topHitAreaStyles.display = 'block';

      if (this.isSouthEastOfAreaSelection(row, col)) {
        bottomStyles.display = 'block';
        bottomHitAreaStyles.display = 'block';
      } else {
        bottomStyles.display = 'none';
        bottomHitAreaStyles.display = 'none';
      }
    } else {
      topStyles.display = 'none';
      bottomStyles.display = 'none';
      topHitAreaStyles.display = 'none';
      bottomHitAreaStyles.display = 'none';
    }

    if (row === this.wot.wtSettings.getSetting('fixedRowsTop') ||
        col === this.wot.wtSettings.getSetting('fixedColumnsStart')) {
      topStyles.zIndex = '9999';
      topHitAreaStyles.zIndex = '9999';
    } else {
      topStyles.zIndex = '';
      topHitAreaStyles.zIndex = '';
    }
  }

  /**
   * Tells whether a selection edge lands exactly on a frozen-pane boundary and is therefore owned
   * by the frozen overlay (drawn by `drawFrozenBoundaryEdge` and hidden on the master). It depends
   * only on the global fixed-pane settings and the raw selection corner, so the master and the
   * frozen overlay always evaluate it on identical inputs.
   *
   * @private
   * @param {'row'|'column'} axis The freeze axis to test (`row` → `fixedRowsTop`, `column` → `fixedColumnsStart`).
   * @param {number} fromIndex The selection's top (`row`) or inline-start (`column`) corner index.
   * @returns {boolean}
   */
  isFrozenBoundaryEdge(axis: 'row' | 'column', fromIndex: number): boolean {
    if (axis === 'row') {
      const fixedRowsTop = this.wot.getSetting('fixedRowsTop') as number;

      return fixedRowsTop > 0 && fromIndex === fixedRowsTop;
    }

    const fixedColumnsStart = this.wot.getSetting('fixedColumnsStart') as number;

    return fixedColumnsStart > 0 && fromIndex === fixedColumnsStart;
  }

  /**
   * Draws the single selection-border edge that lies exactly on a frozen-pane boundary.
   *
   * When `fixedRowsTop`/`fixedColumnsStart` are used, a selection located in the master pane but
   * flush against the freeze line has its top/inline-start edge drawn by the master overlay right
   * on that line, where the frozen overlay (stacked above the master) occludes it. This method
   * re-draws that one edge inside the frozen overlay (`top` / `inline_start`), just within its
   * clipped area, so the edge becomes visible. It is a no-op unless the relevant fixed-pane option
   * is active and the selection's edge is flush with the boundary (`fromRow === fixedRowsTop` /
   * `fromColumn === fixedColumnsStart`). `appear` hides the matching master edge under the same
   * condition, so exactly one line is drawn.
   *
   * @param {number[]} corners The selection corners `[fromRow, fromColumn, toRow, toColumn]`.
   * @returns {boolean} `true` when a boundary edge was drawn (regular drawing should be skipped).
   */
  drawFrozenBoundaryEdge(corners: number[]): boolean {
    const { wtTable } = this.wot;
    const overlayName = wtTable.name;
    const isTopOverlay = overlayName === 'top';
    const isInlineStartOverlay = overlayName === 'inline_start';

    if (!isTopOverlay && !isInlineStartOverlay) {
      return false;
    }

    // In RTL the horizontal axis is mirrored: edges are anchored with `right` (measured from the
    // table's right edge), exactly like the regular flow in `appear`. Row-freeze (vertical) geometry
    // is direction-agnostic.
    const isRtl = this.wot.wtSettings.getSetting('rtlMode');
    const [fromRow, fromColumn, toRow, toColumn] = corners;
    // Cross-axis offset for the thin dimension of the boundary line. The frozen overlay clips its
    // content at the freeze line, so the line is anchored by its FAR edge (bottom for `top`,
    // inline-end for `inline_start`) flush to that line — i.e. shifted by its own thickness — to keep
    // it fully inside the clipped pane for borders thicker than 1px. This intentionally differs from
    // the `-1` table-border compensation used on the along-axis (which mirrors the regular `appear`).
    const borderWidth = this.settings.border?.width ?? 0;
    // Along-axis extension applied to the line's length, mirroring `appear` (which adds
    // `ceil(borderWidth / 2)` to every edge's width/height so the corners meet). Without it the
    // boundary line falls short of the side edges drawn by the master, leaving a gap at the corner
    // for borders thicker than 1px.
    const delta = Math.ceil(borderWidth / 2);

    // The cheap integer/DOM-lookup guards below run first; `offset()` (which forces a layout
    // reflow) is deferred to the success path so the common bail-outs stay reflow-free.
    if (isTopOverlay) {
      const fixedRowsTop = this.wot.getSetting('fixedRowsTop') as number;

      // Decision shared with the master's suppression via `isFrozenBoundaryEdge`, so both panes
      // agree on which one owns the edge. The rendered-range and cell-lookup guards below are
      // defensive: if any fails, the edge is off-screen or not renderable in this overlay, in which
      // case it simply stays hidden on both panes (a visual no-op).
      if (!this.isFrozenBoundaryEdge('row', fromRow)) {
        return false;
      }

      const firstColumn = Math.max(fromColumn, wtTable.getFirstRenderedColumn());
      const lastColumn = Math.min(toColumn, wtTable.getLastRenderedColumn());

      if (lastColumn < firstColumn) {
        return false;
      }

      const boundaryRow = fixedRowsTop - 1;
      const boundaryTD = wtTable.getCell(this.wot.createCellCoords(boundaryRow, firstColumn));
      const boundaryEndTD = wtTable.getCell(this.wot.createCellCoords(boundaryRow, lastColumn));

      if (!isHTMLElement(boundaryTD) || !isHTMLElement(boundaryEndTD)) {
        return false;
      }

      const containerOffset = offset(wtTable.TABLE);
      const boundaryOffset = offset(boundaryTD);
      const freezeLineY = boundaryOffset.top + outerHeight(boundaryTD);
      const endOffset = offset(boundaryEndTD);

      this.disappear();
      this.topStyle!.top = `${freezeLineY - containerOffset.top - borderWidth}px`;

      if (isRtl) {
        // `firstColumn` (lowest index) is the visual-right cell, `lastColumn` the visual-left one.
        const spanRightX = boundaryOffset.left + outerWidth(boundaryTD);
        const tableRightX = containerOffset.left + outerWidth(wtTable.TABLE);

        this.topStyle!.right = `${tableRightX - spanRightX - 1}px`;
        this.topStyle!.width = `${spanRightX - endOffset.left + delta}px`;
      } else {
        this.topStyle!.left = `${boundaryOffset.left - containerOffset.left - 1}px`;
        this.topStyle!.width = `${endOffset.left + outerWidth(boundaryEndTD) - boundaryOffset.left + delta}px`;
      }

      this.topStyle!.display = 'block';

      return true;
    }

    // inline_start overlay → draw the inline-start (left, in LTR) edge on the column freeze line.
    const fixedColumnsStart = this.wot.getSetting('fixedColumnsStart') as number;

    // Mirror of the top branch on the column axis. Decision shared with the master via
    // `isFrozenBoundaryEdge`; the later guards are defensive (see the top branch).
    if (!this.isFrozenBoundaryEdge('column', fromColumn)) {
      return false;
    }

    const firstRow = Math.max(fromRow, wtTable.getFirstRenderedRow());
    const lastRow = Math.min(toRow, wtTable.getLastRenderedRow());

    if (lastRow < firstRow) {
      return false;
    }

    const boundaryColumn = fixedColumnsStart - 1;
    const boundaryTD = wtTable.getCell(this.wot.createCellCoords(firstRow, boundaryColumn));
    const boundaryEndTD = wtTable.getCell(this.wot.createCellCoords(lastRow, boundaryColumn));

    if (!isHTMLElement(boundaryTD) || !isHTMLElement(boundaryEndTD)) {
      return false;
    }

    const containerOffset = offset(wtTable.TABLE);
    const boundaryOffset = offset(boundaryTD);
    const endOffset = offset(boundaryEndTD);

    this.disappear();
    this.startStyle!.top = `${boundaryOffset.top - containerOffset.top - 1}px`;

    if (isRtl) {
      // RTL: the frozen pane sits on the right, so the freeze line is the boundary cell's LEFT edge,
      // and the edge is drawn just inside it (to the right) via the `right` anchor.
      const tableRightX = containerOffset.left + outerWidth(wtTable.TABLE);

      this.startStyle!.right = `${tableRightX - boundaryOffset.left - borderWidth}px`;
    } else {
      const freezeLineX = boundaryOffset.left + outerWidth(boundaryTD);

      this.startStyle!.left = `${freezeLineX - containerOffset.left - borderWidth}px`;
    }

    this.startStyle!.height = `${endOffset.top + outerHeight(boundaryEndTD) - boundaryOffset.top + delta}px`;
    this.startStyle!.display = 'block';

    return true;
  }

  /**
   * Show border around one or many cells.
   *
   * @param {Array} corners The corner coordinates.
   */
  appear(corners: number[]) {
    if (this.disabled) {
      return;
    }

    // A selection located in the master pane but flush against a frozen-pane boundary has its
    // top/inline-start edge rendered by the master overlay right on the freeze line, where the
    // frozen overlay (painted above the master) occludes it. Re-draw that single edge inside the
    // frozen overlay so it stays visible. No-op unless `fixedRowsTop`/`fixedColumnsStart` is used.
    if (this.drawFrozenBoundaryEdge(corners)) {
      return;
    }

    let [fromRow, fromColumn, toRow, toColumn] = corners;

    // Capture the top-start corner before the clamping below mutates it — used to suppress the
    // master's boundary edge (so it isn't doubled by the frozen overlay's edge).
    const originalFromRow = fromRow;
    const originalFromColumn = fromColumn;

    // borders can not be rendered on headers so hide them
    if (fromRow < 0 && toRow < 0 || fromColumn < 0 && toColumn < 0) {
      this.disappear();

      return;
    }

    const { wtTable, rootDocument, rootWindow } = this.wot;
    const isMultiple = (fromRow !== toRow || fromColumn !== toColumn);
    const firstRenderedRow = wtTable.getFirstRenderedRow();
    const lastRenderedRow = wtTable.getLastRenderedRow();
    const firstRenderedColumn = wtTable.getFirstRenderedColumn();
    const lastRenderedColumn = wtTable.getLastRenderedColumn();

    if (
      firstRenderedColumn < 0 && lastRenderedColumn < 0 ||
      firstRenderedRow < 0 && lastRenderedRow < 0
    ) {
      // ...also when overlays have rendered only headers skip it
      this.disappear();

      return;
    }

    let fromTD: HTMLElement | number;

    if (isMultiple) {
      fromColumn = Math.max(fromColumn, firstRenderedColumn);
      toColumn = Math.min(toColumn, lastRenderedColumn);
      fromRow = Math.max(fromRow, firstRenderedRow);
      toRow = Math.min(toRow, lastRenderedRow);

      if (toColumn < fromColumn || toRow < fromRow) {
        this.disappear();

        return;
      }

      fromTD = wtTable.getCell(this.wot.createCellCoords(fromRow, fromColumn));

      if (!isHTMLElement(fromTD)) {
        this.disappear();

        return;
      }
    } else {

      fromTD = wtTable.getCell(this.wot.createCellCoords(fromRow, fromColumn));

      if (!isHTMLElement(fromTD)) {
        this.disappear();

        return;
      }
    }

    const toTD = isMultiple ? wtTable.getCell(this.wot.createCellCoords(toRow, toColumn)) : fromTD;
    const fromTDEl = fromTD;
    const toTDEl = isHTMLElement(toTD) ? toTD : fromTDEl;
    const fromOffset = offset(fromTDEl);
    const toOffset = isMultiple ? offset(toTDEl) : fromOffset;
    const containerOffset = offset(wtTable.TABLE);
    const minTop = fromOffset.top;
    const minLeft = fromOffset.left;
    const isRtl = this.wot.wtSettings.getSetting('rtlMode');

    let inlineStartPos = 0;
    let width = 0;

    if (isRtl) {
      const containerWidth = outerWidth(wtTable.TABLE);
      const fromWidth = outerWidth(fromTDEl);
      const gridRightPos = rootWindow.innerWidth - containerOffset.left - containerWidth;

      width = minLeft + fromWidth - toOffset.left;
      inlineStartPos = rootWindow.innerWidth - minLeft - fromWidth - gridRightPos - 1;

    } else {
      width = toOffset.left + outerWidth(toTDEl) - minLeft;
      inlineStartPos = minLeft - containerOffset.left - 1;
    }

    if (this.isEntireColumnSelected(fromRow, toRow)) {
      const rowHeader = fromRow;
      const modifiedValues = this.getDimensionsFromHeader('columns', fromColumn, toColumn, rowHeader, containerOffset);
      let fromTH = null;

      if (modifiedValues) {
        [fromTH, inlineStartPos, width] = modifiedValues;
      }

      if (fromTH) {
        fromTD = fromTH;
      }
    }

    let top = minTop - containerOffset.top - 1;
    let height = toOffset.top + outerHeight(toTDEl) - minTop;

    if (this.isEntireRowSelected(fromColumn, toColumn)) {
      const columnHeader = fromColumn;
      const modifiedValues = this.getDimensionsFromHeader('rows', fromRow, toRow, columnHeader, containerOffset);
      let fromTH = null;

      if (modifiedValues) {
        [fromTH, top, height] = modifiedValues;
      }

      if (fromTH) {
        fromTD = fromTH;
      }
    }

    const style = rootWindow.getComputedStyle(fromTDEl);

    if (parseInt(style.borderTopWidth, 10) > 0) {
      top += 1;
      height = height > 0 ? height - 1 : 0;
    }
    if (parseInt(style[isRtl ? 'borderRightWidth' : 'borderLeftWidth'], 10) > 0) {
      inlineStartPos += 1;
      width = width > 0 ? width - 1 : 0;
    }

    const inlinePosProperty = isRtl ? 'right' : 'left';
    const delta = Math.ceil((this.settings.border?.width ?? 0) / 2);

    this.topStyle!.top = `${top}px`;
    this.topStyle![inlinePosProperty] = `${inlineStartPos}px`;
    this.topStyle!.width = `${width + delta}px`;
    this.topStyle!.display = 'block';

    this.startStyle!.top = `${top}px`;
    this.startStyle![inlinePosProperty] = `${inlineStartPos}px`;
    this.startStyle!.height = `${height + delta}px`;
    this.startStyle!.display = 'block';

    this.bottomStyle!.top = `${top + height - parseInt(this.bottomStyle!.height, 10) + delta}px`;
    this.bottomStyle![inlinePosProperty] = `${inlineStartPos}px`;
    this.bottomStyle!.width = `${width + delta}px`;
    this.bottomStyle!.display = 'block';

    this.endStyle!.top = `${top}px`;
    this.endStyle![inlinePosProperty] = `${inlineStartPos + width - parseInt(this.endStyle!.width, 10) + delta}px`;
    this.endStyle!.height = `${height + delta}px`;
    this.endStyle!.display = 'block';

    // A selection edge that lands exactly on a frozen-pane boundary is owned by the frozen overlay
    // (drawn by `drawFrozenBoundaryEdge`). Hide it on the master so the two lines don't stack into a
    // doubled/thicker border. The shared `isFrozenBoundaryEdge` predicate guarantees the master and
    // the frozen overlay take this decision on identical inputs.
    if (wtTable.isMaster) {
      if (this.isFrozenBoundaryEdge('row', originalFromRow)) {
        this.topStyle!.display = 'none';
      }
      if (this.isFrozenBoundaryEdge('column', originalFromColumn)) {
        this.startStyle!.display = 'none';
      }
    }

    let cornerVisibleSetting = this.settings.border?.cornerVisible;

    cornerVisibleSetting = typeof cornerVisibleSetting === 'function' ?
      cornerVisibleSetting(this.settings.layerLevel) : cornerVisibleSetting;

    const hookResult = this.wot.getSetting('onModifyGetCellCoords', toRow, toColumn, false, 'render');
    let [checkRow, checkCol] = [toRow, toColumn];

    if (hookResult && Array.isArray(hookResult)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      [,, checkRow, checkCol] = hookResult;
    }

    if (isMobileBrowser() || !cornerVisibleSetting || !this.isSouthEastOfAreaSelection(checkRow, checkCol)) {
      this.cornerStyle!.display = 'none';

    } else {
      const cornerBorderWidth = Number(this.cornerDefaultStyle.borderWidth); // eslint-disable-line no-lonely-if

      this.cornerStyle!.top = `${top + height + this.cornerCenterPointOffset - cornerBorderWidth}px`;
      this.cornerStyle![inlinePosProperty] = `${
        inlineStartPos + width + this.cornerCenterPointOffset - (Number(this.cornerDefaultStyle.borderWidth))
      }px`;
      this.cornerStyle!.borderRightWidth = `${this.cornerDefaultStyle.borderWidth}px`;
      this.cornerStyle!.borderLeftWidth = `${this.cornerDefaultStyle.borderWidth}px`;
      this.cornerStyle!.borderBottomWidth = `${this.cornerDefaultStyle.borderWidth}px`;
      this.cornerStyle!.width = String(this.cornerDefaultStyle.width);

      // Hide the fill handle, so the possible further adjustments won't force unneeded scrollbars.
      this.cornerStyle!.display = 'none';

      let trimmingContainer: HTMLElement | Window = getTrimmingContainer(wtTable.TABLE);
      const trimToWindow = Object.is(trimmingContainer, rootWindow);

      if (trimToWindow) {
        trimmingContainer = rootDocument.documentElement;
      }

      // -1 was initially removed from the base position to compensate for the table border. We need to exclude it from
      // the corner width.
      const cornerBorderCompensation = parseInt(String(this.cornerDefaultStyle.borderWidth), 10) - 1;
      const cornerHalfWidth = Math.ceil(parseInt(String(this.cornerDefaultStyle.width), 10) / 2);
      const cornerHalfHeight = Math.ceil(parseInt(String(this.cornerDefaultStyle.height), 10) / 2);

      if (toColumn === (this.wot.getSetting('totalColumns') as number) - 1) {
        const toTdOffsetLeft = trimToWindow ? toTDEl.getBoundingClientRect().left : toTDEl.offsetLeft;
        let cornerOverlappingContainer = false;
        let cornerEdge = 0;

        if (isRtl) {
          cornerEdge = toTdOffsetLeft - (parseInt(String(this.cornerDefaultStyle.width), 10) / 2);
          cornerOverlappingContainer = cornerEdge < 0;

        } else {
          cornerEdge = toTdOffsetLeft + outerWidth(toTDEl) + (parseInt(String(this.cornerDefaultStyle.width), 10) / 2);
          cornerOverlappingContainer = cornerEdge >= innerWidth(trimmingContainer);
        }

        if (cornerOverlappingContainer) {
          const inlineStartPosition = Math.floor(
            inlineStartPos + width + this.cornerCenterPointOffset - cornerHalfWidth - cornerBorderCompensation
          );

          addClass(this.corner!, 'wtCornerInlineEndEdge');

          this.cornerStyle![inlinePosProperty] = `${inlineStartPosition - 1}px`;
        }
      } else {
        removeClass(this.corner!, 'wtCornerInlineEndEdge');
      }

      if (toRow === (this.wot.getSetting('totalRows') as number) - 1) {
        const toTdOffsetTop = trimToWindow ? toTDEl.getBoundingClientRect().top : toTDEl.offsetTop;
        const cornerHalfHeight = parseInt(String(this.cornerDefaultStyle.height), 10) / 2;
        const cornerBottomEdge = toTdOffsetTop + outerHeight(toTDEl) + cornerHalfHeight;
        const cornerOverlappingContainer = cornerBottomEdge >= innerHeight(trimmingContainer);

        if (cornerOverlappingContainer) {
          const cornerTopPosition = Math.floor(
            top + height + this.cornerCenterPointOffset - cornerHalfHeight - cornerBorderCompensation
          );

          addClass(this.corner!, 'wtCornerBlockEndEdge');

          this.cornerStyle!.top = `${cornerTopPosition - 1}px`;
        }
      } else {
        removeClass(this.corner!, 'wtCornerBlockEndEdge');
      }

      this.cornerStyle!.display = 'block';
    }

    if (isMobileBrowser() && this.instance.getSetting('isDataViewInstance')) {
      this.updateMultipleSelectionHandlesPosition(toRow, toColumn, top, inlineStartPos, width, height);
    }
  }

  /**
   * Check whether an entire column of cells is selected.
   *
   * @private
   * @param {number} startRowIndex Start row index.
   * @param {number} endRowIndex End row index.
   * @returns {boolean}
   */
  isEntireColumnSelected(startRowIndex: number, endRowIndex: number) {
    return startRowIndex === this.wot.wtTable.getFirstRenderedRow() &&
      endRowIndex === this.wot.wtTable.getLastRenderedRow();
  }

  /**
   * Check whether an entire row of cells is selected.
   *
   * @private
   * @param {number} startColumnIndex Start column index.
   * @param {number} endColumnIndex End column index.
   * @returns {boolean}
   */
  isEntireRowSelected(startColumnIndex: number, endColumnIndex: number) {
    return startColumnIndex === this.wot.wtTable.getFirstRenderedColumn() &&
      endColumnIndex === this.wot.wtTable.getLastRenderedColumn();
  }

  /**
   * Get left/top index and width/height depending on the `direction` provided.
   *
   * @private
   * @param {string} direction `rows` or `columns`, defines if an entire column or row is selected.
   * @param {number} fromIndex Start index of the selection.
   * @param {number} toIndex End index of the selection.
   * @param {number} headerIndex The header index as negative value.
   * @param {number} containerOffset Offset of the container.
   * @returns {Array|boolean} Returns an array of [headerElement, left, width] or [headerElement, top, height], depending on `direction` (`false` in case of an error getting the headers).
   */
  getDimensionsFromHeader(
    direction: string, fromIndex: number, toIndex: number, headerIndex: number,
    containerOffset: { top: number; left: number }): false | [HTMLElement, number, number] {
    const { wtTable } = this.wot;
    const rootHotElement = wtTable.wtRootElement.parentNode as HTMLElement;
    let getHeaderFn: ((...args: unknown[]) => HTMLElement | undefined) | null = null;
    let dimensionFn: ((el: HTMLElement) => number) | null = null;
    let entireSelectionClassname: string | null = null;
    let index: number | null = null;
    let dimension: number | null = null;
    let dimensionProperty: 'top' | 'left' | null = null;
    let startHeader: HTMLElement | undefined | null = null;
    let endHeader: HTMLElement | undefined | null = null;

    switch (direction) {
      case 'rows':
        getHeaderFn = (...args: unknown[]) => wtTable.getRowHeader(args[0] as number, args[1] as number);
        dimensionFn = (el: HTMLElement) => outerHeight(el);
        entireSelectionClassname = 'ht__selection--rows';
        dimensionProperty = 'top';

        break;

      case 'columns':
        getHeaderFn = (...args: unknown[]) => wtTable.getColumnHeader(args[0] as number, args[1] as number);
        dimensionFn = (el: HTMLElement) => outerWidth(el);
        entireSelectionClassname = 'ht__selection--columns';
        dimensionProperty = 'left';
        break;
      default:
    }

    if (entireSelectionClassname && rootHotElement.classList.contains(entireSelectionClassname)) {
      type ColHeadersFn = (...args: unknown[]) => unknown;
      const columnHeaderLevelCount = (this.wot.getSetting('columnHeaders') as ColHeadersFn[]).length;

      startHeader = getHeaderFn?.(fromIndex, columnHeaderLevelCount - headerIndex);
      endHeader = getHeaderFn?.(toIndex, columnHeaderLevelCount - headerIndex);

      if (!startHeader || !endHeader) {
        return false;
      }

      const startHeaderOffset = offset(startHeader);
      const endOffset = offset(endHeader);
      const startOff = startHeaderOffset[dimensionProperty!];
      const endOff = endOffset[dimensionProperty!];
      const contOff = containerOffset[dimensionProperty!];

      index = startOff - contOff - 1;
      dimension = endOff + dimensionFn!(endHeader) - startOff;

      return [startHeader, index, dimension];
    }

    return false;
  }

  /**
   * Change border style.
   *
   * @private
   * @param {string} borderElement Coordinate where add/remove border: top, bottom, start, end.
   * @param {object} border The border object descriptor.
   */
  changeBorderStyle(borderElement: 'top' | 'bottom' | 'start' | 'end', border: Record<string, unknown>) {
    const element = this[borderElement]!;
    const style = element.style;
    const borderStyle = border[borderElement] as Record<string, unknown>;

    if (!borderStyle || borderStyle.hide) {
      addClass(element, 'hidden');

    } else {
      if (hasClass(element, 'hidden')) {
        removeClass(element, 'hidden');
      }

      style.backgroundColor = String(borderStyle.color ?? '');

      if (borderElement === 'top' || borderElement === 'bottom') {
        style.height = `${borderStyle.width}px`;
      }

      if (borderElement === 'start' || borderElement === 'end') {
        style.width = `${borderStyle.width}px`;
      }
    }
  }

  /**
   * Change border style to default.
   *
   * @private
   * @param {string} position The position type ("top", "bottom", "start", "end") to change.
   */
  changeBorderToDefaultStyle(position: 'top' | 'bottom' | 'start' | 'end') {
    const defaultBorder = {
      width: 1,
      color: '#000',
    };
    const style = this[position]!.style;

    style.backgroundColor = defaultBorder.color;
    style.width = `${defaultBorder.width}px`;
    style.height = `${defaultBorder.width}px`;
  }

  /**
   * Toggle class 'hidden' to element.
   *
   * @private
   * @param {string} borderElement Coordinate where add/remove border: top, bottom, start, end.
   * @param {boolean} [remove] Defines type of the action to perform.
   */
  toggleHiddenClass(borderElement: 'top' | 'bottom' | 'start' | 'end', remove: boolean) {
    this.changeBorderToDefaultStyle(borderElement);

    const element = this[borderElement]!;

    if (remove) {
      addClass(element, 'hidden');
    } else {
      removeClass(element, 'hidden');
    }
  }

  /**
   * Hide border.
   */
  disappear() {
    this.topStyle!.display = 'none';
    this.bottomStyle!.display = 'none';
    this.startStyle!.display = 'none';
    this.endStyle!.display = 'none';
    this.cornerStyle!.display = 'none';

    if (isMobileBrowser() && this.instance.getSetting('isDataViewInstance')) {
      this.selectionHandles.styles.top.display = 'none';
      this.selectionHandles.styles.topHitArea.display = 'none';
      this.selectionHandles.styles.bottom.display = 'none';
      this.selectionHandles.styles.bottomHitArea.display = 'none';
    }
  }

  /**
   * Cleans up all the DOM state related to a Border instance. Call this prior to deleting a Border instance.
   */
  destroy() {
    this.eventManager.destroyWithOwnEventsOnly();
    this.main?.parentNode?.removeChild(this.main);
  }
}

export default Border;

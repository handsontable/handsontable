
import type { WalkontableInstance } from '../../types';
import type EventManager from '../../../../../eventManager';
import type { BorderInstanceSettings, CornerDefaultStyle, SelectionHandles } from './types';
import {
  addClass,
  hasClass,
  removeClass,
  getTrimmingContainer,
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

    this.cornerDefaultStyle = getCornerStyle(this.wot);
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
    const bounds = this.wot.domBindings.geometryReader.getBoundingClientRect(parentElement);

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

    if (isMobileBrowser() && this.wot.getSetting('isDataViewInstance')) {
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
   * Tells whether a selection edge lands exactly on a frozen-pane boundary and is therefore owned by
   * the frozen overlay. Depends only on the fixed-pane settings and the raw corner, so every overlay
   * evaluates it on identical inputs.
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
   * Tells whether the selection's boundary corner (the cell flush with a frozen-pane line) has
   * scrolled behind the frozen pane in the master viewport. The frozen overlay can't detect this
   * itself (its rendered range is sticky), so we consult the scroll-aware master and stop drawing the
   * edge once the cell is occluded by the pane.
   *
   * @private
   * @param {'row'|'column'} axis The freeze axis to test (`row` → vertical, `column` → horizontal).
   * @param {number} fromIndex The selection's boundary corner index on that axis.
   * @returns {boolean} `true` when the boundary corner is scrolled out (edge must not be drawn).
   */
  isBoundaryCornerScrolledOut(axis: 'row' | 'column', fromIndex: number): boolean {
    const masterTable = this.wot.cloneSource?.wtTable;

    if (!masterTable) {
      return false;
    }

    const firstVisible = axis === 'row'
      ? masterTable.getFirstVisibleRow()
      : masterTable.getFirstVisibleColumn();

    return firstVisible >= 0 && fromIndex < firstVisible;
  }

  /**
   * Mirror of {@link Border#isFrozenBoundaryEdge} for the bottom freeze line: tells whether the
   * selection's bottom edge lands exactly on the `fixedRowsBottom` boundary (the line between the last
   * non-frozen row and the first bottom-frozen row), and is therefore owned by the bottom overlay.
   *
   * @private
   * @param {number} toIndex The selection's bottom corner row index.
   * @returns {boolean}
   */
  isFrozenBottomBoundaryEdge(toIndex: number): boolean {
    const fixedRowsBottom = this.wot.getSetting('fixedRowsBottom') as number;
    const totalRows = this.wot.getSetting('totalRows') as number;

    return fixedRowsBottom > 0 && toIndex === totalRows - fixedRowsBottom - 1;
  }

  /**
   * Mirror of {@link Border#isBoundaryCornerScrolledOut} for the bottom freeze line: tells whether the
   * selection's bottom boundary cell has scrolled behind the bottom frozen pane in the master viewport
   * (it then drops below the last visible master row), so the edge must not be drawn.
   *
   * @private
   * @param {number} toIndex The selection's bottom boundary corner row index.
   * @returns {boolean} `true` when the boundary corner is scrolled out (edge must not be drawn).
   */
  isBottomBoundaryCornerScrolledOut(toIndex: number): boolean {
    const masterTable = this.wot.cloneSource?.wtTable;

    if (!masterTable) {
      return false;
    }

    const lastVisible = masterTable.getLastVisibleRow();

    return lastVisible >= 0 && toIndex > lastVisible;
  }

  /**
   * Draws the selection-border edge(s) that lie exactly on a frozen-pane boundary, where the master
   * renders them on the freeze line under the occluding frozen overlay. Re-draws each such edge
   * inside the frozen overlay(s) that own it (clamped to each overlay's rendered range), while
   * `appear` hides the matching master edge so exactly one line is drawn per segment.
   *
   * @param {number[]} corners The selection corners `[fromRow, fromColumn, toRow, toColumn]`.
   * @returns {boolean} `true` when a boundary edge was drawn (regular drawing should be skipped).
   */
  drawFrozenBoundaryEdge(corners: number[]): boolean {
    const { wtTable } = this.wot;
    const overlayName = wtTable.name;
    const isTopOverlay = overlayName === 'top';
    const isInlineStartOverlay = overlayName === 'inline_start';
    const isCornerOverlay = overlayName === 'top_inline_start_corner';
    const isBottomOverlay = overlayName === 'bottom';
    const isBottomCornerOverlay = overlayName === 'bottom_inline_start_corner';

    if (!isTopOverlay && !isInlineStartOverlay && !isCornerOverlay &&
        !isBottomOverlay && !isBottomCornerOverlay) {
      return false;
    }

    // In RTL the horizontal axis is mirrored: edges are anchored with `right`, like the regular flow
    // in `appear`. Row-freeze (vertical) geometry is direction-agnostic.
    const isRtl = this.wot.wtSettings.getSetting('rtlMode');
    const [fromRow, fromColumn, toRow, toColumn] = corners;
    const borderWidth = this.settings.border?.width ?? 0;
    // Along-axis length extension mirroring `appear`'s `ceil(borderWidth / 2)`, so corners meet.
    // Without it the line falls short of the master's side edges for borders thicker than 1px.
    const delta = Math.ceil(borderWidth / 2);

    // `rowEdgeOwned`/`columnEdgeOwned` are true when the selection's top/start edge lands on the
    // freeze line AND its boundary cell is still visible. Resolved once and reused by every branch
    // below.
    const rowEdgeOwned = this.isFrozenBoundaryEdge('row', fromRow) &&
      !this.isBoundaryCornerScrolledOut('row', fromRow);
    const columnEdgeOwned = this.isFrozenBoundaryEdge('column', fromColumn) &&
      !this.isBoundaryCornerScrolledOut('column', fromColumn);

    // The bottom-freeze counterpart of `rowEdgeOwned`: the selection's bottom edge lands on the
    // `fixedRowsBottom` line and its boundary cell is still visible in the master.
    const bottomRowEdgeOwned = this.isFrozenBottomBoundaryEdge(toRow) &&
      !this.isBottomBoundaryCornerScrolledOut(toRow);

    // The row-freeze edge straddles the freeze line: the master draws its lower half (below the seam)
    // and the frozen overlay its upper half (above the seam, on top of the opaque pane), so together
    // they show the full thickness in both selection and edit modes. Split between the `top` overlay
    // (non-frozen columns) and the corner overlay (frozen columns), each clamped to its rendered range.
    if (rowEdgeOwned && (isTopOverlay || isCornerOverlay)) {
      const firstColumn = Math.max(fromColumn, wtTable.getFirstRenderedColumn());
      const lastColumn = Math.min(toColumn, wtTable.getLastRenderedColumn());

      if (this.drawRowFreezeEdge(firstColumn, lastColumn, isRtl, delta)) {
        return true;
      }
    }

    // The column-freeze edge is split between the `inline_start` overlay (non-frozen rows) and the
    // top/bottom corner overlays (top-frozen / bottom-frozen rows), each clamped to its own rendered
    // row range so together they cover the edge without overlap. Mirror of the row-freeze branch on
    // the column axis. Without the bottom corner the slice that reaches down into the bottom-frozen
    // rows would be occluded by that overlay and left undrawn.
    if (columnEdgeOwned && (isInlineStartOverlay || isCornerOverlay || isBottomCornerOverlay)) {
      const firstRow = Math.max(fromRow, wtTable.getFirstRenderedRow());
      const lastRow = Math.min(toRow, wtTable.getLastRenderedRow());

      if (this.drawColumnFreezeEdge(firstRow, lastRow, isRtl, delta)) {
        return true;
      }
    }

    // The bottom-freeze edge is split between the `bottom` overlay (non-frozen columns) and the bottom
    // corner overlay (frozen columns), mirroring the row-freeze branch on the bottom axis. The bottom
    // overlay occludes the master's edge on the freeze line, so re-draw it here.
    if (bottomRowEdgeOwned && (isBottomOverlay || isBottomCornerOverlay)) {
      const firstColumn = Math.max(fromColumn, wtTable.getFirstRenderedColumn());
      const lastColumn = Math.min(toColumn, wtTable.getLastRenderedColumn());

      if (this.drawRowFreezeBottomEdge(firstColumn, lastColumn, isRtl, delta)) {
        return true;
      }
    }

    // When the corner lands on BOTH freeze lines, the top and start edges meet in the frozen×frozen
    // square owned by the corner overlay, which occludes both their tips and leaves a gap. Draw that
    // connecting square here to close it.
    if (isCornerOverlay && rowEdgeOwned && columnEdgeOwned) {
      if (this.drawFrozenBoundaryCorner(isRtl, borderWidth)) {
        return true;
      }
    }

    // Bottom mirror of the branch above: when the corner lands on BOTH the bottom and column freeze
    // lines, the bottom and start edges meet in the bottom corner overlay's frozen×frozen square,
    // which occludes their tips. Draw that connecting square here to close the gap.
    if (isBottomCornerOverlay && bottomRowEdgeOwned && columnEdgeOwned) {
      if (this.drawFrozenBottomBoundaryCorner(isRtl, borderWidth)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Shared inline-axis writer for the row/bottom freeze edges. Given the boundary cells and an
   * already-resolved vertical position, writes the horizontal anchor + width (RTL-aware) on the
   * supplied border element and reveals it. The top and bottom freeze edges differ only in which
   * gridline they sit on and which element they reuse, so they delegate the identical inline math
   * here. Cheap range/cell-lookup guards run before any reflow-forcing `geometryReader.offset()`, so non-drawing
   * calls leave the styles untouched.
   *
   * @private
   * @param {number} boundaryRow The row whose edge carries the freeze line.
   * @param {CSSStyleDeclaration} style The border element to position (`topStyle` or `bottomStyle`).
   * @param {number} firstColumn The first column index to span (clamped to the overlay).
   * @param {number} lastColumn The last column index to span (clamped to the overlay).
   * @param {boolean} isRtl Whether the grid is rendered right-to-left.
   * @param {number} delta The along-axis length extension (`ceil(borderWidth / 2)`).
   * @param {Function} resolveTop Resolves the edge's `top` (px) from the boundary cell and offsets.
   * @returns {boolean} `true` when the edge was drawn.
   */
  drawHorizontalFreezeEdge(
    boundaryRow: number,
    style: CSSStyleDeclaration,
    firstColumn: number,
    lastColumn: number,
    isRtl: boolean,
    delta: number,
    resolveTop: (
      boundaryTD: HTMLElement, boundaryOffset: { top: number, left: number }, containerTop: number
    ) => number
  ): boolean {
    const { geometryReader } = this.wot.domBindings;

    if (lastColumn < firstColumn) {
      return false;
    }

    const { wtTable } = this.wot;
    const boundaryTD = wtTable.getCell(this.wot.createCellCoords(boundaryRow, firstColumn));
    const boundaryEndTD = wtTable.getCell(this.wot.createCellCoords(boundaryRow, lastColumn));

    if (!isHTMLElement(boundaryTD) || !isHTMLElement(boundaryEndTD)) {
      return false;
    }

    const containerOffset = geometryReader.offset(wtTable.TABLE);
    const boundaryOffset = geometryReader.offset(boundaryTD);
    const endOffset = geometryReader.offset(boundaryEndTD);

    // The `-1` overlaps the border shared with the previous column, mirroring `appear`. At column 0
    // there is no previous column, so drop the shift and shorten the line to avoid protruding past
    // the pane edge.
    const startShift = firstColumn === 0 ? 0 : 1;

    this.disappear();
    style.top = `${resolveTop(boundaryTD, boundaryOffset, containerOffset.top)}px`;

    if (isRtl) {
      // `firstColumn` (lowest index) is the visual-right cell, `lastColumn` the visual-left one.
      const spanRightX = boundaryOffset.left + geometryReader.outerWidth(boundaryTD);
      const tableRightX = containerOffset.left + geometryReader.outerWidth(wtTable.TABLE);

      style.right = `${tableRightX - spanRightX - startShift}px`;
      style.width = `${spanRightX - endOffset.left + delta - (1 - startShift)}px`;
    } else {
      style.left = `${boundaryOffset.left - containerOffset.left - startShift}px`;
      const edgeWidth = endOffset.left + geometryReader.outerWidth(boundaryEndTD)
        - boundaryOffset.left + delta - (1 - startShift);

      style.width = `${edgeWidth}px`;
    }

    style.display = 'block';

    return true;
  }

  /**
   * Draws the selection's top edge on the row freeze line across the given (clamped) column span,
   * anchored one pixel inside the freeze line by a constant so borders of different widths line up.
   *
   * @private
   * @param {number} firstColumn The first column index to span (clamped to the overlay).
   * @param {number} lastColumn The last column index to span (clamped to the overlay).
   * @param {boolean} isRtl Whether the grid is rendered right-to-left.
   * @param {number} delta The along-axis length extension (`ceil(borderWidth / 2)`).
   * @returns {boolean} `true` when the edge was drawn.
   */
  drawRowFreezeEdge(
    firstColumn: number, lastColumn: number, isRtl: boolean, delta: number): boolean {
    const boundaryRow = (this.wot.getSetting('fixedRowsTop') as number) - 1;

    // The seam sits on the boundary cell's BOTTOM edge, one pixel up to overlap the shared gridline.
    return this.drawHorizontalFreezeEdge(
      boundaryRow, this.topStyle!, firstColumn, lastColumn, isRtl, delta,
      (boundaryTD, boundaryOffset, containerTop) =>
        boundaryOffset.top + this.wot.domBindings.geometryReader.outerHeight(boundaryTD) - containerTop - 1
    );
  }

  /**
   * Mirror of {@link Border#drawRowFreezeEdge} for the bottom freeze line: draws the selection's
   * bottom edge on the `fixedRowsBottom` line across the given (clamped) column span. The boundary
   * cell is the FIRST bottom-frozen row, and the freeze line is its TOP edge (= bottom of the last
   * non-frozen row). Uses the `bottom` border element.
   *
   * @private
   * @param {number} firstColumn The first column index to span (clamped to the overlay).
   * @param {number} lastColumn The last column index to span (clamped to the overlay).
   * @param {boolean} isRtl Whether the grid is rendered right-to-left.
   * @param {number} delta The along-axis length extension (`ceil(borderWidth / 2)`).
   * @returns {boolean} `true` when the edge was drawn.
   */
  drawRowFreezeBottomEdge(
    firstColumn: number, lastColumn: number, isRtl: boolean, delta: number): boolean {
    const fixedRowsBottom = this.wot.getSetting('fixedRowsBottom') as number;
    const totalRows = this.wot.getSetting('totalRows') as number;
    const boundaryRow = totalRows - fixedRowsBottom;

    // The freeze line is the boundary cell's TOP edge; position like `appear`'s bottom border
    // (`cellBottom - thickness + delta`, where `cellBottom` is the freeze line) so borders of
    // different widths stay aligned on the gridline.
    return this.drawHorizontalFreezeEdge(
      boundaryRow, this.bottomStyle!, firstColumn, lastColumn, isRtl, delta,
      (_boundaryTD, boundaryOffset, containerTop) =>
        boundaryOffset.top - containerTop - parseInt(this.bottomStyle!.height, 10) + delta
    );
  }

  /**
   * Draws the selection's inline-start edge on the column freeze line across the given (clamped) row
   * span, anchored one pixel inside the freeze line by a constant so borders of different widths line
   * up. Guard/reflow behavior mirrors `drawRowFreezeEdge`.
   *
   * @private
   * @param {number} firstRow The first row index to span (clamped to the overlay).
   * @param {number} lastRow The last row index to span (clamped to the overlay).
   * @param {boolean} isRtl Whether the grid is rendered right-to-left.
   * @param {number} delta The along-axis length extension (`ceil(borderWidth / 2)`).
   * @returns {boolean} `true` when the edge was drawn.
   */
  drawColumnFreezeEdge(
    firstRow: number, lastRow: number, isRtl: boolean, delta: number): boolean {
    if (lastRow < firstRow) {
      return false;
    }

    const { geometryReader } = this.wot.domBindings;
    const { wtTable } = this.wot;
    const boundaryColumn = (this.wot.getSetting('fixedColumnsStart') as number) - 1;
    const boundaryTD = wtTable.getCell(this.wot.createCellCoords(firstRow, boundaryColumn));
    const boundaryEndTD = wtTable.getCell(this.wot.createCellCoords(lastRow, boundaryColumn));

    if (!isHTMLElement(boundaryTD) || !isHTMLElement(boundaryEndTD)) {
      return false;
    }

    const containerOffset = geometryReader.offset(wtTable.TABLE);
    const boundaryOffset = geometryReader.offset(boundaryTD);
    const endOffset = geometryReader.offset(boundaryEndTD);

    // The `-1` overlaps the border shared with the row above, like `appear`. At row 0 there is no row
    // above, so drop the shift and shorten the line to avoid protruding past the pane top.
    const atFirstRow = firstRow === 0;
    let edgeTop = boundaryOffset.top - containerOffset.top - 1;
    let edgeHeight = endOffset.top + geometryReader.outerHeight(boundaryEndTD) - boundaryOffset.top + delta;

    if (atFirstRow) {
      edgeTop += 1;
      edgeHeight = Math.max(edgeHeight - 1, 0);
    }

    this.disappear();
    this.startStyle!.top = `${edgeTop}px`;

    if (isRtl) {
      // RTL: the frozen pane sits on the right, so the freeze line is the boundary cell's LEFT edge,
      // and the edge is drawn one pixel inside it (to the right) via the `right` anchor.
      const tableRightX = containerOffset.left + geometryReader.outerWidth(wtTable.TABLE);

      this.startStyle!.right = `${tableRightX - boundaryOffset.left - 1}px`;
    } else {
      const freezeLineX = boundaryOffset.left + geometryReader.outerWidth(boundaryTD);

      this.startStyle!.left = `${freezeLineX - containerOffset.left - 1}px`;
    }

    this.startStyle!.height = `${edgeHeight}px`;
    this.startStyle!.display = 'block';

    return true;
  }

  /**
   * Shared writer for the freeze-corner squares. Draws the `borderWidth`-sized square bridging a
   * row/bottom edge and the inline-start edge where a selection corner lands on both freeze lines,
   * since that square sits in the corner overlay's frozen×frozen region that occludes both edges'
   * tips. Anchored one pixel inside the freeze column; the caller resolves the vertical position and
   * the border element to reuse. Reflow/guard behavior mirrors the freeze-edge helpers.
   *
   * @private
   * @param {number} boundaryRow The row whose edge carries the freeze line.
   * @param {CSSStyleDeclaration} style The border element to position (`topStyle` or `bottomStyle`).
   * @param {boolean} isRtl Whether the grid is rendered right-to-left.
   * @param {number} borderWidth The configured border width in pixels.
   * @param {Function} resolveTop Resolves the square's `top` (px) from the boundary cell and offsets.
   * @returns {boolean} `true` when the corner square was drawn.
   */
  drawFreezeCorner(
    boundaryRow: number,
    style: CSSStyleDeclaration,
    isRtl: boolean,
    borderWidth: number,
    resolveTop: (
      boundaryTD: HTMLElement, boundaryOffset: { top: number, left: number }, containerTop: number
    ) => number
  ): boolean {
    const { geometryReader } = this.wot.domBindings;
    const { wtTable } = this.wot;
    const boundaryColumn = (this.wot.getSetting('fixedColumnsStart') as number) - 1;
    const boundaryTD = wtTable.getCell(this.wot.createCellCoords(boundaryRow, boundaryColumn));

    if (!isHTMLElement(boundaryTD)) {
      return false;
    }

    const containerOffset = geometryReader.offset(wtTable.TABLE);
    const boundaryOffset = geometryReader.offset(boundaryTD);

    this.disappear();
    style.top = `${resolveTop(boundaryTD, boundaryOffset, containerOffset.top)}px`;
    style.height = `${borderWidth}px`;
    style.width = `${borderWidth}px`;

    if (isRtl) {
      // RTL: the frozen pane is on the right, so the freeze line is the boundary cell's LEFT edge;
      // the square sits one pixel inside it (to the right) via the `right` anchor.
      const tableRightX = containerOffset.left + geometryReader.outerWidth(wtTable.TABLE);

      style.right = `${tableRightX - boundaryOffset.left - 1}px`;
    } else {
      const freezeLineX = boundaryOffset.left + geometryReader.outerWidth(boundaryTD);

      style.left = `${freezeLineX - containerOffset.left - 1}px`;
    }

    style.display = 'block';

    return true;
  }

  /**
   * Draws the corner square bridging the top and inline-start edges where a selection corner lands on
   * both the `fixedRowsTop` and `fixedColumnsStart` freeze lines. Reuses the `top` border element.
   *
   * @private
   * @param {boolean} isRtl Whether the grid is rendered right-to-left.
   * @param {number} borderWidth The configured border width in pixels.
   * @returns {boolean} `true` when the corner square was drawn.
   */
  drawFrozenBoundaryCorner(isRtl: boolean, borderWidth: number): boolean {
    const boundaryRow = (this.wot.getSetting('fixedRowsTop') as number) - 1;

    // The square sits on the boundary cell's BOTTOM edge (the top freeze line), one pixel up.
    return this.drawFreezeCorner(
      boundaryRow, this.topStyle!, isRtl, borderWidth,
      (boundaryTD, boundaryOffset, containerTop) =>
        boundaryOffset.top + this.wot.domBindings.geometryReader.outerHeight(boundaryTD) - containerTop - 1
    );
  }

  /**
   * Bottom mirror of {@link Border#drawFrozenBoundaryCorner}: draws the corner square bridging the
   * bottom and inline-start edges where a selection corner lands on both the `fixedRowsBottom` and
   * `fixedColumnsStart` freeze lines. The boundary cell is the FIRST bottom-frozen row and the bottom
   * freeze line is its TOP edge. Reuses the `bottom` border element.
   *
   * @private
   * @param {boolean} isRtl Whether the grid is rendered right-to-left.
   * @param {number} borderWidth The configured border width in pixels.
   * @returns {boolean} `true` when the corner square was drawn.
   */
  drawFrozenBottomBoundaryCorner(isRtl: boolean, borderWidth: number): boolean {
    const fixedRowsBottom = this.wot.getSetting('fixedRowsBottom') as number;
    const totalRows = this.wot.getSetting('totalRows') as number;
    const boundaryRow = totalRows - fixedRowsBottom;
    const delta = Math.ceil(borderWidth / 2);

    // Align with the bottom edge's vertical position (`cellBottom - thickness + delta`, where
    // `cellBottom` is the freeze line = the boundary cell's TOP edge) so it joins seamlessly.
    return this.drawFreezeCorner(
      boundaryRow, this.bottomStyle!, isRtl, borderWidth,
      (_boundaryTD, boundaryOffset, containerTop) =>
        boundaryOffset.top - containerTop - borderWidth + delta
    );
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

    // A selection flush against a frozen-pane boundary has its top/inline-start edge rendered by the
    // master on the freeze line, where the frozen overlay occludes it. Re-draw it inside the frozen
    // overlay so it stays visible; no-op unless `fixedRowsTop`/`fixedColumnsStart` is used.
    //
    // When it draws, we return early and intentionally skip the rest of `appear` (corner/fill handle,
    // the other edges): in these overlays the selection's cell isn't rendered here — only the seam
    // edge slice is — so there is nothing else to draw.
    if (this.drawFrozenBoundaryEdge(corners)) {
      return;
    }

    let [fromRow, fromColumn, toRow, toColumn] = corners;

    // Capture the top-start corner before the clamping below mutates it — used to suppress the
    // master's boundary edge (so it isn't doubled by the frozen overlay's edge).
    const originalFromRow = fromRow;
    const originalFromColumn = fromColumn;
    const originalToRow = toRow;
    const originalToColumn = toColumn;

    // borders can not be rendered on headers so hide them
    if (fromRow < 0 && toRow < 0 || fromColumn < 0 && toColumn < 0) {
      this.disappear();

      return;
    }

    const { wtTable, rootDocument, rootWindow } = this.wot;
    const { geometryReader } = this.wot.domBindings;
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
    const fromOffset = geometryReader.offset(fromTDEl);
    const toOffset = isMultiple ? geometryReader.offset(toTDEl) : fromOffset;
    const containerOffset = geometryReader.offset(wtTable.TABLE);
    const minTop = fromOffset.top;
    const minLeft = fromOffset.left;
    const isRtl = this.wot.wtSettings.getSetting('rtlMode');

    let inlineStartPos = 0;
    let width = 0;

    if (isRtl) {
      const containerWidth = geometryReader.outerWidth(wtTable.TABLE);
      const fromWidth = geometryReader.outerWidth(fromTDEl);
      const gridRightPos = rootWindow.innerWidth - containerOffset.left - containerWidth;

      width = minLeft + fromWidth - toOffset.left;
      inlineStartPos = rootWindow.innerWidth - minLeft - fromWidth - gridRightPos - 1;

    } else {
      width = toOffset.left + geometryReader.outerWidth(toTDEl) - minLeft;
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
    let height = toOffset.top + geometryReader.outerHeight(toTDEl) - minTop;

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

    const style = geometryReader.getComputedStyle(fromTDEl);

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

    // A boundary edge owned by the frozen overlay must be hidden on every other overlay that would
    // redraw it in its regular flow, so the lines don't stack into a doubled border. The row-freeze
    // edge is hidden on the master and `inline_start`; the column-freeze edge on the master and `top`.
    const overlayName = wtTable.name;

    // The master keeps drawing the seam top edge (its straddling lower half stays visible below the
    // frozen pane / editor); the frozen overlay adds the upper half on top of the pane. Only hide the
    // master when the whole selection is in frozen columns (then the inline-start pane occludes it and
    // the corner overlay owns the edge). `inline_start` always hides its row-edge duplicate.
    const seamAllFrozenCols =
      originalToColumn < (this.wot.getSetting('fixedColumnsStart') as number);

    if (this.isFrozenBoundaryEdge('row', originalFromRow) &&
        (overlayName === 'inline_start' || (wtTable.isMaster && seamAllFrozenCols))) {
      this.topStyle!.display = 'none';
    }
    if (this.isFrozenBoundaryEdge('column', originalFromColumn) &&
        (wtTable.isMaster || overlayName === 'top' || overlayName === 'bottom')) {
      this.startStyle!.display = 'none';
    }
    // The bottom-freeze edge straddles its seam: the master draws the half above the freeze line and
    // the `bottom` overlay the half below it (on top of the opaque bottom pane), so together they show
    // the full thickness in both selection and edit modes. Hide the master only when the whole
    // selection is in frozen columns (then the inline-start pane occludes it and the bottom corner owns
    // the edge); `inline_start` always hides its duplicate.
    if (this.isFrozenBottomBoundaryEdge(originalToRow) &&
        (overlayName === 'inline_start' || (wtTable.isMaster && seamAllFrozenCols))) {
      this.bottomStyle!.display = 'none';
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
        const toTdOffsetLeft = trimToWindow
          ? geometryReader.getBoundingClientRect(toTDEl).left
          : geometryReader.offsetLeft(toTDEl);
        let cornerOverlappingContainer = false;
        let cornerEdge = 0;

        if (isRtl) {
          cornerEdge = toTdOffsetLeft - (parseInt(String(this.cornerDefaultStyle.width), 10) / 2);
          cornerOverlappingContainer = cornerEdge < 0;

        } else {
          cornerEdge = toTdOffsetLeft + geometryReader.outerWidth(toTDEl)
            + (parseInt(String(this.cornerDefaultStyle.width), 10) / 2);
          cornerOverlappingContainer = cornerEdge >= geometryReader.innerWidth(trimmingContainer);
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
        const toTdOffsetTop = trimToWindow
          ? geometryReader.getBoundingClientRect(toTDEl).top
          : geometryReader.offsetTop(toTDEl);
        const cornerHalfHeight = parseInt(String(this.cornerDefaultStyle.height), 10) / 2;
        const cornerBottomEdge = toTdOffsetTop + geometryReader.outerHeight(toTDEl) + cornerHalfHeight;
        const cornerOverlappingContainer = cornerBottomEdge >= geometryReader.innerHeight(trimmingContainer);

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

    if (isMobileBrowser() && this.wot.getSetting('isDataViewInstance')) {
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
    const { geometryReader } = this.wot.domBindings;
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
        dimensionFn = (el: HTMLElement) => geometryReader.outerHeight(el);
        entireSelectionClassname = 'ht__selection--rows';
        dimensionProperty = 'top';

        break;

      case 'columns':
        getHeaderFn = (...args: unknown[]) => wtTable.getColumnHeader(args[0] as number, args[1] as number);
        dimensionFn = (el: HTMLElement) => geometryReader.outerWidth(el);
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

      const startHeaderOffset = geometryReader.offset(startHeader);
      const endOffset = geometryReader.offset(endHeader);
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

    if (isMobileBrowser() && this.wot.getSetting('isDataViewInstance')) {
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

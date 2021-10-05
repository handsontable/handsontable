import {
  addClass,
  hasClass,
  removeClass,
  getComputedStyle,
  getTrimmingContainer,
  innerWidth,
  innerHeight,
  offset,
  outerHeight,
  outerWidth,
} from './../../../helpers/dom/element';
import { stopImmediatePropagation } from './../../../helpers/dom/event';
import { objectEach } from './../../../helpers/object';
import { isMobileBrowser } from './../../../helpers/browser';
import EventManager from './../../../eventManager';
import CellCoords from './cell/coords';

/**
 *
 */
class Border {
  /**
   * @param {Walkontable} wotInstance The Walkontable instance.
   * @param {object} settings The border settings.
   */
  constructor(wotInstance, settings) {
    if (!settings) {
      return;
    }
    this.eventManager = new EventManager(wotInstance);
    this.instance = wotInstance;
    this.wot = wotInstance;
    this.settings = settings;
    this.mouseDown = false;
    this.main = null;

    this.top = null;
    this.left = null;
    this.bottom = null;
    this.right = null;

    this.topStyle = null;
    this.leftStyle = null;
    this.bottomStyle = null;
    this.rightStyle = null;

    this.cornerDefaultStyle = {
      width: '6px',
      height: '6px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#FFF'
    };
    // Offset to moving the corner to be centered relative to the grid.
    this.cornerCenterPointOffset = -(parseInt(this.cornerDefaultStyle.width, 10) / 2);
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

    for (let c = 0, len = this.main.childNodes.length; c < len; c++) {
      const element = this.main.childNodes[c];

      this.eventManager
        .addEventListener(element, 'mouseenter', event => this.onMouseEnter(event, this.main.childNodes[c]));
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
  onMouseEnter(event, parentElement) {
    if (!this.mouseDown || !this.wot.getSetting('hideBorderOnMouseDownOver')) {
      return;
    }
    event.preventDefault();
    stopImmediatePropagation(event);

    const _this = this;
    const documentBody = this.wot.rootDocument.body;
    const bounds = parentElement.getBoundingClientRect();

    // Hide border to prevents selection jumping when fragmentSelection is enabled.
    parentElement.style.display = 'none';

    /**
     * @param {Event} mouseEvent The mouse event object.
     * @returns {boolean}
     */
    function isOutside(mouseEvent) {
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
    function handler(handlerEvent) {
      if (isOutside(handlerEvent)) {
        _this.eventManager.removeEventListener(documentBody, 'mousemove', handler);
        parentElement.style.display = 'block';
      }
    }

    this.eventManager.addEventListener(documentBody, 'mousemove', handler);
  }

  /**
   * Create border elements.
   *
   * @param {object} settings The border settings.
   */
  createBorders(settings) {
    const { rootDocument } = this.wot;

    this.main = rootDocument.createElement('div');

    const borderDivs = ['top', 'left', 'bottom', 'right', 'corner'];
    let style = this.main.style;

    style.position = 'absolute';
    style.top = 0;
    style.left = 0;

    for (let i = 0; i < 5; i++) {
      const position = borderDivs[i];
      const div = rootDocument.createElement('div');

      div.className = `wtBorder ${this.settings.className || ''}`; // + borderDivs[i];

      if (this.settings[position] && this.settings[position].hide) {
        div.className += ' hidden';
      }
      style = div.style;
      style.backgroundColor = (this.settings[position] && this.settings[position].color) ?
        this.settings[position].color : settings.border.color;
      style.height = (this.settings[position] && this.settings[position].width) ?
        `${this.settings[position].width}px` : `${settings.border.width}px`;
      style.width = (this.settings[position] && this.settings[position].width) ?
        `${this.settings[position].width}px` : `${settings.border.width}px`;

      this.main.appendChild(div);
    }
    this.top = this.main.childNodes[0];
    this.left = this.main.childNodes[1];
    this.bottom = this.main.childNodes[2];
    this.right = this.main.childNodes[3];

    this.topStyle = this.top.style;
    this.leftStyle = this.left.style;
    this.bottomStyle = this.bottom.style;
    this.rightStyle = this.right.style;

    this.corner = this.main.childNodes[4];
    this.corner.className += ' corner';
    this.cornerStyle = this.corner.style;
    this.cornerStyle.width = this.cornerDefaultStyle.width;
    this.cornerStyle.height = this.cornerDefaultStyle.height;
    this.cornerStyle.border = [
      this.cornerDefaultStyle.borderWidth,
      this.cornerDefaultStyle.borderStyle,
      this.cornerDefaultStyle.borderColor
    ].join(' ');

    if (isMobileBrowser()) {
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
    const { rootDocument } = this.wot;

    this.selectionHandles = {
      topLeft: rootDocument.createElement('DIV'),
      topLeftHitArea: rootDocument.createElement('DIV'),
      bottomRight: rootDocument.createElement('DIV'),
      bottomRightHitArea: rootDocument.createElement('DIV')
    };
    const width = 10;
    const hitAreaWidth = 40;

    this.selectionHandles.topLeft.className = 'topLeftSelectionHandle';
    this.selectionHandles.topLeftHitArea.className = 'topLeftSelectionHandle-HitArea';
    this.selectionHandles.bottomRight.className = 'bottomRightSelectionHandle';
    this.selectionHandles.bottomRightHitArea.className = 'bottomRightSelectionHandle-HitArea';

    this.selectionHandles.styles = {
      topLeft: this.selectionHandles.topLeft.style,
      topLeftHitArea: this.selectionHandles.topLeftHitArea.style,
      bottomRight: this.selectionHandles.bottomRight.style,
      bottomRightHitArea: this.selectionHandles.bottomRightHitArea.style
    };

    const hitAreaStyle = {
      position: 'absolute',
      height: `${hitAreaWidth}px`,
      width: `${hitAreaWidth}px`,
      'border-radius': `${parseInt(hitAreaWidth / 1.5, 10)}px`,
    };

    objectEach(hitAreaStyle, (value, key) => {
      this.selectionHandles.styles.bottomRightHitArea[key] = value;
      this.selectionHandles.styles.topLeftHitArea[key] = value;
    });

    const handleStyle = {
      position: 'absolute',
      height: `${width}px`,
      width: `${width}px`,
      'border-radius': `${parseInt(width / 1.5, 10)}px`,
      background: '#F5F5FF',
      border: '1px solid #4285c8'
    };

    objectEach(handleStyle, (value, key) => {
      this.selectionHandles.styles.bottomRight[key] = value;
      this.selectionHandles.styles.topLeft[key] = value;
    });

    this.main.appendChild(this.selectionHandles.topLeft);
    this.main.appendChild(this.selectionHandles.bottomRight);
    this.main.appendChild(this.selectionHandles.topLeftHitArea);
    this.main.appendChild(this.selectionHandles.bottomRightHitArea);
  }

  /**
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {boolean}
   */
  isPartRange(row, col) {
    const areaSelection = this.wot.selections.createOrGetArea();

    if (areaSelection.cellRange) {
      if (row !== areaSelection.cellRange.to.row || col !== areaSelection.cellRange.to.col) {
        return true;
      }
    }

    return false;
  }

  /**
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {number} top The top position of the handler.
   * @param {number} left The left position of the handler.
   * @param {number} width The width of the handler.
   * @param {number} height The height of the handler.
   */
  updateMultipleSelectionHandlesPosition(row, col, top, left, width, height) {
    const handleWidth = parseInt(this.selectionHandles.styles.topLeft.width, 10);
    const hitAreaWidth = parseInt(this.selectionHandles.styles.topLeftHitArea.width, 10);

    this.selectionHandles.styles.topLeft.top = `${parseInt(top - handleWidth, 10)}px`;
    this.selectionHandles.styles.topLeft.left = `${parseInt(left - handleWidth, 10)}px`;

    this.selectionHandles.styles.topLeftHitArea.top = `${parseInt(top - ((hitAreaWidth / 4) * 3), 10)}px`;
    this.selectionHandles.styles.topLeftHitArea.left = `${parseInt(left - ((hitAreaWidth / 4) * 3), 10)}px`;

    this.selectionHandles.styles.bottomRight.top = `${parseInt(top + height, 10)}px`;
    this.selectionHandles.styles.bottomRight.left = `${parseInt(left + width, 10)}px`;

    this.selectionHandles.styles.bottomRightHitArea.top = `${parseInt(top + height - (hitAreaWidth / 4), 10)}px`;
    this.selectionHandles.styles.bottomRightHitArea.left = `${parseInt(left + width - (hitAreaWidth / 4), 10)}px`;

    if (this.settings.border.cornerVisible && this.settings.border.cornerVisible()) {
      this.selectionHandles.styles.topLeft.display = 'block';
      this.selectionHandles.styles.topLeftHitArea.display = 'block';

      if (this.isPartRange(row, col)) {
        this.selectionHandles.styles.bottomRight.display = 'none';
        this.selectionHandles.styles.bottomRightHitArea.display = 'none';
      } else {
        this.selectionHandles.styles.bottomRight.display = 'block';
        this.selectionHandles.styles.bottomRightHitArea.display = 'block';
      }
    } else {
      this.selectionHandles.styles.topLeft.display = 'none';
      this.selectionHandles.styles.bottomRight.display = 'none';
      this.selectionHandles.styles.topLeftHitArea.display = 'none';
      this.selectionHandles.styles.bottomRightHitArea.display = 'none';
    }

    if (row === this.wot.wtSettings.getSetting('fixedRowsTop') ||
        col === this.wot.wtSettings.getSetting('fixedColumnsLeft')) {
      this.selectionHandles.styles.topLeft.zIndex = '9999';
      this.selectionHandles.styles.topLeftHitArea.zIndex = '9999';
    } else {
      this.selectionHandles.styles.topLeft.zIndex = '';
      this.selectionHandles.styles.topLeftHitArea.zIndex = '';
    }
  }

  /**
   * Show border around one or many cells.
   *
   * @param {Array} corners The corner coordinates.
   */
  appear(corners) {
    if (this.disabled) {
      return;
    }

    const { wtTable, rootDocument, rootWindow } = this.wot;
    let fromRow;
    let toRow;
    let fromColumn;
    let toColumn;
    let rowHeader;
    let columnHeader;

    const rowsCount = wtTable.getRenderedRowsCount();

    for (let i = 0; i < rowsCount; i += 1) {
      const s = wtTable.rowFilter.renderedToSource(i);

      if (s >= corners[0] && s <= corners[2]) {
        fromRow = s;
        rowHeader = corners[0];
        break;
      }
    }

    for (let i = rowsCount - 1; i >= 0; i -= 1) {
      const s = wtTable.rowFilter.renderedToSource(i);

      if (s >= corners[0] && s <= corners[2]) {
        toRow = s;
        break;
      }
    }

    const columnsCount = wtTable.getRenderedColumnsCount();

    for (let i = 0; i < columnsCount; i += 1) {
      const s = wtTable.columnFilter.renderedToSource(i);

      if (s >= corners[1] && s <= corners[3]) {
        fromColumn = s;
        columnHeader = corners[1];
        break;
      }
    }

    for (let i = columnsCount - 1; i >= 0; i -= 1) {
      const s = wtTable.columnFilter.renderedToSource(i);

      if (s >= corners[1] && s <= corners[3]) {
        toColumn = s;
        break;
      }
    }
    if (fromRow === void 0 || fromColumn === void 0) {
      this.disappear();

      return;
    }

    let fromTD = wtTable.getCell(new CellCoords(fromRow, fromColumn));
    const isMultiple = (fromRow !== toRow || fromColumn !== toColumn);
    const toTD = isMultiple ? wtTable.getCell(new CellCoords(toRow, toColumn)) : fromTD;
    const fromOffset = offset(fromTD);
    const toOffset = isMultiple ? offset(toTD) : fromOffset;
    const containerOffset = offset(wtTable.TABLE);
    const minTop = fromOffset.top;
    const minLeft = fromOffset.left;

    let left = minLeft - containerOffset.left - 1;
    let width = toOffset.left + outerWidth(toTD) - minLeft;

    if (this.isEntireColumnSelected(fromRow, toRow)) {
      const modifiedValues = this.getDimensionsFromHeader('columns', fromColumn, toColumn, rowHeader, containerOffset);
      let fromTH = null;

      if (modifiedValues) {
        [fromTH, left, width] = modifiedValues;
      }

      if (fromTH) {
        fromTD = fromTH;
      }
    }

    let top = minTop - containerOffset.top - 1;
    let height = toOffset.top + outerHeight(toTD) - minTop;

    if (this.isEntireRowSelected(fromColumn, toColumn)) {
      const modifiedValues = this.getDimensionsFromHeader('rows', fromRow, toRow, columnHeader, containerOffset);
      let fromTH = null;

      if (modifiedValues) {
        [fromTH, top, height] = modifiedValues;
      }

      if (fromTH) {
        fromTD = fromTH;
      }
    }

    const style = getComputedStyle(fromTD, rootWindow);

    if (parseInt(style.borderTopWidth, 10) > 0) {
      top += 1;
      height = height > 0 ? height - 1 : 0;
    }
    if (parseInt(style.borderLeftWidth, 10) > 0) {
      left += 1;
      width = width > 0 ? width - 1 : 0;
    }

    this.topStyle.top = `${top}px`;
    this.topStyle.left = `${left}px`;
    this.topStyle.width = `${width}px`;
    this.topStyle.display = 'block';

    this.leftStyle.top = `${top}px`;
    this.leftStyle.left = `${left}px`;
    this.leftStyle.height = `${height}px`;
    this.leftStyle.display = 'block';

    const delta = Math.floor(this.settings.border.width / 2);

    this.bottomStyle.top = `${top + height - delta}px`;
    this.bottomStyle.left = `${left}px`;
    this.bottomStyle.width = `${width}px`;
    this.bottomStyle.display = 'block';

    this.rightStyle.top = `${top}px`;
    this.rightStyle.left = `${left + width - delta}px`;
    this.rightStyle.height = `${height + 1}px`;
    this.rightStyle.display = 'block';

    let cornerVisibleSetting = this.settings.border.cornerVisible;

    cornerVisibleSetting = typeof cornerVisibleSetting === 'function' ?
      cornerVisibleSetting(this.settings.layerLevel) : cornerVisibleSetting;

    const hookResult = this.wot.getSetting('onModifyGetCellCoords', toRow, toColumn);
    let [checkRow, checkCol] = [toRow, toColumn];

    if (hookResult && Array.isArray(hookResult)) {
      [,, checkRow, checkCol] = hookResult;
    }

    if (isMobileBrowser() || !cornerVisibleSetting || this.isPartRange(checkRow, checkCol)) {
      this.cornerStyle.display = 'none';

    } else {
      this.cornerStyle.top = `${top + height + this.cornerCenterPointOffset - 1}px`;
      this.cornerStyle.left = `${left + width + this.cornerCenterPointOffset - 1}px`;
      this.cornerStyle.borderRightWidth = this.cornerDefaultStyle.borderWidth;
      this.cornerStyle.width = this.cornerDefaultStyle.width;

      // Hide the fill handle, so the possible further adjustments won't force unneeded scrollbars.
      this.cornerStyle.display = 'none';

      let trimmingContainer = getTrimmingContainer(wtTable.TABLE);
      const trimToWindow = trimmingContainer === rootWindow;

      if (trimToWindow) {
        trimmingContainer = rootDocument.documentElement;
      }

      if (toColumn === this.wot.getSetting('totalColumns') - 1) {
        const toTdOffsetLeft = trimToWindow ? toTD.getBoundingClientRect().left : toTD.offsetLeft;
        const cornerRightEdge = toTdOffsetLeft + outerWidth(toTD) + (parseInt(this.cornerDefaultStyle.width, 10) / 2);
        const cornerOverlappingContainer = cornerRightEdge >= innerWidth(trimmingContainer);

        if (cornerOverlappingContainer) {
          this.cornerStyle.left = `${Math.floor(left + width + this.cornerCenterPointOffset - (parseInt(this.cornerDefaultStyle.width, 10) / 2))}px`; // eslint-disable-line max-len
          this.cornerStyle.borderRightWidth = 0;
        }
      }

      if (toRow === this.wot.getSetting('totalRows') - 1) {
        const toTdOffsetTop = trimToWindow ? toTD.getBoundingClientRect().top : toTD.offsetTop;
        const cornerBottomEdge = toTdOffsetTop + outerHeight(toTD) + (parseInt(this.cornerDefaultStyle.height, 10) / 2);
        const cornerOverlappingContainer = cornerBottomEdge >= innerHeight(trimmingContainer);

        if (cornerOverlappingContainer) {
          this.cornerStyle.top = `${Math.floor(top + height + this.cornerCenterPointOffset - (parseInt(this.cornerDefaultStyle.height, 10) / 2))}px`; // eslint-disable-line max-len
          this.cornerStyle.borderBottomWidth = 0;
        }
      }

      this.cornerStyle.display = 'block';
    }

    if (isMobileBrowser()) {
      this.updateMultipleSelectionHandlesPosition(toRow, toColumn, top, left, width, height);
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
  isEntireColumnSelected(startRowIndex, endRowIndex) {
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
  isEntireRowSelected(startColumnIndex, endColumnIndex) {
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
  getDimensionsFromHeader(direction, fromIndex, toIndex, headerIndex, containerOffset) {
    const { wtTable } = this.wot;
    const rootHotElement = wtTable.wtRootElement.parentNode;
    let getHeaderFn = null;
    let dimensionFn = null;
    let entireSelectionClassname = null;
    let index = null;
    let dimension = null;
    let dimensionProperty = null;
    let startHeader = null;
    let endHeader = null;

    switch (direction) {
      case 'rows':
        getHeaderFn = (...args) => wtTable.getRowHeader(...args);
        dimensionFn = (...args) => outerHeight(...args);
        entireSelectionClassname = 'ht__selection--rows';
        dimensionProperty = 'top';

        break;

      case 'columns':
        getHeaderFn = (...args) => wtTable.getColumnHeader(...args);
        dimensionFn = (...args) => outerWidth(...args);
        entireSelectionClassname = 'ht__selection--columns';
        dimensionProperty = 'left';
        break;
      default:
    }

    if (rootHotElement.classList.contains(entireSelectionClassname)) {
      const columnHeaderLevelCount = this.wot.getSetting('columnHeaders').length;

      startHeader = getHeaderFn(fromIndex, columnHeaderLevelCount - headerIndex);
      endHeader = getHeaderFn(toIndex, columnHeaderLevelCount - headerIndex);

      if (!startHeader || !endHeader) {
        return false;
      }

      const startHeaderOffset = offset(startHeader);
      const endOffset = offset(endHeader);

      if (startHeader && endHeader) {
        index = startHeaderOffset[dimensionProperty] - containerOffset[dimensionProperty] - 1;
        dimension = endOffset[dimensionProperty] + dimensionFn(endHeader) - startHeaderOffset[dimensionProperty];
      }

      return [startHeader, index, dimension];
    }

    return false;
  }

  /**
   * Change border style.
   *
   * @private
   * @param {string} borderElement Coordinate where add/remove border: top, right, bottom, left.
   * @param {object} border The border object descriptor.
   */
  changeBorderStyle(borderElement, border) {
    const style = this[borderElement].style;
    const borderStyle = border[borderElement];

    if (!borderStyle || borderStyle.hide) {
      addClass(this[borderElement], 'hidden');

    } else {
      if (hasClass(this[borderElement], 'hidden')) {
        removeClass(this[borderElement], 'hidden');
      }

      style.backgroundColor = borderStyle.color;

      if (borderElement === 'top' || borderElement === 'bottom') {
        style.height = `${borderStyle.width}px`;
      }

      if (borderElement === 'right' || borderElement === 'left') {
        style.width = `${borderStyle.width}px`;
      }
    }
  }

  /**
   * Change border style to default.
   *
   * @private
   * @param {string} position The position type ("top", "bottom", "left", "right") to change.
   */
  changeBorderToDefaultStyle(position) {
    const defaultBorder = {
      width: 1,
      color: '#000',
    };
    const style = this[position].style;

    style.backgroundColor = defaultBorder.color;
    style.width = `${defaultBorder.width}px`;
    style.height = `${defaultBorder.width}px`;
  }

  /**
   * Toggle class 'hidden' to element.
   *
   * @private
   * @param {string} borderElement Coordinate where add/remove border: top, right, bottom, left.
   * @param {boolean} [remove] Defines type of the action to perform.
   */
  toggleHiddenClass(borderElement, remove) {
    this.changeBorderToDefaultStyle(borderElement);

    if (remove) {
      addClass(this[borderElement], 'hidden');
    } else {
      removeClass(this[borderElement], 'hidden');
    }
  }

  /**
   * Hide border.
   */
  disappear() {
    this.topStyle.display = 'none';
    this.leftStyle.display = 'none';
    this.bottomStyle.display = 'none';
    this.rightStyle.display = 'none';
    this.cornerStyle.display = 'none';

    if (isMobileBrowser()) {
      this.selectionHandles.styles.topLeft.display = 'none';
      this.selectionHandles.styles.bottomRight.display = 'none';
    }
  }

  /**
   * Cleans up all the DOM state related to a Border instance. Call this prior to deleting a Border instance.
   */
  destroy() {
    this.eventManager.destroyWithOwnEventsOnly();
    this.main.parentNode.removeChild(this.main);
  }
}

export default Border;

import getSvgPathsRenderer, { adjustLinesToViewBox, convertLinesToCommand, compareStrokePriority } from './svg/pathsRenderer';
import getSvgResizer from './svg/resizer';
import svgOptimizePath from './svg/optimizePath';
import { GRIDLINE_WIDTH } from '../utils/gridline';

const offsetToOverLapPrecedingGridline = -GRIDLINE_WIDTH;

/**
 * Manages rendering of cell borders using SVG. Creates a single instance of SVG for each `Table`.
 */
export default class BorderRenderer {
  constructor(parentElement, padding, uniqueDomId, overlayName, getCellFn) {
    /**
     * SVG graphic will cover the area of the table element (element passed to the render function), minus the specified paddings.
     *
     * @type {object} Object with properties top, left, bottom, right
     */
    this.padding = padding;
    /**
     * String that can be used to uniquely identify the SVG border element in the window DOM.
     *
     * @type {string}
     */
    this.uniqueDomId = uniqueDomId;
    /**
     * Overlay name.
     *
     * @type {string}
     */
    this.overlayName = overlayName;
    /**
     * Function that returns a cell from the current overlay.
     *
     * @type {Function}
     */
    this.getCellFn = getCellFn;
    /**
     * The SVG container element, where all SVG groups are rendered.
     *
     * @type {HTMLElement}
     */
    this.svg = this.createSvgContainer(parentElement);
    /**
     * The function used to resize the SVG container when needed.
     *
     * @type {Function}
     */
    this.svgResizer = getSvgResizer(this.svg);
    /**
     * Array that holds pathGroup metadata objects keyed by the layer number.
     *
     * @type {Array.<object>}
     */
    this.pathGroups = [];
    /**
     * Desired width for the SVG container.
     *
     * @type {number}
     */
    this.maxWidth = 0;
    /**
     * Desired height for the SVG container.
     *
     * @type {number}
     */
    this.maxHeight = 0;
    /**
     * Context for getComputedStyle.
     *
     * @type {object}
     */
    this.rootWindow = parentElement.ownerDocument.defaultView;
  }

  /**
   * Creates and configures the SVG container element, where all SVG paths are rendered.
   *
   * @param {HTMLElement} parentElement Parent element where the SVG element will be inserted.
   * @returns {HTMLElement}
   */
  createSvgContainer(parentElement) {
    const svg = parentElement.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'svg');

    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '0';
    svg.style.height = '0';
    svg.style.position = 'absolute';
    svg.style.zIndex = '5';
    svg.setAttribute('pointer-events', 'none');
    svg.setAttribute('class', 'wtBorders'); // in IE, classList is not defined on SVG elements and className is read-only
    parentElement.appendChild(svg);

    const defs = parentElement.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'defs');

    const clipPath = parentElement.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.setAttribute('id', `${this.uniqueDomId}-inner-clip`);

    const rect = parentElement.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'rect');
    this.clipPathShape = rect;

    clipPath.appendChild(rect);
    defs.appendChild(clipPath);
    svg.appendChild(defs);

    return svg;
  }

  /**
   * Returns pathGroup metadata object for a given index.
   * Works recursively to fill gaps in indices starting from 0, e.g.
   * You request index 1 while 0 does not exist, it will create 0 and 1.
   *
   * @param {number} index Number that corresonds to a visual layer (0 is the bottom layer).
   * @returns {object} PathGroup metadata object.
   */
  ensurePathGroup(index) {
    const found = this.pathGroups[index];

    if (!found) {
      if (this.pathGroups.length < index) {
        this.ensurePathGroup(index - 1); // ensure there are no gaps
      }

      const isCustomBorder = index === 0;
      const pathGroup = {
        svgPathsRenderer: this.getSvgPathsRendererForGroup(this.svg, isCustomBorder),
        stylesAndLines: new Map(),
        styles: [],
        commands: []
      };

      this.pathGroups[index] = pathGroup;

      return pathGroup;
    }

    return found;
  }

  /**
   * Draws the paths according to configuration passed in `argArrays`.
   *
   * @param {HTMLTableElement} table HTML table element used for position measurements.
   * @param {object[]} borderEdgesDescriptors Array of border edge descriptors.
   */
  render(table, borderEdgesDescriptors) {
    this.clipLeft = Infinity;
    this.clipTop = Infinity;
    this.clipRight = 0;
    this.clipBottom = 0;
    this.containerBoundingRect = table.getBoundingClientRect();

    this.maxWidth = 0;
    this.maxHeight = 0;

    // batch all calculations
    this.pathGroups.forEach(pathGroup => pathGroup.stylesAndLines.clear());
    for (let i = 0; i < borderEdgesDescriptors.length; i++) {
      this.convertBorderEdgesDescriptorToLines(borderEdgesDescriptors[i]);
    }
    this.pathGroups.forEach(pathGroup => this.convertLinesToCommands(pathGroup));
    if (this.clipLeft === Infinity) {
      this.clipLeft = 0;
      this.clipTop = 0;
    }

    // batch all DOM writes
    let width = Math.min(this.maxWidth, this.containerBoundingRect.width);
    let height = Math.min(this.maxHeight, this.containerBoundingRect.height);

    if (width < 0) {
      width = 0;
    }
    if (height < 0) {
      height = 0;
    }
    this.svgResizer(width, height);

    this.clipLeft += this.padding.left;
    this.clipTop += this.padding.top;
    this.clipRight += this.padding.right;
    this.clipBottom += this.padding.bottom;

    const clipWidth = width - this.clipLeft - this.clipRight;
    const clipHeight = height - this.clipTop - this.clipBottom;

    this.clipPathShape.setAttribute('width', Math.max(clipWidth, 0));
    this.clipPathShape.setAttribute('height', Math.max(clipHeight, 0));
    this.clipPathShape.setAttribute('x', this.clipLeft);
    this.clipPathShape.setAttribute('y', this.clipTop);

    this.pathGroups.forEach(pathGroup => pathGroup.svgPathsRenderer(pathGroup.styles, pathGroup.commands));
  }

  /**
   * Returns the sum of values at a specified inner index in a 2D array.
   *
   * @param {Array.<Array.<number>>} arr Array of subarrays.
   * @param {number} index Index in subarray.
   * @returns {number} Sum.
   */
  sumArrayElementAtIndex(arr, index) {
    return arr.reduce((accumulator, subarr) => Math.max(accumulator, subarr[index]), 0);
  }

  /**
   * Get a value stored in a 2D map (key1->key2->value).
   *
   * @param {Map.<number, Map.<number, number>>} map Map.
   * @param {number} key1 Key 1.
   * @param {number} key2 Key 2.
   * @returns {number} Value.
   */
  getFrom2dMap(map, key1, key2) {
    const subMap = map.get(key1);

    return subMap ? subMap.get(key2) : undefined;
  }

  /**
   * Store a value in a 2D map key1->key2->value).
   *
   * @param {Map.<number, Map.<number, number>>} map Map.
   * @param {number} key1 Key 1.
   * @param {number} key2 Key 2.
   * @param {number} value Value.
   */
  setIn2dMap(map, key1, key2, value) {
    const subMap = map.get(key1);

    if (subMap) {
      subMap.set(key2, value);
    } else {
      map.set(key1, new Map([[key2, value]]));
    }
  }

  /**
   * Adjusts the beginning and end tips of the lines to overlap each other according to the specification.
   * The specification is covered in TDD file border.spec.js.
   *
   * @param {Array.<Array.<number>>} lines Lines in format `[[x1, y1, x2, y2, ...], ...]`.
   * @param {number} width Line width.
   * @param {Map} horizontalPointSizeMap Horizontal point size map.
   * @param {Map} verticalPointSizeMap Vertical point size map.
   */
  adjustTipsOfLines(lines, width, horizontalPointSizeMap, verticalPointSizeMap) {
    if (lines.length === 0) {
      return;
    }

    const beginX = 0;
    const beginY = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isVertical = line[0] === line[2];
      const lookupPointSizeMap = isVertical ? horizontalPointSizeMap : verticalPointSizeMap;
      const savedPointSizeMap = isVertical ? verticalPointSizeMap : horizontalPointSizeMap;
      const beginIndex = isVertical ? beginY : beginX;
      const lineLength = line.length;
      const endX = lineLength - 2;
      const endY = lineLength - 1;
      const endIndex = isVertical ? endY : endX;
      const cachedStartPointSize = this.getFrom2dMap(lookupPointSizeMap, line[beginX], line[beginY]);
      const cachedEndPointSize = this.getFrom2dMap(lookupPointSizeMap, line[endX], line[endY]);

      if (width > 1) {
        for (let p = 0; p < lineLength; p += 2) {
          this.setIn2dMap(savedPointSizeMap, line[p], line[p + 1], width);
        }
      }
      if (cachedStartPointSize) {
        line[beginIndex] -= Math.floor(cachedStartPointSize / 2);
      }

      line[endIndex] += GRIDLINE_WIDTH;

      if (cachedEndPointSize) {
        const compensateForEvenWidthsInset = (cachedEndPointSize % 2 === 0) ? -1 : 0;

        line[endIndex] += Math.floor(cachedEndPointSize / 2) + compensateForEvenWidthsInset;
      }
    }
  }

  /**
   * Serializes `stylesAndLines` map into into a 1D array of SVG path commands (`commands`) within a pathGroup.
   * Sets `this.maxWidth` and `this.maxHeight` to the highest observed value.
   *
   * @param {object} pathGroup PathGroup metadata object.
   */
  convertLinesToCommands(pathGroup) {
    const { stylesAndLines, commands } = pathGroup;
    const keys = [...stylesAndLines.keys()];
    const horizontalPointSizeMap = new Map();
    const verticalPointSizeMap = new Map();

    commands.length = 0;
    pathGroup.styles = keys.sort(compareStrokePriority);
    pathGroup.styles.forEach((style) => {
      const lines = stylesAndLines.get(style);
      const width = parseInt(style, 10);

      this.adjustTipsOfLines(lines, width, horizontalPointSizeMap, verticalPointSizeMap);

      const adjustedLines = adjustLinesToViewBox(width, lines);
      const optimizedLines = svgOptimizePath(adjustedLines);
      const optimizedCommand = convertLinesToCommand(optimizedLines);
      const marginForBoldStroke = Math.ceil(width / 2); // needed to make sure that the SVG width is enough to render bold strokes
      const currentMaxWidth = this.sumArrayElementAtIndex(lines, 2) + marginForBoldStroke;
      const currentMaxHeight = this.sumArrayElementAtIndex(lines, 3) + marginForBoldStroke;

      if (currentMaxWidth > this.maxWidth) {
        this.maxWidth = currentMaxWidth;
      }
      if (currentMaxHeight > this.maxHeight) {
        this.maxHeight = currentMaxHeight;
      }

      commands.push(optimizedCommand);
    });
  }

  /**
   * Creates and configures the SVG group element, where all SVG paths are rendered.
   *
   * @param {HTMLElement} svg SVG container element.
   * @param {boolean} useInnerClipping Whether to use inner clipping.
   * @returns {HTMLElement}
   */
  getSvgPathsRendererForGroup(svg, useInnerClipping) {
    const group = svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'g');

    if (useInnerClipping) {
      group.setAttribute('clip-path', `url(#${this.uniqueDomId}-inner-clip)`);
    }

    svg.appendChild(group);

    return getSvgPathsRenderer(group);
  }

  /**
   * Returns a number that represents the visual layer on which a border should be rendered.
   * Used to render custom borders on a lower layer than built-in borders (fill, area, current).
   * Higher numbers render above lower numbers.
   *
   * @param {object} selectionSetting Settings provided in the same format as used by `Selection.setting`.
   * @returns {number}
   */
  getLayerNumber(selectionSetting) {
    switch (selectionSetting.className) {
      case 'current':
        return 3;

      case 'area':
        return 2;

      case 'fill':
        return 1;

      default:
        return 0;
    }
  }

  /**
   * Generates lines in format `[[x1, y1, x2, y2], ...]` based on input given as arguments, and stores them in `pathGroup.stylesAndLines`.
   *
   * @param {object} borderEdgesDescriptor Border descriptor object.
   * @param {object} borderEdgesDescriptor.settings Settings provided in the same format as used by `Selection.setting`.
   * @param {object} borderEdgesDescriptor.selectionStart Object with properties row, col that represents the top left corner of the selection.
   * @param {object} borderEdgesDescriptor.selectionEnd Object with properties row, col that represents the bottom right corner of the selection.
   * @param {boolean} borderEdgesDescriptor.hasTopEdge TRUE if the range between `firstTd` and `lastTd` contains the top line, FALSE otherwise.
   * @param {boolean} borderEdgesDescriptor.hasRightEdge TRUE if the range between `firstTd` and `lastTd` contains the right line, FALSE otherwise.
   * @param {boolean} borderEdgesDescriptor.hasBottomEdge TRUE if the range between `firstTd` and `lastTd` contains bottom top line, FALSE otherwise.
   * @param {boolean} borderEdgesDescriptor.hasLeftEdge TRUE if the range between `firstTd` and `lastTd` contains left top line, FALSE otherwise.
   */
  convertBorderEdgesDescriptorToLines(borderEdgesDescriptor) {
    const {
      settings,
      selectionStart,
      selectionEnd,
      hasTopEdge,
      hasRightEdge,
      hasBottomEdge,
      hasLeftEdge
    } = borderEdgesDescriptor;
    const layerNumber = this.getLayerNumber(settings);
    const stylesAndLines = this.ensurePathGroup(layerNumber).stylesAndLines;
    const isItASelectionBorder = !!settings.className;

    const isSingle = selectionStart.row === selectionEnd.row && selectionStart.col === selectionEnd.col;
    let addFirstTdWidth = 0;
    let addFirstTdHeight = 0;
    let firstTd = this.getCellFn(selectionStart);

    if (firstTd === -1) {
      selectionStart.row += 1;
      firstTd = this.getCellFn(selectionStart);
      addFirstTdHeight = -1;
    }
    if (firstTd === -2) {
      selectionStart.row -= 1;
      firstTd = this.getCellFn(selectionStart);
      addFirstTdHeight = 1;
    }
    if (firstTd === -4) {
      selectionStart.col -= 1;
      firstTd = this.getCellFn(selectionStart);
      addFirstTdWidth = 1;
    }

    if (typeof firstTd !== 'object') {
      return;
    }

    let lastTd;
    let addLastTdWidth = 0;
    let addLastTdHeight = 0;

    if (isSingle) {
      lastTd = firstTd;
      addLastTdWidth = addFirstTdWidth;
      addLastTdHeight = addFirstTdHeight;
    } else {
      lastTd = this.getCellFn(selectionEnd);

      if (lastTd === -1) {
        selectionEnd.row += 1;
        lastTd = this.getCellFn(selectionEnd);
        addLastTdHeight = -1;
      }
      if (lastTd === -2) {
        selectionEnd.row -= 1;
        lastTd = this.getCellFn(selectionEnd);
        addLastTdHeight = 1;
      }
      if (lastTd === -4) {
        selectionEnd.col -= 1;
        lastTd = this.getCellFn(selectionEnd);
        addLastTdWidth = 1;
      }
    }

    if (typeof lastTd !== 'object') {
      return;
    }

    const selectionBeginsAndEndsOnDifferentOverlay = addFirstTdWidth !== 0 || addFirstTdHeight !== 0 || addLastTdWidth !== 0 || addLastTdHeight !== 0;

    if (isItASelectionBorder && selectionBeginsAndEndsOnDifferentOverlay) {
      if (!this.overlayName === 'bottom_left_corner') {
        return; // For selections made on a pane that is lower in the visual hierarchy, we do not render the part of a selection border that is on the freeze line.
      }
    }

    const firstTdBoundingRect = firstTd.getBoundingClientRect();
    const lastTdBoundingRect = (firstTd === lastTd) ? firstTdBoundingRect : lastTd.getBoundingClientRect();

    if (this.clipLeft === Infinity) {
      const firstTdInTbody = firstTd.parentElement.parentElement.querySelector('td');

      if (firstTdInTbody) {
        const rect = firstTdInTbody.getBoundingClientRect();

        this.clipLeft = Math.max(0, rect.left - this.containerBoundingRect.left + offsetToOverLapPrecedingGridline);
        this.clipTop = Math.max(0, rect.top - this.containerBoundingRect.top + offsetToOverLapPrecedingGridline);
      }
    }

    // initial coordinates are termined by the position of the top-left and bottom-right cell
    let x1 = firstTdBoundingRect.left;
    let y1 = firstTdBoundingRect.top;
    let x2 = lastTdBoundingRect.left + lastTdBoundingRect.width;
    let y2 = lastTdBoundingRect.top + lastTdBoundingRect.height;

    // if top-left or bottom-right cell are not rendered, we use the neighboring cell adjusted by its width or height
    x1 += addFirstTdWidth * firstTdBoundingRect.width;
    y1 += addFirstTdHeight * firstTdBoundingRect.height;
    x2 += addLastTdWidth * lastTdBoundingRect.width;
    y2 += addLastTdHeight * lastTdBoundingRect.height;

    const firstTdIncludesGridlineOnTheLeft = !(firstTd.nodeName === 'TH' || firstTd.previousElementSibling); // if there is a row header, the left gridline of column 0 comes from the row header. If firstTD is the first child, we know that there is no row header
    const firstTdIncludesGridlineOnTheTop = !firstTd.parentNode.previousElementSibling && !firstTd.parentNode.parentNode.previousElementSibling.firstElementChild; // if there is a column header, the top gridline of row 0 comes from the column header. If the table table has an empty thead, we know that there is no row header

    // adjustments needed to render the border directly on the gridline, depending on the surrounding CSS
    if (!firstTdIncludesGridlineOnTheLeft) {
      x1 += offsetToOverLapPrecedingGridline;
    }
    if (!firstTdIncludesGridlineOnTheTop) {
      y1 += offsetToOverLapPrecedingGridline;
    }
    x1 += -this.containerBoundingRect.left;
    y1 += -this.containerBoundingRect.top;
    x2 += offsetToOverLapPrecedingGridline - this.containerBoundingRect.left;
    y2 += offsetToOverLapPrecedingGridline - this.containerBoundingRect.top;

    if (settings.border && settings.border.width && settings.border.strokeAlignment === 'inside') {
      // strokeAlignment: 'inside' is used to render the border of selection "inside" a cell
      // any other strokeAlignment value means to render the border centered on the gridlines. Other alignment types might be implemented in the future
      const flooredHalfWidth = Math.floor(settings.border.width / 2);
      const ceiledHalfWidth = Math.ceil(settings.border.width / 2) - 1;

      x1 += flooredHalfWidth;
      y1 += flooredHalfWidth;
      x2 -= ceiledHalfWidth;
      y2 -= ceiledHalfWidth;
    }

    if (this.overlayName === 'bottom' || this.overlayName === 'bottom_left_corner') {
      if (y2 === -1) {
        y2 = 0; // render selection from row above at the correct posotion regarding the bottom frozen line
      }
    }

    if (hasTopEdge && this.hasLineAtEdge(settings, 'top')) {
      const lines = this.getLines(stylesAndLines, settings, 'top');

      lines.push([x1, y1, x2, y1]);
    }
    if (hasRightEdge && this.hasLineAtEdge(settings, 'right')) {
      const lines = this.getLines(stylesAndLines, settings, 'right');

      lines.push([x2, y1, x2, y2]);
    }
    if (hasBottomEdge && this.hasLineAtEdge(settings, 'bottom')) {
      const lines = this.getLines(stylesAndLines, settings, 'bottom');

      lines.push([x1, y2, x2, y2]);
    }
    if (hasLeftEdge && this.hasLineAtEdge(settings, 'left')) {
      const lines = this.getLines(stylesAndLines, settings, 'left');

      lines.push([x1, y1, x1, y2]);
    }
  }

  /**
   * Checks in the selection configuration to see if a particular edge is set to be rendered and
   * returns TRUE if yes, FALSE otherwise.
   *
   * @param {object} selectionSetting Settings provided in the same format as used by `Selection.setting`.
   * @param {string} edge Possible values: 'top', 'right', 'bottom', 'left'.
   * @returns {boolean}
   */
  hasLineAtEdge(selectionSetting, edge) {
    return !(selectionSetting[edge] && selectionSetting[edge].hide);
  }

  /**
   * For a given `selectionSetting` and `edge`, returns a relevant array from the `stylesAndLines` map.
   * Sets a new array in `stylesAndLines` if an existing one is not found.
   *
   * @param {Map.<string, Array.<Array.<number>>>} stylesAndLines Map where keys are the `style` strings and values are lines in format `[[x1, y1, x2, y2, ...], ...]`.
   * @param {object} selectionSetting Settings provided in the same format as used by `Selection.setting`.
   * @param {string} edge Possible falues: 'top', 'right', 'bottom', 'left'.
   * @returns {Array.<Array.<number>>} Lines in format `[[x1, y1, x2, y2, ...], ...]`.
   */
  getLines(stylesAndLines, selectionSetting, edge) {
    let width = 1;

    if (selectionSetting[edge] && selectionSetting[edge].width !== undefined) {
      width = selectionSetting[edge].width;
    } else if (selectionSetting.border && selectionSetting.border.width !== undefined) {
      width = selectionSetting.border.width;
    }

    const color = (selectionSetting[edge] && selectionSetting[edge].color) || (selectionSetting.border && selectionSetting.border.color) || 'black';
    const stroke = `${width}px solid ${color}`;
    const lines = stylesAndLines.get(stroke);

    if (lines) {
      return lines;
    }

    const newLines = [];

    stylesAndLines.set(stroke, newLines);

    return newLines;
  }
}

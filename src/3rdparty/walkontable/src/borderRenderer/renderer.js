import { outerWidth, outerHeight, offset, getComputedStyle } from './../../../../helpers/dom/element';
import getSvgPathsRenderer, { adjustLinesToViewBox, convertLinesToCommand } from './svg/pathsRenderer';
import getSvgResizer from './svg/resizer';
import svgOptimizePath from './svg/optimizePath';

const offsetToOverLapPrecedingBorder = -1;
const insetPositioningForCurrentCellHighlight = 1;

/**
 * Manages rendering of cell borders using SVG. Creates a single instance of SVG for each `Table`
 */
export default class BorderRenderer {
  constructor(parentElement) {
    /**
     * The SVG container element, where all SVG groups are rendered
     *
     * @type {HTMLElement}
     */
    this.svg = this.createSvgContainer(parentElement);

    /**
     * The function used to resize the SVG container when needed
     *
     * @type {Function}
     */
    this.svgResizer = getSvgResizer(this.svg);
    /**
     * Array that holds pathGroup metadata objects keyed by the layer number
     *
     * @type {Array.<Object>}
     */
    this.pathGroups = [];
    /**
     * Desired width for the SVG container
     *
     * @type {Number}
     */
    this.maxWidth = 0;
    /**
     * Desired height for the SVG container
     *
     * @type {Number}
     */
    this.maxHeight = 0;
    /**
     * Context for getComputedStyle
     *
     * @type {Object}
     */
    this.rootWindow = parentElement.ownerDocument.defaultView;
  }

  /**
   * Creates and configures the SVG container element, where all SVG paths are rendered
   *
   * @param {HTMLElement} parentElement
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
    parentElement.appendChild(svg);

    return svg;
  }

  /**
   * Returns pathGroup metadata object for a given index.
   * Works recursively to fill gaps in indices starting from 0, e.g.
   * you request index 1 while 0 does not exist, it will create 0 and 1
   *
   * @param {Number} index Number that corresonds to a visual layer (0 is the bottom layer)
   * @returns {Object} pathGroup metadata object
   */
  ensurePathGroup(index) {
    const found = this.pathGroups[index];

    if (!found) {
      if (this.pathGroups.length < index) {
        this.ensurePathGroup(index - 1); // ensure there are no gaps
      }

      const pathGroup = {
        svgPathsRenderer: this.getSvgPathsRendererForGroup(this.svg),
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
   * Draws the paths according to configuration passed in `argArrays`
   *
   * @param {HTMLElement} table
   * @param {Array.<Array.<*>>} argArrays
   */
  render(table, argArrays) {
    this.containerOffset = offset(table);

    this.maxWidth = 0;
    this.maxHeight = 0;

    // batch all calculations
    this.pathGroups.forEach(pathGroup => pathGroup.stylesAndLines.clear());
    argArrays.forEach(argArray => this.convertArgsToLines(...argArray));
    this.pathGroups.forEach(pathGroup => this.convertLinesToCommands(pathGroup));

    // batch all DOM writes
    this.svgResizer(this.maxWidth, this.maxHeight);
    this.pathGroups.forEach(pathGroup => pathGroup.svgPathsRenderer(pathGroup.styles, pathGroup.commands));
  }

  /**
   * Returns the sum of values at a specified inner index in a 2D array
   *
   * @param {Array.<Array.<number>>} arr Array of subarrays
   * @param {Number} index Index in subarray
   * @returns {Number} Sum
   */
  sumArrayElementAtIndex(arr, index) {
    return arr.reduce((accumulator, subarr) => Math.max(accumulator, subarr[index]), 0);
  }

  /**
   * Serializes `stylesAndLines` map into into a 1D array of SVG path commands (`commands`) within a pathGroup
   * Sets `this.maxWidth` and `this.maxHeight` to the highest observed value.
   *
   * @param {Object} pathGroup pathGroup metadata object
   */
  convertLinesToCommands(pathGroup) {
    const { stylesAndLines, styles, commands } = pathGroup;

    commands.length = 0;
    styles.length = 0;
    styles.push(...stylesAndLines.keys());
    styles.forEach((style) => {
      const lines = stylesAndLines.get(style);
      const width = parseInt(style, 10);
      const adjustedLines = adjustLinesToViewBox(width, lines, Infinity, Infinity);
      const optimizedLines = svgOptimizePath(adjustedLines);
      const optimizedCommand = convertLinesToCommand(optimizedLines);

      commands.push(optimizedCommand);

      const marginForBoldStroke = Math.ceil(width / 2); // needed to make sure that the SVG width is enough to render bold strokes
      const currentMaxWidth = this.sumArrayElementAtIndex(lines, 2) + marginForBoldStroke;
      const currentMaxHeight = this.sumArrayElementAtIndex(lines, 3) + marginForBoldStroke;

      if (currentMaxWidth > this.maxWidth) {
        this.maxWidth = currentMaxWidth;
      }
      if (currentMaxHeight > this.maxHeight) {
        this.maxHeight = currentMaxHeight;
      }
    });
  }

  /**
   * Creates and configures the SVG group element, where all SVG paths are rendered
   *
   * @param {HTMLElement} svg SVG container element
   * @returns {HTMLElement}
   */
  getSvgPathsRendererForGroup(svg) {
    const group = svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'g');

    svg.appendChild(group);

    return getSvgPathsRenderer(group);
  }

  /**
   * Returns a number that represents the visual layer on which a border should be rendered.
   * Used to render custom borders on a lower layer than built-in borders (fill, area, current).
   * Higher numbers render above lower numbers.
   *
   * @param {Object} selectionSetting Settings provided in the same format as used by `Selection.setting`
   * @returns {Number}
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
   * Generates lines in format `[[x1, y1, x2, y2], ...]` based on input given as arguments, and stores them in `pathGroup.stylesAndLines`
   *
   * @param {Object} selectionSetting Settings provided in the same format as used by `Selection.setting`
   * @param {HTMLElement} firstTd TD element that corresponds of the top-left corner of the line that we are drawing
   * @param {HTMLElement} lastTd TD element that corresponds of the bottom-right corner of the line that we are drawing
   * @param {Boolean} hasTopEdge TRUE if the range between `firstTd` and `lastTd` contains the top line, FALSE otherwise
   * @param {Boolean} hasRightEdge TRUE if the range between `firstTd` and `lastTd` contains the right line, FALSE otherwise
   * @param {Boolean} hasBottomEdge TRUE if the range between `firstTd` and `lastTd` contains bottom top line, FALSE otherwise
   * @param {Boolean} hasLeftEdge TRUE if the range between `firstTd` and `lastTd` contains left top line, FALSE otherwise
   */
  convertArgsToLines(selectionSetting, firstTd, lastTd, hasTopEdge, hasRightEdge, hasBottomEdge, hasLeftEdge) {
    const layerNumber = this.getLayerNumber(selectionSetting);
    const stylesAndLines = this.ensurePathGroup(layerNumber).stylesAndLines;

    const firstTdOffset = offset(firstTd);
    const lastTdOffset = (firstTd === lastTd) ? firstTdOffset : offset(lastTd);
    const lastTdWidth = outerWidth(lastTd);
    const lastTdHeight = outerHeight(lastTd);
    const style = getComputedStyle(firstTd, this.rootWindow);

    let x1 = firstTdOffset.left;
    let y1 = firstTdOffset.top;
    let x2 = lastTdOffset.left + lastTdWidth;
    let y2 = lastTdOffset.top + lastTdHeight;

    if (parseInt(style.borderLeftWidth, 10) > 0) {
      x1 += 1;
    }
    if (parseInt(style.borderTopWidth, 10) > 0) {
      y1 += 1;
    }

    x1 += (offsetToOverLapPrecedingBorder - this.containerOffset.left);
    y1 += (offsetToOverLapPrecedingBorder - this.containerOffset.top);
    x2 += (offsetToOverLapPrecedingBorder - this.containerOffset.left);
    y2 += (offsetToOverLapPrecedingBorder - this.containerOffset.top);

    if (selectionSetting.className === 'current') {
      x1 += insetPositioningForCurrentCellHighlight;
      y1 += insetPositioningForCurrentCellHighlight;
    }

    if (x1 < 0 && x2 < 0 || y1 < 0 && y2 < 0) {
      // nothing to draw, everything is at a negative index
      return;
    }

    if (hasTopEdge && this.hasLineAtEdge(selectionSetting, 'top')) {
      const lines = this.getLines(stylesAndLines, selectionSetting, 'top');

      lines.push([x1, y1, x2, y1]);
    }
    if (hasRightEdge && this.hasLineAtEdge(selectionSetting, 'right')) {
      const lines = this.getLines(stylesAndLines, selectionSetting, 'right');

      lines.push([x2, y1, x2, y2]);
    }
    if (hasBottomEdge && this.hasLineAtEdge(selectionSetting, 'bottom')) {
      const lines = this.getLines(stylesAndLines, selectionSetting, 'bottom');

      lines.push([x1, y2, x2, y2]);
    }
    if (hasLeftEdge && this.hasLineAtEdge(selectionSetting, 'left')) {
      const lines = this.getLines(stylesAndLines, selectionSetting, 'left');

      lines.push([x1, y1, x1, y2]);
    }
  }

  /**
   * Checks in the selection configuration to see if a particular edge is set to be rendered and
   * returns TRUE if yes, FALSE otherwise.
   *
   * @param {Object} selectionSetting Settings provided in the same format as used by `Selection.setting`
   * @param {String} edge Possible falues: 'top', 'right', 'bottom', 'left'
   * @returns {Boolean}
   */
  hasLineAtEdge(selectionSetting, edge) {
    return !(selectionSetting[edge] && selectionSetting[edge].hide);
  }

  /**
   * For a given `selectionSetting` and `edge`, returns a relevant array from the `stylesAndLines` map.
   * Sets a new array in `stylesAndLines` if an existing one is not found.
   *
   * @param {Map.<string, Array.<Array.<number>>>} stylesAndLines Map where keys are the `style` strings and values are lines in format `[[x1, y1, x2, y2, ...], ...]`
   * @param {Object} selectionSetting Settings provided in the same format as used by `Selection.setting`
   * @param {String} edge Possible falues: 'top', 'right', 'bottom', 'left'
   * @returns {Array.<Array.<number>>} Lines in format `[[x1, y1, x2, y2, ...], ...]`
   */
  getLines(stylesAndLines, selectionSetting, edge) {
    let width = 1;

    if (selectionSetting[edge] && selectionSetting[edge].width !== undefined) {
      width = selectionSetting[edge].width;
    } else if (selectionSetting.border && selectionSetting.border.width !== undefined) {
      width = selectionSetting.border.width;
    }

    const color = (selectionSetting[edge] && selectionSetting[edge].color) || (selectionSetting.border && selectionSetting.border.color) || 'black';
    const stroke = `${width}px ${color}`;
    const lines = stylesAndLines.get(stroke);

    if (lines) {
      return lines;
    }

    const newLines = [];

    stylesAndLines.set(stroke, newLines);

    return newLines;
  }
}

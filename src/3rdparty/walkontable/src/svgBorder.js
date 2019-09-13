import getSvgPathsRenderer, { convertLinesToCommand } from './svg/svgPathsRenderer';
import getSvgResizer from './svg/svgResizer';
import svgOptimizePath from './svg/svgOptimizePath';

const marginForSafeRenderingOfTheRightBottomEdge = 1;
const offsetToOverLapPrecedingBorder = -1;
const insetPositioningForCurrentCellHighlight = 1;

export default class SvgBorder {
  constructor(parentElement) {
    this.svg = parentElement.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.style.top = '0';
    this.svg.style.left = '0';
    this.svg.style.width = '0';
    this.svg.style.height = '0';
    this.svg.style.position = 'absolute';
    this.svg.style.zIndex = '5';
    this.svg.setAttribute('pointer-events', 'none');
    parentElement.appendChild(this.svg);
    this.svgResizer = getSvgResizer(this.svg);

    this.pathGroups = []; // paths are grouped by priority

    this.maxWidth = 0;
    this.maxHeight = 0;
  }

  ensurePathGroup(priority) {
    const found = this.pathGroups[priority];
    if (!found) {
      if (this.pathGroups.length < priority) {
        this.ensurePathGroup(priority - 1); // ensure there are no gaps
      }
      const pathGroup = {
        svgPathsRenderer: this.getSvgPathsRendererForGroup(this.svg),
        stylesAndLines: new Map(),
        styles: [],
        commands: []
      };
      this.pathGroups[priority] = pathGroup;
      return pathGroup;
    }
    return found;
  }

  render(argArrays) {
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
   *
   * @param {Array} arr Array of subarrays
   * @param {Number} index Index in subarray
   * @returns {Number} Sum
   */
  sumArrayElementAtIndex(arr, index) {
    return arr.reduce((accumulator, subarr) => Math.max(accumulator, subarr[index]), 0);
  }

  convertLinesToCommands(pathGroup) {
    const { stylesAndLines, styles, commands } = pathGroup;
    commands.length = 0;
    styles.length = 0;
    styles.push(...stylesAndLines.keys());
    styles.forEach((style) => {
      const lines = stylesAndLines.get(style);
      const width = parseInt(style, 10);
      const command = convertLinesToCommand(width, lines, Infinity, Infinity);
      const optimizedCommand = svgOptimizePath(command);
      commands.push(optimizedCommand);

      const currentMaxWidth = this.sumArrayElementAtIndex(lines, 2) + marginForSafeRenderingOfTheRightBottomEdge;
      if (currentMaxWidth > this.maxWidth) {
        this.maxWidth = currentMaxWidth;
      }
      const currentMaxHeight = this.sumArrayElementAtIndex(lines, 3) + marginForSafeRenderingOfTheRightBottomEdge;
      if (currentMaxHeight > this.maxHeight) {
        this.maxHeight = currentMaxHeight;
      }
    });
  }

  getSvgPathsRendererForGroup(svg) {
    const group = svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(group);
    return getSvgPathsRenderer(group);
  }

  convertArgsToLines(rect, borderSetting, priority, hasTopEdge, hasRightEdge, hasBottomEdge, hasLeftEdge) {
    let { x1, y1, x2, y2 } = rect;
    const stylesAndLines = this.ensurePathGroup(priority).stylesAndLines;

    x1 += offsetToOverLapPrecedingBorder;
    y1 += offsetToOverLapPrecedingBorder;
    x2 += offsetToOverLapPrecedingBorder;
    y2 += offsetToOverLapPrecedingBorder;
    if (borderSetting.className === 'current') {
      x1 += insetPositioningForCurrentCellHighlight;
      y1 += insetPositioningForCurrentCellHighlight;
    }

    if (x1 < 0 && x2 < 0 || y1 < 0 && y2 < 0) {
      // nothing to draw, everything is at a negative index
      return;
    }

    if (hasTopEdge && this.hasLineAtEdge(borderSetting, 'top')) {
      const lines = this.getLines(stylesAndLines, borderSetting, 'top');
      lines.push([x1, y1, x2, y1]);
    }
    if (hasRightEdge && this.hasLineAtEdge(borderSetting, 'right')) {
      const lines = this.getLines(stylesAndLines, borderSetting, 'right');
      lines.push([x2, y1, x2, y2]);
    }
    if (hasBottomEdge && this.hasLineAtEdge(borderSetting, 'bottom')) {
      const lines = this.getLines(stylesAndLines, borderSetting, 'bottom');
      lines.push([x1, y2, x2, y2]);
    }
    if (hasLeftEdge && this.hasLineAtEdge(borderSetting, 'left')) {
      const lines = this.getLines(stylesAndLines, borderSetting, 'left');
      lines.push([x1, y1, x1, y2]);
    }
  }

  hasLineAtEdge(borderSetting, edge) {
    return !(borderSetting[edge] && borderSetting[edge].hide);
  }

  getLines(map, borderSetting, edge) {
    let width = 1;
    if (borderSetting[edge] && borderSetting[edge].width !== undefined) {
      width = borderSetting[edge].width;
    } else if (borderSetting.border && borderSetting.border.width !== undefined) {
      width = borderSetting.border.width;
    }
    const color = (borderSetting[edge] && borderSetting[edge].color) || (borderSetting.border && borderSetting.border.color) || 'black';
    const stroke = `${width}px ${color}`;

    const lines = map.get(stroke);
    if (lines) {
      return lines;
    }
    const newLines = [];
    map.set(stroke, newLines);
    return newLines;
  }
}

import getSvgPathsRenderer, { createPathString } from './svg/svgPathsRenderer';
import getSvgResizer from './svg/svgResizer';
import svgOptimizePath from './svg/svgOptimizePath';

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

    this.priorityGroups = [];

    this.maxWidth = 0;
    this.maxHeight = 0;
  }

  ensurePriorityGroup(priority) {
    const found = this.priorityGroups[priority];
    if (!found) {
      if (this.priorityGroups.length < priority) {
        this.ensurePriorityGroup(priority - 1); // ensure there are no gaps
      }
      const group = {
        svgPathsRenderer: this.getSvgPathsRendererForGroup(this.svg),
        stylesAndStrokes: new Map(),
        strokeStyles: [],
        strokeLines: []
      };
      this.priorityGroups[priority] = group;
      return group;
    }
    return found;
  }

  render(argArrays) {
    this.maxWidth = 0;
    this.maxHeight = 0;

    // make all DOM reads
    this.priorityGroups.forEach((group) => {
      group.stylesAndStrokes.clear();
    });
    argArrays.forEach(argArray => this.addBorderLinesToStrokes(...argArray));
    this.priorityGroups.forEach((group) => {
      this.drawPaths(group);
    });

    // make all DOM writes
    this.svgResizer(this.maxWidth, this.maxHeight);
    this.priorityGroups.forEach((group) => {
      group.svgPathsRenderer(group.strokeStyles, group.strokeLines);
    });
  }

  drawPaths(group) {
    const stylesAndStrokes = group.stylesAndStrokes;
    group.strokeStyles.length = 0;
    group.strokeLines.length = 0;

    const marginForSafeRenderingOfTheRightBottomEdge = 1;
    const keys = stylesAndStrokes.keys();
    Array.from(keys).forEach((key) => {
      const value = stylesAndStrokes.get(key);
      const width = parseInt(key, 10);
      const pathString = createPathString(width, value, Infinity, Infinity);
      const optimizedPathString = svgOptimizePath(pathString);

      group.strokeStyles.push(key);
      group.strokeLines.push(optimizedPathString);

      const currentMaxWidth = value.reduce((accumulator, line) => Math.max(accumulator, line[2]), 0) + marginForSafeRenderingOfTheRightBottomEdge;
      if (currentMaxWidth > this.maxWidth) {
        this.maxWidth = currentMaxWidth;
      }
      const currentMaxHeight = value.reduce((accumulator, line) => Math.max(accumulator, line[3]), 0) + marginForSafeRenderingOfTheRightBottomEdge;
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

  /**
   * This method tries to be as easy on performance on possible. It only reads from DOM (getBoundingClientRect)
   * @param {Map} map
   * @param {Selection} selection
   * @param {Number} sourceRow
   * @param {Number} sourceColumn
   */
  addBorderLinesToStrokes(rect, borderSetting, priority, hasTopEdge, hasRightEdge, hasBottomEdge, hasLeftEdge) {
    const map = this.ensurePriorityGroup(priority).stylesAndStrokes;

    const offsetToOverLapPrecedingBorder = -1;
    rect.x1 += offsetToOverLapPrecedingBorder;
    rect.y1 += offsetToOverLapPrecedingBorder;
    rect.x2 += offsetToOverLapPrecedingBorder;
    rect.y2 += offsetToOverLapPrecedingBorder;
    if (borderSetting.className === 'current') {
      const insetPositioningForCurrentCellHighlight = 1;
      rect.x1 += insetPositioningForCurrentCellHighlight;
      rect.y1 += insetPositioningForCurrentCellHighlight;
    }

    if (rect.x1 < 0 && rect.x2 < 0 || rect.y1 < 0 && rect.y2 < 0) {
      // nothing to draw, everything is at a negative index
      return;
    }

    if (hasTopEdge && this.hasBorderLineAtEdge(borderSetting, 'top')) {
      const lines = this.getStrokeLines(map, borderSetting, 'top');
      lines.push([rect.x1, rect.y1, rect.x2, rect.y1]);
    }
    if (hasRightEdge && this.hasBorderLineAtEdge(borderSetting, 'right')) {
      const lines = this.getStrokeLines(map, borderSetting, 'right');
      lines.push([rect.x2, rect.y1, rect.x2, rect.y2]);
    }
    if (hasBottomEdge && this.hasBorderLineAtEdge(borderSetting, 'bottom')) {
      const lines = this.getStrokeLines(map, borderSetting, 'bottom');
      lines.push([rect.x1, rect.y2, rect.x2, rect.y2]);
    }
    if (hasLeftEdge && this.hasBorderLineAtEdge(borderSetting, 'left')) {
      const lines = this.getStrokeLines(map, borderSetting, 'left');
      lines.push([rect.x1, rect.y1, rect.x1, rect.y2]);
    }
  }

  hasBorderLineAtEdge(borderSetting, edge) {
    return !(borderSetting[edge] && borderSetting[edge].hide);
  }

  getStrokeLines(map, borderSetting, edge) {
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

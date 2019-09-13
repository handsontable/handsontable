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

    this.svgPathsRenderersByPriority = [];

    this.maxWidth = 0;
    this.maxHeight = 0;
  }

  ensureRendererForPriority(priority) {
    const found = this.svgPathsRenderersByPriority[priority];
    if (!found) {
      if (this.svgPathsRenderersByPriority.length < priority) {
        this.ensureRendererForPriority(priority - 1); // ensure there are no gaps
      }
      const svgPathsRenderer = this.getSvgPathsRendererForGroup(this.svg);
      svgPathsRenderer.stylesAndStrokes = new Map();
      this.svgPathsRenderersByPriority[priority] = svgPathsRenderer;
      return svgPathsRenderer;
    }
    return found;
  }

  render(argArrays) {
    this.maxWidth = 0;
    this.maxHeight = 0;

    // make all DOM reads
    this.svgPathsRenderersByPriority.forEach((svgPathsRenderer) => {
      svgPathsRenderer.stylesAndStrokes.clear();
    });
    argArrays.forEach(argArray => this.addBorderLinesToStrokes(...argArray));
    this.svgPathsRenderersByPriority.forEach((svgPathsRenderer, priority) => {
      const stylesAndPaths = this.drawPaths(priority);
      svgPathsRenderer.strokeStyles = [...stylesAndPaths.keys()];
      svgPathsRenderer.strokeLines = [...stylesAndPaths.values()];
    });

    // make all DOM writes
    this.svgResizer(this.maxWidth, this.maxHeight);
    this.svgPathsRenderersByPriority.forEach((svgPathsRenderer) => {
      svgPathsRenderer(svgPathsRenderer.strokeStyles, svgPathsRenderer.strokeLines);
    });
  }

  drawPaths(priority) {
    const stylesAndStrokes = this.ensureRendererForPriority(priority).stylesAndStrokes;
    const stylesAndPaths = new Map();

    const marginForSafeRenderingOfTheRightBottomEdge = 1;
    const keys = stylesAndStrokes.keys();
    Array.from(keys).forEach((key) => {
      const value = stylesAndStrokes.get(key);
      const width = parseInt(key, 10);
      const pathString = createPathString(width, value, Infinity, Infinity);
      const optimizedPathString = svgOptimizePath(pathString);
      stylesAndPaths.set(key, optimizedPathString);

      const currentMaxWidth = value.reduce((accumulator, line) => Math.max(accumulator, line[2]), 0) + marginForSafeRenderingOfTheRightBottomEdge;
      if (currentMaxWidth > this.maxWidth) {
        this.maxWidth = currentMaxWidth;
      }
      const currentMaxHeight = value.reduce((accumulator, line) => Math.max(accumulator, line[3]), 0) + marginForSafeRenderingOfTheRightBottomEdge;
      if (currentMaxHeight > this.maxHeight) {
        this.maxHeight = currentMaxHeight;
      }
    });

    return stylesAndPaths;
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
  addBorderLinesToStrokes(rect, selection, priority, isTopClean, isRightClean, isBottomClean, isLeftClean) {
    const map = this.ensureRendererForPriority(priority).stylesAndStrokes;

    const offsetToOverLapPrecedingBorder = -1;
    rect.x1 += offsetToOverLapPrecedingBorder;
    rect.y1 += offsetToOverLapPrecedingBorder;
    rect.x2 += offsetToOverLapPrecedingBorder;
    rect.y2 += offsetToOverLapPrecedingBorder;
    if (selection.settings.className === 'current') {
      const insetPositioningForCurrentCellHighlight = 1;
      rect.x1 += insetPositioningForCurrentCellHighlight;
      rect.y1 += insetPositioningForCurrentCellHighlight;
    }

    if (rect.x1 < 0 && rect.x2 < 0 || rect.y1 < 0 && rect.y2 < 0) {
      // nothing to draw, everything is at a negative index
      return;
    }

    if (isTopClean && !this.shouldSkipStroke(selection.settings, 'top')) {
      const lines = this.getStrokeLines(map, selection.settings, 'top');
      lines.push([rect.x1, rect.y1, rect.x2, rect.y1]);
    }
    if (isRightClean && !this.shouldSkipStroke(selection.settings, 'right')) {
      const lines = this.getStrokeLines(map, selection.settings, 'right');
      lines.push([rect.x2, rect.y1, rect.x2, rect.y2]);
    }
    if (isBottomClean && !this.shouldSkipStroke(selection.settings, 'bottom')) {
      const lines = this.getStrokeLines(map, selection.settings, 'bottom');
      lines.push([rect.x1, rect.y2, rect.x2, rect.y2]);
    }
    if (isLeftClean && !this.shouldSkipStroke(selection.settings, 'left')) {
      const lines = this.getStrokeLines(map, selection.settings, 'left');
      lines.push([rect.x1, rect.y1, rect.x1, rect.y2]);
    }
  }

  shouldSkipStroke(borderSetting, edge) {
    return borderSetting[edge] && borderSetting[edge].hide;
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

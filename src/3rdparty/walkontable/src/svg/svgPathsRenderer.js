import svgOptimizePath from './svgOptimizePath';

/**
 * getSvgPathsRenderer is a higher-order function that returns a function to render paths.
 * The returned function expects `strokeStyles`, `strokeLines` to be in a format created by `precalculateStrokes`.
 *
 * `strokeStyles` is an array of stroke style strings, e.g.:
 * [
 *   '1px black',
 *   '2px #FF0000'
 * ]
 *
 * `strokeLines` is an array of x1, y1, x2, y2 quadruplets for each strokeStyle, e.g.:
 * [
 *   [0, 0, 10, 10, 0, 0, 10, 0, 20, 20, 50, 50],
 *   [5, 5, 55, 5]
 * ]
 *
 * Assumptions:
 *  - `(x1 >= 0 || x2 >= 0) && (y1 >= 0 || y2 >= 0)`
 *  - `x1 <= x2 && y1 <= y2`
 *  - `x1 === x2 || y1 === y2`
 *  - the length of strokeLines must be 4 * the length of strokeStyles
 *
 * @param {HTMLElement} svg <svg> or <g> element
 */
export default function getSvgPathsRenderer(svg) {
  svg.setAttribute('fill', 'none');

  const brushes = new Map();

  return (strokeStyles, strokeLines) => {
    brushes.forEach(resetBrush);

    for (let ii = 0; ii < strokeStyles.length; ii++) { // http://jsbench.github.io/#fb2e17228039ba5bfdf4d1744395f352
      const brush = getBrushForStyle(brushes, strokeStyles[ii], svg);
      brush.instruction = strokeLines[ii];
    }

    brushes.forEach((brush) => {
      if (brush.renderedInstruction !== brush.instruction) {
        brush.elem.setAttribute('d', brush.instruction);
        brush.renderedInstruction = brush.instruction;
      }
    });
  };
}

function ensureStrokeLines(map, stroke) {
  const lines = map.get(stroke);
  if (lines) {
    return lines;
  }
  const newLines = [];
  map.set(stroke, newLines);
  return newLines;
}

export function precalculateStrokes(rawData, totalWidth, totalHeight) {
  const map = new Map();

  for (let ii = 0; ii < rawData.length; ii++) {
    const { x1, y1, x2, y2, topStroke, rightStroke, bottomStroke, leftStroke } = rawData[ii];
    if (topStroke) {
      const lines = ensureStrokeLines(map, topStroke);
      lines.push([x1, y1, x2, y1]);
    }
    if (rightStroke) {
      const lines = ensureStrokeLines(map, rightStroke);
      lines.push([x2, y1, x2, y2]);
    }
    if (bottomStroke) {
      const lines = ensureStrokeLines(map, bottomStroke);
      lines.push([x1, y2, x2, y2]);
    }
    if (leftStroke) {
      const lines = ensureStrokeLines(map, leftStroke);
      lines.push([x1, y1, x1, y2]);
    }
  }

  const keys = map.keys();
  Array.from(keys).forEach((key) => {
    const value = map.get(key);
    const width = parseInt(key, 10);
    const pathString = createPathString(width, value, totalWidth, totalHeight);
    const optimizedPathString = svgOptimizePath(pathString);
    map.set(key, optimizedPathString);
  });

  return map;
}

function resetBrush(brush) {
  brush.instruction = '';
  brush.x = undefined;
  brush.y = undefined;
}

function getBrushForStyle(brushes, style, parent) {
  let brush = brushes.get(style);
  if (!brush) {
    const elem = parent.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'path');
    const [width, color] = style.split(' ');
    elem.setAttribute('stroke', color);
    elem.setAttribute('stroke-width', width);
    elem.setAttribute('stroke-linecap', 'square');
    elem.setAttribute('shape-rendering', 'optimizeSpeed');
    // elem.setAttribute('shape-rendering', 'geometricPrecision'); // TODO why the border renders wrong when this is on
    // elem.setAttribute('shape-rendering', 'crispEdges');

    brush = {};
    brush.elem = elem;
    brush.width = parseInt(width, 10);
    brush.renderedInstruction = '';
    resetBrush(brush);
    parent.appendChild(elem);
    brushes.set(style, brush);
  }
  return brush;
}

function preventStrokeLeakingAtEdges(pos, totalSize, brushHalfSize) {
  if (pos - brushHalfSize < 0) {
    pos += Math.ceil(brushHalfSize - pos);
  }
  if (pos + brushHalfSize > totalSize) {
    pos -= Math.ceil(pos + brushHalfSize - totalSize);
  }
  return pos;
}

export function createPathString(width, lines, totalWidth, totalHeight) {
  const instruction = [];
  const brushHalfSize = width / 2;
  const needSubPixelCorrection = (width % 2 !== 0); // disable antialiasing

  for (let ii = 0; ii < lines.length; ii++) {
    let [x1, y1, x2, y2] = lines[ii];

    if (needSubPixelCorrection) {
      y1 += 0.5;
      y2 += 0.5;
      x1 += 0.5;
      x2 += 0.5;
    }

    x1 = preventStrokeLeakingAtEdges(x1, totalWidth, brushHalfSize);
    y1 = preventStrokeLeakingAtEdges(y1, totalHeight, brushHalfSize);
    x2 = preventStrokeLeakingAtEdges(x2, totalWidth, brushHalfSize);
    y2 = preventStrokeLeakingAtEdges(y2, totalHeight, brushHalfSize);

    instruction.push(`M ${x1} ${y1} `);
    instruction.push(`L ${x2} ${y2} `);
  }

  return instruction.join(' ');
}

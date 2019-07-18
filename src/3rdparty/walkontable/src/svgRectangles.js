/**
 * getSvgRectangleRenderer is a higher-order function that returns a function to render groupedRects.
 * The returned function expects groupedRects to be in a format created by SvgRectangles.precalculate
 * Stroke lines are not defined within the SVG. You should define them using CSS on the SVG element.
 * @param {HTMLElement} svg
 */
export default function getSvgRectangleRenderer(svg) {
  svg.setAttribute('shape-rendering', 'optimizeSpeed');
  // svg.setAttribute('shape-rendering', 'geometricPrecision'); // TODO why the border renders wrong when this is on
  // svg.setAttribute('shape-rendering', 'crispEdges');

  svg.setAttribute('fill', 'none');

  // todo copy retina solutions from hot

  let lastTotalWidth;
  let lastTotalHeight;

  const brushes = new Map();

  // TODO instead of totalWidth, etc, I could use maximum x2, y2 in groupedRects
  // on the other hand, totalWidth, totalHeight should not change that often
  return (totalWidth, totalHeight, rects) => {
    if (totalWidth !== lastTotalWidth || totalHeight !== lastTotalHeight) {
      svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);

      if (totalWidth !== lastTotalWidth) {
        svg.style.width = `${totalWidth}px`;
        svg.setAttribute('width', totalWidth);
        lastTotalWidth = totalWidth;
      }
      if (totalHeight !== lastTotalHeight) {
        svg.style.height = `${totalHeight}px`;
        svg.setAttribute('height', totalHeight);
        lastTotalHeight = totalHeight;
      }
    }

    brushes.forEach(resetBrush);

    for (let rr = 0; rr < rects.length; rr++) {
      const { x1, x2, y1, y2 } = rects[rr];

      const { topStroke, leftStroke, bottomStroke, rightStroke } = rects[rr];
      if (topStroke) {
        const brush = getBrushForStyle(brushes, topStroke, svg);
        lineH(brush, x1, y1, x2, totalWidth, totalHeight);
      }
      if (rightStroke) {
        const brush = getBrushForStyle(brushes, rightStroke, svg);
        lineV(brush, x2, y1, y2, totalWidth, totalHeight);
      }
      if (bottomStroke) {
        const brush = getBrushForStyle(brushes, bottomStroke, svg);
        lineH(brush, x2, y2, x1, totalWidth, totalHeight);
      }
      if (leftStroke) {
        const brush = getBrushForStyle(brushes, leftStroke, svg);
        lineV(brush, x1, y2, y1, totalWidth, totalHeight);
      }
    }

    brushes.forEach((brush) => {
      // if (brush.instruction.indexOf('undefined') > -1) {
      //     debugger;
      // }
      // if (brush.instruction.indexOf('NaN') > -1) {
      //     debugger;
      // }
      if (brush.renderedInstruction !== brush.instruction) {
        if (brush.instruction) {
          brush.instruction += 'z';
        }
        brush.elem.setAttribute('d', brush.instruction);
        brush.renderedInstruction = brush.instruction;
      }
    });
  };
}

function resetBrush(brush) {
  brush.instruction = '';
  brush.x = undefined;
  brush.y = undefined;
}

function getBrushForStyle(brushes, style, parent) {
  if (style === true) {
    style = '1px black';
  }
  let brush = brushes.get(style);
  if (!brush) {
    const elem = parent.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'path');
    const [width, color] = style.split(' ');
    elem.setAttribute('stroke', color);
    elem.setAttribute('stroke-width', width);
    // elem.setAttribute('stroke-linecap', 'square');

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

function lineH(brush, x1, y1, x2, totalWidth, totalHeight) {
  // Compare: https://stackoverflow.com/questions/7241393/can-you-control-how-an-svgs-stroke-width-is-drawn

  if (brush.width % 2 !== 0) { // disable antialiasing
    y1 += 0.5;
    x1 += 0.5;
    x2 += 0.5;
  }

  const brushHalfSize = brush.width / 2;
  x1 = preventStrokeLeakingAtEdges(x1, totalWidth, brushHalfSize);
  x2 = preventStrokeLeakingAtEdges(x2, totalWidth, brushHalfSize);
  y1 = preventStrokeLeakingAtEdges(y1, totalHeight, brushHalfSize);

  if (brush.x !== x1 || brush.y !== y1) {
    brush.instruction += `M ${x1} ${y1} `;
    brush.y = y1;
  }
  brush.instruction += `H ${x2} `;
  brush.x = x2;
}

function lineV(brush, x1, y1, y2, totalWidth, totalHeight) {
  if (brush.width % 2 !== 0) { // disable antialiasing
    y1 += 0.5;
    y2 += 0.5;
    x1 += 0.5;
  }

  const brushHalfSize = brush.width / 2;
  x1 = preventStrokeLeakingAtEdges(x1, totalWidth, brushHalfSize);
  y1 = preventStrokeLeakingAtEdges(y1, totalHeight, brushHalfSize);
  y2 = preventStrokeLeakingAtEdges(y2, totalHeight, brushHalfSize);

  if (brush.x !== x1 || brush.y !== y1) {
    brush.instruction += `M ${x1} ${y1} `;
    brush.x = x1;
  }
  brush.instruction += `V ${y2} `;
  brush.y = y2;
}

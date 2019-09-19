import mergeOverlappingLines from './mergeOverlappingLines';
import groupLinesIntoPolylines from './groupLinesIntoPolylines';

/**
 * Simplifies a 2D array of paths by removing redundant points (points that are intermediate on a line)
 * and redundant move commands (moves that can be avoided by correct chaining of the lines)
 *
 * @param {Array.<Array.<number>>>} lines SVG Path data in format `[[x1, y1, x2, y2], ...]`
 * @returns {Array.<Array.<number>>>} SVG Path data in chained format `[[x1, y1, x2, y2, x3, y3, ...], ...]`
 */
export default function svgOptimizePath(lines) {
  const mergedLines = mergeOverlappingLines(lines); // remove redundant points
  const polylines = groupLinesIntoPolylines(mergedLines); // remove redundant move commands

  return polylines;
}

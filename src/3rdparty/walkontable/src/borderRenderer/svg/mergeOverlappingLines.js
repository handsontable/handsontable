/*
This file contains refactored excerpts from:

Maker.js
https://github.com/Microsoft/maker.js

Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
*/

/**
 * Reduce redundancy by combining multiple overlapping lines into a single line.
 *
 * @param {Array.<Array.<number>>>} lines SVG Path data in format `[[x1, y1, x2, y2], ...]`
 * @returns {Array.<Array.<number>>>} SVG Path data in the same format as input, but you can expect fewer lines if possible
 */
export default function mergeOverlappingLines(lines) {
  const newLines = [];
  const similarities = new Map();

  for (let i = 0; i < lines.length; i++) {
    const pathContext = lines[i];
    const isHorizontal = (pathContext[1] === pathContext[3]);

    const key = isHorizontal ? `h-${pathContext[1]}` : `v-${pathContext[0]}`; // group horizontal lines by Y, vertical lines by X
    const found = similarities.get(key);

    if (found) {
      found.push(pathContext);
    } else {
      similarities.set(key, [pathContext]);
    }
  }

  similarities.forEach((value) => {
    if (value.length > 1) {
      // merge
      newLines.push(...checkForOverlaps(value));
    } else {
      // no merge needed
      newLines.push(value[0]);
    }
  });

  return newLines;
}

/**
 * @private
 */
function checkForOverlaps(walkedPaths) {
  let currIndex = 0;

  do {
    const root = walkedPaths[currIndex];
    const isHorizontal = (root[1] === root[3]);
    let overlaps;

    do {
      overlaps = false;

      for (let i = currIndex + 1; i < walkedPaths.length; i++) {
        const walkedPath = walkedPaths[i];

        if (!walkedPath.deleted) {
          overlaps = isLineOverlapping(root, walkedPath);
          if (overlaps) {
            const m = modelExtents(root, walkedPath);

            if (!isHorizontal) {
            // vertical
              root[1] = m.low[1];
              root[3] = m.high[1];
            } else {
            // horizontal
              root[0] = m.low[0];
              root[2] = m.high[0];
            }

            walkedPath.deleted = true;
            break;
          }
        }
      }
    } while (overlaps);
    currIndex += 1;
  } while (currIndex < walkedPaths.length);

  return walkedPaths.filter(x => !x.deleted);
}

/**
 * @private
 */
function isPointOnLine(pointX, pointY, line) {
  if (isBetween(pointX, line[0], line[2])) {
    return isBetween(pointY, line[1], line[3]);
  }

  return false;
}

/**
 * Check for line overlapping another line.
 *
 * @private
 * @param lineA The line to test.
 * @param lineB The line to check for overlap.
 * @returns Boolean true if lineA is overlapped with lineB.
 */
function isLineOverlapping(lineA, lineB) {
  return isPointOnLine(lineB[0], lineB[1], lineA) || isPointOnLine(lineB[2], lineB[3], lineA);
}

/**
 * Check if a given number is between two given limits.
 *
 * @private
 * @param valueInQuestion The number to test.
 * @param limitA First limit.
 * @param limitB Second limit.
 * @returns Boolean true if value is between (or equal to) the limits.
 */
function isBetween(valueInQuestion, limitA, limitB) {
  if (limitB > limitA) {
    return valueInQuestion >= limitA && valueInQuestion <= limitB;
  }

  return valueInQuestion >= limitB && valueInQuestion <= limitA;
}

/**
 * Measures the smallest rectangle which contains a model.
 *
 * @private
 * @returns object with low and high points.
 */
function modelExtents(lineA, lineB) {
  const extentsA = pathExtents(lineA);
  const extentsB = pathExtents(lineB);

  return increase(extentsA, extentsB);
}

/**
 * Calculates the smallest rectangle which contains a path.
 *
 * @private
 * @param pathToMeasure The path to measure.
 * @returns object with low and high points.
 */
function pathExtents(pathToMeasure) {
  return {
    low: getExtremePoint(pathToMeasure, Math.min),
    high: getExtremePoint(pathToMeasure, Math.max)
  };
}

/**
 * @private
 */
function getExtremePoint(line, fn) {
  return [
    fn(line[0], line[2]),
    fn(line[1], line[3])
  ];
}

/**
 * Increase a measurement by an additional measurement.
 *
 * @private
 * @param baseMeasure The measurement to increase.
 * @param addMeasure The additional measurement.
 * @returns The increased original measurement (for cascading).
 */
function increase(baseMeasure, addMeasure) {
  getExtreme(baseMeasure.low, addMeasure.low, Math.min);
  getExtreme(baseMeasure.high, addMeasure.high, Math.max);

  return baseMeasure;
}

/**
 * @private
 */
function getExtreme(basePoint, newPoint, fn) {
  basePoint[0] = fn(basePoint[0], newPoint[0]);
  basePoint[1] = fn(basePoint[1], newPoint[1]);
}

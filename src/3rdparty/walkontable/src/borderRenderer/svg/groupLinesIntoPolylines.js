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
 * Arrange lines that share the starting or ending point into chains. This allows to reduce the number of "move" operations
 *
 * @param {Array.<Array.<number>>>} lines SVG Path data in format `[[x1, y1, x2, y2], ...]`
 * @returns {Array.<Array.<number>>>} SVG Path data in chained format `[[x1, y1, x2, y2, x3, y3, ...], ...]`
 */
export default function groupLinesIntoPolylines(lines) {
  const pointGraph = new PointGraph();
  const chains = [];

  for (let i = 0; i < lines.length; i++) {
    const pathContext = lines[i];

    const valueIdOrigin = pointGraph.insertValue({
      pathContext,
      reversed: false,
    });

    pointGraph.insertValueIdAtPoint(valueIdOrigin, getOriginCoords(pathContext));

    const valueIdEnd = pointGraph.insertValue({
      pathContext,
      reversed: true,
    });

    pointGraph.insertValueIdAtPoint(valueIdEnd, getEndCoords(pathContext));
  }

  const loose = [];

  pointGraph.forEachPoint((values, el) => {
    if (el.length > 0) {
      const chain = [];

      followLink(pointGraph, values[0], chain, values[0]);
      if (chain.endless) {
        chains.push(chain);
      } else {
        // need to go in reverse
        chain.reverse();

        const firstLink = chain[0];

        chain.forEach((link) => { link.reversed = !link.reversed; });

        // remove the last link, it will be added in the call
        const currLink = chain.pop();

        followLink(pointGraph, currLink, chain, firstLink);
        if (chain.length > 1) {
          // chain found
          chain.endless = isPointEqual(linkEndpoint(chain[0], true), linkEndpoint(chain[chain.length - 1]));
          chains.push(chain);
        } else {
          // chain not found
          loose.push(chain[0].pathContext);
        }
      }
    }
  });

  const polylines = [];

  chains.forEach((chain) => {
    polylines.push(chainToPolyline(chain));
  });
  loose.forEach((pathContext) => {

    polylines.push(pathContext);
  });

  return polylines;
}

/**
 * A graph of items which may be located on the same points.
 *
 * @private
 */
function PointGraph() {
  this.reset();
}

/**
 * Reset the stored points, graphs, lists, to initial state.
 *
 * @private
 */
PointGraph.prototype.reset = function() {
  this.insertedCount = 0;
  this.graph = {};
  this.index = {};
  this.values = [];
};

/**
 * Insert a value.
 *
 * @private
 * @param value Value associated with this point.
 * @returns valueId of the inserted value.
 */
PointGraph.prototype.insertValue = function(value) {
  this.values.push(value);

  return this.values.length - 1;
};

/**
 * Insert a value at a point.
 *
 * @private
 * @param p Point.
 * @param value Value associated with this point.
 */
PointGraph.prototype.insertValueIdAtPoint = function(valueId, p) {
  const x = p[0];
  const y = p[1];

  if (!this.graph[x]) {
    this.graph[x] = {};
  }

  const pgx = this.graph[x];
  const existed = (y in pgx);
  let valueIds;
  let pointId;

  if (!existed) {
    pointId = this.insertedCount;
    pgx[y] = pointId;
    this.insertedCount += 1;
    valueIds = [valueId];
    this.index[pointId] = valueIds;
  } else {
    pointId = pgx[y];
    valueIds = this.index[pointId];
    valueIds.push(valueId);
  }
};

/**
 * Iterate over points in the index.
 *
 * @private
 * @param cb Callback for each point in the index.
 */
PointGraph.prototype.forEachPoint = function(cb) {
  for (let pointId = 0; pointId < this.insertedCount; pointId++) {
    const el = this.index[pointId];

    if (el && el.length > 0) {
      cb(el.map(i => this.values[i]), el);
    }
  }
};

/**
 * Gets the id of a point, after merging.
 *
 * @private
 * @param p Point to look up id.
 */
PointGraph.prototype.getIdOfPoint = function(p) {
  const px = this.graph[p[0]];

  if (px) {
    const pointId = px[p[1]];

    if (pointId >= 0) {
      return pointId;
    }
  }
};

/**
 * Get the index element of a point, after merging.
 *
 * @private
 * @param p Point to look up index element.
 */
PointGraph.prototype.getElementAtPoint = function(p) {
  const pointId = this.getIdOfPoint(p);

  if (pointId >= 0) {
    return this.index[pointId];
  }
};

/**
 * @private
 */
function getOriginCoords(line) {
  return line.slice(0, 2);
}

/**
 * @private
 */
function getEndCoords(line) {
  return line.slice(2, 4);
}

/**
 * @private
 */
function followLink(pointGraph, currLink, chain, firstLink) {
  while (currLink) {
    chain.push(currLink);

    const nextPoint = getNextPoint(currLink.pathContext, currLink.reversed);
    const nextEl = pointGraph.getElementAtPoint(nextPoint);

    if (!nextEl || nextEl.length === 0) {
      break;
    }

    const items = nextEl.map((valueIndex) => { return pointGraph.values[valueIndex]; });
    const nextLink = getOpposedLink(items, currLink.pathContext);

    // remove the first 2 items, which should be currlink and nextlink
    nextEl.splice(0, 2);
    if (!nextLink) {
      break;
    }
    if (nextLink.pathContext === firstLink.pathContext) {
      if (chain.length > 1) {
        chain.endless = true;
      }
      break;
    }
    currLink = nextLink;
  }
}

/**
 * @private
 */
function getNextPoint(pathContext, isReversed) {
  if (isReversed) {
    return getOriginCoords(pathContext);
  }

  return getEndCoords(pathContext);
}

/**
 * @private
 */
function getOpposedLink(linkedPaths, pathContext) {
  if (linkedPaths[0].pathContext === pathContext) {
    return linkedPaths[1];
  }

  return linkedPaths[0];
}

/**
 * Find out if two points are equal.
 *
 * @private
 * @param a First point.
 * @param b Second point.
 * @returns true if points are the same, false if they are not
 */
function isPointEqual(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

/**
 * @private
 */
function linkEndpoint(link, beginning) {
  if (beginning === link.reversed) {
    return getEndCoords(link.pathContext);
  }

  return getOriginCoords(link.pathContext);
}

/**
 * Convert a chain to an array of positions
 *
 * @private
 * @param chain Chain to convert.
 * @returns Array of positions [x1, y1, x2, y2, ...]
 */
function chainToPolyline(chain) {
  const result = [];

  result.push(...getNextPoint(chain[0].pathContext, !chain[0].reversed));
  for (let i = 0; i < chain.length; i++) {
    result.push(...getNextPoint(chain[i].pathContext, chain[i].reversed));
  }

  return result;
}

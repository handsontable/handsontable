/* eslint-disable */
// makerjs 0.17.0 (extracts)

// TODO eliminate more of dead code

export const MakerJs = {};


const paths = {};
/**
 * Class for line path.
 */

function Line(origin, end) {
  this.origin = origin;
  this.end = end;
}
paths.Line = Line;


const model = {};

/**
 * @private
 */
function followLinks(pointGraph, chainFound, chainNotFound) {
  function followLink(currLink, chain, firstLink) {
    while (currLink) {
      chain.links.push(currLink);
      chain.pathLength += currLink.pathLength;
      var next = currLink.reversed ? 0 : 1;
      var nextPoint = currLink.endPoints[next];
      var nextEl = pointGraph.getElementAtPoint(nextPoint);
      if (!nextEl || nextEl.valueIds.length === 0) {
        break;
      }
      var items = nextEl.valueIds.map(function (valueIndex) { return pointGraph.values[valueIndex]; });
      var nextLink = getOpposedLink(items, currLink.walkedPath.pathContext);
      //remove the first 2 items, which should be currlink and nextlink
      nextEl.valueIds.splice(0, 2);
      if (!nextLink) {
        break;
      }
      if (nextLink.walkedPath.pathContext === firstLink.walkedPath.pathContext) {
        if (chain.links.length > 1) {
          chain.endless = true;
        }
        break;
      }
      currLink = nextLink;
    }
  }
  pointGraph.forEachPoint(function (p, values, pointId, el) {
    if (el.valueIds.length > 0) {
      var chain = {
        links: [],
        pathLength: 0
      };
      followLink(values[0], chain, values[0]);
      if (chain.endless) {
        chainFound(chain, false);
      }
      else {
        //need to go in reverse
        chain.links.reverse();
        var firstLink = chain.links[0];
        chain.links.map(function (link) { link.reversed = !link.reversed; });
        //remove the last link, it will be added in the call
        chain.pathLength -= chain.links[chain.links.length - 1].pathLength;
        var currLink = chain.links.pop();
        followLink(currLink, chain, firstLink);
        if (chain.links.length > 1) {
          chainFound(chain, true);
        }
        else {
          chainNotFound(chain.links[0].walkedPath);
        }
      }
    }
  });
}

/**
 * @private
 */
function getOpposedLink(linkedPaths, pathContext) {
  if (linkedPaths[0].walkedPath.pathContext === pathContext) {
    return linkedPaths[1];
  }
  return linkedPaths[0];
}

function findChains(modelContext, callback) {
  var pointGraph = new MakerJs.PointGraph();
  var chains = [];
  var walkOptions = {
    onPath: function (walkedPath) {
      var pathLength = MakerJs.measure.pathLength(walkedPath.pathContext);

        //gather both endpoints from all non-circle segments
        var endPoints = [walkedPath.pathContext.origin, walkedPath.pathContext.end];
        for (var i = 0; i < 2; i++) {
          var link = {
            walkedPath: walkedPath,
            endPoints: endPoints,
            reversed: i != 0,
            pathLength: pathLength
          };
          var valueId = pointGraph.insertValue(link);
          pointGraph.insertValueIdAtPoint(valueId, endPoints[i]);
        }

    }
  };
  model.walk(modelContext, walkOptions);

  var loose = [];

  //follow paths to find endless chains
  followLinks(pointGraph, function (chain, checkEndless) {
    if (checkEndless) {
      chain.endless = MakerJs.measure.isPointEqual(linkEndpoint(chain.links[0], true), linkEndpoint(chain.links[chain.links.length - 1]));
    }
    else {
      chain.endless = !!chain.endless;
    }
    chains.push(chain);
  }, function (walkedPath) {
    loose.push(walkedPath);
  });
  //sort to return largest chains first
  chains.sort(function (a, b) { return b.pathLength - a.pathLength; });
  if (callback)
    callback(chains, loose);
}
model.findChains = findChains;

/**
 * @private
 */
function linkEndpoint(link, beginning) {
  let index = (beginning === link.reversed) ? 1 : 0;
  return link.endPoints[index];
}

/**
 * @private
 */
function checkForOverlaps(refPaths, overlapUnion) {
  var currIndex = 0;
  do {
    var root = refPaths[currIndex];
    do {
      var overlaps = false;
      for (var i = currIndex + 1; i < refPaths.length; i++) {
        var arcRef = refPaths[i];
        overlaps = MakerJs.measure.isLineOverlapping(root.pathContext, arcRef.pathContext);
        if (overlaps) {
          overlapUnion(root.pathContext, arcRef.pathContext);
          delete arcRef.modelContext.paths[arcRef.pathId];
          refPaths.splice(i, 1);
          break;
        }
      }
    } while (overlaps);
    currIndex++;
  } while (currIndex < refPaths.length);
}

/**
 * Simplify a model's paths by reducing redundancy: combine multiple overlapping paths into a single path. The model must be originated.
 *
 * @param modelContext The originated model to search for similar paths.
 * @returns The simplified model (for cascading).
 */
function simplify(modelToSimplify) {
  var similarLines = new MakerJs.Collector(MakerJs.measure.isSlopeEqual);
  //walk the model and collect: arcs on same center / radius, circles on same center / radius, lines on same y-intercept / slope.
  var walkOptions = {
    onPath: function (lineRef) {
      var slope = MakerJs.measure.lineSlope(lineRef.pathContext);
      similarLines.addItemToCollection(slope, lineRef);
    }
  };
  model.walk(modelToSimplify, walkOptions);
  //for all lines that are similar, see if they overlap.
  //combine overlapping lines into the first one and delete the second.
  similarLines.getCollectionsOfMultiple(function (slope, arcRefs) {
    checkForOverlaps(arcRefs, function (lineA, lineB) {
      var m = MakerJs.measure.modelExtents(lineA, lineB);
      if (!slope.isHorizontal) {
        //vertical
        lineA.origin[1] = m.low[1];
        lineA.end[1] = m.high[1];
      }
      else {
          //horizontal
          lineA.origin[0] = m.low[0];
          lineA.end[0] = m.high[0];
      }
    });
  });
  return modelToSimplify;
}
model.simplify = simplify;

/**
 * Recursively walk through all child models and paths for a given model.
 *
 * @param modelContext The model to walk.
 * @param options Object containing callbacks.
 * @returns The original model (for cascading).
 */
function walk(modelContext, options) {

  for (var pathId in modelContext.paths) {
    var pathContext = modelContext.paths[pathId];
    if (!pathContext)
      continue;
    var walkedPath = {
      modelContext: modelContext,
      pathContext: pathContext,
      pathId: pathId,
    };

    options.onPath(walkedPath);
  }

return modelContext;
}
model.walk = walk;



/**
 * Collects items that share a common key.
 */
var Collector = /** @class */ (function () {
  function Collector(comparer) {
    this.comparer = comparer;
    this.collections = [];
  }
  Collector.prototype.addItemToCollection = function (key, item) {
    var found = this.findCollection(key);
    if (found) {
      found.push(item);
    }
    else {
      var collection = { key: key, items: [item] };
      this.collections.push(collection);
    }
  };
  Collector.prototype.findCollection = function (key, action) {
    for (var i = 0; i < this.collections.length; i++) {
      var collection = this.collections[i];
      if (this.comparer(key, collection.key)) {
        if (action) {
          action(i);
        }
        return collection.items;
      }
    }
    return null;
  };
  Collector.prototype.getCollectionsOfMultiple = function (cb) {
    for (var i = 0; i < this.collections.length; i++) {
      var collection = this.collections[i];
      if (collection.items.length > 1) {
        cb(collection.key, collection.items);
      }
    }
  };
  return Collector;
}());

const point = {};

/**
 * Create a clone of a point, mirrored on either or both x and y axes.
 *
 * @param pointToMirror The point to mirror.
 * @param mirrorX Boolean to mirror on the x axis.
 * @param mirrorY Boolean to mirror on the y axis.
 * @returns Mirrored point.
 */
function mirror2(pointToMirror, mirrorX, mirrorY) {
  var p = clone(pointToMirror);
  if (mirrorX) {
    p[0] = -p[0];
  }
  if (mirrorY) {
    p[1] = -p[1];
  }
  return p;
}
point.mirror = mirror2;


/**
 * Clone a point into a new point.
 *
 * @param pointToClone The point to clone.
 * @returns A new point with same values as the original.
 */
function clone(pointToClone) {
  return [pointToClone[0], pointToClone[1]];
}
point.clone = clone;


const measure = {};

/**
 * Increase a measurement by an additional measurement.
 *
 * @param baseMeasure The measurement to increase.
 * @param addMeasure The additional measurement.
 * @returns The increased original measurement (for cascading).
 */
function increase(baseMeasure, addMeasure) {
  function getExtreme(basePoint, newPoint, fn) {
    for (var i = 2; i--;) {
      basePoint[i] = fn(basePoint[i], newPoint[i]);
    }
  }
  if (addMeasure) {
    getExtreme(baseMeasure.low, addMeasure.low, Math.min);
    getExtreme(baseMeasure.high, addMeasure.high, Math.max);
  }
  return baseMeasure;
}
measure.increase = increase;

/**
 * Check if a given number is between two given limits.
 *
 * @param valueInQuestion The number to test.
 * @param limitA First limit.
 * @param limitB Second limit.
 * @returns Boolean true if value is between (or equal to) the limits.
 */
function isBetween(valueInQuestion, limitA, limitB) {
    return Math.min(limitA, limitB) <= valueInQuestion && valueInQuestion <= Math.max(limitA, limitB);
}

/**
 * Check if a given point is between a line's end points.
 *
 * @param pointInQuestion The point to test.
 * @param line Line to test against.
 * @returns Boolean true if point is between (or equal to) the line's origin and end points.
 */
function isBetweenPoints(pointInQuestion, line) {
  var oneDimension = false;
  for (var i = 2; i--;) {
    if (line.origin[i] - line.end[i] == 0) {
      if (oneDimension)
        return false;
      oneDimension = true;
      continue;
    }
    if (!isBetween(pointInQuestion[i], line.origin[i], line.end[i]))
      return false;
  }
  return true;
}

/**
 * Check for line overlapping another line.
 *
 * @param lineA The line to test.
 * @param lineB The line to check for overlap.
 * @returns Boolean true if lineA is overlapped with lineB.
 */
function isLineOverlapping(lineA, lineB) {
  function checkPoints(index, a, b) {
    function checkPoint(p) {
      return isBetweenPoints(p, a);
    }
    return checkPoint(b.origin) || checkPoint(b.end);
  }
  return checkPoints(0, lineA, lineB) || checkPoints(1, lineB, lineA);
}
measure.isLineOverlapping = isLineOverlapping;

/**
 * Find out if two points are equal.
 *
 * @param a First point.
 * @param b Second point.
 * @returns true if points are the same, false if they are not
 */
function isPointEqual(a, b) {
    return a[0] - b[0] == 0 && a[1] - b[1] == 0;
}
measure.isPointEqual = isPointEqual;

/**
 * Check for slope equality.
 *
 * @param slopeA The ISlope to test.
 * @param slopeB The ISlope to check for equality.
 * @returns Boolean true if slopes are equal.
 */
function isSlopeEqual(slopeA, slopeB) {
  if (slopeA.isHorizontal) {
    if (slopeB.isHorizontal) {
      //lines are parallel, but not vertical, see if y-intercept is the same
      return slopeA.line.origin[1] === slopeB.line.origin[1];
    }
  }
  else {
    if (!slopeB.isHorizontal) {
      //lines are both vertical, see if x are the same
      return slopeA.line.origin[0] === slopeB.line.origin[0];
    }
  }
  return false;
}
measure.isSlopeEqual = isSlopeEqual;


/**
 * Gets the slope of a line.
 */
function lineSlope(line) {
  return {
    line: line,
    isHorizontal: !(line.end[0] == line.origin[0])
  };
}
measure.lineSlope = lineSlope;

/**
 * Measures the smallest rectangle which contains a model.
 *
 * @returns object with low and high points.
 */
function modelExtents(lineA, lineB) {
  const extentsA = pathExtents(lineA);
  const extentsB = pathExtents(lineB);

  return increase(extentsA, extentsB);
}
measure.modelExtents = modelExtents;

/**
 * @private
 */
function getExtremePoint(a, b, fn) {
  return [
    fn(a[0], b[0]),
    fn(a[1], b[1])
  ];
}

/**
 * Calculates the smallest rectangle which contains a path.
 *
 * @param pathToMeasure The path to measure.
 * @returns object with low and high points.
 */
function pathExtents(pathToMeasure) {
  return {
    low: getExtremePoint(pathToMeasure.origin, pathToMeasure.end, Math.min),
    high: getExtremePoint(pathToMeasure.origin, pathToMeasure.end, Math.max)
  };
}
measure.pathExtents = pathExtents;


/**
 * Measures the length of a path.
 *
 * @param pathToMeasure The path to measure.
 * @returns Length of the path.
 */
function pathLength(pathToMeasure) {
  var dx = pathToMeasure.end[0] - pathToMeasure.origin[0];
  var dy = pathToMeasure.end[1] - pathToMeasure.origin[1];
  return Math.sqrt(dx * dx + dy * dy);
}
measure.pathLength = pathLength;


const exporter = {};


/**
 * @private
 */
function svgCoords(p) {
  return MakerJs.point.mirror(p, false, true);
}

/**
 * Convert a chain to SVG path data.
 *
 * @param chain Chain to convert.
 * @returns String of SVG path data.
 */
function chainToSVGPathData(chain) {
  var first = chain.links[0];
  var firstPoint = svgCoords(first.endPoints[first.reversed ? 1 : 0]);
  var d = ['M', firstPoint[0], firstPoint[1]];
  for (var i = 0; i < chain.links.length; i++) {
    var link = chain.links[i];
    const endPoint = svgCoords(link.endPoints[link.reversed ? 0 : 1]);
    d.push('L', endPoint[0], endPoint[1]);
  }
  if (chain.endless) {
    d.push('Z');
  }
  return d.join(' ');
}
exporter.chainToSVGPathData = chainToSVGPathData;

/**
 * @private
 */
function getPathDataByLayer(modelToExport) {
  const pathDatas = [];
  MakerJs.model.findChains(modelToExport, function (chains, loose) {
    function single(walkedPath) {
      var pathData = pathToSVGPathData(walkedPath.pathContext);
      pathDatas.push(pathData);
    }
      chains.forEach(function (chain) {
        if (chain.links.length > 1) {
          var pathData = chainToSVGPathData(chain);
          pathDatas.push(pathData);
        }
        else {
          single(chain.links[0].walkedPath);
        }
      });
    loose.forEach(function (wp) { return single(wp); });
  });
  return pathDatas;
}

/**
 * @private
 */
function startSvgPathData(start, d) {
  return ["M", start[0], start[1]].concat(d);
}

/**
 * Export a path to SVG path data.
 *
 * @param pathToExport IPath to export.
 * @returns String of SVG path data.
 */
function pathToSVGPathData(pathToExport) {
  var fixedPath = MakerJs.path.mirror(pathToExport, false, true);
  var d = startSvgPathData(fixedPath.origin, fixedPath.end);
  return d.join(' ');
}
exporter.pathToSVGPathData = pathToSVGPathData;


const models = {};

/**
 * A graph of items which may be located on the same points.
 */
function PointGraph() {
  this.reset();
}
/**
 * Reset the stored points, graphs, lists, to initial state.
 */
PointGraph.prototype.reset = function () {
  this.insertedCount = 0;
  this.graph = {};
  this.index = {};
  this.merged = {};
  this.values = [];
};
/**
 * Insert a value.
 * @param value Value associated with this point.
 * @returns valueId of the inserted value.
 */
PointGraph.prototype.insertValue = function (value) {
  this.values.push(value);
  return this.values.length - 1;
};
/**
 * Insert a value at a point.
 * @param p Point.
 * @param value Value associated with this point.
 */
PointGraph.prototype.insertValueIdAtPoint = function (valueId, p) {
  var x = p[0], y = p[1];
  if (!this.graph[x]) {
    this.graph[x] = {};
  }
  var pgx = this.graph[x];
  var existed = (y in pgx);
  var el;
  var pointId;
  if (!existed) {
    pgx[y] = pointId = this.insertedCount++;
    el = {
      pointId: pointId,
      point: p,
      valueIds: [valueId]
    };
    this.index[pointId] = el;
  }
  else {
    pointId = pgx[y];
    if (pointId in this.merged) {
      pointId = this.merged[pointId];
    }
    el = this.index[pointId];
    el.valueIds.push(valueId);
  }
  return { existed: existed, pointId: pointId };
};

/**
 * Iterate over points in the index.
 * @param cb Callback for each point in the index.
 */
PointGraph.prototype.forEachPoint = function (cb) {
  var _this = this;
  for (var pointId = 0; pointId < this.insertedCount; pointId++) {
    var el = this.index[pointId];
    if (!el)
      continue;
    var length_1 = el.valueIds.length;
    if (length_1 > 0) {
      cb(el.point, el.valueIds.map(function (i) { return _this.values[i]; }), pointId, el);
    }
  }
};
/**
 * Gets the id of a point, after merging.
 * @param p Point to look up id.
 */
PointGraph.prototype.getIdOfPoint = function (p) {
  var px = this.graph[p[0]];
  if (px) {
    var pointId = px[p[1]];
    if (pointId >= 0) {
      if (pointId in this.merged) {
        return this.merged[pointId];
      }
      else {
        return pointId;
      }
    }
  }
};
/**
 * Get the index element of a point, after merging.
 * @param p Point to look up index element.
 */
PointGraph.prototype.getElementAtPoint = function (p) {
  var pointId = this.getIdOfPoint(p);
  if (pointId >= 0) {
    return this.index[pointId];
  }
};
MakerJs.PointGraph = PointGraph;



const path = {};

/**
 * Create a clone of a path, mirrored on either or both x and y axes.
 *
 * @param pathToMirror The path to mirror.
 * @param mirrorX Boolean to mirror on the x axis.
 * @param mirrorY Boolean to mirror on the y axis.
 * @returns Mirrored path.
 */
function mirror(pathToMirror, mirrorX, mirrorY) {
  var origin = MakerJs.point.mirror(pathToMirror.origin, mirrorX, mirrorY);
  var newPath = new MakerJs.paths.Line(origin, MakerJs.point.mirror(pathToMirror.end, mirrorX, mirrorY));
  return newPath;
}
path.mirror = mirror;

MakerJs.point = point;
MakerJs.measure = measure;
MakerJs.paths = paths;
MakerJs.model = model;
MakerJs.Collector = Collector;
MakerJs.exporter = exporter;
MakerJs.models = models;
MakerJs.path = path;

export { getPathDataByLayer };
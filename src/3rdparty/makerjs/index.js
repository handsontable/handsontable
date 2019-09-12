/* eslint-disable */
// makerjs 0.17.0 (extracts)

// TODO eliminate more of dead code

export const MakerJs = {};
/**
 * String-based enumeration of all paths types.
 *
 * Examples: use pathType instead of string literal when creating a circle.
 * ```
 * var circle: IPathCircle = { type: pathType.Circle, origin: [0, 0], radius: 7 };   //typescript
 * var circle = { type: pathType.Circle, origin: [0, 0], radius: 7 };   //javascript
 * ```
 */
MakerJs.pathType = {
  Line: "line",
};

/**
 * @private
 */
function split(s, char) {
  var p = s.indexOf(char);
  if (p < 0) {
    return [s];
  }
  else if (p > 0) {
    return [s.substr(0, p), s.substr(p + 1)];
  }
  else {
    return ['', s];
  }
}

const importer = {};

/**
 * Create a model from SVG path data.
 *
 * @param pathData SVG path data.
 * @param options ISVGImportOptions object.
 * @returns An IModel object.
 */
function fromSVGPathData(pathData, options) {
  if (options === void 0) { options = {}; }
  var result = {};
  function addPath(p) {
    if (!result.paths) {
      result.paths = {};
    }
    result.paths['p_' + ++pathCount] = p;
  }
  function getPoint(cmd, offset) {
    if (offset === void 0) { offset = 0; }
    var p = MakerJs.point.mirror([cmd.data[0 + offset], cmd.data[1 + offset]], false, true);
    if (cmd.absolute) {
      return p;
    }
    else {
      return MakerJs.point.add(p, cmd.from);
    }
  }
  function lineTo(cmd, end) {
    if (!MakerJs.measure.isPointEqual(cmd.from, end)) {
      addPath(new MakerJs.paths.Line(cmd.from, end));
    }
    return end;
  }
  var map = {};
  map['M'] = function (cmd) {
    firstPoint = getPoint(cmd);
    return firstPoint;
  };
  map['Z'] = function (cmd) {
    return lineTo(cmd, firstPoint);
  };
  map['H'] = function (cmd) {
    var end = MakerJs.point.clone(cmd.from);
    if (cmd.absolute) {
      end[0] = cmd.data[0];
    }
    else {
      end[0] += cmd.data[0];
    }
    return lineTo(cmd, end);
  };
  map['V'] = function (cmd) {
    var end = MakerJs.point.clone(cmd.from);
    //subtract to mirror on y axis: SVG coords
    if (cmd.absolute) {
      end[1] = -cmd.data[0];
    }
    else {
      end[1] -= cmd.data[0];
    }
    return lineTo(cmd, end);
  };
  map['L'] = function (cmd) {
    var end = getPoint(cmd);
    return lineTo(cmd, end);
  };
  var firstPoint = [0, 0];
  var currPoint = [0, 0];
  var pathCount = 0;
  var prevCommand;
  var regexpCommands = /([achlmqstvz])([0-9e\.,\+-\s]*)/ig;
  var commandMatches;
  while ((commandMatches = regexpCommands.exec(pathData)) !== null) {
    if (commandMatches.index === regexpCommands.lastIndex) {
      regexpCommands.lastIndex++;
    }
    var command = commandMatches[1]; //0 = command and data, 1 = command, 2 = data
    var dataString = commandMatches[2];
    var currCmd = {
      command: command.toUpperCase(),
      data: [],
      from: currPoint,
      prev: prevCommand
    };
    if (command === currCmd.command) {
      currCmd.absolute = true;
    }
    currCmd.data = importer.parseNumericList(dataString);
    var fn = map[currCmd.command];
    if (fn) {
      currPoint = fn(currCmd);
    }
    prevCommand = currCmd;
  }
  return result;
}
importer.fromSVGPathData = fromSVGPathData;

/**
 * Create a numeric array from a string of numbers. The numbers may be delimited by anything non-numeric.
 *
 * Example:
 * ```
 * var n = makerjs.importer.parseNumericList('5, 10, 15.20 25-30-35 4e1 .5');
 * ```
 *
 * @param s The string of numbers.
 * @returns Array of numbers.
 */
function parseNumericList(s) {
  var result = [];
  //http://stackoverflow.com/questions/638565/parsing-scientific-notation-sensibly
  var re = /[\.-]?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
  var matches;
  while ((matches = re.exec(s)) !== null) {
    if (matches.index === re.lastIndex) {
      re.lastIndex++;
    }
    result.push(parseFloat(matches[0]));
  }
  return result;
}
importer.parseNumericList = parseNumericList;


/**
 * Copy the properties from one object to another object.
 *
 * Example:
 * ```
 * makerjs.extendObject({ abc: 123 }, { xyz: 789 }); //returns { abc: 123, xyz: 789 }
 * ```
 *
 * @param target The object to extend. It will receive the new properties.
 * @param other An object containing properties to merge in.
 * @returns The original object after merging.
 */
function extendObject(target, other) {
  if (target && other) {
    for (var key in other) {
      if (typeof other[key] !== 'undefined') {
        target[key] = other[key];
      }
    }
  }
  return target;
}
MakerJs.extendObject = extendObject;


/**
 * Numeric rounding
 *
 * Example: round to 3 decimal places
 * ```
 * makerjs.round(3.14159, .001); //returns 3.142
 * ```
 *
 * @param n The number to round off.
 * @param accuracy Optional exemplar of number of decimal places.
 * @returns Rounded number.
 */
function round(n, accuracy) {
  if (accuracy === void 0) { accuracy = .0000001; }
  //optimize for early exit for integers
  if (n % 1 === 0)
    return n;
  var exp = 1 - String(Math.ceil(1 / accuracy)).length;
  //Adapted from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
  // If the exp is undefined or zero...
  if (typeof exp === 'undefined' || +exp === 0) {
    return Math.round(n);
  }
  n = +n;
  exp = +exp;
  // If the value is not a number or the exp is not an integer...
  if (isNaN(n) || !(typeof exp === 'number' && exp % 1 === 0)) {
    return NaN;
  }
  // If the value is negative...
  if (n < 0) {
    return -round(-n, accuracy);
  }
  // Shift
  var a = split(n.toString(), 'e');
  n = Math.round(+(a[0] + 'e' + (a[1] ? (+a[1] - exp) : -exp)));
  // Shift back
  a = split(n.toString(), 'e');
  return +(a[0] + 'e' + (a[1] ? (+a[1] + exp) : exp));
}
MakerJs.round = round;


/**
 * Create a string representation of a route array.
 *
 * @param route Array of strings which are segments of a route.
 * @returns String of the flattened array.
 */
function createRouteKey(route) {
  var converted = [];
  for (var i = 0; i < route.length; i++) {
    var element = route[i];
    var newElement;
    if (i % 2 === 0) {
      newElement = (i > 0 ? '.' : '') + element;
    }
    else {
      newElement = JSON.stringify([element]);
    }
    converted.push(newElement);
  }
  return converted.join('');
}
MakerJs.createRouteKey = createRouteKey;


const paths = {};
/**
 * Class for line path.
 */

function Line() {
  var args = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    args[_i] = arguments[_i];
  }
  this.type = 'line';
  switch (args.length) {
    case 1:
      var points = args[0];
      this.origin = points[0];
      this.end = points[1];
      break;
    case 2:
      this.origin = args[0];
      this.end = args[1];
      break;
  }
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

function findChains(modelContext) {
  var args = [];
  for (var _i = 1; _i < arguments.length; _i++) {
    args[_i - 1] = arguments[_i];
  }
  var options;
  var callback;
  switch (args.length) {
    case 1:
      if (typeof args[0] === 'function') {
        callback = args[0];
      }
      else {
        options = args[0];
      }
      break;
    case 2:
      callback = args[0];
      options = args[1];
      break;
  }
  var opts = {
    pointMatchingDistance: .005
  };
  MakerJs.extendObject(opts, options);
  var pointGraphsByLayer = {};
  var chainsByLayer = {};
  var ignored = {};
  var walkOptions = {
    onPath: function (walkedPath) {
      var layer = opts.byLayers ? walkedPath.layer : '';
      if (!pointGraphsByLayer[layer]) {
        pointGraphsByLayer[layer] = new MakerJs.PointGraph();
      }
      var pointGraph = pointGraphsByLayer[layer];
      var pathLength = MakerJs.measure.pathLength(walkedPath.pathContext);

        //don't add lines which are 5x shorter than the tolerance
        if (pathLength < opts.pointMatchingDistance / 5) {
          if (!ignored[layer]) {
            ignored[layer] = [];
          }
          ignored[layer].push(walkedPath);
          return;
        }
        //gather both endpoints from all non-circle segments
        var endPoints = MakerJs.point.fromPathEnds(walkedPath.pathContext, walkedPath.offset);
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
  if (opts.shallow) {
    walkOptions.beforeChildWalk = function () { return false; };
  }
  model.walk(modelContext, walkOptions);
  var _loop_3 = function (layer_2) {
    var pointGraph = pointGraphsByLayer[layer_2];
    // pointGraph.mergeNearestSinglePoints(opts.pointMatchingDistance);
    loose = [];
    if (!chainsByLayer[layer_2]) {
      chainsByLayer[layer_2] = [];
    }
    //follow paths to find endless chains
    followLinks(pointGraph, function (chain, checkEndless) {
      if (checkEndless) {
        chain.endless = MakerJs.measure.isPointEqual(linkEndpoint(chain.links[0], true), linkEndpoint(chain.links[chain.links.length - 1], false), opts.pointMatchingDistance);
      }
      else {
        chain.endless = !!chain.endless;
      }
      chainsByLayer[layer_2].push(chain);
    }, function (walkedPath) {
      loose.push(walkedPath);
    });
    //sort to return largest chains first
    chainsByLayer[layer_2].sort(function (a, b) { return b.pathLength - a.pathLength; });
    if (callback)
      callback(chainsByLayer[layer_2], loose, layer_2, ignored[layer_2]);
  };
  var loose;
  for (var layer_2 in pointGraphsByLayer) {
    _loop_3(layer_2);
  }
  if (opts.byLayers) {
    return chainsByLayer;
  }
  else {
    return chainsByLayer[''];
  }
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
 * Recursively walk through all child models and paths for a given model.
 *
 * @param modelContext The model to walk.
 * @param options Object containing callbacks.
 * @returns The original model (for cascading).
 */
function walk(modelContext, options) {
  if (!modelContext)
    return;
  function walkRecursive(modelContext, layer, offset, route, routeKey) {
    var newOffset = MakerJs.point.add(modelContext.origin, offset);
    layer = (layer != undefined) ? layer : '';
    if (modelContext.paths) {
      for (var pathId in modelContext.paths) {
        var pathContext = modelContext.paths[pathId];
        if (!pathContext)
          continue;
        var walkedPath = {
          modelContext: modelContext,
          layer: (pathContext.layer != undefined) ? pathContext.layer : layer,
          offset: newOffset,
          pathContext: pathContext,
          pathId: pathId,
          route: route.concat(['paths', pathId]),
          routeKey: routeKey + (routeKey ? '.' : '') + 'paths' + JSON.stringify([pathId])
        };
        if (options.onPath)
          options.onPath(walkedPath);
      }
    }
    if (modelContext.models) {
      for (var modelId in modelContext.models) {
        var childModel = modelContext.models[modelId];
        if (!childModel)
          continue;
        var walkedModel = {
          parentModel: modelContext,
          layer: (childModel.layer != undefined) ? childModel.layer : layer,
          offset: newOffset,
          route: route.concat(['models', modelId]),
          routeKey: routeKey + (routeKey ? '.' : '') + 'models' + JSON.stringify([modelId]),
          childId: modelId,
          childModel: childModel
        };
        if (options.beforeChildWalk) {
          if (!options.beforeChildWalk(walkedModel))
            continue;
        }
        walkRecursive(walkedModel.childModel, walkedModel.layer, newOffset, walkedModel.route, walkedModel.routeKey);
        if (options.afterChildWalk) {
          options.afterChildWalk(walkedModel);
        }
      }
    }
  }
  walkRecursive(modelContext, modelContext.layer, [0, 0], [], '');
  return modelContext;
}
model.walk = walk;

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
 * Round the values of a point.
 *
 * @param pointContext The point to serialize.
 * @param accuracy Optional exemplar number of decimal places.
 * @returns A new point with the values rounded.
 */
function rounded(pointContext, accuracy) {
  return [MakerJs.round(pointContext[0], accuracy), MakerJs.round(pointContext[1], accuracy)];
}
point.rounded = rounded;

/**
 * Add two points together and return the result as a new point object.
 *
 * @param a First point.
 * @param b Second point.
 * @param subtract Optional boolean to subtract instead of add.
 * @returns A new point object.
 */
function add(a, b, subtract) {
  var newPoint = clone(a);
  if (!b)
    return newPoint;
  for (var i = 2; i--;) {
    if (subtract) {
      newPoint[i] -= b[i];
    }
    else {
      newPoint[i] += b[i];
    }
  }
  return newPoint;
}
point.add = add;

/**
 * Get the average of two points.
 *
 * @param a First point.
 * @param b Second point.
 * @returns New point object which is the average of a and b.
 */
function average(a, b) {
  function avg(i) {
    return (a[i] + b[i]) / 2;
  }
  return [avg(0), avg(1)];
}
point.average = average;


/**
 * Clone a point into a new point.
 *
 * @param pointToClone The point to clone.
 * @returns A new point with same values as the original.
 */
function clone(pointToClone) {
  if (!pointToClone)
    return point.zero();
  return [pointToClone[0], pointToClone[1]];
}
point.clone = clone;

/**
 * @private
 */
var pathEndsMap = {};
pathEndsMap[MakerJs.pathType.Line] = function (line) {
  return [line.origin, line.end];
};

/**
 * Get the two end points of a path.
 *
 * @param pathContext The path object.
 * @returns Array with 2 elements: [0] is the point object corresponding to the origin, [1] is the point object corresponding to the end.
 */
function fromPathEnds(pathContext, pathOffset) {
  var result = null;
  var fn = pathEndsMap[pathContext.type];
  if (fn) {
    result = fn(pathContext);
    if (pathOffset) {
      result = result.map(function (p) { return add(p, pathOffset); });
    }
  }
  return result;
}
point.fromPathEnds = fromPathEnds;

/**
 * A point at 0,0 coordinates.
 * NOTE: It is important to call this as a method, with the empty parentheses.
 *
 * @returns A new point.
 */
function zero() {
  return [0, 0];
}
point.zero = zero;


const measure = {};

/**
 * Increase a measurement by an additional measurement.
 *
 * @param baseMeasure The measurement to increase.
 * @param addMeasure The additional measurement.
 * @param augmentBaseMeasure Optional flag to call measure.augment on the measurement.
 * @returns The increased original measurement (for cascading).
 */
function increase(baseMeasure, addMeasure, augmentBaseMeasure) {
  function getExtreme(basePoint, newPoint, fn) {
    if (!newPoint)
      return;
    for (var i = 2; i--;) {
      if (newPoint[i] == null)
        continue;
      if (basePoint[i] == null) {
        basePoint[i] = newPoint[i];
      }
      else {
        basePoint[i] = fn(basePoint[i], newPoint[i]);
      }
    }
  }
  if (addMeasure) {
    getExtreme(baseMeasure.low, addMeasure.low, Math.min);
    getExtreme(baseMeasure.high, addMeasure.high, Math.max);
  }
  if (augmentBaseMeasure) {
    augment(baseMeasure);
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
 * @param exclusive Flag to exclude equaling the limits.
 * @returns Boolean true if value is between (or equal to) the limits.
 */
function isBetween(valueInQuestion, limitA, limitB, exclusive) {
  if (exclusive) {
    return Math.min(limitA, limitB) < valueInQuestion && valueInQuestion < Math.max(limitA, limitB);
  }
  else {
    return Math.min(limitA, limitB) <= valueInQuestion && valueInQuestion <= Math.max(limitA, limitB);
  }
}
measure.isBetween = isBetween;

/**
 * Check if a given point is between a line's end points.
 *
 * @param pointInQuestion The point to test.
 * @param line Line to test against.
 * @param exclusive Flag to exclude equaling the origin or end points.
 * @returns Boolean true if point is between (or equal to) the line's origin and end points.
 */
function isBetweenPoints(pointInQuestion, line, exclusive) {
  var oneDimension = false;
  for (var i = 2; i--;) {
    if (MakerJs.round(line.origin[i] - line.end[i], .000001) == 0) {
      if (oneDimension)
        return false;
      oneDimension = true;
      continue;
    }
    var origin_value = MakerJs.round(line.origin[i]);
    var end_value = MakerJs.round(line.end[i]);
    if (!isBetween(MakerJs.round(pointInQuestion[i]), origin_value, end_value, exclusive))
      return false;
  }
  return true;
}
measure.isBetweenPoints = isBetweenPoints;

/**
 * Check for line overlapping another line.
 *
 * @param lineA The line to test.
 * @param lineB The line to check for overlap.
 * @param excludeTangents Boolean to exclude exact endpoints and only look for deep overlaps.
 * @returns Boolean true if lineA is overlapped with lineB.
 */
function isLineOverlapping(lineA, lineB, excludeTangents) {
  function checkPoints(index, a, b) {
    function checkPoint(p) {
      return isBetweenPoints(p, a, excludeTangents);
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
 * @param withinDistance Optional distance to consider points equal.
 * @returns true if points are the same, false if they are not
 */
function isPointEqual(a, b, withinDistance) {
  if (!withinDistance) {
    return MakerJs.round(a[0] - b[0]) == 0 && MakerJs.round(a[1] - b[1]) == 0;
  }
  else {
    if (!a || !b)
      return false;
    var distance = measure.pointDistance(a, b);
    return distance <= withinDistance;
  }
}
measure.isPointEqual = isPointEqual;

/**
 * @private
 */
function cloneMeasure(measureToclone) {
  return {
    high: MakerJs.point.clone(measureToclone.high),
    low: MakerJs.point.clone(measureToclone.low)
  };
}

/**
 * Augment a measurement - add more properties such as center point, height and width.
 *
 * @param measureToAugment The measurement to augment.
 * @returns Measurement object with augmented properties.
 */
function augment(measureToAugment) {
  var m = measureToAugment;
  m.center = MakerJs.point.average(m.high, m.low);
  m.width = m.high[0] - m.low[0];
  m.height = m.high[1] - m.low[1];
  return m;
}
measure.augment = augment;


/**
 * Measures the smallest rectangle which contains a model.
 *
 * @param modelToMeasure The model to measure.
 * @param atlas Optional atlas to save measurements.
 * @returns object with low and high points.
 */
function modelExtents(modelToMeasure, atlas) {
  function increaseParentModel(childRoute, childMeasurement) {
    if (!childMeasurement)
      return;
    //to get the parent route, just traverse backwards 2 to remove id and 'paths' / 'models'
    var parentRoute = childRoute.slice(0, -2);
    var parentRouteKey = MakerJs.createRouteKey(parentRoute);
    if (!(parentRouteKey in atlas.modelMap)) {
      //just start with the known size
      atlas.modelMap[parentRouteKey] = cloneMeasure(childMeasurement);
    }
    else {
      increase(atlas.modelMap[parentRouteKey], childMeasurement);
    }
  }
  if (!atlas)
    atlas = new Atlas(modelToMeasure);
  var walkOptions = {
    onPath: function (walkedPath) {
      //trust that the path measurement is good
      if (!(walkedPath.routeKey in atlas.pathMap)) {
        atlas.pathMap[walkedPath.routeKey] = pathExtents(walkedPath.pathContext, walkedPath.offset);
      }
      increaseParentModel(walkedPath.route, atlas.pathMap[walkedPath.routeKey]);
    },
    afterChildWalk: function (walkedModel) {
      //model has been updated by all its children, update parent
      increaseParentModel(walkedModel.route, atlas.modelMap[walkedModel.routeKey]);
    }
  };
  MakerJs.model.walk(modelToMeasure, walkOptions);
  atlas.modelsMeasured = true;
  var m = atlas.modelMap[''];
  if (m) {
    return augment(m);
  }
  return m;
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
 * @private
 */
var pathExtentsMap = {};
pathExtentsMap[MakerJs.pathType.Line] = function (line) {
  return {
    low: getExtremePoint(line.origin, line.end, Math.min),
    high: getExtremePoint(line.origin, line.end, Math.max)
  };
};

/**
 * Calculates the smallest rectangle which contains a path.
 *
 * @param pathToMeasure The path to measure.
 * @returns object with low and high points.
 */
function pathExtents(pathToMeasure, addOffset) {
  if (pathToMeasure) {
    var fn = pathExtentsMap[pathToMeasure.type];
    if (fn) {
      var m = fn(pathToMeasure);
      if (addOffset) {
        m.high = MakerJs.point.add(m.high, addOffset);
        m.low = MakerJs.point.add(m.low, addOffset);
      }
      return m;
    }
  }
  return { low: null, high: null };
}
measure.pathExtents = pathExtents;


/**
 * Calculates the distance between two points.
 *
 * @param a First point.
 * @param b Second point.
 * @returns Distance between points.
 */
function pointDistance(a, b) {
  var dx = b[0] - a[0];
  var dy = b[1] - a[1];
  return Math.sqrt(dx * dx + dy * dy);
}
measure.pointDistance = pointDistance;


/**
 * @private
 */
var pathLengthMap = {};
pathLengthMap[MakerJs.pathType.Line] = function (line) {
  return pointDistance(line.origin, line.end);
};

/**
 * Measures the length of a path.
 *
 * @param pathToMeasure The path to measure.
 * @returns Length of the path.
 */
function pathLength(pathToMeasure) {
  if (pathToMeasure) {
    var fn = pathLengthMap[pathToMeasure.type];
    if (fn) {
      return fn(pathToMeasure);
    }
  }
  return 0;
}
measure.pathLength = pathLength;


/**
 * A list of maps of measurements.
 *
 * @param modelToMeasure The model to measure.
 * @param atlas Optional atlas to save measurements.
 * @returns object with low and high points.
 */
var Atlas = /** @class */ (function () {
  /**
   * Constructor.
   * @param modelContext The model to measure.
   */
  function Atlas(modelContext) {
    this.modelContext = modelContext;
    /**
     * Flag that models have been measured.
     */
    this.modelsMeasured = false;
    /**
     * Map of model measurements, mapped by routeKey.
     */
    this.modelMap = {};
    /**
     * Map of path measurements, mapped by routeKey.
     */
    this.pathMap = {};
  }
  Atlas.prototype.measureModels = function () {
    if (!this.modelsMeasured) {
      modelExtents(this.modelContext, this);
    }
  };
  return Atlas;
}());
measure.Atlas = Atlas;


const exporter = {};


/**
 * @private
 */
var chainLinkToPathDataMap = {};
chainLinkToPathDataMap[MakerJs.pathType.Line] = function (line, endPoint, reversed, d, accuracy) {
  d.push('L', MakerJs.round(endPoint[0], accuracy), MakerJs.round(endPoint[1], accuracy));
};

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
 * @param offset IPoint relative offset point.
 * @param accuracy Optional accuracy of SVG path data.
 * @returns String of SVG path data.
 */
function chainToSVGPathData(chain, offset, accuracy) {
  function offsetPoint(p) {
    return MakerJs.point.add(p, offset);
  }
  var first = chain.links[0];
  var firstPoint = offsetPoint(svgCoords(first.endPoints[first.reversed ? 1 : 0]));
  var d = ['M', MakerJs.round(firstPoint[0], accuracy), MakerJs.round(firstPoint[1], accuracy)];
  for (var i = 0; i < chain.links.length; i++) {
    var link = chain.links[i];
    var pathContext = link.walkedPath.pathContext;
    var fn = chainLinkToPathDataMap[pathContext.type];
    if (fn) {
      var fixedPath = MakerJs.path.mirror(pathContext, false, true);
      // var fixedPath;
      // MakerJs.path.moveTemporary([pathContext], [link.walkedPath.offset], function () {
      //   fixedPath = MakerJs.path.mirror(pathContext, false, true);
      // });
      MakerJs.path.moveRelative(fixedPath, offset);
      fn(fixedPath, offsetPoint(svgCoords(link.endPoints[link.reversed ? 0 : 1])), link.reversed, d, accuracy);
    }
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
function getPathDataByLayer(modelToExport, offset, options, accuracy) {
  var pathDataByLayer = {};
  MakerJs.model.findChains(modelToExport, function (chains, loose, layer) {
    function single(walkedPath, clockwise) {
      var pathData = pathToSVGPathData(walkedPath.pathContext, walkedPath.offset, offset, accuracy, clockwise);
      pathDataByLayer[layer].push(pathData);
    }
    pathDataByLayer[layer] = [];
    function doChains(cs, clockwise) {
      cs.forEach(function (chain) {
        if (chain.links.length > 1) {
          var pathData = chainToSVGPathData(chain, offset, accuracy);
          pathDataByLayer[layer].push(pathData);
        }
        else {
          single(chain.links[0].walkedPath, clockwise);
        }
        if (chain.contains) {
          doChains(chain.contains, !clockwise);
        }
      });
    }
    doChains(chains, true);
    loose.forEach(function (wp) { return single(wp); });
  }, options);
  return pathDataByLayer;
}

/**
 * @private
 */
function startSvgPathData(start, d, accuracy) {
  return ["M", MakerJs.round(start[0], accuracy), MakerJs.round(start[1], accuracy)].concat(d);
}

/**
 * @private
 */
var svgPathDataMap = {};
svgPathDataMap[MakerJs.pathType.Line] = function (line, accuracy) {
  return startSvgPathData(line.origin, MakerJs.point.rounded(line.end, accuracy), accuracy);
};

/**
 * Export a path to SVG path data.
 *
 * @param pathToExport IPath to export.
 * @param pathOffset IPoint relative offset of the path object.
 * @param exportOffset IPoint relative offset point of the export.
 * @param accuracy Optional accuracy of SVG path data.
 * @param clockwiseCircle Optional flag to use clockwise winding for circles.
 * @returns String of SVG path data.
 */
function pathToSVGPathData(pathToExport, pathOffset, exportOffset, accuracy, clockwiseCircle) {
  var fn = svgPathDataMap[pathToExport.type];
  if (fn) {
    var fixedPath = MakerJs.path.mirror(pathToExport, false, true); // warp removed dead code
    // var fixedPath;
    // MakerJs.path.moveTemporary([pathToExport], [pathOffset], function () {
    //   fixedPath = MakerJs.path.mirror(pathToExport, false, true);
    // });
    // MakerJs.path.moveRelative(fixedPath, exportOffset);
    var d = fn(fixedPath, accuracy, clockwiseCircle);
    return d.join(' ');
  }
  return '';
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
 * @private
 */
var mirrorMap = {};
mirrorMap[MakerJs.pathType.Line] = function (line, origin, mirrorX, mirrorY) {
  return new MakerJs.paths.Line(origin, MakerJs.point.mirror(line.end, mirrorX, mirrorY));
};

/**
 * @private
 */
function copyLayer(pathA, pathB) {
  if (pathA && pathB && typeof pathA.layer !== 'undefined') {
    pathB.layer = pathA.layer;
  }
}

/**
 * Create a clone of a path, mirrored on either or both x and y axes.
 *
 * @param pathToMirror The path to mirror.
 * @param mirrorX Boolean to mirror on the x axis.
 * @param mirrorY Boolean to mirror on the y axis.
 * @returns Mirrored path.
 */
function mirror(pathToMirror, mirrorX, mirrorY) {
  var newPath = null;
  if (pathToMirror) {
    var origin = MakerJs.point.mirror(pathToMirror.origin, mirrorX, mirrorY);
    var fn = mirrorMap[pathToMirror.type];
    if (fn) {
      newPath = fn(pathToMirror, origin, mirrorX, mirrorY);
    }
  }
  copyLayer(pathToMirror, newPath);
  return newPath;
}
path.mirror = mirror;

/**
 * @private
 */
var moveRelativeMap = {};
moveRelativeMap[MakerJs.pathType.Line] = function (line, delta, subtract) {
  line.end = MakerJs.point.add(line.end, delta, subtract);
};
/**
 * Move a path's origin by a relative amount.
 *
 * @param pathToMove The path to move.
 * @param delta The x & y adjustments as a point object.
 * @param subtract Optional boolean to subtract instead of add.
 * @returns The original path (for cascading).
 */
function moveRelative(pathToMove, delta, subtract) {
  if (pathToMove && delta) {
    pathToMove.origin = MakerJs.point.add(pathToMove.origin, delta, subtract);
    var fn = moveRelativeMap[pathToMove.type];
    if (fn) {
      fn(pathToMove, delta, subtract);
    }
  }
  return pathToMove;
}
path.moveRelative = moveRelative;


MakerJs.importer = importer;
MakerJs.point = point;
MakerJs.measure = measure;
MakerJs.paths = paths;
MakerJs.model = model;
MakerJs.exporter = exporter;
MakerJs.models = models;
MakerJs.path = path;

export { getPathDataByLayer };
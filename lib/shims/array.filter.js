/**
 * Array.filter() shim by Trevor Menagh (https://github.com/trevmex) with some modifications
 */

if (!Array.prototype.filter) {
  Array.prototype.filter = function (fun, thisp) {
    "use strict";

    if (typeof this === "undefined" || this === null) {
      throw new TypeError();
    }
    if (typeof fun !== "function") {
      throw new TypeError();
    }

    thisp = thisp || this;

    if (isNodeList(thisp)) {
      thisp = convertNodeListToArray(thisp);
    }

    var len = thisp.length,
      res = [],
      i,
      val;

    for (i = 0; i < len; i += 1) {
      if (thisp.hasOwnProperty(i)) {
        val = thisp[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, thisp)) {
          res.push(val);
        }
      }
    }

    return res;

    function isNodeList(object) {
      return /NodeList/i.test(object.item);
    }

    function convertNodeListToArray(nodeList) {
      var array = [];

      for (var i = 0, len = nodeList.length; i < len; i++){
        array[i] = nodeList[i]
      }

      return array;
    }
  };
}

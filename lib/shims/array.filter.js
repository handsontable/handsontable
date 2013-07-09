/**
 * Array.filter() shim by Trevor Menagh (https://github.com/trevmex)
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

    var t = this.slice(),
      len = t.length,
      res = [],
      i,
      val;

    for (i = 0; i < len; i += 1) {
      if (typeof t[i] === "undefined") {
        val = t[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, t)) {
          res.push(val);
        }
      }
    }

    return res;
  };
}

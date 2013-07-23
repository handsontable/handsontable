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

    var len = this.length,
      res = [],
      i,
      val;

    for (i = 0; i < len; i += 1) {
      if (this.hasOwnProperty(i)) {
        val = this[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, this)) {
          res.push(val);
        }
      }
    }

    return res;
  };
}

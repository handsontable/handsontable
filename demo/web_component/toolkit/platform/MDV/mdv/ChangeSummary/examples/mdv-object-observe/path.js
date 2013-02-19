// Copyright 2011 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var Path = (function() {

  /*

  Path = PathHead PathTail*

  PathHead = '#'? Ident
           | '[' Index ']'

  PathTail = '.' Ident
           | '[' Index ']'

  */

  // RegExp to validate a path. It is used with isPathValid and is not complete.
  // blarg
  var identPart = '[\$a-z0-9_]+[\$a-z0-9_\\d]*';
  var indexPart = '\\d+';
  var re = new RegExp('^' +
                      '(?:#?' + identPart + ')?' +
                      '(?:' +
                        '(?:\\.' + identPart + ')|' +
                      ')*' +
                      '$', 'i');

  var upSel = new RegExp('^(/|\./|\.\./)+$');

  function isPathValid(s) {
    var index = s.lastIndexOf('/');
    if (index >= 0) {
      var navS = s.substring(0, index + 1);
      s = s.substring(index + 1);
      if (!upSel.test(navS))
        return false;
    }

    if (s == '')
      return true;
    s = s.replace(/\s/g, '');
    if (s[0] == '.')
      return false;

    return re.test(s);
  }

  function filterEmpty(arr) {
    return arr.filter(function(s) {
      return s;
    });
  }

  function parse(s) {
    if (isIndex(s))
      return [[String(s)], false, 0];

    if (!isPathValid(s))
      return [];

    var isNamed = false;
    var isAbsolute = false;
    var ancestorLevels = 0;

    if (s.indexOf('#') == 0) {
      isNamed = true;
      s = s.substring(1);
    }

    var index = s.lastIndexOf('/');
    if (index >= 0) {
      var navS = s.substring(0, index + 1);
      if (navS[0] == '/')
        isAbsolute = true;

      ancestorLevels = navS.split('/').reduce(function(val, sel) {
        return val + (sel == '..' ? 1 : 0);
      }, 0);

      if (isAbsolute && ancestorLevels)
        return [];

      s = s.substring(index + 1);
    }

    return [filterEmpty(s.split(/\.|\[|\]/)),
            isNamed,
            isAbsolute,
            ancestorLevels];
  }

  /**
   * @param {*} s The value to test.
   * @return {boolean} Whether a value is a considered an indexed property name.
   *     Indexes are uint32.
   */
  var allDigits = new RegExp('^\\d+$');

  function isIndex(s) {
    // toUint32: s >>> 0
    return s == String(s >>> 0);
  }

  /**
   * Creates a new path object or returns an existing one.
   * @param {string|Path|undefined} s The value to create the path from.
   * @constructor
   */
  function Path(s) {
    if (s instanceof Path)
      return s;

    if (s == null) {
      this.parts_ = [];
    } else {
      s = String(s).replace(/\s/g, '');
      var parsed = parse(s);
      this.parts_ = parsed[0];
      this.isNamed_ = parsed[1];
      this.isAbsolute_ = parsed[2];
      this.ancestorLevels_ = parsed[3];
    }
  }

  /**
   * Joins a set of paths.
   * @param {string|Path|undefined...}
   * @return {!Path} A new path where all the parts have been joined.
   */
  Path.join = function(var_args) {
    var p = new Path;
    return p.concat.apply(p, arguments);
  };

  Path.prototype = {
    toString: function() {
      if (this.valid) {
        var s = '';
        if (this.isNamed) {
          s += '#';
        } else if (this.isAbsolute) {
          s += '/';
        } else if (this.ancestorLevels > 0) {
          for (var i = 0; i < this.ancestorLevels; i++) {
            s += '../';
          }
        }

        for (var i = 0; i < this.parts_.length; i++) {
          s += (i == 0 ? '' : '.') + this.parts_[i];
        }
        return s;
      }
      return '[object Invalid Path]';
    },

    get valid() {
      return !!this.parts_;
    },

    get: function(index) {
      return this.parts_[index];
    },

    slice: function(start, end) {
      var p = new Path;
      p.parts_ = this.parts_.slice.apply(this.parts_, arguments);
      return p;
    },

    startsWith: function(other) {
      if (!(other instanceof Path))
        other = new Path(other);

      for (var i = 0; i < other.length; i++) {
        if (other.get(i) != this.get(i))
          return false;
      }

      return true;
    },

    /**
     * The number of segments in the path.
     * @type {number}
     */
    get length() {
      return this.parts_ ? this.parts_.length : 0;
    },

    get isNamed() {
      return this.isNamed_;
    },

    get forwardPath() {
      var p = new Path('');
      p.parts_ = this.parts_.concat();
      return p;
    },

    get isAbsolute() {
      return this.isAbsolute_;
    },

    get ancestorLevels() {
      return this.ancestorLevels_;
    },

    /**
     * Visit all values from a value along a path, call a function(value, index)
     * at each present value. Note that this visits |path.length + 1| nodes
     * (because it visits the |val| and then each item in |path|. I.e. if
     * path == 'a.b', then it'll  visit |obj|, |obj.a| & |obj.a.b|
     * @param {*} val The value to which the path refers
     * @param {Function} f Function to be called for each present value along
     *                     path. If f returns true, the walking stops.
     * @param {Object=} that Optional |this| for the function call.
     */
    walk: function(val, f, that) {
      var path = this.parts_.concat();
      for (var i = 0; i < path.length + 1; i++) {
        if (f.call(that, val, i))
          break;
        if (val != null && i < path.length &&
            typeof val === 'object' && path[i] in val) {
          val = val[path[i]];
        } else {
          break;
        }
      }
    },

    concat: function(var_args) {
      var rv = new Path('');
      rv.parts_ = null;
      rv.isAbsolute_ = this.isAbsolute;
      rv.ancestorLevels_ = this.ancestorLevels;

      var parts = this.parts_.concat();
      for (var i = 0; i < arguments.length; i++) {
        var path = arguments[i];

        if (!(path instanceof Path))
          path = new Path(path);

        if (path.isNamed) {
          rv.isNamed_ = true;
          rv.isAbsolute_ = false;
          parts = [];
        } else if (path.isAbsolute) {
          rv.isAbsolute_ = true;
          rv.isNamed_ = false;
          parts = [];
        } else if (path.ancestorLevels > 0) {
          if (path.ancestorLevels > parts.length) {
            rv.ancestorLevels_ += path.ancestorLevels - parts.length;
            parts = [];
          } else {
            parts = parts.slice(0, parts.length - path.ancestorLevels);
          }
        }

        parts.push.apply(parts, path.parts_);
      }

      parts = filterEmpty(parts);

      // Search backwards for named path.
      for (var i = parts.length - 1; i >= 0; i--) {
        if (parts[i][0] == '#')
          break;
      }

      if (i > 0)
        parts = parts.slice(i);

      rv.parts_ = parts;
      return rv;
    }
  };

  return Path;
})();

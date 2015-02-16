
var _ = require('lodash');
var fs = require('fs');
var glob = require('glob');
var ModuleItem = require('./module-item');
var path = require('path');

module.exports = function moduleFinder(paths, options) {
  return new ModuleFinder(paths);
};

function ModuleFinder(paths) {
  this.paths = paths;
  this.items = [];
  this.find();
}

/**
 *
 */
ModuleFinder.prototype.find = function() {
  var _this = this,
    files;

  this.paths.forEach(function(path) {
    files = glob.sync('src/' + path + '/**/!(*.spec).js');
    _.forEach(files, function(file) {
      var item;

      // ignore abstract modules
      if (/_base\.js$/.test(file)) {
        return;
      }
      item = new ModuleItem(file);
      _this.items.push(item);
    });

    _this.items.forEach(function(item) {
      var deps;

      if (!item.dependencies.length) {
        return;
      }
      deps = item.dependencies;

      for (var i = 0, len = deps.length; i < len; i++) {
        deps[i] = _this.getModuleByName(deps[i]);
      }
    });
  });
};

/**
 * @returns {Array}
 */
ModuleFinder.prototype.getModules = function() {
  return this.items;
};

/**
 * @param {String} name
 * @returns {ModuleItem|null}
 */
ModuleFinder.prototype.getModuleByName = function(name) {
  var _module = null,
    len = this.items.length;

  while (len --) {
    if (name === this.items[len].name) {
      _module = this.items[len];
      break;
    }
  }

  return _module;
};

//require(path.resolve(file));
//
//findIndex = _.findIndex(excludes, function(value) {
//  return new RegExp(value.replace('.', '\\.') + '$').test(file);
//});
//if (findIndex !== -1) {
//  return;
//}
//
//function extractExcludes(type) {
//  var arg = argv['remove-' + type.substr(0, type.length - 1)],
//    modules = [];
//
//  if (arg) {
//    modules = arg.split(',').map(function(value) {
//      return value + '.js';
//    });
//  }
//
//  return modules;
//}

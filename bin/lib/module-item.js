
var fs = require('fs');
var path = require('path');

module.exports = ModuleItem;

/**
 * @param {String} filepath
 * @constructor
 */
function ModuleItem(filepath) {
  this.filepath = filepath;
  this.type = null;
  this.name = '';
  this.dependencies = [];
  this.classify();
}

ModuleItem.TYPE_PLUGIN = 'plugin';
ModuleItem.TYPES = [ModuleItem.TYPE_PLUGIN];

/**
 * Get file path
 *
 * @returns {String}
 */
ModuleItem.prototype.getFilePath = function() {
  return this.filepath;
};

/**
 *
 * @returns {Array}
 */
ModuleItem.prototype.getAllDependencies = function(moduleItem) {
  var deps = [];

  if (!moduleItem) {
    moduleItem = this;
  }
  if (!moduleItem.dependencies.length) {
    return deps;
  }
  for (var i = 0; i < moduleItem.dependencies.length; i++) {
    deps.push(moduleItem.dependencies[i]);
    deps = Array.prototype.concat(deps, this.getAllDependencies(moduleItem.dependencies[i]));
  }

  return deps;
};

/**
 * Check is module is a plugin
 *
 * @returns {Boolean}
 */
ModuleItem.prototype.isPlugin = function() {
  return this.type === ModuleItem.TYPE_PLUGIN;
};

/**
 * Classify module and read all necessary informations from source code
 */
ModuleItem.prototype.classify = function() {
  var src = fs.readFileSync(this.filepath).toString(),
    i = ModuleItem.TYPES.length,
    depsMatch, nameMatch;

  while (i) {
    i --;

    if (new RegExp('@' + ModuleItem.TYPES[i]).test(src)) {
      this.type = ModuleItem.TYPES[i];
      break;
    }
  }
  nameMatch = src.match(/@class ([a-zA-Z ]+)/);

  if (nameMatch && nameMatch.length === 2) {
    this.name = nameMatch[1];
  }
  depsMatch = src.match(/@dependencies ([a-zA-Z ]+)/);

  if (depsMatch && depsMatch.length >= 2) {
    this.dependencies = depsMatch[1].split(' ').filter(function(dep) {
      return dep !== '';
    });
  }
};

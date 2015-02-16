
'use strict';

var async = require('async');
var browserify = require('browserify');
var colors = require('colors');
var EventEmitter = require('events').EventEmitter;
var glob = require('glob');
var inherits = require('inherits');
var inquirer = require('inquirer');
var moduleFinder = require('./module-finder');
var path = require('path');
var Worker = require('./worker');

colors.setTheme({
  log: 'white',
  info: 'green',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

module.exports = Builder;

inherits(Builder, EventEmitter);

function Builder(argv, options) {
  var _this = this,
    file;

  if (!(this instanceof Builder)) {
    return new Builder(argv, options);
  }
  argv = argv || {};

  // setup default option values
  options = options || {};
  options.baseSrc = options.baseSrc|| 'src/';
  options.input = options.input || argv.input || 'src/browser.js';
  options.output = options.output || argv.output;
  options.buildMode = options.buildMode || (argv.all ? 'all' : 'core');
  options.disableUI = options.disableUI || argv['disable-ui'];
  options.external = options.external || this.parseArgumentAsArray(argv, 'modules-src', ['plugins']);
  options.include = options.include || this.parseArgumentAsAddRemoveModule(argv, 'add-plugin');
  options.exclude = options.exclude || this.parseArgumentAsAddRemoveModule(argv, 'remove-plugin');

  this.moduleFinder = moduleFinder(options.external);

  if (options.disableUI) {
    run();
  }
  else {
    this.showUIPrompt(function(selected) {
      options.buildMode = 'core';
      options.include = selected.modules;
      run();
    });
  }
  function run() {
    console.log('Creating custom build...\n'.underline.log);

    file = {
      src: options.input,
      dest: options.output
    };
    _this.runTask(options, file);
  }
}

/**
 * Create and show UI Prompt with all available modules to select
 *
 * @param callback
 */
Builder.prototype.showUIPrompt = function(callback) {
  var choices = [];

  choices.push(new inquirer.Separator('Plugins:'));

  this.moduleFinder.getModules().forEach(function(mod) {
    choices.push({
      name: mod.name
    });
  });

  choices.push(new inquirer.Separator());

  inquirer.prompt([{
      type: 'checkbox',
      message: 'Select modules that will be used to build your custom Handsontable distribution package',
      name: 'modules',
      choices: choices,
      paginated: false
    }
  ], callback);
};

/**
 * Run task
 *
 * @param {Object} options
 * @param {Object} file
 */
Builder.prototype.runTask = function(options, file) {
  var _this = this,
    runner;

  runner = new Worker({
    browserify: browserify,
    options: options
  });
  file.src = path.resolve(file.src);

  runner.on('error', function(err) {
    _this.emit('error', err);
  });
  runner.on('complete', function(file) {
    _this.emit('complete');
    console.log(('Created file ' + file.dest).green);
  });

  runner.run(file);
};

/**
 * Parse arguments like add-(plugin|editor|renderer) and remove-(plugin|editor|renderer)
 *
 * @param {Object} argv
 * @param {String} key
 * @returns {Array}
 */
Builder.prototype.parseArgumentAsAddRemoveModule = function(argv, key) {
  var arr = this.parseArgumentAsArray(argv, key);

  if (arr.length === 1 && /,/.test(arr[0])) {
    arr = arr[0].split(',');
  }
  arr = arr.map(function(moduleName) {
    return moduleName[0].toUpperCase() + moduleName.substr(1);
  });

  return arr;
};

/**
 * Parse argument as array
 *
 * @param {Object} argv
 * @param {String} key
 * @param {*} defaults
 * @returns {Array}
 */
Builder.prototype.parseArgumentAsArray = function(argv, key, defaults) {
  defaults = defaults || [];

  return Array.isArray(argv[key]) ? argv[key] : (argv[key] ? [argv[key]] : defaults);
};

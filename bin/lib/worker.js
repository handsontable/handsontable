
var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var glob = require('glob');
var inherits = require('inherits');
var moduleFinder = require('./module-finder');
var path = require('path');
var resolve = require('resolve');

var ES6_TRANSPILER = 'es6ify';

module.exports = Worker;

inherits(Worker, EventEmitter);

function Worker(options) {
  this.browserify = options.browserify;
  this.options = options.options || {};
  this.moduleFinder = moduleFinder(options.options.external);
  this.b = null;
}

Worker.prototype.run = function(file) {
  var _this = this;

  this.b = this.browserify({
    entries: file.src,
    basedir: this.options.baseSrc,
    debug: false
  });
  this.b.on('error', function(err) {
    _this.emit('error', err);
  });
  this.b.transform(ES6_TRANSPILER);

  this.buildFileTree();
  this.prepareDestDir(file.dest);
  this.bundle(function(err, buf) {
    if (err) {
      _this.emit('error', err);
    }
    else if (buf) {
      _this.write(file.dest, buf);
      _this.emit('complete', file);
    }
  });
};

Worker.prototype.buildFileTree = function() {
  var _this = this,
    modules = this.moduleFinder.getModules(),
    filteredModules;

  if (this.options.buildMode === 'all') {
    filteredModules = modules.filter(function(mod) {
      return _this.options.exclude.indexOf(mod.name) === -1;
    });
  }
  // build core-only
  else {
    filteredModules = modules.filter(function(mod) {
      return _this.options.include.indexOf(mod.name) !== -1;
    });
  }

  modules.forEach(function(mod) {
    function logTemplate(type) {
        return 'Found ' + type + ' (' + '%s'.yellow + '): ' + '%s'.cyan + ' %s';
    }

    if (filteredModules.indexOf(mod) === -1) {
      console.log(logTemplate('module'), mod.type, mod.name, '[excluded]'.red);

      return;
    }

    _this.b.add(path.resolve(mod.filepath));
    console.log(logTemplate('module'), mod.type, mod.name, '[included]'.green);

    if (mod.dependencies.length) {
      mod.getAllDependencies().forEach(function(dep, index, arr) {
        _this.b.add(path.resolve(dep.filepath));
        console.log((arr.length - 1 === index ? ' └──' : ' ├──') + ' Included dependency ' +
            '(' + '%s'.yellow + '): ' + '%s'.cyan, dep.type, dep.name);
      });
    }
  });
  if (this.options.external.length) {
    console.log('Founded ' + '%s'.green + ' modules\n', modules.length);
  }
};

Worker.prototype.bundle = function(callback) {
  this.b.bundle(function(err, buf) {
    // replace sourceURL injected by Traceur
    buf = buf.toString('utf8');
    buf = buf.replace(/sourceURL=.*/g, '');

    callback(err, buf);
  });
};

Worker.prototype.prepareDestDir = function(destination) {
  var destPath = path.dirname(path.resolve(destination));

  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath, parseInt('0777', 8) & (~process.umask()));
  }
};

Worker.prototype.write = function(filepath, contents) {
  try {
    fs.writeFileSync(filepath, contents);

  } catch(e) {
    this.emit('error', 'Unable to write "' + filepath + '" file (Error code: ' + e.code + ').');
    //throw console.log('Unable to write "' + filepath + '" file (Error code: ' + e.code + ').'.error, e);
  }
};

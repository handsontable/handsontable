
'use strict';

var async = require('async');
var path = require('path');
var HotBuilder = require('./../bin/lib/builder');

module.exports = function hotBuilder(grunt) {
  grunt.registerMultiTask('hotBuilder', 'Handsontable custom builder.', function() {
    var options;

    // setup default option values
    options = this.options({
      baseSrc: 'src/',
      disableUI: true,
      buildMode: 'all'
    });

    async.eachSeries(this.files, function(file, next) {
      var builder;
      //runTask(grunt, options, file, next);

      options.input = file.src[0];
      options.output = file.dest;

      //console.log(options);

      builder = new HotBuilder(null, options);
      builder.on('complete', function() {
        next();
      });
    }, this.async());
  });
};

//function runTask(grunt, options, file, next) {
//  var runner, files;
//
//  runner = new Worker({
//    browserify: browserify,
//    logger: grunt,
//    writer: grunt.file,
//    options: options
//  });
//
//  files = grunt.file.expand({filter: 'isFile'}, file.src).map(function(file) {
//    return path.resolve(file);
//  });
//
//  runner.run(files, file.dest, function() {
//    grunt.log.writeln('File ' + file.dest['cyan'] + ' created.');
//    next();
//  });
//}

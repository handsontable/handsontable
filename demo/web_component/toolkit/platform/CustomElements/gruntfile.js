/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
module.exports = function(grunt) {
  var os = require('os');
  var browsers = ['Chrome', 'Firefox'];
  if (os.type() === 'Darwin') {
    browsers.push('ChromeCanary');
  }
  if (os.type() === 'Windows_NT') {
    browsers.push('IE');
  }
  CustomElements = [
    'src/sidetable.js',
    'MutationObservers/MutationObserver.js',
    'src/CustomElements.js',
    'src/HTMLElementElement.js'
  ];
  grunt.initConfig({
    karma: {
      CustomElements: {
        configFile: 'conf/karma.conf.js',
        keepalive: true,
        browsers: browsers
      }
    },
    uglify: {
      CustomElements: {
        /*
        options: {
          sourceMap: 'custom-elements.min.source-map.js'
        },
        */
        files: {
          'custom-elements.min.js': CustomElements
        }
      }
    },
    yuidoc: {
      compile: {
        name: '<%= pkg.name %>',
        description: '<%= pkg.description %>',
        version: '<%= pkg.version %>',
        url: '<%= pkg.homepage %>',
        options: {
          exclude: 'third_party',
          paths: '.',
          outdir: 'docs',
          linkNatives: 'true',
          tabtospace: 2,
          themedir: '../docs/doc_themes/simple'
        }
      }
    },
    pkg: grunt.file.readJSON('package.json')
  });

  // plugins
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-yuidoc');
  grunt.loadNpmTasks('grunt-karma');

  // tasks
  grunt.registerTask('default', ['uglify']);
  grunt.registerTask('minify', ['uglify']);
  grunt.registerTask('docs', ['yuidoc']);
  grunt.registerTask('test', ['karma']);
};


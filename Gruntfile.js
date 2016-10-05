/**
 * This file is used to build Handsontable from `src/*`
 *
 * Installation:
 * 1. Install Grunt CLI (`npm install -g grunt-cli`)
 * 1. Install Grunt 0.4.0 and other dependencies (`npm install`)
 *
 * Build:
 * Execute `grunt` from root directory of this directory (where Gruntfile.js is)
 * To execute automatically after each change, execute `grunt --force default watch`
 * To execute build followed by the test run, execute `grunt test`
 *
 * Result:
 * building Handsontable will create files:
 *  - dist/handsontable.js
 *  - dist/handsontable.css
 *  - dist/handsontable.full.js
 *  - dist/handsontable.full.css
 *  - dist/handsontable.full.min.js
 *  - dist/handsontable.full.min.css
 *
 * See http://gruntjs.com/getting-started for more information about Grunt
 */
module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    meta: {
      src: [
        'src/*.js',
        'src/editors/*.js',
        'src/plugins/**/!(*.spec).js',
        'src/renderers/*.js',
        'src/validators/*.js',
        'src/shims/*.js',
        'src/3rdparty/*.js'
      ],
      walkontable: [
        'src/3rdparty/walkontable/src/**/*.js'
      ]
    },

    jshint: {
      options: {
        jshintrc: true
      },
      handsontable: '<%= meta.src %>',
      walkontable: '<%= meta.walkontable %>'
    },

    jscs: {
      handsontable: {
        files: {
          src: ['<%= meta.src %>', '!src/shims/classes.js']
        }
      },
      walkontable: {
        files: {
          src: ['<%= meta.walkontable %>', '!src/shims/classes.js']
        }
      },
      options: {
        config: '.jscsrc',
      }
    },

    hotBuilder: {
      handsontable: {
        files: {
          dist: 'package.json'
        }
      },
      handsontableDev: {
        files: {
          dist: 'package.json'
        },
        options: {
          devMode: true
        }
      },
      handsontableCustom: {
        files: {
          dist: 'package.json'
        },
        options: {
          disableUI: false
        }
      },
      options: {
        minify: true
      }
    }
  });

  // Default task.
  grunt.registerTask('default', ['jscs', 'jshint', 'hotBuilder:handsontable']);
  grunt.registerTask('build', ['default']);
  grunt.registerTask('build-dev', ['hotBuilder:handsontableDev']);
  grunt.registerTask('build-custom', ['hotBuilder:handsontableCustom']);

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('hot-builder');
};

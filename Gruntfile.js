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

    jasmine: {
      options: {
        page: {
          viewportSize: {
            width: 1200,
            height: 1000
          }
        },
        outfile: 'test/SpecRunner.html',
        display: 'short',
        summary: true,
        keepRunner: true,
      },
      handsontableStandalone: {
        src: [
          'dist/handsontable.js',
        ],
        options: {
          specs: [
            'test/spec/**/*.spec.js',
            'test/spec/!(mobile)*/*.spec.js',
            'src/plugins/*/test/*.spec.js',
            'test/spec/MemoryLeakTest.js',
          ],
          styles: [
            'test/lib/normalize.css',
            'dist/pikaday/pikaday.css',
            'dist/handsontable.css',
          ],
          vendor: [
            'test/lib/jquery.min.js',
            'test/lib/jquery.simulate.js',
            'dist/numbro/numbro.js',
            'dist/numbro/languages.js',
            'dist/moment/moment.js',
            'dist/pikaday/pikaday.js',
            'dist/zeroclipboard/ZeroClipboard.js',
            'demo/js/backbone/lodash.underscore.js',
            'demo/js/backbone/backbone.js',
          ],
          helpers: [
            'test/SpecHelper.js'
          ],
        }
      },
      handsontableFull: {
        src: [
          'dist/handsontable.full.min.js',
          'dist/numbro/languages.js',
        ],
        options: {
          specs: [
            'test/spec/**/*.spec.js',
            'test/spec/!(mobile)*/*.spec.js',
            'src/plugins/*/test/*.spec.js',
            'test/spec/MemoryLeakTest.js',
          ],
          styles: [
            'test/lib/normalize.css',
            'dist/pikaday/pikaday.css',
            'dist/handsontable.full.min.css',
          ],
          vendor: [
            'test/lib/jquery.min.js',
            'test/lib/jquery.simulate.js',
            'demo/js/backbone/lodash.underscore.js',
            'demo/js/backbone/backbone.js',
          ],
          helpers: [
            'test/SpecHelper.js'
          ],
        }
      },
      walkontable: {
        src: [
          'dist/handsontable.js'
        ],
        options: {
          specs: [
            'src/3rdparty/walkontable/test/spec/**/*.spec.js'
          ],
          styles: [
            'src/3rdparty/walkontable/css/walkontable.css'
          ],
          vendor: [
            'src/3rdparty/walkontable/test/lib/jquery.min.js',
            'src/3rdparty/walkontable/test/lib/jquery.simulate.js',
            'dist/numbro/numbro.js',
            'dist/numbro/languages.js',
            'dist/moment/moment.js',
            'dist/pikaday/pikaday.js',
            'dist/zeroclipboard/ZeroClipboard.js',
          ],
          helpers: [
            'src/3rdparty/walkontable/test/SpecHelper.js'

          ],
          outfile: 'src/3rdparty/walkontable/test/SpecRunner.html',
        }
      },
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
  grunt.registerTask('test', ['default', 'jasmine:walkontable', 'jasmine:handsontableStandalone', 'jasmine:handsontableFull']);
  grunt.registerTask('test-handsontable', ['jasmine:handsontableStandalone']);
  grunt.registerTask('test-handsontableFull', ['jasmine:handsontableFull']);
  grunt.registerTask('test-walkontable', ['jasmine:walkontable']);

  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('hot-builder');
};

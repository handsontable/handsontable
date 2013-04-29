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
 *  - jquery.handsontable.js
 *  - jquery.handsontable.css
 *  - dist/jquery.handsontable.full.js
 *  - dist/jquery.handsontable.full.css
 *
 * See http://gruntjs.com/getting-started for more information about Grunt
 */
module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      src: [
        'tmp/core.js',
        'src/focusCatcher.js',
        'src/tableView.js',
        'src/helpers.js',
        'src/fillHandle.js',
        'src/undoRedo.js',
        'src/selectionPoint.js',

        'src/renderers/textRenderer.js',
        'src/renderers/autocompleteRenderer.js',
        'src/renderers/checkboxRenderer.js',
        'src/renderers/numericRenderer.js',

        'src/editors/textEditor.js',
        'src/editors/autocompleteEditor.js',
        'src/editors/checkboxEditor.js',
        'src/editors/dateEditor.js',
        'src/editors/handsontableEditor.js',

        'src/cellTypes.js',

        'src/pluginHooks.js',
        'src/plugins/autoColumnSize.js',
        'src/plugins/columnSorting.js',
        'src/plugins/contextMenu.js',
        'src/plugins/legacy.js',
        'src/plugins/manualColumnMove.js',
        'src/plugins/manualColumnResize.js',

        'src/3rdparty/jquery.autoresize.js',
        'src/3rdparty/sheetclip.js',
        'src/3rdparty/copypaste.js'
      ],
      walkontable: [
        'src/3rdparty/walkontable/src/*.js',
        'src/3rdparty/walkontable/src/3rdparty/*.js'
      ],
      vendor: [
        'lib/bootstrap-typeahead.js',
        'lib/numeral.js',
        'lib/jQuery-contextMenu/jquery.contextMenu.js'
        // seems to have no effect when turned off on contextmenu.html
        //'lib/jQuery-contextMenu/jquery.ui.position.js' 
      ]
    },

    concat: {
      dist: {
        files: {
          'jquery.handsontable.js': [
            'tmp/intro.js',
            '<%= meta.src %>',
            '<%= meta.walkontable %>',
            'src/outro.js'
          ]
        }
      },
      full_js: {
        files: {
          'dist/jquery.handsontable.full.js': [
            'jquery.handsontable.js',
            '<%= meta.vendor %>'
          ]
        }
      },
      full_css: {
        files: {
          'dist/jquery.handsontable.full.css': [
            'jquery.handsontable.css',
            'lib/jQuery-contextMenu/jquery.contextMenu.css'
          ]
        }
      },
      wc: {
        files: {
          'dist_wc/css/x-handsontable.css': [
            'dist/jquery.handsontable.full.css'
          ],
          'dist_wc/css/jquery-ui/css/smoothness/jquery-ui.custom.css': [
            'lib/jquery-ui/css/smoothness/jquery-ui.custom.css'
          ]
        }
      }
    },

    watch: {
      files: [
        'src/**/*.js',
        'src/**/*.css',
        'lib/**/*.js',
        'lib/**/*.css'
      ],
      tasks: ['default']
    },

    clean: {
      dist: ['tmp']
    },

    replace: {
      dist: {
        options: {
          variables: {
            version: '<%= pkg.version %>',
            timestamp: '<%= (new Date()).toString() %>'
          }
        },
        files: {
          'tmp/intro.js': 'src/intro.js',
          'tmp/core.js': 'src/core.js',
          'jquery.handsontable.css': 'src/css/jquery.handsontable.css'
        }
      },
      wc: {
        options: {
          variables: {
            model: '<%= grunt.file.read("dist/jquery.handsontable.full.js") %>',
            controller: '<%= grunt.file.read("src/wc/x-handsontable-controller.js") %>'
          }
        },
        files: {
          'dist_wc/x-handsontable.html': 'src/wc/x-handsontable.html'
        }
      }
    },
    jasmine: {
      handsontable: {
        src: [
          'lib/jquery.min.js',
          'jquery.handsontable.js',
          'lib/bootstrap-typeahead.js',
          'lib/numeral.js',
          'lib/jQuery-contextMenu/jquery.contextMenu.js',
          'test/jasmine/spec/SpecHelper.js',
          'demo/js/backbone/lodash.underscore.js',
          'demo/js/backbone/backbone.js',
          'demo/js/backbone/backbone-relational/backbone-relational.js'
        ],
        options: {
          specs: [
            'test/jasmine/spec/*Spec.js',
            'test/jasmine/spec/*/*Spec.js'
          ],
          styles: [
            'test/jasmine/css/SpecRunner.css',
            'jquery.handsontable.css',
            'lib/jQuery-contextMenu/jquery.contextMenu.css'
          ]
        }
      },
      walkontable: {
        src: [
          'lib/jquery.min.js',
          'src/3rdparty/walkontable/src/*.js',
          'src/3rdparty/walkontable/src/3rdparty/*.js',
          'src/3rdparty/walkontable/test/jasmine/SpecHelper.js'
        ],
        options: {
          specs: [
            'src/3rdparty/walkontable/test/jasmine/spec/*.spec.js'
          ],
          styles: [
            'src/3rdparty/walkontable/css/walkontable.css'
          ]
        }
      }
    }
  });

  // Default task.
  grunt.registerTask('default', ['replace:dist', 'concat', 'replace:wc', 'clean']);
  grunt.registerTask('test', ['default', 'jasmine']);
  grunt.registerTask('test:handsontable', ['default', 'jasmine:handsontable']);
  grunt.registerTask('test:walkontable', ['default', 'jasmine:walkontable']);

  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
};
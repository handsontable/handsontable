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
 *  - dist/jquery.handsontable.js
 *  - dist/jquery.handsontable.css
 *  - dist/jquery.handsontable.full.js
 *  - dist/jquery.handsontable.full.css
 *
 * See http://gruntjs.com/getting-started for more information about Grunt
 */
var browsers = [
  /*{
   browserName: 'firefox',
   platform: 'Windows 7'
   },
   {
   browserName: 'chrome',
   platform: 'Windows 7'
   },*/
  {
    browserName: 'internet explorer',
    version: '8',
    platform: 'Windows 7'
  },
  {
    browserName: 'internet explorer',
    version: '9',
    platform: 'Windows 7'
  },
  {
    browserName: 'internet explorer',
    version: '10',
    platform: 'Windows 8'
  }
];

module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    gitinfo: {
    },
    meta: {
      src: [
        'tmp/core.js',
        'src/multiMap.js',
        'src/dom.js',
        'src/tableView.js',
        'src/editors.js',
        'src/editorManager.js',
        'src/renderers.js',
        'src/helpers.js',
        'src/dataMap.js',

        'src/renderers/cellDecorator.js',
        'src/renderers/textRenderer.js',
        'src/renderers/autocompleteRenderer.js',
        'src/renderers/checkboxRenderer.js',
        'src/renderers/numericRenderer.js',
        'src/renderers/passwordRenderer.js',
        'src/renderers/htmlRenderer.js',

        'src/editors/baseEditor.js',
        'src/editors/textEditor.js',
        'src/editors/checkboxEditor.js',
        'src/editors/dateEditor.js',
        'src/editors/handsontableEditor.js',
        'src/editors/autocompleteEditor.js',
        'src/editors/passwordEditor.js',
        'src/editors/selectEditor.js',
        'src/editors/dropdownEditor.js',

        'src/validators/numericValidator.js',
        'src/validators/autocompleteValidator.js',

        'src/cellTypes.js',

        'src/3rdparty/autoResize.js',
        'src/3rdparty/sheetclip.js',
        'src/3rdparty/copypaste.js',
        'src/3rdparty/json-patch-duplex.js',

        'src/pluginHooks.js',
        'src/plugins/autoColumnSize.js',
        'src/plugins/columnSorting.js',
        'src/plugins/contextMenu.js',
        'src/plugins/comments.js',
        'src/plugins/legacy.js',
        'src/plugins/manualColumnMove.js',
        'src/plugins/manualColumnResize.js',
        'src/plugins/manualRowResize.js',
        'src/plugins/observeChanges.js',
        'src/plugins/persistentState.js',
        'src/plugins/undoRedo.js',
        'src/plugins/dragToScroll/dragToScroll.js',
        'src/plugins/copyPaste.js',
        'src/plugins/search.js',
        'src/plugins/mergeCells/mergeCells.js',
        'src/plugins/customBorders/customBorders.js',
        'src/plugins/manualRowMove.js',
        'src/plugins/autofill.js',
        'src/plugins/grouping/grouping.js',
        'src/plugins/contextMenuCopyPaste/contextMenuCopyPaste.js'
      ],
      walkontable: [
        'src/3rdparty/walkontable/src/*.js',
        'src/3rdparty/walkontable/src/3rdparty/*.js'
      ],
      vendor: [
        'lib/numeral.js'
      ],
      shims: [
        'lib/shims/array.indexOf.js',
        'lib/shims/array.filter.js',
        'lib/shims/weakmap.js'
      ]
    },

    concat: {
      dist: {
        files: {
          'dist/jquery.handsontable.js': [
            'tmp/intro.js',
            '<%= meta.shims %>',
            '<%= meta.src %>',
            '<%= meta.walkontable %>',
            'src/outro.js'
          ]
        }
      },
      full_js: {
        files: {
          'dist/jquery.handsontable.full.js': [
            'dist/jquery.handsontable.js',
            '<%= meta.vendor %>'
          ]
        }
      },
      full_css: {
        files: {
          'dist/jquery.handsontable.full.css': [
            'dist/jquery.handsontable.css'
          ]
        }
      }
    },

    watch: {
      options: {
        livereload: true //works with Chrome LiveReload extension. See: https://github.com/gruntjs/grunt-contrib-watch
      },
      files: [
        'src/**/*.js',
        'src/**/*.css',
        'src/**/*.html',
        '!src/3rdparty/walkontable/test/**/*',
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
          'dist/jquery.handsontable.css': 'src/css/jquery.handsontable.css'
        }
      }
    },
    jasmine: {
      handsontable: {
        src: [
          'dist/jquery.handsontable.js',
          'demo/js/backbone/lodash.underscore.js',
          'demo/js/backbone/backbone.js',
          'demo/js/backbone/backbone-relational/backbone-relational.js',
          'lib/jquery-ui/js/jquery-ui.custom.js',
          'plugins/removeRow/jquery.handsontable.removeRow.js'
        ],
        options: {
          specs: [
            'test/jasmine/spec/*Spec.js',
            'test/jasmine/spec/*/*Spec.js',
            'src/plugins/*/test/*.spec.js',
            'plugins/*/test/*.spec.js'
          ],
          styles: [
            'test/jasmine/css/SpecRunner.css',
            'dist/jquery.handsontable.css',
            'plugins/removeRow/jquery.handsontable.removeRow.css',
            'lib/jquery-ui/css/ui-bootstrap/jquery-ui.custom.css'
          ],
          vendor: [
            'lib/jquery.min.js',
            'lib/numeral.js',
            'lib/numeral.de-de.js',
            'test/jasmine/lib/jasmine-extensions.js'
          ],
          helpers: [
            'test/jasmine/spec/SpecHelper.js',
            'test/jasmine/lib/nodeShim.js',
            'test/jasmine/spec/test-init.js'
          ],
          outfile: 'test/jasmine/SpecRunner.html',
          template: 'test/jasmine/templates/SpecRunner.tmpl',
          keepRunner: true
        }
      },
      walkontable: {
        src: [
          'src/dom.js',
          'src/3rdparty/walkontable/src/*.js',
          'src/3rdparty/walkontable/src/3rdparty/*.js'
        ],
        options: {
          specs: [
            'src/3rdparty/walkontable/test/jasmine/spec/*.spec.js'
          ],
          styles: [
            'src/3rdparty/walkontable/css/walkontable.css'
          ],
          vendor: [
            'lib/jquery.min.js'
          ],
          helpers: [
            'src/3rdparty/walkontable/test/jasmine/SpecHelper.js',
            'test/jasmine/lib/nodeShim.js',
            'src/3rdparty/walkontable/test/jasmine/test-init.js'

          ],
          outfile: 'src/3rdparty/walkontable/test/jasmine/SpecRunner.html',
          template: 'test/jasmine/templates/SpecRunner.tmpl',
          keepRunner: true
        }
      }
    },
    uglify: {
      options: {
        preserveComments: 'some'
      },
      "dist/jquery.handsontable.full.min.js": ["dist/jquery.handsontable.full.js" ]
    },
    cssmin: {
      minify: {
        expand: true,
        cwd: 'dist/',
        src: ['jquery.handsontable.full.css'],
        dest: 'dist/',
        extDot: 'last',
        ext: '.min.css'
      }
    },
    connect: {
      server: {
        options: {
          port: 8080,
          base: '.',
          keepalive: true
        }
      },
      sauce: {
        options: {
          port: 9999,
          base: '.',
          keepalive: false
        }
      }
    },
    'saucelabs-jasmine': {
      handsontable: {
        options: {
          urls: ['http://localhost:9999/test/jasmine/SpecRunner.html'],
//          build: process.env.TRAVIS_JOB_ID,
          build: '<%= pkg.version %>-<%= gitinfo.local.branch.current.name %>',
          concurrency: 3,
          browsers: browsers,
          testname: "Development test (Handsontable)"
        }
      },
      walkontable: {
        options: {
          urls: ['http://localhost:9999/src/3rdparty/walkontable/test/jasmine/SpecRunner.html'],
//          build: process.env.TRAVIS_JOB_ID,
          build: '<%= pkg.version %>-<%= gitinfo.local.branch.current.name %>',
          concurrency: 3,
          browsers: browsers,
          testname: "Development test (Walkontable)"
        }
      }
    }
  });

  // Default task.
  grunt.registerTask('default', ['gitinfo', 'replace:dist', 'concat', 'uglify', 'cssmin', 'clean']);
  grunt.registerTask('test', ['default', 'jasmine']);
  grunt.registerTask('test:handsontable', ['default', 'jasmine:handsontable']);
  grunt.registerTask('test:walkontable', ['default', 'jasmine:walkontable']);
  grunt.registerTask('sauce', ['default', 'connect:sauce', 'saucelabs-jasmine:walkontable', 'saucelabs-jasmine:handsontable']);
  grunt.registerTask('sauce:handsontable', ['default', 'connect:sauce', 'saucelabs-jasmine:handsontable']);
  grunt.registerTask('sauce:walkontable', ['default', 'connect:sauce', 'saucelabs-jasmine:walkontable']);


  grunt.registerTask('singletest', 'Runs all tests from a single Spec file.\nSyntax: grunt singletest:[handsontable, walkontable]:<file>', function (taskName, specFile) {
    var context = {
      taskName: taskName,
      specFile: specFile
    };

    var configProperty = grunt.template.process('jasmine.<%=taskName%>.options.specs', {data: context});
    var task = grunt.template.process('jasmine:<%=taskName%>', {data: context});
    var specPath;

    switch (taskName) {
      case 'handsontable':
        specPath =  grunt.template.process('test/jasmine/spec/<%=specFile%>', {data: context});
        break;
      case 'walkontable':
        specPath =  grunt.template.process('src/3rdparty/walkontable/test/jasmine/spec/<%=specFile%>', {data: context});
        break;
      default:
        grunt.fail.fatal('Unknown test task: "' + taskName + '". Available test tasks: [handsontable, walkontable]')
    }

    grunt.config.set(configProperty, [specPath]);

    grunt.task.run(task);
  });


  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-saucelabs');
  grunt.loadNpmTasks('grunt-gitinfo');
};

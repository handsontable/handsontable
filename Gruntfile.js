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
var browsers = [
  {
    browserName: 'firefox',
    platform: 'Windows 7'
  },
  {
    browserName: 'chrome',
    platform: 'Windows 7'
  },
  {
    browserName: 'opera',
    platform: 'Windows 7'
  },
  //{
  //  browserName: 'internet explorer',
  //  version: '8',
  //  platform: 'Windows 7'
  //},
  //{
  //  browserName: 'internet explorer',
  //  version: '9',
  //  platform: 'Windows 7'
  //},
  {
    browserName: 'internet explorer',
    version: '10',
    platform: 'Windows 8'
  }
];

module.exports = function(grunt) {

  require('time-grunt')(grunt);
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    gitinfo: {},

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
      ],
      vendor: [
        'lib/numeral/numeral.js'
      ]
    },

    watch: {
      options: {
        livereload: true // works with Chrome LiveReload extension. See: https://github.com/gruntjs/grunt-contrib-watch
      },
      files: [
        'src/**/*(*.js|*.css|*.html)',
        '!src/3rdparty/walkontable/test/**/*',
        'lib/**/*(*.js|*.css)'
      ],
      tasks: ['build-dev']
    },

    jasmine: {
      options: {
        page: {
          viewportSize: {
            width: 1200,
            height: 1000
          }
        },
      },
      handsontableStandalone: {
        src: [
          'dist/handsontable.js',
          'demo/js/numeral.de-de.js',
          'demo/js/backbone/lodash.underscore.js',
          'demo/js/backbone/backbone.js',
          'demo/js/backbone/backbone-relational/backbone-relational.js',
          'demo/js/jquery-ui/js/jquery-ui.custom.js',
          'plugins/removeRow/handsontable.removeRow.js'
        ],
        options: {
          specs: [
            'test/jasmine/spec/*Spec.js',
            'test/jasmine/spec/!(mobile)*/*Spec.js',
            'src/plugins/*/test/*.spec.js',
            'plugins/*/test/*.spec.js',
            'test/jasmine/spec/MemoryLeakTest.js'
          ],
          styles: [
            'test/jasmine/css/SpecRunner.css',
            'dist/handsontable.min.css',
            'plugins/removeRow/handsontable.removeRow.css',
            'demo/js/jquery-ui/css/ui-bootstrap/jquery-ui.custom.css',
            'demo/js/pikaday/css/pikaday.css'
          ],
          vendor: [
            'demo/js/jquery.min.js',
            'lib/numeral/numeral.js',
            'demo/js/moment/moment.js',
            'demo/js/pikaday/pikaday.js',
            'demo/js/ZeroClipboard.js',
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
      handsontableFull: {
        src: [
          'dist/handsontable.full.min.js',
          'demo/js/numeral.de-de.js',
          'demo/js/backbone/lodash.underscore.js',
          'demo/js/backbone/backbone.js',
          'demo/js/backbone/backbone-relational/backbone-relational.js',
          'demo/js/jquery-ui/js/jquery-ui.custom.js',
          'plugins/removeRow/handsontable.removeRow.js'
        ],
        options: {
          specs: [
            'test/jasmine/spec/*Spec.js',
            'test/jasmine/spec/!(mobile)*/*Spec.js',
            'src/plugins/*/test/*.spec.js',
            'plugins/*/test/*.spec.js',
            'test/jasmine/spec/MemoryLeakTest.js'
          ],
          styles: [
            'test/jasmine/css/SpecRunner.css',
            'dist/handsontable.min.css',
            'plugins/removeRow/handsontable.removeRow.css',
            'demo/js/jquery-ui/css/ui-bootstrap/jquery-ui.custom.css',
            'demo/js/pikaday/css/pikaday.css'
          ],
          vendor: [
            'demo/js/jquery.min.js',
            'demo/js/moment/moment.js',
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
          'dist/handsontable.min.js'
        ],
        options: {
          specs: [
            'src/3rdparty/walkontable/test/jasmine/spec/**/*.spec.js'
          ],
          styles: [
            'src/3rdparty/walkontable/css/walkontable.css'
          ],
          vendor: [
            'demo/js/jquery.min.js',
            'lib/numeral/numeral.js',
            'demo/js/moment/moment.js',
            'demo/js/pikaday/pikaday.js',
            'demo/js/ZeroClipboard.js',
            'demo/js/numeral.de-de.js'
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
      },
      mobile: {
        src: [
          'dist/handsontable.min.js',
          'demo/js/numeral.de-de.js',
          'demo/js/backbone/lodash.underscore.js',
          'demo/js/backbone/backbone.js',
          'demo/js/backbone/backbone-relational/backbone-relational.js',
          'demo/js/jquery-ui/js/jquery-ui.custom.js',
          'plugins/removeRow/handsontable.removeRow.js'
        ],
        options: {
          specs: [
            'test/jasmine/spec/mobile/*Spec.js',
            'src/plugins/*/test/mobile/*.spec.js'
          ],
          styles: [
            'test/jasmine/css/SpecRunner.css',
            'dist/handsontable.min.css',
            'plugins/removeRow/handsontable.removeRow.css',
            'demo/js/jquery-ui/css/ui-bootstrap/jquery-ui.custom.css',
            'demo/js/pikaday/css/pikaday.css'
          ],
          vendor: [
            'demo/js/jquery.min.js',
            'lib/numeral/numeral.js',
            'demo/js/ZeroClipboard.js',
            'demo/js/moment/moment.js',
            'demo/js/pikaday/pikaday.js',
            'test/jasmine/lib/jasmine-extensions.js'
          ],
          helpers: [
            'test/jasmine/spec/SpecHelper.js',
            'test/jasmine/spec/MobileSpecHelper.js',
            'test/jasmine/lib/nodeShim.js',
            'test/jasmine/spec/test-init.js'
          ],
          outfile: 'test/jasmine/MobileSpecRunner.html',
          template: 'test/jasmine/templates/SpecRunner.tmpl',
          keepRunner: true
        }
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
          build: '<%= pkg.version %>-<%= gitinfo.local.branch.current.name %>',
          concurrency: 3,
          browsers: browsers,
          testname: 'Development test (Handsontable)'
        }
      },
      walkontable: {
        options: {
          urls: ['http://localhost:9999/src/3rdparty/walkontable/test/jasmine/SpecRunner.html'],
          build: '<%= pkg.version %>-<%= gitinfo.local.branch.current.name %>',
          concurrency: 3,
          browsers: browsers,
          testname: 'Development test (Walkontable)'
        }
      }
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
        esnext: true,
        verbose: true
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
  grunt.registerTask('default', ['jscs', 'jshint', 'gitinfo', 'build']);
  grunt.registerTask('build', ['hotBuilder:handsontable']);
  grunt.registerTask('build-dev', ['hotBuilder:handsontableDev']);
  grunt.registerTask('build-custom', ['hotBuilder:handsontableCustom']);
  grunt.registerTask('test', ['default', 'jasmine:handsontableStandalone', 'jasmine:handsontableFull', 'jasmine:walkontable', 'jasmine:mobile:build']);
  grunt.registerTask('test:handsontable', ['default', 'jasmine:handsontableStandalone']);
  grunt.registerTask('test:handsontableStandalone', ['test:handsontable']);
  grunt.registerTask('test:handsontableFull', ['default', 'jasmine:handsontableFull']);
  grunt.registerTask('test:walkontable', ['default', 'jasmine:walkontable']);
  grunt.registerTask('test:mobile', ['default', 'jasmine:mobile:build']);
  grunt.registerTask('sauce', ['default', 'connect:sauce', 'saucelabs-jasmine:walkontable', 'saucelabs-jasmine:handsontable']);
  grunt.registerTask('sauce:handsontable', ['default', 'connect:sauce', 'saucelabs-jasmine:handsontable']);
  grunt.registerTask('sauce:walkontable', ['default', 'connect:sauce', 'saucelabs-jasmine:walkontable']);

  grunt.registerTask('test-handsontable-standalone', ['default', 'jasmine:handsontableStandalone']);
  grunt.registerTask('test-handsontable-full', ['default', 'jasmine:handsontableFull']);
  grunt.registerTask('test-handsontable', ['test-handsontable-standalone']);

  grunt.loadTasks('tasks');
  grunt.loadNpmTasks('hot-builder');
  grunt.loadNpmTasks('grunt-jscs');
};

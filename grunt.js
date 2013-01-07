/**
 * This file is used to build Handsontable from `src/*`
 *
 * Installation:
 * 1. Install Grunt (`npm install -g grunt`)
 * 2. Install NPM packages from `devDependencies` section in package.json (`npm install`)
 *
 * Build:
 * Execute `grunt` from root directory of this directory (where grunt.js is)
 * To execute automatically after each change, execute `grunt --force default watch`
 *
 * Result:
 * building Handsontable will create files:
 *  - jquery.handsontable.js
 *  - jquery.handsontable.css
 *  - dist/jquery.handsontable.full.js
 *  - dist/jquery.handsontable.full.css
 *
 * See https://github.com/cowboy/grunt for more information
 */
module.exports = function (grunt) {
  grunt.initConfig({
    pkg: '<json:package.json>',
    concat: {
      dist: {
        src: [
          'tmp/intro.js',

          'tmp/core.js',
          'src/tableView.js',
          'src/helpers.js',
          'src/fillHandle.js',
          'src/undoRedo.js',
          'src/selectionPoint.js',

          'src/renderers/textRenderer.js',
          'src/renderers/autocompleteRenderer.js',
          'src/renderers/checkboxRenderer.js',

          'src/editors/textEditor.js',
          'src/editors/autocompleteEditor.js',
          'src/editors/checkboxEditor.js',

          'src/cellTypes.js',

          'src/pluginHooks.js',
          'src/plugins/contextMenu.js',
          'src/plugins/legacy.js',
          'src/plugins/manualColumnResize.js',

          'src/3rdparty/jquery.autoresize.js',
          'src/3rdparty/sheetclip.js',
          'src/3rdparty/walkontable.js',

          'src/outro.js'
        ],
        dest: 'jquery.handsontable.js'
      },
      full_js: {
        src: [
          'jquery.handsontable.js',
          'lib/bootstrap-typeahead.js',
          'lib/jQuery-contextMenu/jquery.contextMenu.js'
          //'lib/jQuery-contextMenu/jquery.ui.position.js' //seems to have no effect when turned off on contextmenu.html
        ],
        dest: 'dist/jquery.handsontable.full.js'
      },
      full_css: {
        src: [
          'jquery.handsontable.css',
          'lib/jQuery-contextMenu/jquery.contextMenu.css'
        ],
        dest: 'dist/jquery.handsontable.full.css'
      }
    },
    watch: {
      files: ['src/*.js', 'src/editors/*.js', 'src/plugins/*.js', 'src/renderers/*.js', 'src/3rdparty/*.js', 'src/css/*.css', 'lib/*.js'],
      tasks: 'replace concat clean'
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
      }
    }
  });

  // Default task.
  grunt.registerTask('default', 'replace concat clean');

  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-contrib-clean');
};
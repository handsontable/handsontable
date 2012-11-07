/**
 * This file is used to build ``jquery.handsontable.js` from `src/*`
 *
 * Installation: Install Grunt (`npm install -g grunt`), them go to repo main directory and install local dependencies (`npm install`)
 * Build: Go to repo main directory and execute `grunt`. To execute automatically after each change, execute `grunt --force default watch`
 *
 * See https://github.com/cowboy/grunt for more information
 */
module.exports = function (grunt) {
  grunt.initConfig({
    pkg: '<json:package.json>',
    concat: {
      dist: {
        src: [
          'src/intro.js',

          'src/core.js',
          'src/tableView.js',
          'src/helpers.js',
          'src/border.js',
          'src/fillHandle.js',
          'src/undoRedo.js',
          'src/blockedRows.js',
          'src/blockedCols.js',
          'src/rowHeader.js',
          'src/colHeader.js',

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

          'src/3rdparty/jquery.autoresize.js',
          'src/3rdparty/jquery.mousewheel.js',
          'src/3rdparty/sheetclip.js',

          'src/outro.js'
        ],
        dest: 'jquery.handsontable.js'
      }
    },
    watch: {
      files: ['<config:concat.dist.src>'],
      tasks: 'concat'
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
          'jquery.handsontable.js': 'jquery.handsontable.js'
        }
      }
    }
  });

  // Default task.
  grunt.registerTask('default', 'concat replace');

  grunt.loadNpmTasks('grunt-replace');
};
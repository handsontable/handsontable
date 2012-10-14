/**
 * This file is used to build ``jquery.handsontable.js` from `src/*`
 *
 * Usage: Install Grunt, then go to repo main directory and execute `grunt`
 * To execute automatically after each change, execute `grunt --force default watch`
 *
 * See https://github.com/cowboy/grunt for more information
 */
module.exports = function (grunt) {
  grunt.initConfig({
    concat: {
      dist: {
        src: [
          'src/intro.js',

          'src/core.js',
          'src/helpers.js',
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

          'src/jquery.autoresize.js',
          'src/jquery.mousewheel.js',

          'src/outro.js'
        ],
        dest: 'jquery.handsontable.js'
      }
    },
    watch: {
      files: ['<config:concat.dist.src>'],
      tasks: 'concat'
    }
  });

  // Default task.
  grunt.registerTask('default', 'concat');
};
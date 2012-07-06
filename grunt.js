/**
 * This file is used to build ``jquery.handsontable.js` from `src/*`
 *
 * Usage: Install Grunt, then go to repo main directory and execute `grunt`
 *
 * See https://github.com/cowboy/grunt for more information
 */
module.exports = function (grunt) {
  grunt.initConfig({
    concat: {
      dist: {
        src: ['src/jquery.handsontable.js', 'src/jquery.handsontable.rowHeader.js', 'src/jquery.handsontable.colHeader.js'],
        dest: 'jquery.handsontable.js'
      }
    }
  });

  // Default task.
  grunt.registerTask('default', 'concat');
};
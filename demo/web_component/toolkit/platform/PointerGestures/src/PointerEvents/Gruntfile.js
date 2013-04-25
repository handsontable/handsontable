module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-karma');

  var os = require('os').type();
  var browsers = ['Chrome', 'Firefox'];
  if (os == 'Darwin') {
    browsers.push('Safari');
  }
  if (os == 'Windows_NT') {
    browsers.push('IE');
  }

  grunt.initConfig({
    uglify: {
      pointerevents: {
        options: {
          sourceMap: 'build/pointerevents.js.map',
          sourceMappingURL: 'pointerevents.js.map',
          sourceMapRoot: '..'
        },
        dest: 'build/pointerevents.js',
        src: [
          'src/touch-action.js',
          'src/PointerEvent.js',
          'src/pointermap.js',
          'src/sidetable.js',
          'src/dispatcher.js',
          'src/installer.js',
          'src/findTarget.js',
          'src/platform-events.js',
          'src/capture.js',
        ]
      }
    },
    karma: {
      test: {
        configFile: 'karma.conf.js',
        browsers: browsers
      }
    },
    clean: {
      build: 'build'
    }
  });

  grunt.registerTask('default', 'uglify');
  grunt.registerTask('test', 'karma');
};

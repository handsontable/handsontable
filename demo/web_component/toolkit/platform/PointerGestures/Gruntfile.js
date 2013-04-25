module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.initConfig({
    uglify: {
      pointergestures: {
        options: {
          sourceMap: 'build/pointergestures.js.map',
          sourceMappingURL: 'pointergestures.js.map',
          sourceMapRoot: '..'
        },
        dest: 'build/pointergestures.js',
        src: [
          // PointerEvents
          'src/PointerEvents/src/touch-action.js',
          'src/PointerEvents/src/PointerEvent.js',
          'src/PointerEvents/src/pointermap.js',
          'src/PointerEvents/src/sidetable.js',
          'src/PointerEvents/src/dispatcher.js',
          'src/PointerEvents/src/installer.js',
          'src/PointerEvents/src/findTarget.js',
          'src/PointerEvents/src/platform-events.js',
          'src/PointerEvents/src/capture.js',
          // PointerGestures
          'src/PointerGestureEvent.js',
          'src/initialize.js',
          'src/sidetable.js',
          'src/pointermap.js',
          'src/dispatcher.js',
          'src/hold.js',
          'src/track.js',
          'src/flick.js',
          'src/tap.js'
        ]
      }
    },
    clean: ['build', 'docs']
  });

  grunt.registerTask('default', 'uglify');
};

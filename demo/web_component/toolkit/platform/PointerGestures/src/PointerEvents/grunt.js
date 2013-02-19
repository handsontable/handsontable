module.exports = function(grunt) {
  grunt.initConfig({
    concat: {
      'build/pointerevents.css': 'src/*.css',
    },
    min: {
      pointerevents: {
        dest: 'build/pointerevents.js',
        src: [
          'third_party/mutation_summary/mutation_summary.js',
          'src/PointerEvent.js',
          'src/sidetable.js',
          'src/initialize.js',
          'src/pointermap.js',
          'src/dispatcher.js',
          'src/installer.js',
          'src/findTarget.js',
          'src/platform-events.js',
          'src/capture.js',
        ]
      }
    }
  });

  grunt.registerTask('default', 'concat min');
};

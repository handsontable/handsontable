
module.exports = function singletest(grunt) {
  'use strict';

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
        grunt.fail.fatal('Unknown test task: "' + taskName + '". Available test tasks: [handsontable, walkontable]');
    }

    grunt.config.set(configProperty, [specPath]);

    grunt.task.run(task);
  });
};

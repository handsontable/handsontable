/**
* This file is used to test only Handsontable End-to-End tests.
*/
var JasmineReporter = require('jasmine-terminal-reporter');

module.exports = function(grunt) {
 grunt.initConfig({});

 grunt.registerTask('test-handsontable', ['phantomjs-handsontable']);

 grunt.registerTask('phantomjs-handsontable', function() {
   spawnPhantomJS('test/E2ERunner.html', this.async());
 });

 function spawnPhantomJS(url, done) {
   var phantomjs = require('grunt-lib-phantomjs').init(grunt);
   var reporter = new JasmineReporter({
     colors: 1,
     cleanStack: 1,
     verbosity: 4,
     listStyle: 'flat',
     activity: true,
   });
   var errorCount = 0;

   // jasmine-reporter handlers.
   phantomjs.on('jasmine.jasmineStarted', function(msg) {
     reporter.jasmineStarted.apply(reporter, arguments);
   });
   phantomjs.on('jasmine.specStarted', function(msg) {
     reporter.specStarted && reporter.specStarted.apply(reporter, arguments);
   });
   phantomjs.on('jasmine.suiteStarted', function(msg) {
     reporter.suiteStarted.apply(reporter, arguments);
   });
   phantomjs.on('jasmine.jasmineDone', function(msg) {
     reporter.jasmineDone.apply(reporter, arguments);
     phantomjs.halt();
   });
   phantomjs.on('jasmine.suiteDone', function(msg) {
     reporter.suiteDone.apply(reporter, arguments);
   });
   phantomjs.on('jasmine.specDone', function(msg) {
     if (msg.failedExpectations.length) {
       errorCount += msg.failedExpectations.length;
     }
     reporter.specDone.apply(reporter, arguments);
   });

   // Built-in error handlers.
   phantomjs.on('fail.load', function(url) {
     grunt.warn('PhantomJS unable to load URL.', 90);
     phantomjs.halt();
   });
   phantomjs.on('fail.timeout', function() {
     grunt.warn('PhantomJS timed out.', 90);
     phantomjs.halt();
   });
   phantomjs.on('error.onError', function(string) {
     grunt.log.error('Error caught from PhantomJS.');
     grunt.warn(string);
     phantomjs.halt();
   });

   phantomjs.spawn(url, {
     options: {
       timeout: 10000,
       page: {
         viewportSize: {width: 1200, height: 1000},
       },
     },
     done: function(err) {
       done(err || errorCount === 0);
     }
   });
 }
};

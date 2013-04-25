// Testacular configuration
// Generated on Thu Feb 21 2013 15:42:45 GMT-0800 (PST)


// base path, that will be used to resolve files and exclude
basePath = '';


// list of files / patterns to load in the browser
files = [
  MOCHA,
  MOCHA_ADAPTER,
  'node_modules/chai/chai.js',
  'node_modules/chai-spies/chai-spies.js',
  'src/PointerEvent.js',
  'src/pointermap.js',
  'src/sidetable.js',
  'src/dispatcher.js',
  'src/installer.js',
  'src/findTarget.js',
  'src/platform-events.js',
  'src/capture.js',
  'tests/setup.js',
  'tests/!(setup).js'
];


// list of files to exclude
exclude = [
  
];


// test results reporter to use
// possible values: 'dots', 'progress', 'junit'
reporters = ['progress'];


// web server port
port = 8080;


// cli runner port
runnerPort = 9100;


// enable / disable colors in the output (reporters and logs)
colors = true;


// level of logging
// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
logLevel = LOG_INFO;


// enable / disable watching file and executing tests whenever any file changes
autoWatch = false;


// Start these browsers, currently available:
// - Chrome
// - ChromeCanary
// - Firefox
// - Opera
// - Safari (only Mac)
// - PhantomJS
// - IE (only Windows)
browsers = ['Chrome', 'ChromeCanary', 'Firefox', 'Safari', 'Opera'];


// If browser does not capture in given timeout [ms], kill it
captureTimeout = 60000;


// Continuous Integration mode
// if true, it capture browsers, run tests and exit
singleRun = true;

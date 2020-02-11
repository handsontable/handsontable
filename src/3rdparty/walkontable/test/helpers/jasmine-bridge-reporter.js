(function() {
  if (typeof jasmineStarted === 'undefined') {
    return;
  }

  /**
   * @class
   */
  function JasmineBridgeReporter() {
    this.started = false;
    this.finished = false;
    this.suites_ = [];
    this.results_ = {};
    this.buffer = '';
  }

  JasmineBridgeReporter.prototype.jasmineStarted = function(metadata) {
    this.started = true;
    jasmineStarted(metadata);
  };

  JasmineBridgeReporter.prototype.specStarted = function(specMetadata) {
    specMetadata.startTime = Date.now();
    jasmineSpecStarted(specMetadata);
  };

  JasmineBridgeReporter.prototype.suiteStarted = function(suiteMetadata) {
    suiteMetadata.startTime = Date.now();
    jasmineSuiteStarted(suiteMetadata);
  };

  JasmineBridgeReporter.prototype.jasmineDone = function() {
    this.finished = true;
    jasmineDone();
  };

  JasmineBridgeReporter.prototype.suiteDone = function(suiteMetadata) {
    suiteMetadata.duration = Date.now() - suiteMetadata.startTime;
    jasmineSuiteDone(suiteMetadata);
  };

  JasmineBridgeReporter.prototype.specDone = function(specMetadata) {
    specMetadata.duration = Date.now() - specMetadata.startTime;
    this.results_[specMetadata.id] = specMetadata;

    jasmineSpecDone(specMetadata);
  };

  jasmine.getEnv().addReporter(new JasmineBridgeReporter());
}());

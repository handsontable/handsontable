(function() {
  if (typeof jasmineStarted === 'undefined') {
    return;
  }

  /**
   * Returns the value when Puppeteer can carry it across the page boundary, or a short description
   * of it otherwise. The bridge functions serialize their arguments as JSON, and a failed
   * expectation carries its `expected` and `actual` values verbatim – a `window`, an overlay, or
   * any other cyclic object there made the call throw inside the reporter, which dropped the spec
   * from the run silently (the run stayed green with one spec fewer).
   *
   * @param {*} value The value to check.
   * @returns {*}
   */
  function toSerializable(value) {
    try {
      JSON.stringify(value);

      return value;
    } catch (error) {
      const constructorName = value && value.constructor && value.constructor.name;

      return `[unserializable ${constructorName || Object.prototype.toString.call(value)}]`;
    }
  }

  /**
   * @param {object} expectation The expectation result.
   * @returns {object}
   */
  function toSerializableExpectation(expectation) {
    return {
      ...expectation,
      expected: toSerializable(expectation.expected),
      actual: toSerializable(expectation.actual),
    };
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
    specMetadata.failedExpectations = (specMetadata.failedExpectations || []).map(toSerializableExpectation);
    this.results_[specMetadata.id] = specMetadata;

    jasmineSpecDone(specMetadata);
  };

  jasmine.getEnv().addReporter(new JasmineBridgeReporter());
}());

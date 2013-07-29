function applyHtmlReporterHacks(htmlReporter) {
  var appendSummaryToSuiteDiv = jasmine.HtmlReporter.SpecView.prototype.appendSummaryToSuiteDiv;
  jasmine.HtmlReporter.SpecView.prototype.appendSummaryToSuiteDiv = function () {
    appendSummaryToSuiteDiv.call(this);

    var time = (this.spec.finishedAt.getTime() - this.spec.startedAt.getTime() ) / 1000;
    this.spec.durationSec = time;
    this.summary.innerHTML += ' (' + time.toFixed(2) + ' s)';

    var suite = this.spec.suite;
    while (suite.parentSuite) {
      suite = suite.parentSuite;
    }

    if (!suite.longestDuration) {
      suite.longestDuration = this.spec;
    }
    else if (this.spec.durationSec > suite.longestDuration.durationSec) {
      suite.longestDuration = this.spec;
    }
  };

  var refresh = jasmine.HtmlReporter.SuiteView.prototype.refresh;
  jasmine.HtmlReporter.SuiteView.prototype.refresh = function () {
    refresh.call(this);
    if (this.suite.longestDuration) {
      this.element.firstChild.innerHTML += " (longest " + this.suite.longestDuration.durationSec.toFixed(2) + ' s)';
    }
  };

  var reportSpecStarting = htmlReporter.reportSpecStarting;
  htmlReporter.reportSpecStarting = function (spec) {
    reportSpecStarting(spec);
    spec.startedAt = new Date();
  };

  var reportSpecResults = htmlReporter.reportSpecResults;
  htmlReporter.reportSpecResults = function (spec) {
    spec.finishedAt = new Date();
    reportSpecResults(spec)
  };
}
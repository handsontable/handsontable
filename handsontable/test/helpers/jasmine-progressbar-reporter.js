/**
 * This reporter adds a progress bar to the top of the spec runner html page.
 */

class JasmineProgressBarReporter {
  constructor() {
    /**
     * Finished specs count.
     *
     * @type {number}
     */
    this.finished = 0;
    /**
     * Failed specs count.
     *
     * @type {number}
     */
    this.failed = 0;
    /**
     * Total specs count.
     *
     * @type {number}
     */
    this.total = 0;
    /**
     * DOM elements needed to render the progress bar.
     *
     * @type {object}
     */
    this.$elements = null;
    /**
     * Color scheme for the progress bar and console reporting.
     *
     * @type {object}
     */
    this.colorScheme = {
      consoleErr: '#ab1d00',
      failedCountBorder: '#f4f4f4',
      failedCountBackground: '#fff',
      bar: '#007069',
      failed: '#ca3a11',
      pending: '#ba9d37',
    };
  }

  /**
   * Initialize the reporter.
   */
  init() {
    this.$elements = {
      container: $('<div class="jasmine_progress-bar"></div>').css({
        direction: 'ltr',
        position: 'fixed',
        zIndex: 10000,
        top: 0,
        left: 0,
        right: 0,
        height: '5px'
      }),
      progressBar: $('<div id="progress-bar"></div>').css({
        position: 'absolute',
        left: 0,
        height: '100%',
        backgroundColor: this.colorScheme.bar,
        width: 0
      })
    };

    this.addProgressBar();
  }

  /**
   * Hook triggered after Jasmine has been started.
   *
   * @param {object} meta Accessible metadata.
   */
  jasmineStarted(meta) {
    this.total = meta.totalSpecsDefined;

    this.init();
  }

  /**
   * Hook triggered after completing a spec run.
   *
   * @param {object} specInfo Object containing information about the currently running spec.
   */
  specDone(specInfo) {
    this.finished += 1;

    if (specInfo.status === 'excluded' && this.finished !== this.total - 1) {
      return;
    }

    this.resizeProgressBar();

    if (['failed', 'pending'].includes(specInfo.status)) {
      this.addExpectationBlock(specInfo.fullName, specInfo.status);

      if (specInfo.status === 'failed') {
        this.failed += 1;

        this.logFailedSpec(specInfo.failedExpectations, specInfo.fullName);

        if (this.failed === 1) {
          this.addFailedCountBlock();

        } else {
          this.updateFailedCountBlock();
        }
      }
    }
  }

  /**
   * Hook triggered after all specs are finished.
   */
  jasmineDone() {
    this.$elements.failedCount.remove();
  }

  /**
   * Resize the progress bar according to the finished specs count.
   */
  resizeProgressBar() {
    this.$elements.progressBar.css({
      width: `${(this.finished / this.total) * 100}%`
    });
  }

  /**
   * Log the failed spec information in the browser console.
   *
   * @param {Array} failedExpectations List of failed expectations.
   * @param {string} fullSpecName Full spec name.
   */
  logFailedSpec(failedExpectations, fullSpecName) {
    /* eslint-disable no-console */
    failedExpectations.forEach((failedExpectation) => {
      console.log(
        '%cFailed expectations in:',
        `color: ${this.colorScheme.consoleErr}; font-weight: bold`,
        `
${document.URL}?spec=${encodeURI(fullSpecName)}

\t${failedExpectation.message.replace(/\n/g, '\n\t')}
`);
    });
    /* eslint-enable no-console */
  }

  /**
   * Updates the failed count block.
   */
  updateFailedCountBlock() {
    this.$elements.failedCount.find('span').text(this.failed);
  }

  /**
   * Generate the block containing information on the number of failed specs.
   *
   * @returns {jQuery}
   */
  generateFailedCountBlock() {
    return $('<div>Failed: <span></span></div>').css({
      position: 'absolute',
      top: '5px',
      right: 0,
      fontSize: '0.8em',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Helvetica Neue",' +
        ' Arial, sans-serif',
      background: this.colorScheme.failedCountBackground,
      padding: '3px',
      border: `1px solid ${this.colorScheme.failedCountBorder}`,
      fontWeight: 'bold',
      color: this.colorScheme.consoleErr,
    });
  }

  /**
   * Generate a block to mark a failed/pending spec on the progress bar.
   *
   * @param {string} fullSpecName Full spec name.
   * @param {number} width Desired width of the block.
   * @param {number} positionLeft Desired position of the block.
   * @param {string} backgroundColor Background color of the block.
   * @returns {jQuery} The jQuery wrapper of the created element.
   */
  generateExpectationBlock(fullSpecName, width, positionLeft, backgroundColor) {
    const $block = $('<div></div>').css({
      display: 'block',
      position: 'absolute',
      left: positionLeft,
      width,
      height: '100%',
      backgroundColor
    });
    const $link = $(`<a title="${fullSpecName.replace(/"/g, '&#34;')}" href="?spec=${encodeURI(fullSpecName)}"></a>`);

    $link.append($block);

    return $link;
  }

  /**
   * Add a failed spec count block.
   */
  addFailedCountBlock() {
    this.$elements.failedCount = this.generateFailedCountBlock();

    this.$elements.container.append(this.$elements.failedCount);

    this.updateFailedCountBlock();
  }

  /**
   * Add a block to mark a failed/pending spec on the progress bar in the DOM.
   *
   * @param {string} fullName Full spec name.
   * @param {'passed'|'failed'|'pending'|'excluded'} status Status of the spec.
   */
  addExpectationBlock(fullName, status) {
    this.$elements.container.append(
      this.generateExpectationBlock(
        fullName,
        `${100 / this.total}%`,
        `${((this.finished - 1) / this.total) * 100}%`,
        this.colorScheme[status]
      ));
  }

  /**
   * Adds the progress bar elements to the DOM.
   */
  addProgressBar() {
    this.$elements.container.append(this.$elements.progressBar);

    $('body').append(this.$elements.container);
  }
}

if (typeof jasmineStarted === 'undefined') {
  jasmine.getEnv().addReporter(new JasmineProgressBarReporter());
}

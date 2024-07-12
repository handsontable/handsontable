/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * Array of functions to be deployed on the documentation web pages. The return statements of those methods will be
 * returned to the checker logic.
 *
 * The return object should be structured as below:
 * ```
 * {
 *   result, // Information on whether the test was successful (boolean)
 *   expected: // Expected result of the test
 *   received: // Actual result of the test
 *   error: // In case of an error, the error message.
 * };
 * ```
 *
 * *Important:* As the callback is being run in Puppeteer (in the context of a web page), all the helpers need to be
 * available inside the scope of the function.
 *
 * @type {Function[]}
 */
/* eslint-enable jsdoc/require-description-complete-sentence */
const testCases = [
  (permalink) => {
    const INSTANCE_NUMBER_EXCEPTIONS = {};
    const setExceptionForPermalink = (url, { expectedCount = 0, notYetRenderedCount = 0 }) => {
      INSTANCE_NUMBER_EXCEPTIONS[url] = {
        expectedCount,
        notYetRenderedCount
      };
    };
    const setExceptionsForPermalinks = (exceptionList) => {
      exceptionList.forEach((exception) => {
        setExceptionForPermalink(...exception);
      });
    };

    setExceptionsForPermalinks([
      // The column-summary example on the page of the framework shows an error being thrown - the Handsontable instance is never rendered.
      ['/react-data-grid/column-summary', { expectedCount: -1 }],
      // The formula calculation page contains an example with two Handsontable instances, hence the compensation here.
      ['/javascript-data-grid/formula-calculation', { expectedCount: 1 }],
      ['/react-data-grid/formula-calculation', { expectedCount: 1 }],
    ]);

    // ----------------------------------------
    // Actual logic starts here:
    // ----------------------------------------

    const codeTabs = document.querySelectorAll('[id^=code-tab]');
    const htMasterElements = document.querySelectorAll('.handsontable.ht_master');

    const emptyExampleContainers = [];
    let elementsNotYetRenderedCount = 0;
    let hotInstancesCount = document.querySelectorAll('[data-preset-type]').length;

    codeTabs.forEach((codeTab) => {
      const exampleId = codeTab.id.replace('code-tab-', '');
      const codePreviewElement = document.querySelector(`#${exampleId}`);

      if (codePreviewElement?.parentNode?.querySelector('.handsontable') === null) {
        elementsNotYetRenderedCount += 1;
      }
    });

    elementsNotYetRenderedCount += INSTANCE_NUMBER_EXCEPTIONS[permalink]?.notYetRenderedCount || 0;
    hotInstancesCount += INSTANCE_NUMBER_EXCEPTIONS[permalink]?.expectedCount || 0;

    return {
      result: (hotInstancesCount === htMasterElements.length) && emptyExampleContainers.length === 0,
      emptyExampleContainers,
      expected: hotInstancesCount,
      received: htMasterElements.length,
      elementsNotYetRendered: !!elementsNotYetRenderedCount,
      error: (!document.body.innerHTML ? 'Page not accessible.' : null),
    };
  }
];

module.exports = {
  testCases
};

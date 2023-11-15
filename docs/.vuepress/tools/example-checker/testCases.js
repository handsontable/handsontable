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
      // The column-summary example on the page of each of the frameworks shows an error being thrown - the Handsontable
      // instance is never rendered.
      ['/react-data-grid/column-summary', { notYetRenderedCount: -1 }],
      ['/javascript-data-grid/column-summary', { notYetRenderedCount: -1 }],
      // The events-and-hooks page contains a rendered Handsontable instance which is not a part of any tabbed example.
      ['/javascript-data-grid/events-and-hooks', { expectedCount: 1 }],
      ['/react-data-grid/events-and-hooks', { expectedCount: 1 }],
      // The demo page contains a rendered Handsontable instance which is not a part of any tabbed example.
      ['/javascript-data-grid/demo', { expectedCount: 1 }],
      ['/react-data-grid/demo', { expectedCount: 1 }],
      // The a11y demo hot reloads handsontable, this makes the test detect an extra instance, we need to do -1 to
      // make it pass
      ['/javascript-data-grid/accessibility', { expectedCount: -1 }],
    ]);

    /**
     * Fetch the framework defined as a preset type in the container configuration.
     *
     * @param {HTMLElement} parentNode Parent node of the example container.
     * @returns {string}
     */
    function fetchContainerFramework(parentNode) {
      const presetHoldingElement = parentNode
        .querySelector('[data-preset-type]');

      if (!presetHoldingElement) {
        return false;
      }

      let containerFramework = presetHoldingElement
        .getAttribute('data-preset-type')
        // Replace any digits with an empty string (vue3 -> vue)
        .replace(/\d/g, '')
        .split('-')[0];

      if (containerFramework === 'hot') {
        containerFramework = 'javascript';
      }

      return containerFramework;
    }

    /**
     * Fetch the content of the tab containing the example configuration (differs between frameworks).
     *
     * @param {HTMLElement} parentElement Parent node of the example container.
     * @param {string} containerFramework Framework defined in the container config.
     * @returns {string}
     */
    function fetchTabContent(parentElement, containerFramework) {
      // Examples have duplicated #code elements, when fixed, this will have to be changed as well.
      const codeTab = parentElement.querySelector('[id^=code-tab]');
      const htmlTab = parentElement.querySelector('[id^=html-tab]');
      const definitionTab = {
        javascript: codeTab,
        react: codeTab,
        angular: codeTab,
        vue: htmlTab
      };

      return definitionTab[containerFramework].innerHTML
        // Strip HTML tags
        .replace(/(<([^>]+)>)/gi, '')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>');
    }

    // ----------------------------------------
    // Actual logic starts here:
    // ----------------------------------------

    const codeTabs = document.querySelectorAll('[id^=code-tab]');
    const htMasterElements = document.querySelectorAll('.handsontable.ht_master');
    const hotInitPrefixes = {
      javascript: ' Handsontable\\(',
      react: '<HotTable',
      vue: '<hot-table',
      angular: '<hot-table'
    };
    const emptyExampleContainers = [];
    let elementsNotYetRenderedCount = 0;
    let hotInstancesCount = 0;

    codeTabs.forEach((codeTab) => {
      const exampleId = codeTab.id.split('-').at(-1);
      const codeTabParentElement = codeTab.parentElement;
      const containerFramework = fetchContainerFramework(codeTabParentElement);

      if (containerFramework === false) {
        elementsNotYetRenderedCount += 1;

        return;
      }

      const tabContent = fetchTabContent(codeTabParentElement, containerFramework);
      const prefixRegex = new RegExp(hotInitPrefixes[containerFramework], 'g');
      const foundInits = tabContent.match(prefixRegex)?.length;

      if (foundInits) {
        hotInstancesCount += foundInits;

      } else {
        emptyExampleContainers.push(exampleId);
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

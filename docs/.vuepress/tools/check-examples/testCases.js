/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * Array of functions to be deployed on the documentation web pages. The return statements of those methods will be
 * returned back to the checker logic.
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
  () => {
    /**
     * Fetch the framework defined as a preset type in the container configuration.
     *
     * @param {HTMLElement} parentNode Parent node of the example container.
     * @returns {string}
     */
    function fetchContainerFramework(parentNode) {
      let containerFramework = parentNode
        .querySelector('[data-preset-type]')
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
     * @param {HTMLElement} parentNode Parent node of the example container.
     * @param {string} containerFramework Framework defined in the container config.
     * @returns {string}
     */
    function fetchTabContent(parentNode, containerFramework) {
      // Examples have duplicated #code elements, when fixed, this will have to be changed as well.
      const codeTab = parentNode.querySelector('#code');
      const htmlTab = parentNode.querySelector('#html');
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

    const previewTabs = document.querySelectorAll('[id^=preview-tab]');
    const htMasterElements = document.querySelectorAll('.handsontable.ht_master');
    const hotInitPrefixes = {
      javascript: ' Handsontable\\(',
      react: '<HotTable',
      vue: '<hot-table',
      angular: '<hot-table'
    };
    let hotInstancesCount = 0;

    previewTabs.forEach((previewTab) => {
      const previewParentNode = previewTab.parentNode;
      const containerFramework = fetchContainerFramework(previewParentNode);
      const tabContent = fetchTabContent(previewParentNode, containerFramework);
      const prefixRegex = new RegExp(hotInitPrefixes[containerFramework], 'g');

      hotInstancesCount += tabContent.match(prefixRegex)?.length || 0;
    });

    return {
      result: hotInstancesCount === htMasterElements.length,
      expected: hotInstancesCount,
      received: htMasterElements.length,
      error: !document.body.innerHTML ? 'Page not accessible.' : null,
    };
  }
];

module.exports = {
  testCases
};

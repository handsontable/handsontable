/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * The function allows to run the test suites based on different parameters (object configuration, datasets etc).
 *
 * For example:
 * ```
 * describe('TextEditor', () => {
 *   using('input value', [1, '1', true], (value) => {
 *     it('should correctly display the value in the textarea element', {
 *        // expect()
 *     });
 *   })
 * })
 * // The jasmine will generate following test cases:
 * //   * "TextEditor using input value: `1` should correctly display the value in the textarea element";
 * //   * "TextEditor using input value: `'1'` should correctly display the value in the textarea element"
 * //   * "TextEditor using input value: `true` should correctly display the value in the textarea element"
 * ```
 *
 * @param {string} name The parameter name to be used within the tests.
 * @param {Array<*>} parameters An array of parameters.
 * @param {Function} func Function to execute where the test suite
 */
export function using(name, parameters, func) {
  parameters.forEach((param) => {
    describe(`using ${name}: \`${JSON.stringify(param)}\``, function() {
      func.call(this, param);
    });
  });
}

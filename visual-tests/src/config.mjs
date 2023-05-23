/**
 * The branch that holds the golden screenshots.
 */
export const BASE_BRANCH = 'develop';
/**
 * The list of wrappers that are to be tested.
 */
// TODO: IMPORTANT! Add `angular` back to this array this after fixing the issue described in
//  https://github.com/handsontable/dev-handsontable/issues/1292
export const WRAPPERS = ['react', 'vue'];

/**
 * The framework that provides reference screenshots to compare against other frameworks.
 */
export const REFERENCE_FRAMEWORK = 'js';
/**
 * The port for the static server that serves the examples.
 */
export const EXAMPLES_SERVER_PORT = '8080';

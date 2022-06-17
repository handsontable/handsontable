/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * Container used to display/hide blocks of content relevant to specific frameworks.
 * It relies on providing the framework name(s) as arguments to the container (see 'Usage' below) and setting a
 * `DOCS_FRAMEWORK` environmental variable as the framework name, for example:
 *
 * ```
 * DOCS_FRAMEWORK=react
 * ```
 *
 * Usage:
 * ```
 * ::: only-for react
 * Content to be displayed only for React documentation.
 * :::
 *
 * ::: only-for javascript react vue
 * Content to be displayed only for JS, React and Vue documentation.
 * :::
 * ```
 *
 * **NOTE:** When using this container to conditionally display another container (like `::: example`), use a
 * separate `only-for` for EACH of the containers.
 */
module.exports = {
  type: 'only-for',
};

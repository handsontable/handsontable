/**
 * Stands in for the generated `src/styles/handsontableStyles` module in Jest.
 *
 * `build:styles` writes the whole core stylesheet (about 160KB, over 700 rules) into that module,
 * and `StylesHandler` injects it into the document for every grid (`injectCoreCss` is `true` by
 * default). jsdom's `getComputedStyle` matches the element and each of its ancestors against every
 * rule in the document, and a grid calls it a few hundred times while it renders, so the real
 * stylesheet made each grid built in a unit test about 10 times slower: the full suite took 450s
 * against about 40s with this stub.
 *
 * A spec that needs the real rules (for example one whose result depends on how many rows jsdom
 * renders) calls `injectRealCoreStyles()` from `test/helpers/realCoreStyles.js`.
 */
module.exports = {
  __esModule: true,
  default: '.handsontable { position: relative; }',
};

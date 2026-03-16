# Handsontable core review notes

Apply these checks when changed files are in `/handsontable/**`.

1. Core language boundary:
   - Core source is JavaScript.
   - Do not add TypeScript files under `/handsontable/src/`.
2. Plugin registration path:
   - New plugins must be wired through `/handsontable/src/plugins/index.js` and exported from their own `index.js`.
3. Default safety:
   - New experimental options should be disabled by default in `/handsontable/src/dataMap/metaManager/metaSchema.js`.
4. API consistency:
   - New public methods/options require JSDoc and matching type updates in `/handsontable/types/**`.
5. Test coverage:
   - Behavior changes should include both `.unit.js` and `.spec.js` tests in plugin or feature `__tests__` directories.

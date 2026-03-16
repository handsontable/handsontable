Create a new Handsontable plugin feature called `$ARGUMENTS` (camelCase, for example: `smartPastePreview`).

Work in the core package: `/handsontable`.

Steps:
1. Create plugin files:
   - `/handsontable/src/plugins/$ARGUMENTS/$ARGUMENTS.js`
   - `/handsontable/src/plugins/$ARGUMENTS/index.js`
   - Follow the export pattern from `/handsontable/src/plugins/autoColumnSize/index.js`.
2. Register the plugin in `/handsontable/src/plugins/index.js`:
   - add import from `./$ARGUMENTS`
   - add `registerPlugin(...)` inside `registerAllPlugins()`
   - export it in the bottom export list.
3. Add the configuration option in `/handsontable/src/dataMap/metaManager/metaSchema.js`:
   - option key: `$ARGUMENTS`
   - default value: `false` (disabled by default)
   - add JSDoc with `@experimental`.
4. Add typings in `/handsontable/types/settings.d.ts` for `$ARGUMENTS`.
5. Add tests:
   - unit test: `/handsontable/src/plugins/$ARGUMENTS/__tests__/$ARGUMENTS.unit.js`
   - e2e test: `/handsontable/src/plugins/$ARGUMENTS/__tests__/$ARGUMENTS.spec.js`
   - use helpers from `/handsontable/test/helpers/index.js` where needed.
6. Do NOT enable the option by default in any config path.

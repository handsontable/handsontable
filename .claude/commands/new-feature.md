Create a new Handsontable feature called $ARGUMENTS.

Steps:
1. Add a feature flag entry in /src/flags.js named $ARGUMENTS (camelCase, disabled by default)
2. Create /src/plugins/$ARGUMENTS/index.js following the pattern in /src/plugins/autoColumnSize/index.js
3. Register it in /src/pluginManager.js
4. Write unit tests in /test/unit/plugins/$ARGUMENTS.unit.js
5. Add a JSDoc entry with @experimental tag
6. Do NOT enable the flag — leave it false

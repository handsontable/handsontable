# Coding Conventions

## Naming Patterns

**Files:**
- Source files: `camelCase.ts` (e.g., `hiddenColumns.ts`, `conditionCollection.ts`, `editorManager.ts`). Walkontable (`src/3rdparty/walkontable/`) is also `camelCase.ts`.
- Plugin directories: `camelCase/` (e.g., `src/plugins/hiddenColumns/`, `src/plugins/copyPaste/`)
- Helper files: `camelCase.ts` in `src/helpers/` (e.g., `array.ts`, `object.ts`, `unicode.ts`)
- Test files: `*.unit.js` for Jest unit tests, `*.spec.js` for Jasmine E2E tests
- Type definition files: `*.types.ts` in `handsontable/test/types/`; generated `.d.ts` in `handsontable/tmp/`
- Each plugin directory has an `index.ts` barrel that re-exports `PLUGIN_KEY`, `PLUGIN_PRIORITY`, and the class

**Functions:**
- Use `camelCase` for all functions and methods: `getActiveEditor()`, `createSpreadsheetData()`
- Private methods use `#` prefix (JavaScript private class fields): `#onAfterDocumentKeyDown()`
- Use full names, never abbreviations: `row` and `columns` (not `cols`)
- All exported functions require JSDoc comments (enforced by ESLint `jsdoc/require-jsdoc: 'error'`)
- Factory functions follow naming pattern: `handsontableMethodFactory()`, `handsontableMouseTriggerFactory()`

**Variables:**
- Use `camelCase` for all variables: `activeEditor`, `tableMeta`, `cellProperties`
- `hot` for Handsontable instance references throughout the codebase
- Use `this.hot.rootWindow` and `this.hot.rootDocument` instead of global `window` or `document` (enforced by ESLint rule `no-restricted-globals`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `PLUGIN_KEY`, `PLUGIN_PRIORITY`, `SETTING_KEYS`, `BROWSERS_LIST`)

**Types:**
- Class names: `PascalCase` (e.g., `BasePlugin`, `HiddenColumns`, `CellMeta`, `EditorManager`)
- Type annotations use TypeScript syntax directly in `.ts` source files
- TypeScript `.d.ts` files in `handsontable/tmp/` are auto-generated — do not hand-edit them.
- TypeScript compilation uses `strict: false`, `noImplicitAny: true`

## Code Style

**Formatting:**
- Modified Airbnb JavaScript style (extends `airbnb-base`)
- Indentation: 2 spaces (`SwitchCase: 1`, function params aligned to first)
- Quotes: Single quotes only (`'string'` not `"string"`)
- Max line length: 120 characters (ignores comments and long `it()` test names matching `^\s*x?it\s*\(`)
- Space before function parens: never (`function foo()` not `function foo ()`)
- Arrow parens: as-needed, required for block body
- Curly braces: always required (`curly: ['error', 'all']`)
- Trailing comma: off (`comma-dangle: 'off'`)
- No `++`/`--` except in for loop afterthoughts
- No multiple empty lines (max 1)
- `no-eq-null: 'error'` -- never use `== null` or `!= null`

**Padding/Blank Lines (enforced by `padding-line-between-statements`):**
- Always a blank line before `return`
- Always a blank line before control flow (`if`, `for`, `switch`, `while`) unless preceded by another block-like statement
- Always a blank line after variable declarations (`const`, `let`, `var`) unless followed by another declaration

**Linting:**
- ESLint with `@babel/eslint-parser` and JSX support
- Root config: `.eslintrc.js` (extends `airbnb-base`)
- Handsontable-specific config: `handsontable/.eslintrc.js` (extends root, adds custom plugin rules)
- Browser compatibility enforced via `eslint-plugin-compat` against browser targets from `browser-targets.js`
- JSDoc validation with `eslint-plugin-jsdoc` at error level
- CSS/SCSS linted via Stylelint: `stylelint --cache "src/**/*.{css,scss}" "test/**/*.{css,scss}"`

## Handsontable-Specific ESLint Rules

| Rule | Enforcement |
|---|---|
| `handsontable/no-native-error-throw` | Use `throwWithCause()` from `src/helpers/errors.ts`, never `throw new Error()` |
| `handsontable/restricted-module-imports` | No imports from barrel index files (`plugins/index`, `editors/index`, `renderers/index`, `validators/index`, `cellTypes/index`, `i18n/index`). Import from specific submodule paths. Only exception: `src/registry.ts` |
| `handsontable/require-async-in-it` | All `it()` callbacks in `*.spec.js` must be `async`. Disabled for `*.unit.js` |
| `handsontable/require-await` | Specific HOT API calls must be `await`-ed in `*.spec.js` (full list in `handsontable/.eslintrc.js` lines 84-151) |
| `no-restricted-globals` | Source: `window`, `document`, `console`, `Handsontable` banned. Tests: only `fit`, `fdescribe` banned |
| `compat/compat` | Browser API compatibility check (off in test files) |

**Test file overrides (relaxed rules in `handsontable/.eslintrc.js`):**
- `jsdoc/require-jsdoc`: off in `*.unit.js` and `*.spec.js`
- `handsontable/no-native-error-throw`: off in test files
- `handsontable/require-async-in-it`: off in `*.unit.js` (only enforced in `*.spec.js`)
- `handsontable/require-await`: off in `*.unit.js`
- `no-undef`: off in test files (globals available from bootstrap)
- `no-await-in-loop`: off in test files

## Import Organization

**Order:**
1. Third-party libraries
2. Internal modules from parent/helper directories (relative paths like `../../helpers/`)
3. Local modules from sibling/child directories
4. Constants and configurations

**Example from `src/plugins/hiddenColumns/hiddenColumns.ts`:**
```typescript
import { BasePlugin } from '../base';
import { addClass } from '../../helpers/dom/element';
import { rangeEach } from '../../helpers/number';
import { arrayEach, arrayMap, arrayReduce } from '../../helpers/array';
import { SEPARATOR } from '../contextMenu/predefinedItems';
import { Hooks } from '../../core/hooks';
import hideColumnItem from './contextMenuItem/hideColumn';
import showColumnItem from './contextMenuItem/showColumn';
import { HidingMap } from '../../translations';
```

**Path Aliases (Jest/test only):**
- `'handsontable'` maps to `<rootDir>/src`
- `'walkontable'` maps to `<rootDir>/src/3rdparty/walkontable/src`

**Critical Rule: No barrel imports in source code.**
- Wrong: `import { HiddenColumns } from '../plugins'`
- Correct: `import { HiddenColumns } from '../plugins/hiddenColumns/hiddenColumns'`
- Only `src/registry.ts` may import from barrel indices

## Error Handling

**Pattern -- Always use `throwWithCause()`:**
```typescript
import { throwWithCause } from '../helpers/errors';

// Instead of: throw new Error('message')
throwWithCause('The `fixedColumnsLeft` is not supported for RTL. Please use option `fixedColumnsStart`.');
```

**Error Cause identification:**
- All errors include `cause: { handsontable: true }` for programmatic recognition
- Check with `error.cause?.handsontable === true`

**Implementation in `src/helpers/errors.ts`:**
```javascript
export function throwWithCause(message) {
  throw new Error(message, {
    cause: { handsontable: true }
  });
}
```

## Logging

**Framework:** Custom wrappers in `src/helpers/console.ts`

**Available Functions:**
- `log(...args)` -- General logging
- `warn(...args)` -- Warning messages
- `deprecatedWarn(message)` -- Deprecated feature warnings (prefixed with "Deprecated: ")
- `info(...args)` -- Informational messages
- `error(...args)` -- Error messages

**Usage Pattern:**
```javascript
import { warn, deprecatedWarn } from './helpers/console';

warn('Both `rowHeights` and `minRowHeights` are defined. The `minRowHeights` will be ignored.');
deprecatedWarn('The `getTotalRows()` method is deprecated. Use `countRows()` instead.');
```

**Why not `console` directly:**
- Enforced by ESLint `no-restricted-globals` with custom error message
- Safely handles missing console in older browsers
- Provides consistent logging interface

## Comments

**When to Comment:**
- Explain *why* code exists, not *what* it does
- Non-obvious algorithmic decisions
- Workarounds and temporary solutions (mark with `// TODO:` or `// FIXME:`)
- Complex coordinate system transformations (physical/visual/renderable)

**JSDoc/Typedoc Requirements:**
- All exported functions must have JSDoc (`jsdoc/require-jsdoc: 'error'`)
- Parameters: `@param {type} name - Description.`
- Returns: `@returns {type} Description.`
- Private: `@private` tag
- Newline required after description (`jsdoc/newline-after-description: 'error'`)
- Check param names, types, property names, access level (all at error level)

**JSDoc Template:**
```javascript
/**
 * Brief description of the method.
 *
 * Additional notes if needed.
 *
 * @param {string} paramName - Description of the parameter.
 * @param {number} anotherParam - Description.
 *
 * @fires [[eventName]] when triggered.
 *
 * @throws [[ErrorType]] when condition is met.
 *
 * @returns {string} Description of the return value.
 *
 * @category CategoryName
 */
```

**Allowed Custom JSDoc Tags:**
`@plugin`, `@util`, `@experimental`, `@deprecated`, `@preserve`, `@core`, `@TODO`, `@category`, `@package`, `@template`

**Typedoc Formatting Rules:**
- No HTML tags in descriptions -- use Markdown
- Line breaks: use empty line, never `<br>`
- Links: `[[MY_LINK]]` syntax, not `{@link MY_LINK}`
- End every sentence with a full stop
- No blank line below `/**` or above `*/`

## Function Design

**Size:** Aim for functions under 100 lines. Extract complex logic into helper functions in `src/helpers/`.

**Parameters:**
- Use object destructuring for multiple related parameters
- `no-param-reassign` is off, but prefer immutable patterns

**Return Values:**
- `consistent-return` is off -- functions may return different types in branches
- Document return type in JSDoc `@returns` tag

## Module Design

**Exports:**
- Named exports preferred (`import/prefer-default-export: 'off'`)
- Plugin index pattern from `src/plugins/hiddenColumns/index.ts`:
```typescript
export {
  PLUGIN_KEY,
  PLUGIN_PRIORITY,
  HiddenColumns,
} from './hiddenColumns';
```

**Plugin Static Properties:**
```javascript
class MyPlugin extends BasePlugin {
  static get PLUGIN_KEY() { return 'myPlugin'; }
  static get PLUGIN_PRIORITY() { return 150; }
  static get SETTING_KEYS() { return ['myPlugin']; }
  static get DEFAULT_SETTINGS() { return {}; }
  static get SETTINGS_VALIDATORS() { return null; }
  static get PLUGIN_DEPS() { return ['plugin:AutoRowSize']; }
}
```

**Plugin Lifecycle Methods (in order):**
1. `constructor(hotInstance)` -- receives HOT instance as `this.hot`
2. `isEnabled()` -- return truthy/falsy based on `this.hot.getSettings()[PLUGIN_KEY]`
3. `enablePlugin()` -- set up hooks via `this.addHook()`, register IndexMapper maps. Call `super.enablePlugin()` at the end
4. `updatePlugin()` -- typical: `this.disablePlugin(); this.enablePlugin(); super.updatePlugin();`
5. `disablePlugin()` -- Call `super.disablePlugin()` first (clears EventManager and hooks). Then clean up
6. `destroy()` -- final teardown. Call `super.destroy()` at the end

**Hooks Registration at Module Level (outside the class):**
```typescript
import { Hooks } from '../../core/hooks';

Hooks.getSingleton().register('beforeMyAction');
Hooks.getSingleton().register('afterMyAction');
```

**Important:** `this.addHook()` (BasePlugin method) auto-cleans hooks on `disablePlugin()`. `this.hot.addHook()` does not.

## Plugin Directory Structure Convention

```
src/plugins/{pluginName}/
├── index.ts              # Re-exports PLUGIN_KEY, PLUGIN_PRIORITY, ClassName
├── {pluginName}.ts       # Main plugin class extending BasePlugin
├── __tests__/            # Tests (*.spec.js for E2E, *.unit.js for unit)
│   └── helpers/          # Optional plugin-specific test helpers (auto-loaded for E2E)
└── {submodules}/         # Additional subdirectories as needed
```

## DOM and Window Access

- Always use `this.hot.rootWindow` instead of global `window`
- Always use `this.hot.rootDocument` instead of global `document`
- This enables multi-instance support and air-gapped environments

```javascript
const element = this.hot.rootDocument.createElement('div');
const width = this.hot.rootWindow.innerWidth;
```

## Optional Chaining Policy

Use `?.` only when a value is genuinely optional by design. Do not use as a blanket safety net. If a value is guaranteed by the data contract (e.g., parallel arrays from the same iterator, `getCellMeta()` always returns an object), access directly without `?.`. Unnecessary optional chaining hides bugs.

## Performance Conventions

- Never use `arr.push(...largeArray)` with arrays that could exceed 10k elements -- use `forEach` loop
- Use `batch()` / `batchRender()` / `suspendRender()` / `resumeRender()` for multiple operations that trigger rendering
- Use `requestAnimationFrame` for batching scroll events
- Target 60fps with 100k+ row datasets

## CSS Conventions

- CSS and JavaScript are strictly separated -- never mix CSS into JavaScript files
- Theme CSS uses CSS custom properties (variables) as the public API for customization
- Three themes: `ht-theme-main`, `ht-theme-classic`, `ht-theme-horizon` (each with `-no-icons` variants)
- Theme class is applied to the root container element

const { BROWSERS_LIST } = require('../browser-targets');

module.exports = {
  extends: ['../.eslintrc.js'],
  parser: '@babel/eslint-parser',
  plugins: [
    'handsontable',
    'compat',
  ],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs'],
      },
    },
    browsers: BROWSERS_LIST,
    lintAllEsApis: true,
  },
  rules: {
    'compat/compat': 'error',
    'handsontable/no-native-error-throw': 'error',
    'no-restricted-syntax': [
      'error',
      'ForInStatement',
      'LabeledStatement',
      'WithStatement',
    ],
    'handsontable/restricted-module-imports': [
      'error',
      '**/cellTypes',
      '**/cellTypes/?(index)',
      '**/editors',
      '**/editors/?(index)',
      '**/i18n',
      '**/i18n/?(index)',
      '**/plugins',
      '**/plugins/?(index)',
      '**/renderers',
      '**/renderers/?(index)',
      '**/validators',
      '**/validators/?(index)',
    ],
  },
  overrides: [
    // TypeScript source files — use @typescript-eslint/parser so all rules
    // (max-len, no-native-error-throw, restricted-module-imports, …) apply to .ts.
    // Type-aware rules are active via projectService, which resolves the correct tsconfig
    // per file (including walkontable, *.types.ts, __tests__/**) without needing a tsconfig.eslint.json.
    {
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2022,
        projectService: true,
        tsconfigRootDir: __dirname,
      },
      plugins: ['@typescript-eslint'],
      rules: {
        // Disable rules handled more accurately by tsc
        'no-undef': 'off',
        'no-unused-vars': 'off',
        'no-shadow': 'off',
        'no-redeclare': 'off',
        'no-dupe-class-members': 'off',
        // All import/* rules are off: tsc validates TypeScript imports;
        // eslint-import-resolver-typescript is not installed, so the plugin
        // cannot resolve TS path aliases or `import type` patterns.
        'import/extensions': 'off',
        'import/no-unresolved': 'off',
        'import/first': 'off',
        'import/order': 'off',
        'import/no-duplicates': 'off',
        'import/no-self-import': 'off',
        'import/named': 'off',
        'import/no-named-default': 'off',
        'import/no-named-as-default': 'off',
        'import/no-named-as-default-member': 'off',
        'import/newline-after-import': 'off',
        // JSDoc: TypeScript types replace JSDoc type annotations
        'jsdoc/require-param': 'off',
        'jsdoc/require-param-type': 'off',
        'jsdoc/check-param-names': 'off',
        'jsdoc/require-returns': 'off',
        'jsdoc/require-returns-type': 'off',
        'jsdoc/valid-types': 'off',
        // TypeScript hoists class/type declarations — the plain ESLint rule
        // incorrectly flags forward references in TS; use @typescript-eslint version instead
        'no-use-before-define': 'off',
        // jsdoc v46 require-returns-check is stricter about mixed-return paths in TS;
        // TypeScript enforces return types via its own type checker
        'jsdoc/require-returns-check': 'off',
        // export { X as default } is valid in TS re-export patterns
        'no-restricted-exports': 'off',
        // Cross-package relative imports are used in walkontable/SheetClip submodules
        'import/no-relative-packages': 'off',
        // ban-types was removed in @typescript-eslint v8; suppress any residual reports
        '@typescript-eslint/ban-types': 'off',
        // @typescript-eslint rules — type-aware linting via projectService
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/consistent-type-imports': ['error', { disallowTypeAnnotations: false }],
        // 923 violations (575 + 348) — ratcheted to warn; fix incrementally and promote to error
        '@typescript-eslint/no-unsafe-assignment': 'warn',
        '@typescript-eslint/no-unsafe-return': 'warn',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        // Test rules: only apply to .spec.js / .unit.js, not .ts source
        'handsontable/require-async-in-it': 'off',
        'handsontable/require-await': 'off',
      },
    },
    {
      files: ['scripts/**'],
      rules: {
        'handsontable/no-native-error-throw': 'off',
        'import/no-relative-packages': 'off',
      }
    },
    {
      files: [
        'test/**',
        'src/3rdparty/walkontable/test/**',
        '*.unit.js',
        '*.unit.ts',
        '*.spec.js',
        'src/plugins/**/__tests__/helpers/**',
        'src/editors/**/__tests__/helpers/**',
        'src/**/__tests__/**',
      ],
      rules: {
        'handsontable/no-native-error-throw': 'off',
        'compat/compat': 'off',
        'no-restricted-syntax': 'off',
        'no-await-in-loop': 'off',
        'no-promise-executor-return': 'off',
        'import/extensions': 'off',
        'import/no-relative-packages': 'off',
        // spec/unit helpers use fire-and-forget promises by design
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
        'import/no-unresolved': [
          'error',
          { ignore: ['handsontable', 'walkontable'] }
        ],
        'no-restricted-globals': [
          'error',
          'fit',
          'fdescribe'
        ],
        'no-undef': 'off',
        'handsontable/restricted-module-imports': 'off',
        'handsontable/require-async-in-it': 'error',
        'brace-style': ['error', '1tbs', { allowSingleLine: true }],
      }
    },
    {
      files: ['*.unit.js', '*.spec.js'],
      rules: {
        'no-undef': 'off',
        'jsdoc/require-jsdoc': 'off',
        'jsdoc/require-param-description': 'off',
        'jsdoc/require-param-type': 'off',
        'jsdoc/require-returns': 'off',
        'handsontable/restricted-module-imports': 'off',
        'handsontable/require-async-in-it': 'error',
        'brace-style': ['error', '1tbs', { allowSingleLine: true }],
      }
    },
    {
      files: ['*.unit.js', '*.unit.ts'],
      rules: {
        'handsontable/require-async-in-it': 'off',
        'handsontable/require-await': 'off',
        'brace-style': ['error', '1tbs', { allowSingleLine: true }],
      }
    },
    // TypeScript type-test files — intentionally use `document`, `new X()`, and
    // expression-only statements to verify type inference without side effects.
    {
      files: ['*.types.ts'],
      rules: {
        'no-restricted-globals': 'off', // document/window needed to create HoT instances
        'no-unused-expressions': 'off', // expression-only type assertions are the pattern
        'no-new': 'off', // new Handsontable() for constructor type checks
        'new-cap': 'off',
        'compat/compat': 'off',
        'no-return-assign': 'off',
        camelcase: 'off',
        'default-case': 'off',
        'handsontable/restricted-module-imports': 'off',
        'jsdoc/require-param-description': 'off',
        'brace-style': ['error', '1tbs', { allowSingleLine: true }],
        // type-test files intentionally write unsafe/expression-only patterns
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      }
    },
    {
      files: ['*.spec.js'],
      rules: {
        'handsontable/require-await': [
          'error',
          // Handsontable API-related helpers
          'alter',
          'clear',
          'deselectCell',
          'emptySelectedCells',
          'listen',
          'loadData',
          'populateFromArray',
          'refreshDimensions',
          'render',
          'scrollToFocusedCell',
          'scrollViewportTo',
          'selectAll',
          'selectCell',
          'selectColumns',
          'selectRows',
          'setDataAtCell',
          'setDataAtRowProp',
          'spliceCellsMeta',
          'spliceCol',
          'spliceRow',
          'suspendExecution',
          'suspendRender',
          'unlisten',
          'updateData',
          'updateSettings',
          'useTheme',
          'validateCell',
          'validateCells',
          'validateColumns',
          'validateRows',
          // Handsontable test helpers
          'scrollViewportVertically',
          'scrollViewportHorizontally',
          'scrollWindowTo',
          'scrollWindowBy',
          'contextMenu',
          'selectContextMenuOption',
          'openContextSubmenuOption',
          'selectContextSubmenuOption',
          'dropdownMenu',
          'selectDropdownMenuOption',
          'openDropdownSubmenuOption',
          'openDropdownByConditionMenu',
          'selectDropdownByConditionMenuOption',
          'resizeColumn',
          'resizeRow',
          'moveSecondDisplayedRowBeforeFirstRow',
          'moveFirstDisplayedRowAfterSecondRow',
          'swapDisplayedColumns',
          // common test helpers
          'simulateTouch',
          'triggerTouchEvent',
          'mouseDown',
          'mouseOver',
          'mouseUp',
          'mouseClick',
          'contextMenuEvent',
          'simulateClick',
          'mouseDoubleClick',
          'mouseRightDown',
          'mouseRightUp',
          'keyDownUp',
          'keyDown',
          'keyUp',
        ],
      }
    },
    // src/**/__tests__/**/*.ts and **/*.types.ts are excluded from tsconfig.json and are not
    // imported by any included file, so projectService cannot find them. Disable projectService
    // and all type-aware rules for these files — non-type-aware rules still run.
    {
      files: [
        'src/**/__tests__/**/*.ts',
        'src/3rdparty/walkontable/test/unit/**/*.ts',
        'src/3rdparty/SheetClip/test/**/*.ts',
        '**/*.types.ts',
        '**/*.d.ts',
      ],
      parserOptions: {
        projectService: false,
      },
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
      },
    },
  ],
};

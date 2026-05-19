const { BROWSERS_LIST } = require('../browser-targets.js');

module.exports = {
  extends: ['../.eslintrc.js'],
  parser: '@babel/eslint-parser',
  plugins: [
    'handsontable',
    'compat',
  ],
  settings: {
    browsers: BROWSERS_LIST,
    lintAllEsApis: true,
  },
  rules: {
    'compat/compat': 'error',
    'handsontable/no-native-error-throw': 'error',
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
    {
      files: ['scripts/**'],
      rules: {
        'handsontable/no-native-error-throw': 'off',
      }
    },
    {
      files: [
        'test/**',
        'src/3rdparty/walkontable/test/**',
        '*.unit.js',
        '*.spec.js',
        'src/plugins/**/__tests__/helpers/**',
        'src/editors/**/__tests__/helpers/**',
      ],
      rules: {
        'handsontable/no-native-error-throw': 'off',
        'compat/compat': 'off',
        'no-restricted-syntax': 'off',
        'no-await-in-loop': 'off',
        'import/extensions': 'off',
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
      }
    },
    {
      files: ['*.unit.js'],
      rules: {
        'handsontable/require-async-in-it': 'off',
        'handsontable/require-await': 'off',
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
  ],
};

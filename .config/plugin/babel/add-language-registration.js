/**
 * The plugin participates in transpiling the legacy language files (e.q. import `languages/pl-PL`).
 * The files have to be modified to be compatible with counterparts CommonJS
 * files and ES Modules syntax. Thus, the origin constants import declaration
 * has to be replaced with the import declaration pointed to the Handsontable
 * itself. And at the end of the file, the code about language registration has
 * to be injected.
 */
const { types } = require('@babel/core');
const { declare } = require('@babel/helper-plugin-utils');
const { existsSync, lstatSync } = require('fs');
const { dirname, resolve } = require('path');

let HOT_LIBRARY_NAME = 'Handsontable';
let HOT_MODULE_NAME = 'handsontable';

const createVisitor = ({ declaration, origArgs }) => {
  return (path, { file }) => {
    const { node: { source, exportKind, importKind } } = path;
    const { opts: { filename } } = file;
    const isTypeOnly = exportKind === 'type' || importKind === 'type';

    // This adds the expression statement with language registration
    // (`Handsontable.languages.registerLanguageDictionary(dictionary)`) before default
    // export declaration.
    if (path.node.type === 'ExportDefaultDeclaration') {
      const registerLanguageExpression = types.expressionStatement(
        types.callExpression(
          types.memberExpression(
            types.memberExpression(
              types.identifier(HOT_LIBRARY_NAME),
              types.identifier('languages'),
            ),
            types.identifier('registerLanguageDictionary')
          ),
          [
            types.identifier('dictionary'),
          ]
        )
      );

      path.insertBefore(registerLanguageExpression);
    }

    if (!source || isTypeOnly) {
      return;
    }

    const { value: moduleName } = source;

    if (moduleName.endsWith('constants.mjs')) {
      const importDefaultSpecifier = types.importDefaultSpecifier(
        types.identifier(HOT_LIBRARY_NAME),
      );
      const importDeclaration = types.importDeclaration(
        [importDefaultSpecifier],
        types.stringLiteral(HOT_MODULE_NAME),
      );

      // Replace the namespace import `import * as C from '../constants';` with default import
      // declaration `import Handsontable from 'handsontable';`.
      path.replaceWith(importDeclaration);

      const dictionaryKeysExpression = types.memberExpression(
        types.memberExpression(
          types.identifier(HOT_LIBRARY_NAME),
          types.identifier('languages'),
        ),
        types.identifier('dictionaryKeys'),
      );

      const dictionaryKeysVariable = types.variableDeclaration('const', [
        types.variableDeclarator(
          types.identifier('C'),
          dictionaryKeysExpression,
        )
      ]);

      // Create a variable expression. Put this `const C = Handsontable.languages.dictionaryKeys;`
      // after the above import declaration.
      path.insertAfter(dictionaryKeysVariable);
    }
  };
};

module.exports = declare((api, options) => {
  api.assertVersion(7);

  return {
    name: 'register-language',
    visitor: {
      ImportDeclaration: createVisitor({
        declaration: types.importDeclaration,
        origArgs: ({ node: { specifiers } }) => [specifiers],
      }),
      ExportDefaultDeclaration: createVisitor({
        declaration: types.exportDefaultDeclaration,
        origArgs: () => [],
      }),
    }
  };
});

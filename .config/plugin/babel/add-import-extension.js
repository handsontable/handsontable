const { types } = require('@babel/core');
const { declare } = require('@babel/helper-plugin-utils');
const { existsSync, lstatSync } = require('fs');
const { dirname, resolve } = require('path');

const VALID_EXTENSIONS = ['js', 'mjs'];

const hasExtension = moduleName => VALID_EXTENSIONS.some(ext => moduleName.endsWith(`.${ext}`));
const isCoreJSPolyfill = moduleName => moduleName.startsWith('core-js');
const isLocalModule = moduleName => moduleName.startsWith('.');
const isProcessableModule = (moduleName) => {
  return !hasExtension(moduleName) && (isCoreJSPolyfill(moduleName) || isLocalModule(moduleName));
};

const createVisitor = ({ declaration, origArgs, extension = 'js' }) => {
  return (path, { file }) => {
    const { node: { source, exportKind, importKind } } = path;
    const { opts: { filename } } = file;
    const isTypeOnly = exportKind === 'type' || importKind === 'type';

    if (!source || isTypeOnly || !isProcessableModule(source.value)) {
      return;
    }

    const { value: moduleName } = source;
    const absoluteFilePath = resolve(dirname(filename), moduleName);
    const finalExtension = isCoreJSPolyfill(moduleName) ? 'js' : extension;

    let newModulePath;

    // Resolves a case where "import" points to a module name which exists as a file and
    // as a directory. For example in this case:
    // ```
    // import { registerPlugin } from 'plugins';
    // ```
    // and with this directory structure:
    //   |- editors
    //   |- plugins
    //     |- filters/
    //     |- ...
    //     +- index.js
    //   |- plugins.js
    //   |- ...
    //   +- index.js
    //
    // the plugin will rename import declaration to point to the `plugins.js` file.
    if (existsSync(`${absoluteFilePath}.js`)) {
      newModulePath = `${moduleName}.${finalExtension}`;

    // In a case when the file doesn't exist and the module is a directory it will
    // rename to `plugins/index.js`.
    } else if (existsSync(absoluteFilePath) && lstatSync(absoluteFilePath).isDirectory()) {
      newModulePath = `${moduleName}/index.${finalExtension}`;

    // And for other cases it simply put the extension on the end of the module path
    } else {
      newModulePath = `${moduleName}.${finalExtension}`;
    }

    path.replaceWith(declaration(...origArgs(path), types.stringLiteral(newModulePath)));
  };
};

module.exports = declare((api, options) => {
  api.assertVersion(7);

  return {
    name: 'add-import-extension',
    visitor: {
      // It covers default and named imports
      ImportDeclaration: createVisitor({
        extension: options.extension,
        declaration: types.importDeclaration,
        origArgs: ({ node: { specifiers } }) => [specifiers],
      }),
      ExportNamedDeclaration: createVisitor({
        extension: options.extension,
        declaration: types.exportNamedDeclaration,
        origArgs: ({ node: { declaration, specifiers } }) => [declaration, specifiers],
      }),
      ExportAllDeclaration: createVisitor({
        extension: options.extension,
        declaration: types.exportAllDeclaration,
        origArgs: () => [],
      }),
    }
  };
});

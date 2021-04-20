import fse from 'fs-extra';
import path from 'path';

const PACKAGE_PATH = path.resolve('package.json');
const DEV_PACKAGE = fse.readJsonSync(PACKAGE_PATH, { encoding: 'utf-8' });
const TARGET_PATH = './tmp';
const FILES_TO_COPY = [
  'dist/handsontable.css',
  'dist/handsontable.full.css',
  'dist/handsontable.full.js',
  'dist/handsontable.full.min.css',
  'dist/handsontable.full.min.js',
  'dist/handsontable.js',
  'dist/handsontable.min.css',
  'dist/handsontable.min.js',
  'dist/languages',
  'dist/README.md',
  'languages',
  'base.d.ts',
  'CHANGELOG.md',
  'handsontable-general-terms.pdf',
  'handsontable-non-commercial-license.pdf',
  'handsontable.d.ts',
  'LICENSE.txt',
  'README.md',
];
const PACKAGE_FIELDS_TO_COPY = [
  'name',
  'description',
  'homepage',
  'repository',
  'bugs',
  'author',
  'version',
  'main',
  'module',
  'jsnext:main',
  'jsdelivr',
  'unpkg',
  'keywords',
  'dependencies',
  'license',
  'resolutions',
  'typings',
  'sideEffects',
];

/**
 * Prepare exports basing on wildcards in paths.
 */
const { exports: exportRules } = DEV_PACKAGE;
const fullExports = {};

Object.keys(exportRules).forEach((ruleName) => {
  const ruleObj = exportRules[ruleName];

  if (ruleName.includes('*')) {
    const commonRuleName = ruleName.replace('/*', '');
    const structure = fse.readdirSync(`${TARGET_PATH}/${commonRuleName}`);
    const files = structure.filter(pathToCheck => pathToCheck.includes('.js'));
    const directories = structure.filter(pathToCheck => !(pathToCheck.includes('.js') || pathToCheck.includes('.mjs')));

    files.forEach((file) => {
      const fileName = file.replace('.js', '');
      const filePath = `${commonRuleName}/${fileName}`;
      const fileRule = filePath.replace('/index', '');

      fullExports[fileRule] = {
        import: `${filePath}.mjs`,
        require: `${filePath}.js`,
      };
    });

    directories.forEach((directory) => {
      const directoryRule = `${commonRuleName}/${directory}`;

      fullExports[directoryRule] = {
        import: `${directoryRule}/index.mjs`,
        require: `${directoryRule}/index.js`,
      };
    });
  } else {
    fullExports[ruleName] = ruleObj;
  }
});

/**
 * Test exports to verify if paths exist in the target directory.
 */
const EXPORTS_ERRORS = [];

Object.keys(fullExports).forEach((ruleName) => {
  const rule = fullExports[ruleName];

  if (typeof rule === 'string') {
    const pathToFile = `${TARGET_PATH}/${rule}`;
    const fileExists = fse.existsSync(pathToFile);

    if (!fileExists) {
      EXPORTS_ERRORS.push(`${ruleName}: ${pathToFile}`);
    }
  } else {
    if (rule.import) {
      const pathToImport = `${TARGET_PATH}/${rule.import}`;
      const importFileExists = fse.existsSync(pathToImport);

      if (!importFileExists) {
        EXPORTS_ERRORS.push(`${ruleName}: ${pathToImport}`);
      }
    }
    if (rule.require) {
      const pathToRequire = `${TARGET_PATH}/${rule.require}`;
      const requireFileExists = fse.existsSync(pathToRequire);

      if (!requireFileExists) {
        EXPORTS_ERRORS.push(`${ruleName}: ${pathToRequire}`);
      }
    }
  }

});

if (EXPORTS_ERRORS.length > 0) {
  const FILES_LIST = `${EXPORTS_ERRORS.map(msg => `- ${msg}`).join('\n')}`;

  throw new Error(`The following exports point to the non-existing files:\n ${FILES_LIST}`);
}

/**
 * Save a cleaned-up package.json.
 */
const newPackageJson = {};

PACKAGE_FIELDS_TO_COPY.forEach((field) => {
  newPackageJson[field] = DEV_PACKAGE[field];
});

fse.writeJSONSync(`${TARGET_PATH}/package.json`, {
  ...newPackageJson,
  exports: {
    ...fullExports,
  },
}, {
  spaces: 2,
  replacer: null,
});

/**
 * Copy rest of the necessary files.
 */
FILES_TO_COPY.forEach((file) => {
  fse.copySync(
    path.resolve(`./${file}`),
    path.resolve(`${TARGET_PATH}/${file}`),
    { overwrite: true });
});

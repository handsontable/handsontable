import fse from 'fs-extra';
import path from 'path';
import glob from 'glob';

const TARGET_PATH = './tmp/';
const PACKAGE_PATH = path.resolve('package.json');
const DEV_PACKAGE = fse.readJsonSync(PACKAGE_PATH, { encoding: 'utf-8' });
const { handsontable } = DEV_PACKAGE;
const {
  copy: FILES_TO_COPY,
  exports: EXPORTS_RULES,
  fields: PACKAGE_FIELDS_TO_COPY,
} = handsontable;

/**
 * Copy necessary files we don't need to process.
 */
FILES_TO_COPY.forEach((file) => {
  fse.copySync(
    path.resolve(`./${file}`),
    path.resolve(`${TARGET_PATH}${file}`),
    { overwrite: true });
});

/**
 * Prepare exports basing on wildcards in paths.
 */
const groupedExports = EXPORTS_RULES.flatMap((rule) => {
  if (typeof rule !== 'string') {
    return rule;
  }

  if (!rule.includes('*')) {
    return { [rule]: rule };
  }

  const rules = {};
  const foundFiles = glob.sync(`${rule}`, { cwd: TARGET_PATH });

  foundFiles.forEach((file) => {
    const cleanPath = file.replace(/\.(m|)js$/, '').replace('/index', '');

    if (!rules[cleanPath]) {
      rules[cleanPath] = {};
    }

    const key = file.includes('.mjs') ? 'import' : 'require';

    rules[cleanPath][key] = file;
  });

  return rules;
});
const targetExports = Object.assign({}, ...groupedExports);

/**
 * Test exports to verify if paths exist in the target directory.
 */
const EXPORTS_ERRORS = [];

Object.keys(targetExports).forEach((ruleName) => {
  const rule = targetExports[ruleName];

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
    ...targetExports,
  },
}, {
  spaces: 2,
  replacer: null,
});

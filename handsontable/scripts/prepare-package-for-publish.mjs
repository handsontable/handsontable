import path from 'path';
import fse from 'fs-extra';
import glob from 'glob';
import { displayErrorMessage, displayWarningMessage } from '../../scripts/utils/console.mjs';

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
 * Create .d.mts copies of every .d.ts file in tmp/ so the `import` condition
 * in the exports map can reference explicitly-ESM type declarations.
 *
 * This step is intentionally done here (and not only in downlevel-dts.mjs)
 * because CI may run `npm run postbuild` after partial build steps without
 * going through the full `npm run build` → downlevel:types pipeline.
 */
glob.sync('./**/*.d.ts', { cwd: TARGET_PATH, nodir: true }).forEach((dtsFile) => {
  const mtsPath = path.resolve(TARGET_PATH, dtsFile.replace(/\.d\.ts$/, '.d.mts'));
  const dtsPath = path.resolve(TARGET_PATH, dtsFile);

  fse.copySync(dtsPath, mtsPath, { overwrite: true });
});

/**
 * Copy necessary files we don't need to process.
 */
FILES_TO_COPY.forEach((fileToCopy) => {
  const isPatternMode = isObject(fileToCopy);
  let pathSlice = 0;
  let foundFiles = [fileToCopy];

  if (isPatternMode) {
    foundFiles = glob.sync(fileToCopy.pattern);
    // slice a path off the bottom of the paths e.g. for value 1 it
    // slices path from `./types/base.d.ts` to `./base.d.ts`.
    pathSlice = fileToCopy.pathSlice;
  }

  foundFiles.forEach((file) => {
    const from = path.resolve(`./${file}`);

    if (isPatternMode) {
      file = path.join(...path.normalize(file).split(path.sep).slice(pathSlice));
    }

    const to = path.resolve(`${TARGET_PATH}${file.replace('../', '')}`);

    if (fse.existsSync(from)) {
      fse.copySync(from, to, { overwrite: true });
    } else {
      displayWarningMessage(`The copy source file or directory does not exist: ${from}`);
    }
  });
});

/**
 * Prepare exports basing on wildcards in paths.
 */
const regexpJSFiles = /\.(m?js|d\.ts|d\.mts)$/;

// Each entry maps a file extension to [condition, subKey] in the nested exports object:
//   { import: { types: ".d.mts", default: ".mjs" }, require: { types: ".d.ts", default: ".js" } }
const entrypointMap = {
  '.mts': ['import', 'types'], // .d.mts → import.types
  '.mjs': ['import', 'default'], // .mjs → import.default
  '.ts': ['require', 'types'], // .d.ts → require.types
  '.js': ['require', 'default'], // .js → require.default
};
const groupedExports = EXPORTS_RULES.flatMap((rule) => {
  if (typeof rule !== 'string') {
    return rule;
  }

  const rules = {};
  const foundFiles = glob.sync(`${rule}`, { cwd: TARGET_PATH, nodir: true });

  foundFiles.forEach((filePath) => {
    if (!filePath.startsWith('./dist/') && regexpJSFiles.test(filePath)) {
      const cleanPath = filePath.replace(regexpJSFiles, '').replace('/index', '');
      const mapping = entrypointMap[path.extname(filePath)];

      if (!mapping) {
        return;
      }

      const [condition, subKey] = mapping;

      if (!rules[cleanPath]) {
        rules[cleanPath] = {};
      }

      if (!rules[cleanPath][condition]) {
        rules[cleanPath][condition] = {};
      }

      rules[cleanPath][condition][subKey] = filePath;

    } else {
      rules[filePath] = filePath;
    }
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

    if (!fse.statSync(pathToFile, { throwIfNoEntry: false })?.isFile()) {
      EXPORTS_ERRORS.push(`${ruleName}: ${pathToFile}`);
    }

  } else {
    // Walk one or two levels: supports both flat { condition: "path" } and
    // nested { condition: { subKey: "path" } } formats.
    Object.entries(rule).forEach(([conditionKey, conditionValue]) => {
      if (typeof conditionValue === 'string') {
        const pathToFile = `${TARGET_PATH}/${conditionValue}`;

        if (!fse.statSync(pathToFile, { throwIfNoEntry: false })?.isFile()) {
          EXPORTS_ERRORS.push(`"${ruleName}": { "${conditionKey}": "${conditionValue}" }`);
        }

      } else if (typeof conditionValue === 'object' && conditionValue !== null) {
        Object.entries(conditionValue).forEach(([subKey, subPath]) => {
          const pathToFile = `${TARGET_PATH}/${subPath}`;

          if (!fse.statSync(pathToFile, { throwIfNoEntry: false })?.isFile()) {
            EXPORTS_ERRORS.push(`"${ruleName}": { "${conditionKey}.${subKey}": "${subPath}" }`);
          }
        });
      }
    });
  }
});

if (EXPORTS_ERRORS.length > 0) {
  const FILES_LIST = `${EXPORTS_ERRORS.map(msg => `- ${msg}`).join('\n')}`;

  displayErrorMessage(`The following exports point to the non-existing files:\n${FILES_LIST}`);
  process.exit(1);
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
  // Explicitly mark the published package as CJS so .d.ts files are treated as
  // CJS type declarations under moduleResolution: "node16". Not added to the
  // source package.json to avoid breaking ESM import syntax in test files.
  type: 'commonjs',
  exports: {
    ...targetExports,
  },
}, {
  spaces: 2,
  replacer: null,
});

/**
 * Helper that checks if the passed value is POJO.
 *
 * @param {any} object The object to check.
 * @returns {boolean}
 */
function isObject(object) {
  return Object.prototype.toString.call(object) === '[object Object]';
}

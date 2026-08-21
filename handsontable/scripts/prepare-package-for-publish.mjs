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
 * The script composes the publishable package tree for every channel – the npm release, the
 * `next`/`experimental` builds and the pkg.pr.new previews - so `handsontable.copy` and
 * `handsontable.exports` are the single definition of what that tree holds and how it is
 * addressed. By default the script enforces that definition and fails on an incomplete tree.
 *
 * `--partial` downgrades the completeness checks to warnings. Only a tree that never reaches a
 * registry may skip them – today the ES + CJS build job (it runs before the UMD bundles and the
 * theme stylesheets exist) and the visual screenshot runs (they compose from whichever artifacts
 * a given run has). Anything that publishes composes the whole package. Skipping the checks is
 * what let a preview package ship 18 stylesheets with 2 of them in the exports map. Both call-site
 * lists – strict and partial – are pinned by `test/__tests__/previewPackaging.unit.js`.
 */
const IS_PARTIAL = process.argv.includes('--partial');
const COMPLETENESS_ERRORS = [];
const COPY_DESTINATIONS = [];

/**
 * Report a file that the package definition promises but the composed tree does not hold.
 *
 * @param {string} message The message to be reported.
 */
function reportIncompleteness(message) {
  if (IS_PARTIAL) {
    displayWarningMessage(message);
  } else {
    COMPLETENESS_ERRORS.push(message);
  }
}

/**
 * Generate thin .d.mts wrapper files for every .d.ts so the `import` condition
 * in the exports map can reference explicitly-ESM type declarations.
 *
 * Copying .d.ts verbatim as .d.mts does NOT work: the emitted declarations use
 * extensionless imports (e.g. `from './base'`) that fail to resolve under ESM
 * moduleResolution (node16/bundler), causing attw InternalResolutionError.
 *
 * The wrapper approach avoids this: each .d.mts re-exports from its .js sibling,
 * which TypeScript maps to the .d.ts via its declaration-lookup rules. The .d.ts
 * files handle all internal resolution under their own CJS context.
 *
 * This step runs here (not only in downlevel-dts.mjs) because CI may call
 * `npm run postbuild:partial` after partial build steps without running downlevel:types.
 */
glob.sync('./**/*.d.ts', { cwd: TARGET_PATH, nodir: true }).forEach((dtsFile) => {
  const mtsPath = path.resolve(TARGET_PATH, dtsFile.replace(/\.d\.ts$/, '.d.mts'));
  const dtsPath = path.resolve(TARGET_PATH, dtsFile);
  const jsRef = `./${path.basename(dtsFile, '.d.ts')}.js`;
  const dtsContent = fse.readFileSync(dtsPath, 'utf8');
  const hasDefault = /\bexport\s+default\b/.test(dtsContent);

  let mtsContent = `export * from '${jsRef}';\n`;

  if (hasDefault) {
    mtsContent += `export { default } from '${jsRef}';\n`;
  }

  fse.outputFileSync(mtsPath, mtsContent);
});

/**
 * Translate a copy pattern into the pattern its files are addressed by inside the composed tree,
 * by dropping the same leading segments `pathSlice` drops off each matched path.
 *
 * @param {string} pattern The `handsontable.copy` pattern, e.g. a declaration glob under `types/`.
 * @param {number} pathSlice How many leading path segments the copy step slices off.
 * @returns {string}
 */
function toTargetPattern(pattern, pathSlice) {
  const segments = pattern.split(/[\\/]/).filter(segment => segment !== '' && segment !== '.');

  return segments.slice(pathSlice).join('/');
}

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

    if (foundFiles.length === 0) {
      // No match means no destination is recorded, so the check below cannot see this entry at
      // all. Ask the destination side directly instead: the tree may already carry the files
      // from an artifact built elsewhere (the preview job extracts a `tmp/` composed in another
      // job), which is legitimate; holding none of them is an incomplete package.
      const targetPattern = toTargetPattern(fileToCopy.pattern, pathSlice);
      const composedFiles = targetPattern === '' ?
        [] : glob.sync(targetPattern, { cwd: TARGET_PATH, nodir: true });

      if (composedFiles.length === 0) {
        reportIncompleteness(
          `The package holds no file the copy pattern declares: ${fileToCopy.pattern}`
        );
      }
    }
  }

  foundFiles.forEach((file) => {
    const from = path.resolve(`./${file}`);

    if (isPatternMode) {
      file = path.join(...path.normalize(file).split(path.sep).slice(pathSlice));
    }

    const to = path.resolve(`${TARGET_PATH}${file.replace('../', '')}`);

    COPY_DESTINATIONS.push(to);

    if (fse.existsSync(from)) {
      fse.copySync(from, to, { overwrite: true });
    } else {
      // Not an error on its own: a caller may compose from artifacts that already carry the
      // entry (the preview job extracts a `tmp/` built elsewhere). What the package holds is
      // checked below, on the destination side.
      displayWarningMessage(`The copy source file or directory does not exist: ${from}`);
    }
  });
});

COPY_DESTINATIONS.forEach((destination) => {
  if (!fse.existsSync(destination)) {
    reportIncompleteness(`The package does not hold a file the copy list declares: ${destination}`);
  }
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

  if (foundFiles.length === 0) {
    reportIncompleteness(`The exports rule matches no file in "${TARGET_PATH}": ${rule}`);
  }

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

if (COMPLETENESS_ERRORS.length > 0) {
  const FILES_LIST = `${COMPLETENESS_ERRORS.map(msg => `- ${msg}`).join('\n')}`;

  displayErrorMessage(
    `The composed package is incomplete:\n${FILES_LIST}\n\n` +
    'Build the missing artifacts, or run `npm run postbuild:partial` if this tree is ' +
    'intentionally incomplete.'
  );
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

import path from 'path';
import fse from 'fs-extra';
import glob from 'glob';
import { fileURLToPath } from 'url';
import { displayErrorMessage, displayWarningMessage } from '../../scripts/utils/console.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const regexpJSFiles = /\.(m?js|d\.ts)$/;
const entrypointMap = {
  '.mjs': 'import',
  '.js': 'require',
  '.ts': 'types',
};
const groupedExports = EXPORTS_RULES.flatMap((rule) => {
  if (typeof rule !== 'string') {
    return rule;
  }

  const rules = {};
  const foundFiles = glob.sync(`${rule}`, { cwd: TARGET_PATH });

  foundFiles.forEach((filePath) => {
    if (!filePath.startsWith('./dist/') && regexpJSFiles.test(filePath)) {
      const cleanPath = filePath.replace(regexpJSFiles, '').replace('/index', '');

      if (!rules[cleanPath]) {
        rules[cleanPath] = {};
      }

      rules[cleanPath][entrypointMap[path.extname(filePath)]] = filePath;

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
    const fileExists = fse.existsSync(pathToFile);

    if (!fileExists) {
      EXPORTS_ERRORS.push(`${ruleName}: ${pathToFile}`);
    }

  } else {
    Object.keys(rule).forEach((key) => {
      const pathToFile = `${TARGET_PATH}/${rule[key]}`;
      const isFileExist = fse.existsSync(pathToFile);

      if (!isFileExist) {
        EXPORTS_ERRORS.push(`"${ruleName}": { "${key}": "${pathToFile.replace(`${TARGET_PATH}/`, '')}" }`);
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
  exports: {
    ...targetExports,
  },
}, {
  spaces: 2,
  replacer: null,
});

/**
 * Inject CSS into the main entry point files (index.js and index.mjs).
 */
function injectCssIntoEntryPoints() {
  const pathToCss = path.resolve(__dirname, '../tmp/styles/handsontable.min.css');

  if (!pathToCss) {
    displayWarningMessage(`[CSS Injection] CSS file not found. Tried: ${pathToCss}`);

    return;
  }

  // Read CSS content
  const cssContent = fse.readFileSync(pathToCss, 'utf8');

  // Escape CSS content for JavaScript string
  const escapedCss = cssContent
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\${/g, '\\${')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Create injection code
  const injectionCode = `(function() {
  if (typeof document !== 'undefined') {
    const styleId = 'handsontable-styles';
    const existingStyle = document.getElementById(styleId);
    
    if (!existingStyle) {
      const style = document.createElement('style');

      style.id = styleId;
      style.type = 'text/css';
      style.textContent = \`${escapedCss}\`;
      
      const head = document.head || document.getElementsByTagName('head')[0];

      if (head) {
        head.appendChild(style);
      }
    }
  }
})();
`;

  // Inject into index.js and index.mjs
  const entryPoints = ['index.js', 'index.mjs'];

  entryPoints.forEach((entryPoint) => {
    const filePath = path.resolve(TARGET_PATH, entryPoint);

    if (fse.existsSync(filePath)) {
      const currentContent = fse.readFileSync(filePath, 'utf8');
      const newContent = injectionCode + currentContent;

      fse.writeFileSync(filePath, newContent, 'utf8');
    }
  });
}

// Inject CSS into entry points
injectCssIntoEntryPoints();

/**
 * Helper that checks if the passed value is POJO.
 *
 * @param {any} object The object to check.
 * @returns {boolean}
 */
function isObject(object) {
  return Object.prototype.toString.call(object) === '[object Object]';
}

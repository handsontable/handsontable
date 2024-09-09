import { readFileSync, writeFileSync } from 'fs';

const THEME_KEY = 'ht-theme';
const PATH = './src/styles/themes';

const file = readFileSync(`${PATH}/utils/tokens.json`, 'utf8');
const themes = JSON.parse(file);

/**
 * Helper to find value by path.
 *
 * @param {obj} obj The theme object.
 * @param {string} path The value path.
 * @returns {string}
 */
function findValue(obj, path) {
  const paths = path.split('.');
  let current = obj;

  for (let i = 0; i < paths.length; ++i) {
    if (current[paths[i]] === undefined) {
      return undefined;
    } else {
      current = current[paths[i]];
    }
  }

  return current;
}

/**
 * Update key values.
 *
 * @param {obj} obj The theme object.
 * @param {string} variant The theme variant.
 * @returns {obj}
 */
function updateValues(obj, variant) {
  if (typeof obj === 'object') {

    // eslint-disable-next-line no-restricted-syntax
    for (const keys in obj) {
      if (obj[keys].value === undefined) {
        updateValues(obj[keys], variant);
      } else {
        const prop = obj[keys];

        if (typeof prop.value === 'string' && /{mode.*}/.test(prop.value)) {
          const path = prop.value
            .replace(/{mode\.[a-z]*\./, `{mode.${variant}.`)
            .replace('{', '')
            .replace('}', '');
          const val = findValue(themes, path);

          prop.value = val.value;
        } else if (typeof prop.value === 'string' && /{ht.*}/.test(prop.value)) {
          const path = prop.value
            .replace('{', '')
            .replace('}', '');
          const val = findValue(themes, path);

          prop.value = val.value;
        }

        if (prop.type === 'dimension') {
          prop.value = `${prop.value}px`;
        }

        obj[keys] = prop;
      }
    }
  }

  return obj;
}

/**
 * Generate flat key value structure.
 *
 * @param {obj} obj The theme object.
 * @returns {boolean}
 */
function generateVariables(obj) {
  // eslint-disable-next-line no-shadow
  const flattenRecursive = (obj, propertyMap = {}) => {
    for (const [key, prop] of Object.entries(obj)) {

      const property = `--ht-${key}`;

      if (prop && typeof prop === 'object' && !('value' in prop)) {
        flattenRecursive(prop, propertyMap, key);
      } else {
        propertyMap[property] = prop.value;
      }
    }

    return propertyMap;
  };

  return flattenRecursive(obj);
}

const themesContent = {};

/**
 * Generate object structure for light and dark theme.
 */
['light', 'dark'].forEach((variant) => {
  const themeClone = JSON.parse(JSON.stringify(themes));

  updateValues(themeClone, variant);

  Object.entries(themeClone[THEME_KEY]).forEach(([themeKey, themeValues]) => {
    if (!themesContent[themeKey]) {
      themesContent[themeKey] = {};
    }

    themesContent[themeKey][variant] = generateVariables(themeValues);
  });
});

/**
 * Generate theme scss file content and write it to a file.
 */
Object.entries(themesContent).forEach(([themeKey, themeValues]) => {
  let utilsContent = `@use 'icons";

@include icons.output();

`;

  Object.entries(themeValues).forEach(([variantKey, variantValue]) => {
    utilsContent += `@mixin ${variantKey} {
    .ht-main-wrapper {\n`;

    Object.entries(variantValue).forEach(([key, value]) => {
      utilsContent += `        ${key}: ${value};\n`;
    });

    utilsContent += `    }
}\n`;
  });

  const darkAutoContent = `@use "utils/${themeKey}";

/* Light mode */
@media (prefers-color-scheme: light) {
  @include ${themeKey}.light();
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  @include ${themeKey}.dark();
}

`;

  const lightContent = `@use "utils/${themeKey}";

@include ${themeKey}.light();

`;

  const darkContent = `@use "utils/${themeKey}";

@include ${themeKey}.dark();
      
`;

  try {
    writeFileSync(`${PATH}/utils/${themeKey}/_index.scss`, utilsContent);
    writeFileSync(`${PATH}/${themeKey}-dark-auto.scss`, darkAutoContent);
    writeFileSync(`${PATH}/${themeKey}-light.scss`, lightContent);
    writeFileSync(`${PATH}/${themeKey}-dark.scss`, darkContent);

    console.log('Themes have been generated.');
  } catch (err) {
    console.error(err);
  }
});

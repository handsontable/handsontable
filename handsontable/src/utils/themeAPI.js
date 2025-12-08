import baseStyles from '../themes/utils/styles';
import { addClass } from '../helpers/dom/element';
import { iconsMap } from '../themes/utils/icons';

/**
 * Checks if the given object is an object.
 *
 * @param {object} object - The object to check.
 * @returns {boolean} - True if the object is an object, false otherwise.
 */
function isObject(object) {
  return Object.prototype.toString.call(object) === '[object Object]';
}

/**
 * Flattens the colors object into a string of CSS variables.
 *
 * @param {object} obj - The object to flatten.
 * @param {string} [prefix='colors'] - The prefix to add to the CSS variables.
 * @param {string} [parentKey=''] - The parent key to add to the CSS variables.
 * @returns {string} - The flattened CSS variables.
 */
function flattenColors(obj, prefix = 'colors', parentKey = '') {
  let cssVars = '';

  Object.entries(obj).forEach(([key, value]) => {
    const fullKey = parentKey ? `${parentKey}_${key}` : key;

    if (isObject(value) && value !== null && !Array.isArray(value)) {
      // Recursively process nested objects
      cssVars += flattenColors(value, prefix, fullKey);
    } else {
      // Convert key from snake_case to kebab-case and add prefix
      const cssKey = `--ht-${prefix}-${fullKey.replace(/_/g, '-')}`;

      cssVars += `${cssKey}: ${value};\n`;
    }
  });

  return cssVars;
}

/**
 * ThemeAPI class.
 *
 * @class ThemeAPI
 */
export class ThemeAPI {
  constructor({ rootDocument, rootWrapperElement, rootPortalElement, stringInstanceID, themeObject }) {
    this.injectBaseStyles(rootDocument);
    this.injectThemeStyles({
      rootDocument,
      rootWrapperElement,
      rootPortalElement,
      stringInstanceID,
      themeObject,
    });
  }

  /**
   * Injects base styles into the document head.
   *
   * @param {Document} document - The document object to inject styles into.
   * @param {string} [styleId] - Optional ID for the style element to prevent duplicate injections.
   * @returns {HTMLElement|null} The created style element, or null if injection failed.
   */
  injectBaseStyles(document, styleId = 'handsontable-base-styles') {
    if (!document || !document.head) {
      return null;
    }

    // Check if styles are already injected
    const existingStyle = document.getElementById(styleId);

    if (existingStyle) {
      return existingStyle;
    }

    const styleElement = document.createElement('style');

    styleElement.id = styleId;
    styleElement.type = 'text/css';
    styleElement.textContent = baseStyles;

    document.head.appendChild(styleElement);

    return styleElement;
  }

  /**
   * Injects theme styles into the DOM.
   *
   * @param {object} options - The options object.
   * @param {Document} options.rootDocument - The document to create the style element in.
   * @param {HTMLElement} options.rootWrapperElement - The wrapper element to prepend the style to.
   * @param {HTMLElement} options.rootPortalElement - The portal element to prepend the style to.
   * @param {string} options.stringInstanceID - The instance ID.
   * @param {object | undefined} options.themeObject - The theme configuration object with light, dark, theme, and icons properties.
   */
  async injectThemeStyles({
    rootDocument,
    rootWrapperElement,
    rootPortalElement,
    stringInstanceID,
    themeObject,
  }) {
    if (!isObject(themeObject)) {
      return;
    }

    const inlineThemeClassName = `ht-inline-theme-${stringInstanceID}`;
    const themeObj = themeObject.getThemeConfig();

    addClass(rootWrapperElement, inlineThemeClassName);
    addClass(rootPortalElement, inlineThemeClassName);

    if (rootWrapperElement && rootWrapperElement.querySelector('style')) {
      return;
    }

    const styleElement = rootDocument.createElement('style');
    const colorScheme = themeObj.colorScheme === 'auto' ? 'light dark' : themeObj.colorScheme;

    styleElement.textContent = `:where(.${inlineThemeClassName}) {\n`;
    styleElement.textContent += `color-scheme: ${colorScheme};\n`;
    styleElement.textContent += Object.entries(themeObj.sizing || {}).map(
      ([key, value]) => `--ht-sizing-${key}: ${value};`
    ).join('\n');
    styleElement.textContent += '\n';
    styleElement.textContent += Object.entries(themeObj.density || {}).map(
      ([key, value]) => `--ht-density-${key}: var(--ht-${value.split('.').join('-')});`
    ).join('\n');
    styleElement.textContent += '\n';
    styleElement.textContent += flattenColors(themeObj.colors || {});
    styleElement.textContent += Object.entries(themeObj.tokens || {}).map(
      ([key, value]) => {
        if (typeof value === 'string'
          && (
            (value.includes('themes.') ||
              value.includes('colors.') ||
              value.includes('sizing.') ||
              value.includes('density.')))
        ) {
          if (value.includes('themes')) {
            return `--ht-${key}: var(--ht-${value.split('.').slice(1).join('-')});`;
          }

          return `--ht-${key}: var(--ht-${value.split('.').join('-')});`;
        }

        if (isObject(value)) {
          // eslint-disable-next-line max-len
          return `--ht-${key}: light-dark(var(--ht-${value.light.split('.').join('-')}), var(--ht-${value.dark.split('.').join('-')}));`;
        }

        return `--ht-${key}: ${value};`;
      }
    ).join('\n');

    styleElement.textContent += iconsMap(themeObj.icons || {});
    styleElement.textContent += '}';

    rootWrapperElement.prepend(styleElement);
  }
}

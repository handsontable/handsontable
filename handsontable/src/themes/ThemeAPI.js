import baseStyles from './styles';
import { addClass } from '../helpers/dom/element';
import { iconsMap } from './utils/icons';
import { mainTheme } from './index';
import { isObject } from '../helpers/object';

/**
 * ThemeAPI class.
 *
 * @class ThemeAPI
 */
export class ThemeAPI {
  constructor(rootDocument, rootWrapperElement, rootPortalElement, themeObject, stringInstanceID) {
    this.injectBaseStyles(rootDocument);
    this.injectThemeStyles(rootDocument, rootWrapperElement, rootPortalElement, themeObject, stringInstanceID);
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
   * @param {Document} rootDocument - The document to create the style element in.
   * @param {HTMLElement} rootWrapperElement - The wrapper element to prepend the style to.
   * @param {HTMLElement} rootPortalElement - The portal element to prepend the style to.
   * @param {object | undefined} themeObject - The theme configuration object with light, dark, theme, and icons properties.
   * @param {string} stringInstanceID - The instance ID.
   */

  injectThemeStyles(rootDocument, rootWrapperElement, rootPortalElement, themeObject, stringInstanceID) {
    const inlineThemeClassName = `ht-inline-theme-${stringInstanceID}`;
    const themeObj = isObject(themeObject) ? themeObject.getThemeConfig() : mainTheme.getThemeConfig();

    addClass(rootWrapperElement, inlineThemeClassName);
    addClass(rootPortalElement, inlineThemeClassName);

    if (rootWrapperElement && rootWrapperElement.querySelector('style')) {
      return;
    }

    const styleElement = rootDocument.createElement('style');
    const colorScheme = themeObj.colorScheme === 'auto' ? 'light dark' : themeObj.colorScheme;

    styleElement.textContent = `:where(.${inlineThemeClassName}) {`;
    styleElement.textContent += `color-scheme: ${colorScheme};`;
    styleElement.textContent += Object.entries(themeObj.light || {}).map(
      // eslint-disable-next-line max-len
      ([key, value]) => `--ht-${key.replace(/([A-Z])/g, '-$1').replace(/_/g, '-').toLowerCase()}: light-dark(${value}, ${themeObj.dark[key]});`
    ).join('\n');
    styleElement.textContent += Object.entries(themeObj.theme || {}).map(
      ([key, value]) => `--ht-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`
    ).join('\n');
    styleElement.textContent += iconsMap(themeObj.icons || {});
    styleElement.textContent += '}';

    rootWrapperElement.prepend(styleElement);
  }
}

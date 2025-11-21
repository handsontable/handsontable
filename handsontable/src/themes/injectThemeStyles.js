import { iconsMap } from './utils/icons';

/**
 * Injects theme styles into the DOM.
 *
 * @param {Document} rootDocument - The document to create the style element in.
 * @param {HTMLElement} rootWrapperElement - The wrapper element to prepend the style to.
 * @param {string} inlineThemeClassName - The CSS class name for the inline theme.
 * @param {object} themeObject - The theme configuration object with light, dark, theme, and icons properties.
 */
export function injectThemeStyles(rootDocument, rootWrapperElement, inlineThemeClassName, themeObject) {
  if (rootWrapperElement && rootWrapperElement.querySelector('style')) {
    return;
  }

  const styleElement = rootDocument.createElement('style');
  const colorScheme = themeObject.colorScheme === 'auto' ? 'light dark' : themeObject.colorScheme;

  styleElement.textContent = `:where(.${inlineThemeClassName}) {`;
  styleElement.textContent += `color-scheme: ${colorScheme};`;
  styleElement.textContent += Object.entries(themeObject.light || {}).map(
    // eslint-disable-next-line max-len
    ([key, value]) => `--ht-${key.replace(/([A-Z])/g, '-$1').replace(/_/g, '-').toLowerCase()}: light-dark(${value}, ${themeObject.dark[key]});`
  ).join('\n');
  styleElement.textContent += Object.entries(themeObject.theme || {}).map(
    ([key, value]) => `--ht-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`
  ).join('\n');
  styleElement.textContent += iconsMap(themeObject.icons || {});
  styleElement.textContent += '}';

  rootWrapperElement.prepend(styleElement);
}


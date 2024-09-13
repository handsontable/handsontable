export const MAIN_THEME_NAME = 'ht-theme-main';

/**
 * Get theme class name from rootElement class.
 *
 * @param {string} className Class names.
 * @returns {string}
 */
export function getThemeClassName(className) {
  if (!className || typeof className !== 'string') {
    return false;
  }

  const [match] = className.match(/ht-theme-[a-zA-Z0-9_-]+/) || [];

  return match;
}

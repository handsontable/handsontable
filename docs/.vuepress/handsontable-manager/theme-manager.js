const setTheme = () => {
  try {
    // Skip auto theme sync for examples that manage their own theme (e.g., theme demo page)
    if (document.querySelector('.disable-auto-theme')) {
      return;
    }

    // eslint-disable-next-line no-undef
    if (typeof Handsontable !== 'undefined' && Handsontable.themes) {
      // eslint-disable-next-line no-undef
      const themeNames = Handsontable.themes.getThemeNames();
      // eslint-disable-next-line no-undef
      const mainTheme = themeNames.includes('main') ? Handsontable.themes.getTheme('main') : undefined;

      if (mainTheme) {
        if (
          document.documentElement.classList.contains('theme-dark')
          && mainTheme.getThemeConfig().colorScheme !== 'dark'
          && mainTheme.getThemeConfig().colorScheme !== 'auto'
        ) {
          mainTheme.setColorScheme('dark');
        } else if (
          !document.documentElement.classList.contains('theme-dark')
          && mainTheme.getThemeConfig().colorScheme !== 'light'
          && mainTheme.getThemeConfig().colorScheme !== 'auto'
        ) {
          mainTheme.setColorScheme('light');
        }
      }
    }
  } catch (e) {
    // Silently ignore theme errors to prevent breaking HOT instances
    // eslint-disable-next-line no-console
    console.warn('Theme manager: Failed to set theme', e);
  }
};

const ensureCorrectHotThemes = () => {
  if (typeof Handsontable !== 'undefined') {
    // eslint-disable-next-line no-undef
    Handsontable.hooks.add('afterInit', () => {
      setTheme();
    });
  }
};

const switchExamplesTheme = () => {
  setTheme();
};

module.exports = {
  themeManager: {
    ensureCorrectHotThemes,
    switchExamplesTheme,
  },
};

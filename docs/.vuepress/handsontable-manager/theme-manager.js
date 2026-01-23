const setTheme = () => {
  try {
    // Skip auto theme sync for examples that manage their own theme (e.g., theme demo page)
    if (document.querySelector('.disable-auto-theme')) {
      return;
    }

    if (typeof Handsontable !== 'undefined' && Handsontable.themes) {
      const mainTheme = Handsontable.themes.getThemeNames().includes('main') ? Handsontable.themes.getTheme('main') : undefined;

      if (mainTheme) {
        if (document.documentElement.classList.contains('theme-dark') && mainTheme.getThemeConfig().colorScheme !== 'dark') {
          mainTheme.setColorScheme('dark');
        } else if (!document.documentElement.classList.contains('theme-dark') && mainTheme.getThemeConfig().colorScheme !== 'light') {
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

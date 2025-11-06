const STORAGE_KEY = 'handsontable/docs::color-scheme';

const _getThemeClassName = (colorScheme) => {
  switch (colorScheme) {
    case 'dark':
      return 'ht-theme-main-dark';
    case 'light':
      return 'ht-theme-main';
    default:
      return 'ht-theme-main-dark-auto';
  }
};

const _afterSetThemeCallback = function() {
  setTimeout(() => {
    if (this.rootContainer?.closest('.disable-auto-theme') || this.rootContainer?.closest('.ht-portal')) {
      return;
    }

    const themeName = _getThemeClassName(localStorage.getItem(STORAGE_KEY));

    if (this.getCurrentThemeName() !== themeName) {
      this.useTheme(themeName);
    }
  }, 0);
};

const ensureCorrectHotThemes = () => {
  if (typeof Handsontable !== 'undefined') {
    Handsontable.hooks.add('afterSetTheme', _afterSetThemeCallback);
  }
};

const switchExamplesTheme = (hotInstances) => {
  hotInstances.forEach((hotInstance) => {
    if (hotInstance.rootContainer.closest('.disable-auto-theme')) {
      return;
    }

    const version = localStorage.getItem(STORAGE_KEY);
    const currentThemeName = hotInstance.getCurrentThemeName();

    // Remove the '-auto' suffix from the theme name.
    const newThemeName = currentThemeName.replace('-auto', '');
    const isCurrentlyDark = newThemeName.includes('dark');

    switch (version) {
      case 'dark':
        hotInstance.useTheme(isCurrentlyDark ? newThemeName : `${newThemeName}-dark`);
        break;
      case 'light':
        hotInstance.useTheme(isCurrentlyDark ? newThemeName.replace('-dark', '') : newThemeName);
        break;
      default:
    }
  });
};

module.exports = {
  themeManager: {
    ensureCorrectHotThemes,
    switchExamplesTheme,
  },
};

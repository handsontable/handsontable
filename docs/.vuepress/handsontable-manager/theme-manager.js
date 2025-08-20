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

const ensureCorrectHotThemes = () => {
  if (typeof Handsontable !== 'undefined') {
    // eslint-disable-next-line no-undef
    Handsontable.hooks.add('afterSetTheme', function() {
      setTimeout(() => {
        if (this.rootContainer.closest('.disable-auto-theme')) {
          return;
        }

        const themeName = _getThemeClassName(localStorage.getItem(STORAGE_KEY));

        if (this.getCurrentThemeName() !== themeName) {
          this.useTheme(themeName);
        }
      }, 0);
    });
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

const getThemeClassName = (colorScheme) => {
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
    const themeName = getThemeClassName(localStorage?.getItem('handsontable/docs::color-scheme'));

    if (themeName) {
      // eslint-disable-next-line no-undef
      Handsontable.hooks.add('afterInit', function() {
        if (this.getCurrentThemeName() !== themeName) {
          this.useTheme(themeName);
          this.render();
        }
      });
    }
  }
};

const switchExamplesTheme = (hotInstances) => {
  const version = localStorage.getItem('handsontable/docs::color-scheme');

  hotInstances.forEach((hotInstance) => {
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

    hotInstance.render();
  });
};

module.exports = {
  themeManager: {
    ensureCorrectHotThemes,
    switchExamplesTheme,
    getThemeClassName,
  }
};

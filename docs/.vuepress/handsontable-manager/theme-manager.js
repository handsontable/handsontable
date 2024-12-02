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
    // eslint-disable-next-line no-undef
    Handsontable.hooks.add('afterInit', function() {
      const themeName = getThemeClassName(localStorage.getItem('handsontable/docs::color-scheme'));

      if (
        themeName
        && this.rootElement.classList.contains('ht-wrapper')
        && !this.rootElement.classList.contains('disable-auto-theme')
        && !this.rootElement?.parentNode.classList.contains('disable-auto-theme')
      ) {
        if (this.getCurrentThemeName() !== themeName) {
          this.useTheme(themeName);
          this.render();
        }
      }
    });
  }
};

const switchExamplesTheme = (hotInstances) => {
  const version = localStorage.getItem('handsontable/docs::color-scheme');

  hotInstances.forEach((hotInstance) => {
    const currentThemeName = hotInstance.getCurrentThemeName();

    if (
      hotInstance.rootElement.classList.contains('disable-auto-theme')
      || hotInstance.rootElement?.parentNode.classList.contains('disable-auto-theme')
    ) {
      return;
    }

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

const switchExampleTheme = (hotInstance, themeName) => {
  hotInstance?.updateSettings({ themeName });
  hotInstance.render();
};

module.exports = {
  themeManager: {
    ensureCorrectHotThemes,
    switchExamplesTheme,
    getThemeClassName,
    switchExampleTheme
  }
};

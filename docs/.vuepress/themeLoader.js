export const themeLoader = () => {
  const STORAGE_KEY = 'handsontable/docs::color-scheme';
  const CLASS_THEME_DARK = 'theme-dark';

  const userPrefferedTheme = localStorage ? localStorage.getItem(STORAGE_KEY) : 'light';

  if (userPrefferedTheme === 'dark') {
    document.documentElement.classList.add(CLASS_THEME_DARK);

    return;
  }

  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

  if (prefersDarkScheme.matches) {
    document.documentElement.classList.add(CLASS_THEME_DARK);
  } else {
    document.documentElement.classList.remove(CLASS_THEME_DARK);
  }
};

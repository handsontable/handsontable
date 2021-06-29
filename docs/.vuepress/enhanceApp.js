const { applyToWindow, instanceRegister } = require('./handsontable-manager');

applyToWindow();

const buildRegisterCleaner = register => (to, from) => {
  if (to.path === from.path) {
    return;
  }
  if (register === undefined) {
    // eslint-disable-next-line
    console.warn('The register doesn\'t exists');

    return;
  }
  register.destroyAll();
};

const buildActiveHeaderLinkHandler = () => {
  let activeLink = '';

  return (to, from) => {
    if (to.hash !== from.hash) {
      if (activeLink) {
        activeLink.classList.remove('active');
      }
      // eslint-disable-next-line
      activeLink = document.querySelector(`.table-of-contents a[href="${to.hash}"]`);

      if (activeLink) {
        activeLink.classList.add('active');
      }
    }
  };
};

const themeLoader = () => {
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

export default ({ router, isServer }) => {
  if (!isServer) {

    themeLoader();
    router.afterEach(buildRegisterCleaner(instanceRegister));
    router.afterEach(buildActiveHeaderLinkHandler());
  }
};

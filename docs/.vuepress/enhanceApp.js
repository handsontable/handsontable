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
  let activeLink = null;

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

const addLatestVersionRedirection = (router, version) => {
  const latestVersionRegExp = new RegExp(`^\/${version}\/`);

  router.getRoutes().forEach((route) => {
    if (latestVersionRegExp.test(route.path)) {
      route.redirect = route.path.replace(latestVersionRegExp, '/');
    }
  });
};

export default ({ router, isServer, siteData }) => {
  if (!isServer) {
    addLatestVersionRedirection(router, siteData.themeConfig.latestVersion);

    router.afterEach(buildRegisterCleaner(instanceRegister));
    router.afterEach(buildActiveHeaderLinkHandler());
  }
};

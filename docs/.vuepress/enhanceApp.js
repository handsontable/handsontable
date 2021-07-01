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

/**
 * The function iterates over the routes that point to the latest documentation
 * (that routes that do not have a declared version in the path URL) and adds
 * redirects to that pages but with an implicitly declared version in the URL
 * path (e.g. redirect from "/9.0/license-key/ to "/license-key").
 *
 * @param {*} router The Vue Router instance.
 * @param {string} latestVersion The latest version of the documentation.
 */
const addLatestVersionRedirection = (router, latestVersion) => {
  const versionedPathRegExp = /^\/(\d+\.\d+|next)\//;
  const toNonVersionedRedirects = router.getRoutes()
    .reduce((routes, { path }) => {
      if (!versionedPathRegExp.test(path)) {
        routes.push({
          path: `/${latestVersion}${path}`,
          redirect: path
        });
      }

      return routes;
    }, []);

  toNonVersionedRedirects.forEach(versionedRedirect => router.addRoute(versionedRedirect));
};

export default ({ router, isServer, siteData }) => {
  if (!isServer) {
    addLatestVersionRedirection(router, siteData.themeConfig.latestVersion);

    router.afterEach(buildRegisterCleaner(instanceRegister));
    router.afterEach(buildActiveHeaderLinkHandler());
  }
};

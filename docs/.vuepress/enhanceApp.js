/* global GA_ID, ga */
const { applyToWindow, instanceRegister } = require('./handsontable-manager');
const { themeLoader } = require('./themeLoader');

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
 * The variable prevents collect double page views for the initial page load.
 * For the first page load, the GA automatically registers pageview. For other
 * route changes, the event is triggered manually.
 */
let isFirstPageLoaded = true;

export default async({ router, siteData, isServer }) => {
  if (!isServer) {
    const pathVersion = ['dev-pseudo-prod.handsontable.com', 'handsontable.com']
      .includes(window.location.host) ? '' : 'next/';
    const response = await fetch(`${window.location.origin}/docs/${pathVersion}data/common.json`);
    const docsData = await response.json();
    const canonicalURLs = new Map(docsData.urls);

    siteData.pages.forEach((page) => {
      const { path, frontmatter } = page;
      const pathNorm = path.replace(/^\//, '').replace(/\/$/, '');

      if (canonicalURLs.has(pathNorm)) {
        const docsVersion = canonicalURLs.get(pathNorm) === '' ? '' : `/${canonicalURLs.get(pathNorm)}`;

        frontmatter.canonicalUrl = `/docs${docsVersion}${path}`;
      }

      page.versions = docsData.versions;
      page.latestVersion = docsData.latestVersion;
    });

    themeLoader();

    if (typeof window.ga === 'function') {
      router.afterEach((to) => {
        if (!isFirstPageLoaded) {
          ga.getAll().forEach((tracker) => {
            if (tracker.get('trackingId') === GA_ID) {
              // Collect the page view in the next browser event loop cycle to make sure
              // that the VuePress finished render new page completely (change the URL address
              // and document title).
              setTimeout(() => {
                tracker.set('page', router.app.$withBase(to.fullPath));
                tracker.send('pageview');
              });
            }
          });
        }

        isFirstPageLoaded = false;
      });
    }

    router.afterEach(buildRegisterCleaner(instanceRegister));
    router.afterEach(buildActiveHeaderLinkHandler());
  }
};

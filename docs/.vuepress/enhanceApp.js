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
    const currentVersion = siteData.pages[0].currentVersion;
    const buildMode = siteData.pages[0].buildMode;
    let pathVersion = '';

    /**
     * Depends on the Docs image environment, build or the domain under the Docs runs, the path
     * may change according to:
     * 1. For non-production Docs images fetch JSON file from the versioned docs version
     *  - For localhost development e.g {HOST}/docs/next/data/common.json
     *  - For localhost development of the production Docs version branch (prod-docs/{MAJOR}.{MINOR}) e.g {HOST}/docs/9.0/data/common.json
     *  - For staging environment ("development") e.g {HOST}/docs/next/data/common.json
     * 2. For production Docs image that runs under the official domain (https://handsontable.com) use
     * URL without defining docs version e.g {HOST}/docs/data/common.json
     * 3. For production Docs image that runs under the staging domain (https://dev.handsontable.com) use
     * URL that points to the "next" version e.g {HOST}/docs/next/data/common.json
     */
    if (buildMode !== 'production') {
      pathVersion = `${currentVersion}/`;
    } else if (window.location.host === 'dev.handsontable.com') {
      pathVersion = 'next/';
    }

    const response = await fetch(`${window.location.origin}/docs/${pathVersion}data/common.json`);
    const docsData = await response.json();
    const canonicalURLs = new Map(docsData.urls);

    siteData.pages.forEach((page) => {
      const frontmatter = page.frontmatter;
      const canonicalUrl = frontmatter.canonicalUrl;
      const canonicalUrlNorm = canonicalUrl.replace(/^\/docs\//, '').replace(/\/$/, '');

      if (canonicalURLs.has(canonicalUrlNorm) && canonicalURLs.get(canonicalUrlNorm) !== '') {
        const docsVersion = canonicalURLs.get(canonicalUrlNorm);

        frontmatter.canonicalUrl = canonicalUrl.replace(/^\/docs\//, `/docs/${docsVersion}/`);
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

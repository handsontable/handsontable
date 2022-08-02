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
    const framework = `${siteData.pages[0].currentFramework}${siteData.pages[0].frameworkSuffix}`;
    const devBuildMode = siteData.pages[0].isEnvDev;
    let pathVersion = `${currentVersion}/`;

    if (!devBuildMode) {
      pathVersion += `${framework}/`;
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
      page.frameworkedVersions = docsData.frameworkedVersions;
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

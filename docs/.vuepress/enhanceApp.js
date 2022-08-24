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
let isFirstPageGALoaded = true;
let isPageLoaded = false;

export default async({ router, siteData, isServer }) => {
  if (isServer) {
    return;
  }

  const currentVersion = siteData.pages[0].currentVersion;
  const buildMode = siteData.pages[0].buildMode;
  let pathVersion = '';

  if (buildMode !== 'production') {
    pathVersion = `${currentVersion}/`;
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

  router.options.scrollBehavior = function(to, from, savedPosition) {
    if (this.app.$vuepress.$get('disableScrollBehavior')) {
      return false;
    }

    let scrollPosition = { x: 0, y: 0 }; // page without hash

    if (savedPosition) {
      scrollPosition = savedPosition; // page from the browser navigation (back/forward)

    } else if (to.hash) {
      scrollPosition = {
        selector: to.hash,
        // top offset that matches to the "scroll-padding-top" (.vuepress/theme/styles/index.styl@34)
        // mostly it's the height of the top header plus some margin
        offset: { x: 0, y: 75 }
      };
    }

    let scrollResolver;

    const scrollPromise = new Promise((resolve) => {
      scrollResolver = resolve;
    });

    if (isPageLoaded) {
      if (to.path === from.path) {
        scrollResolver(scrollPosition);
      } else {
        setTimeout(() => scrollResolver(scrollPosition));
      }
    } else {
      window.onload = () => {
        isPageLoaded = true;
        scrollResolver(scrollPosition);
      };
    }

    return scrollPromise;
  };

  themeLoader();

  if (typeof window.ga === 'function') {
    router.afterEach((to) => {
      if (!isFirstPageGALoaded) {
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

      isFirstPageGALoaded = false;
    });
  }

  router.afterEach(buildRegisterCleaner(instanceRegister));
  router.afterEach(buildActiveHeaderLinkHandler());
};

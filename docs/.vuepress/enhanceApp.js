/* global GA_ID, ga */

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
  register.initPage();
};

// TODO: temporary disabled on September 29 (#9963)
// const buildActiveHeaderLinkHandler = () => {
//   let activeLink = null;

//   return (to, from) => {
//     if (to.hash !== from.hash) {
//       if (activeLink) {
//         activeLink.classList.remove('active');
//       }
//       // eslint-disable-next-line
//       activeLink = document.querySelector(`.table-of-contents a[href="${to.hash}"]`);

//       if (activeLink) {
//         activeLink.classList.add('active');
//       }
//     }
//   };
// };

/**
 * The variable prevents collect double page views for the initial page load.
 * For the first page load, the GA automatically registers pageview. For other
 * route changes, the event is triggered manually.
 */
let isFirstPageGALoaded = true;

export default async({ router, siteData, isServer }) => {
  if (isServer) {
    return;
  }

  const {
    currentVersion,
    buildMode,
    defaultFramework,
    frameworkSuffix,
  } = siteData.pages[0];

  // in watch mode redirect to page with default framework
  if (location.pathname === '/docs/' && currentVersion === 'next' && !buildMode) {
    location.replace(`${location.href}${defaultFramework}${frameworkSuffix}`);

    return;
  }

  let pathVersion = '';

  // Change path for `/data/common.json` file for developing released docs versions locally.
  if (buildMode !== 'production' && currentVersion !== 'next') {
    pathVersion = `${currentVersion}/`;
  }

  const response = await fetch(`${window.location.origin}/docs/${pathVersion}data/common.json`);
  const docsData = await response.json();

  siteData.pages.forEach((page) => {
    page.versions = docsData.versions;
    page.latestVersion = docsData.latestVersion;
    page.versionsWithPatches = new Map(docsData.versionsWithPatches);
  });

  router.afterEach((to) => {

    if (to.hash) {
      console.log('debugScrollbar::hashed', to);

      const element = document.querySelector(to.hash);

      if (element) {
        const offset = 75;
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;

        // Scroll to the element with the offset
        return window.scrollTo({
          top: elementPosition - offset,
          behavior: 'smooth',
        });
      }
    }
    console.log('debugScrollbar::nonhased', to);

    return window.scrollTo(0, 0);
  });

  // router.options.scrollBehavior = async(to, from) => {
  //   return { top: 0 };
  // };
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
  // TODO: temporary disabled on September 29 (#9963)
  // router.afterEach(buildActiveHeaderLinkHandler());
};

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

export default ({ router, isServer }) => {
  if (!isServer) {
    themeLoader();

    if (typeof window.ga === 'function') {
      router.afterEach((to) => {
        if (!isFirstPageLoaded) {
          ga.getAll().forEach((tracker) => {
            if (tracker.get('trackingId') === GA_ID) {
              tracker.set('page', router.app.$withBase(to.fullPath));
              tracker.send('pageview');
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

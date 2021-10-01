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

export default ({ router, isServer }) => {
  if (!isServer) {
    themeLoader();

    if (typeof window.ga === 'function') {
      router.afterEach((to) => {
        ga.getAll().forEach(tracker => {
          if (tracker.get('trackingId') === GA_ID) {
            tracker.set('page', router.app.$withBase(to.fullPath));
            tracker.send('pageview');
          }
        });
      });
    }

    router.afterEach(buildRegisterCleaner(instanceRegister));
    router.afterEach(buildActiveHeaderLinkHandler());
  }
};

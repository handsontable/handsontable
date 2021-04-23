// import RouterLink from './theme/components/RouterLink.vue';
const { logger } = require('./tools/utils');

const buildRegisterCleaner = register => (to, from) => {
  if (to.path === from.path) {
    return;
  }
  if (register === undefined) {
    logger.warn('The register doesn\'t exists');
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

export default ({ router, isServer }) => {
  if (!isServer) {
    // eslint-disable-next-line
    router.afterEach(buildRegisterCleaner(handsontableInstancesRegister));
    router.afterEach(buildActiveHeaderLinkHandler());
  }
};

// import RouterLink from './theme/components/RouterLink.vue';

const buildRegisterCleaner = (register) => (to,from,next) => {
    if(to.path === from.path) {
      return;
    }
    if(register === undefined){
        console.warn('The register doesn\'t exists');
        return;
    }
    register.destroyAll();
}

const buildActiveHeaderLinkHandler = () => {
  let activeLink = '';

  return (to, from) => {
    if(to.hash !== from.hash){
      if(activeLink){
        activeLink.classList.remove("active");
      }
      activeLink = document.querySelector('.table-of-contents a[href="'+to.hash+'"]');
      if(activeLink){
        activeLink.classList.add("active");
      }
    }
  }
}

export default ({ Vue, options, router, siteData, isServer }) => {
    if(!isServer) {
        router.afterEach(buildRegisterCleaner(handsontableInstancesRegister));
        router.afterEach(buildActiveHeaderLinkHandler());
    }
}

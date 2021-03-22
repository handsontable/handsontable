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

export default ({ Vue, options, router, siteData, isServer }) => {
    if(!isServer) {
      console.log(router);
      router.afterEach(buildRegisterCleaner(handsontableInstancesRegister));
    }
}

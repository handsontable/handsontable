// import RouterLink from './theme/components/RouterLink.vue';

const buildRegisterCleaner = (register) => () => {
    if(register === undefined){
        console.warn('The register doesn\'t exists');
        return;
    }

    register.destroyAll();
}

export default ({ Vue, options, router, siteData, isServer }) => {
    if(!isServer) {
        router.afterEach(buildRegisterCleaner(handsontableInstancesRegister));
    }
}

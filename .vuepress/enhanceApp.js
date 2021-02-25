// import RouterLink from './theme/components/RouterLink.vue';

const buildRegistryCleaner = (registry) => () => {
    if(registry === undefined){
        console.warn('The registry doesn\'t exists');
        return;
    }

    registry.forEach( instance => instance.destroy());
    registry.clear();
}

export default ({ Vue, options, router, siteData, isServer }) => {
    router.afterEach(buildRegistryCleaner(handsotnableInstancesRegister));
    // replace RouterLink component with ours
    // Vue.component('RouterLink', RouterLink);
}

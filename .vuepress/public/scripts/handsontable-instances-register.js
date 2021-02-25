'use strict';

const handsotnableInstancesRegister = (() => {
    const register = new Set();

    try {
        Handsontable.hooks.add('afterInit', function(){register.add(this);});
    } catch(e){
        console.error('handsotnableInstancesRegister initialization failed', e);
    }

    return register;
})();
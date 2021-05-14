/* eslint-disable no-restricted-globals, no-undef, no-console, no-unused-vars */

const register = new Map();

register.listen = () => {
  try {
    if (typeof Handsontable !== 'undefined' && Handsontable._instanceRegisterInstalled === undefined) {
      Handsontable._instanceRegisterInstalled = true;
      Handsontable.hooks.add('afterInit', function() {
        register.set(this.rootElement.id, this);
      });
    }
  } catch (e) {
    console.error('handsontableInstancesRegister initialization failed', e);
  }
};

register.destroyAll = () => {
  register.forEach(instance => instance.destroy());
  register.clear();
};

module.exports = { register };

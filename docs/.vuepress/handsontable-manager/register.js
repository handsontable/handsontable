/* eslint-disable no-restricted-globals, no-undef, no-console, no-unused-vars */

const register = new Set();

register.listen = () => {
  try {
    if (typeof Handsontable !== 'undefined' && Handsontable._instanceRegisterInstalled === undefined) {
      Handsontable._instanceRegisterInstalled = true;
      Handsontable.hooks.add('afterInit', function() {
        // Collect only HoT main instances. Skip context menu, dropdown menu
        // and other internal HoT-based components.
        if (this.rootElement.classList.contains('hot')) {
          register.add(this);
        }
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

const { useHandsontable } = require('./use-handsontable');
const { getDependencies } = require('./dependencies');
const { register } = require('./register');
const { themeManager } = require('./theme-manager');

if (module) {
  module.exports = {
    useHandsontable,
    instanceRegister: register,
    getDependencies,
    applyToWindow: () => {
      /* eslint-disable no-restricted-globals */
      if ((typeof window !== 'undefined')) {
        window.useHandsontable = useHandsontable;
        window.instanceRegister = register;
        window.hotThemeManager = themeManager;
      }
      /* eslint-enable no-restricted-globals */
    }
  };
}

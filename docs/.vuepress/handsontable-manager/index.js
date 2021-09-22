const { useHandsontable } = require('./use-handsontable');
const { getDependencies } = require('./dependencies');
const { register } = require('./register');

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
      }
      /* eslint-enable no-restricted-globals */
    }
  };
}

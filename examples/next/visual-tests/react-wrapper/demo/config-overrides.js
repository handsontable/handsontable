const path = require('path');
const fs = require('fs');

module.exports = (config, env) => {
  const fs = require('fs');

  if (fs.lstatSync(path.resolve('../node_modules/handsontable')).isSymbolicLink()) {
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.resolve('../node_modules/react'),
      'react-dom': path.resolve('../node_modules/react-dom'),
    };

    config.resolve.plugins = config.resolve.plugins.filter(
      plugin => plugin.constructor.name !== 'ModuleScopePlugin'
    );
  }

  return config;
};

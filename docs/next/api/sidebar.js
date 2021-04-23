const fs = require('fs');
const path = require('path');

const apiHighLevelPages = [
  'introduction',
  'core',
  'pluginHooks',
  'metaSchema'
];

const nonPublicPages = [
  'indexMapper',
  'baseEditor',
  'coords',
  'focusableElement',
];

module.exports = {
  sidebar: [
    ...apiHighLevelPages,
    {
      title: 'Plugins',
      path: `/${path.join(__dirname, '../').split('/').pop()}/api/plugins`,
      collapsable: false,
      children: fs.readdirSync(path.join(__dirname, './'))
        .filter(f => ![...nonPublicPages, ...apiHighLevelPages].includes(f.split('.').shift()))
    },
  ]
};

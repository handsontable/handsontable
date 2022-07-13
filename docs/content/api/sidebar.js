const fs = require('fs');
const path = require('path');

const apiHighLevelPages = [
  'introduction',
  'core',
  'pluginHooks',
  'metaSchema'
];

const plugins = fs.readdirSync(path.join(__dirname, './'))
  .filter((fileName) => {
    const file = fs.readFileSync(path.resolve(__dirname, fileName));

    return file.includes('hotPlugin: true\n');
  }).map(fileName => fileName.split('.').shift());

module.exports = {
  sidebar: [
    ...apiHighLevelPages,
    {
      title: 'Plugins',
      path: '/api/plugins',
      collapsable: false,
      children: plugins
    },
  ]
};

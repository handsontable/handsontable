const fs = require('fs');
const path = require('path');
const {
  getEnvDocsVersion,
  getLatestVersion,
} = require('../../.vuepress/helpers');

const apiHighLevelPages = [
  'introduction',
  'core',
  'hooks',
  'options'
];

const plugins = fs.readdirSync(path.join(__dirname, './'))
  .filter((fileName) => {
    const file = fs.readFileSync(path.resolve(__dirname, fileName));

    return file.includes('hotPlugin: true\n');
  }).map(fileName => fileName.split('.').shift());

const getUrlVersionPart = () => {
  const version = path.resolve(__dirname, '../').split('/').pop();

  return getLatestVersion() === version || getEnvDocsVersion() ? '' : `/${version}`;
};

module.exports = {
  sidebar: [
    ...apiHighLevelPages,
    {
      title: 'Plugins',
      path: `${getUrlVersionPart()}/api/plugins`,
      collapsable: false,
      children: plugins
    },
  ]
};

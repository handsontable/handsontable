const fs = require('fs');
const path = require('path');
const { getBuildDocsVersion, getLatestVersion } = require('../../.vuepress/helpers');

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
  'plugins',
  'focusableElement',
  'DataMap',
  'hidingMap',
  'indexesSequence',
  'trimmingMap',
  'samplesGenerator',
  'physicalIndexToValueMap',
  'ghostTable',
];

const getUrlVersionPart = () => {
  const version = path.resolve(__dirname, '../').split('/').pop();

  return getLatestVersion() === version || getBuildDocsVersion() ? '' : `/${version}`;
};

module.exports = {
  sidebar: [
    ...apiHighLevelPages,
    {
      title: 'Plugins',
      path: `${getUrlVersionPart()}/api/plugins`,
      collapsable: false,
      children: fs.readdirSync(path.join(__dirname, './'))
        .filter(f => !['sidebar', ...nonPublicPages, ...apiHighLevelPages].includes(f.split('.').shift()))
    },
  ]
};

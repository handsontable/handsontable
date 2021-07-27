module.exports = {
  pathToSource: '../../../../src',
  pathToDist: '../../../next/api',
  urlPrefix: '/next/api/',
  whitelist: [
    'dataMap/metaManager/metaSchema.js',
    'pluginHooks.js',
    'core.js',
    'translations/indexMapper.js',
    'editors/baseEditor/baseEditor.js',
    '3rdparty/walkontable/src/cell/coords.js',
    'plugins/copyPaste/focusableElement.js',
    'dataMap.js',
    'translations/maps/hidingMap.js',
    'translations/maps/indexesSequence.js',
    'translations/maps/trimmingMap.js',
    'utils/samplesGenerator.js',
    'translations/maps/physicalIndexToValueMap.js',
    'utils/ghostTable.js'
  ],
  seo: {
    'dataMap/metaManager/metaSchema.js': {
      title: 'Options',
      metaTitle: 'Options - API Reference - Handsontable Documentation',
      permalink: '/next/api/options'
    },
    'pluginHooks.js': {
      title: 'Hooks',
      metaTitle: 'Hooks - API Reference - Handsontable Documentation',
      permalink: '/next/api/hooks'
    },
    'core.js': {
      title: 'Core',
      metaTitle: 'Core - API Reference - Handsontable Documentation',
      permalink: '/next/api/core'
    },
    '3rdparty/walkontable/src/cell/coords.js': {
      title: 'CellCoords',
      metaTitle: 'CellCoords - API Reference - Handsontable Documentation',
      permalink: '/next/api/coords'
    }
  },
  linkAliases: {
    options: 'metaSchema',
    hooks: 'pluginHooks'
  }
};

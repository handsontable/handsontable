// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const contentPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../content');
// const contentDir = fs.existsSync(contentPath) ? 'content' : 'next';

export default {
  pathToSource: '../../../../src',
  pathToDist: '../../../content/api',
  urlPrefix: '/9.0/api/',
  seo: {
    'dataMap/metaManager/metaSchema.js': {
      title: 'Options',
      metaTitle: 'Options - API Reference - Handsontable Documentation',
      permalink: '/9.0/api/options'
    },
    'pluginHooks.js': {
      title: 'Hooks',
      metaTitle: 'Hooks - API Reference - Handsontable Documentation',
      permalink: '/9.0/api/hooks'
    },
    'core.js': {
      title: 'Core',
      metaTitle: 'Core - API Reference - Handsontable Documentation',
      permalink: '/9.0/api/core'
    },
    '3rdparty/walkontable/src/cell/coords.js': {
      title: 'CellCoords',
      metaTitle: 'CellCoords - API Reference - Handsontable Documentation',
      permalink: '/9.0/api/coords'
    }
  }
};

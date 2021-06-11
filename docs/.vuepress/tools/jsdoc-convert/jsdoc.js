/* eslint-disable no-useless-escape */
/// requires
const jsdoc2md = require('jsdoc-to-markdown'); // eslint-disable-line import/no-unresolved
const dmd = require('dmd'); // eslint-disable-line import/no-unresolved
const path = require('path');
const fs = require('fs');

const { logger } = require('../utils');

/// parameters
const pathToSource = '../../../../src';
const pathToDist = '../../../next/api';
const urlPrefix = '/next/api/';
const whitelist = [
  'dataMap/metaManager/metaSchema.js',
  'pluginHooks.js',
  'core.js',
  'translations/indexMapper.js',
  'editors/baseEditor/baseEditor.js',
  '3rdparty/walkontable/src/cell/coords.js',
  'plugins/copyPaste/focusableElement.js',
];

const seo = {
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
  'translations/indexMapper.js': {
    title: 'IndexMapper',
    metaTitle: 'IndexMapper - API Reference - Handsontable Documentation',
    permalink: '/next/api/index-mapper'
  },
  'editors/baseEditor/baseEditor.js': {
    title: 'BaseEditor',
    metaTitle: 'BaseEditor - API Reference - Handsontable Documentation',
    permalink: '/next/api/base-editor'
  },
  '3rdparty/walkontable/src/cell/coords.js': {
    title: 'CellCoords',
    metaTitle: 'CellCoords - API Reference - Handsontable Documentation',
    permalink: '/next/api/coords'
  },
  'plugins/copyPaste/focusableElement.js': {
    title: 'FocusableElement',
    metaTitle: 'FocusableElement - API Reference - Handsontable Documentation',
    permalink: '/next/api/focusable-element'
  },
};

/// classifications
const isOptions = data => data[0]?.meta.filename === 'metaSchema.js';
const isPlugin = data => data[0]?.customTags?.filter(tag => tag.tag === 'plugin' && tag.value).length > 0 ?? false;

/// paths construction
const source = file => path.join(__dirname, pathToSource, file);

const flat = file => file.split('/').pop();

const dist = file => path.join(__dirname, pathToDist, flat(file.replace(/(.*)\.js/, '$1.md')));

/// seo
const genSeoTitle = file => file
  .replace(/(^.*\/)?(.*?)\.[.a-zA-Z]*$/, '$2') // Get first filename segment (to the first dot) without full path
  // .replace(/([A-Z]+)/g, " $1") // Add spaces before each word
  .replace(/(^[a-z])/, m => m.toUpperCase()); // To upper first letter
const seoTitle = file => seo[file] && seo[file].title || genSeoTitle(file);

const genSeoMetaTitle = file => `${seoTitle(file)} - Plugin - Handsontable Documentation`; 
const seoMetaTitle = file => seo[file] && seo[file].metaTitle || genSeoMetaTitle(file);

const genSeoPermalink = file => file
  .replace(/(^.*\/)?(.*)\.[a-zA-Z]*$/, '$2') // Get filename without full path and extension
  .replace(/([A-Z]+)/g, '-$1') // Separate words
  .toLowerCase();
const seoPermalink = file => seo[file] && seo[file].permalink || urlPrefix + genSeoPermalink(file);

const seoCanonicalUrl = file => seoPermalink(file).replace('/next', '');

const header = (file) => {
  const title = seoTitle(file);

  return `---
title: ${title}
metaTitle: ${seoMetaTitle(file)}
permalink: ${seoPermalink(file)}
canonicalUrl: ${seoCanonicalUrl(file)}
editLink: false
---

# ${title}

[[toc]]
`;
};

/// post processing after markdown was generated
const fixLinks = text => text
  .replace(/\[([^\[]*?)]\(([^:]*?)(#[^#]*?)?\)/g, '[$1](./$2/$3)') // @see https://regexr.com/5nqqr
  .replace(/\.\/\//g, '');

const clearEmptyOptionHeaders = text => text.replace(/## Options\n## Members/g, '## Members');
const clearEmptyMembersHeaders = text => text.replace(/## Members\n## Methods/g, '## Methods');
const clearEmptyFunctionsHeaders = text => text
  .replace(/(## Methods\n)+$/g, '\n')
  .replace(/(## Methods\n## Methods\n\n## Description)/g, '## Description');

const fixTypes = text => text.replace(
  /(::: signame |\*\*Returns\*\*:|\*\*See\*\*:|\*\*Emits\*\*:)( ?[^\n-]*)/g,
  (_, part, signame) => {
    let suffix = '';
    let prefix = part;

    if (part === '::: signame ') {
      prefix = '_';
      suffix = '_';
    }
    const r = prefix + signame
      .replace(/([^\w`\[#])(`)?(IndexMapper)(#\w*)?(`)?/g, '$1[$2$3$4$5](./index-mapper/$4)')
      .replace(/([^\w`\[#])(`)?(Handsontable|Core)(#\w*)?(`)?/g, '$1[$2$3$4$5](./core/$4)')
      .replace(/([^\w`\[#])(`)?(Hooks)((#)(event:)?(\w*))?(`)?/g, '$1[$2$3$4$8](./hooks/$5$7)')
      .replace(/([^\w`\[#])(`)?(BaseEditor)(#\w*)?(`)?/g, '$1[$2$3$4$5](./base-editor/$4)')
      .replace(/([^\w`\[#])(`)?(CellCoords)(#\w*)?(`)?/g, '$1[$2$3$4$5](./coords/$4)')
      .replace(/([^\w`\[#])(`)?(FocusableWrapper)(#\w*)?(`)?/g, '$1[$2$3$4$5](./focusable-element/$4)')
      .replace(/\.</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/`\\\*`/, '`*`')
    + suffix;

    return r;
  }
);

const fixCategories = text => text.replace(
  /(\*\*Category\*\*: ?)([^\n- ]*)/g,
  (_, part, signame) => `${part}[${signame}](${genSeoPermalink(signame).replace('-', '../')})`
);

const unescapeRedundant = text => text
  .replace(/`[^`\n]*`/g, m => // get all inline codes
    m.replace(/\&lt;/g, '<')
      .replace(/\&gt;/g, '>')
      .replace(/\.</g, '<')
      .replace(/\\\*/g, '*')
      .replace(/\\_/g, '_')
  )
  .replace(/<\/ul>\./g, '</ul>') // remove redundant dot, which eslint enforce to add after list closing tag.
  .replace(/&quot;&#x27;/g, '"')
  .replace(/&#x27;&quot;/g, '"');

const postProcessors = [
  fixLinks,
  clearEmptyOptionHeaders,
  clearEmptyMembersHeaders,
  clearEmptyFunctionsHeaders,
  fixTypes,
  fixCategories,
  unescapeRedundant
];

const postProcess = initialText => postProcessors.reduce((text, postProcessor) => postProcessor(text), initialText);

/// post processing before markdown will be generated and after jsdoc was parsed
const sort = data => data.sort((m, p) => {
  if (m.kind === 'constructor' || m.kind === 'class') return -1;

  if (p.kind === 'constructor' || p.kind === 'class') return 1;

  return m.name.localeCompare(p.name);
});

const linkToSource = data => data.map((x) => {
  if (x.meta && x.meta.path && x.meta.filename && x.meta.lineno) {
    const filepath = path.relative(path.join(__dirname, '../../../../'), x.meta.path);
    const filename = x.meta.filename;
    const line = x.meta.lineno;

    x.sourceLink = `https://github.com/handsontable/handsontable/blob/develop/${filepath}/${filename}#L${line}`;
  }

  return x;
});

const optionsPerPlugin = {};
const memorizeOptions = data => (!isOptions(data) ? data : data.map((x) => {
  if (x.category) {
    const cat = x.category.trim();

    optionsPerPlugin[cat] = optionsPerPlugin[cat] || [];
    optionsPerPlugin[cat].push(x);
  }

  return x;
}));
const applyPluginOptions = (data) => {
  if (isPlugin(data)) {
    const plugin = data[0].customTags
      ?.filter(tag => tag.tag === 'plugin').pop()
      ?.value;

    const options = optionsPerPlugin[plugin]?.map((option) => {
      return {
        ...option,
        isOption: true,
        category: undefined,
        memberof: plugin // workaround to force print as a member.
      };
    }) ?? [];

    const index = data.findIndex(x => x.kind === 'constructor');

    data.splice(index + 1, 0, ...options);
  }

  return data;
};

const preProcessors = [
  sort,
  linkToSource,
  memorizeOptions,
  applyPluginOptions
];

const preProcess = initialData => preProcessors.reduce((data, preProcessor) => preProcessor(data), initialData);

/// jsdoc2md integration
const fromJsdoc = file => jsdoc2md.getTemplateDataSync({
  files: source(file),
  'no-cache': true,
});

const toMd = data => dmd(data, {
  noCache: true,
  partial: path.join(__dirname, 'dmd/partials/**/*.hbs'),
  template: '{{>hot-main~}}'
});

const parse = file => postProcess(toMd(preProcess(fromJsdoc(file))));

/// main logic
const write = (file, output) => {
  const match = file.match(/(.*\/)/);
  const dir = match && match[1];

  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(file, output);
};

const render = file => write(dist(file), header(file) + parse(file));

/// traverse files:
const traversePlugins = function* () {
  const items = fs.readdirSync(source('plugins'));

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (['base', '__tests__'].includes(item)) {
      continue; // eslint-disable-line no-continue
    }
    if (fs.statSync(source(path.join('plugins', item))).isDirectory()) {
      yield path.join('plugins', item, `${item}.js`);
    }
  }
};

const traverse = function* () {
  yield* whitelist;
  yield* traversePlugins();
};

/// program:
const errors = [];

for (const file of traverse()) { // eslint-disable-line no-restricted-syntax
  logger.log('Generating: ', source(file));
  try {
    render(file);
  } catch (e) {
    logger.error('ERROR: ', e);
    errors.push({ file, e });
  }
}
if (errors.length) {
  logger.warn(`Finished with ${errors.length} errors`, errors.map(x => x.file));
  process.exit(1);
}

logger.success('OK!');
process.exit(0);

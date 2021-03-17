/// requires
const jsdoc2md = require('jsdoc-to-markdown')
const dmd = require('dmd')
const path = require('path')
const fs = require('fs')

/// parameters
const pathToSource = '../../../../src';
const pathToDist = '../../../next/api';
const prefix = 'next/api/';
const whitelist = [
    'core.js',
    'pluginHooks.js',
    'dataMap/metaManager/metaSchema.js',
    'translations/indexMapper.js',
    'editors/baseEditor/baseEditor.js',
    '3rdparty/walkontable/src/cell/coords.js',
    'plugins/copyPaste/focusableElement.js',
];

const seo = {
    'dataMap/metaManager/metaSchema.js': {
        title: 'Options',
        permalink: '/next/api/options'
    },
    'pluginHooks.js': {
        title: 'Hooks',
        permalink: '/next/api/hooks'
    },
    'core.js': {
        title: 'Core',
        permalink: '/next/api/'
    },
    'translations/indexMapper.js': {
        title: 'IndexMapper',
        permalink: '/next/api/index-mapper'
    },
    'editors/baseEditor/baseEditor.js': {
        title: 'BaseEditor',
        permalink: '/next/api/base-editor'
    },
    '3rdparty/walkontable/src/cell/coords.js': {
        title: 'CellCoords',
        permalink: '/next/api/coords'
    },
    'plugins/copyPaste/focusableElement.js': {
        title: 'FocusableElement',
        permalink: '/next/api/focusable-element'
    },
}
/// paths construction
const source = (file) => path.join(__dirname, pathToSource, file);

const flat = (path) => path.split('/').pop();

const dist = (file) => path.join(__dirname, pathToDist, flat(file.replace(/(.*)\.js/, "$1.md")));

/// post processing after markdown was generated
const fixLinks = (text) => text
    .replace(/\[([^\[]*?)]\(([^:]*?)(#[^#]*?)?\)/g, "[$1](./$2/$3)") // @see https://regexr.com/5nqqr
    .replace(/\.\/\//g, '');

const clearEmptyMembersHeaders = (text) => text.replace(/## Members:\n## Methods:/g, '## Methods:');
const clearEmptyFunctionsHeaders = (text) => text.replace(/(## Methods:\n)+$/g, "\n");

const fixTypes = (text) => text.replace(/(::: signame |\*\*Returns\*\*:|\*\*See\*\*:)( ?[^\n]*)/g, (_, part, signame) => {
    let suffix='', prefix=part;
    if(part === '::: signame '){
        prefix = '_';
        suffix = '_';
    }
    const r = prefix+signame
        .replace(/([^\w`\[#])(`)?(IndexMapper)(#\w*)?(`)?/g, '$1[$2$3$4$5](./index-mapper/$4)')
        .replace(/([^\w`\[#])(`)?(Hooks)(#\w*)?(`)?/g, '$1[$2$3$4$5](./hooks/$4)')
        .replace(/([^\w`\[#])(`)?(BaseEditor)(#\w*)?(`)?/g, '$1[$2$3$4$5](./base-editor/$4)')
        .replace(/([^\w`\[#])(`)?(CellCoords)(#\w*)?(`)?/g, '$1[$2$3$4$5](./coords/$4)')
        .replace(/([^\w`\[#])(`)?(FocusableWrapper)(#\w*)?(`)?/g, '$1[$2$3$4$5](./focusable-element/$4)')
        .replace(/\.</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/`\\\*`/,'`*`')
        +suffix;
    return r;
});

const postProcessors = [
    fixLinks,
    clearEmptyMembersHeaders,
    clearEmptyFunctionsHeaders,
    fixTypes
];

const postProcess = (initialText) => postProcessors.reduce((text, postProcessor)=>postProcessor(text), initialText)

/// post processing before markdown will be generated and after jsdoc was parsed
const sort = (data) => data.sort((m,p)=>{
    if(m.kind==='constructor' || m.kind==='class') return -1;
    if(p.kind==='constructor' || p.kind==='class') return 1;
    return m.name.localeCompare(p.name);
})

const preProcessors = [
    sort
]

const preProcess = (initialData) => preProcessors.reduce((data, preProcessor)=>preProcessor(data), initialData)

/// jsdoc2md integration
const fromJsdoc = (file) => jsdoc2md.getTemplateDataSync({
    files: source(file),
    'no-cache': true,
});

const toMd = (data) => dmd(data, {
    'noCache': true,
    'partial': path.join(__dirname, 'dmd/partials/**/*.hbs'),
    'template': '{{>hot-main~}}'
});

const parse = (file) => postProcess(toMd(preProcess(fromJsdoc(file))));

/// seo
const genSeoTitle = (file) => file
    .replace(/(^.*\/)?(.*?)\.[.a-zA-Z]*$/, "$2") // Get first filename segment (to the first dot) without full path
    // .replace(/([A-Z]+)/g, " $1") // Add spaces before each word
    .replace(/(^[a-z])/, (m) => m.toUpperCase()); // To upper first letter
const seoTitle = (file) => seo[file] && seo[file].title || genSeoTitle(file);

const genSeoPermalink = (file) => '/'+prefix+file
    .replace(/(^.*\/)?(.*)\.[a-zA-Z]*$/, "$2") // Get filename without full path and extension
    .replace(/([A-Z]+)/g, "-$1") // Separate words
    .toLowerCase();
const seoPermalink = (file) => seo[file] && seo[file].permalink || genSeoPermalink(file);

const seoCanonicalUrl = (file) => seoPermalink(file).replace('/next','');

const header = (file) =>
    `---
title: ${seoTitle(file)}
permalink: ${seoPermalink(file)}
canonicalUrl: ${seoCanonicalUrl(file)}
---

# {{ $frontmatter.title }}

[[toc]]
`

/// main logic
const write = (file, output) => {
    const match = file.match(/(.*\/)/);
    const dir = match && match[1];
    if (dir && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
    }

    fs.writeFileSync(file, output);
}

const render = (file) => write(dist(file), header(file) + parse(file));

/// traverse files:
const traversePlugins = function* () {
    const items = fs.readdirSync(source('plugins'));

    for (const item of items) {
        if (fs.statSync(source(path.join('plugins', item))).isDirectory()) {
            yield path.join('plugins', item, item + '.js');
        }
    }
}

const traverse = function* () {
    yield* whitelist;
    yield* traversePlugins();
}

/// program:
const errors = [];
let i = 0;
for (const file of traverse()) {
    console.log(++i, 'Generating: ', source(file));
    try {
        render(file);
    } catch (e) {
        console.error('ERROR: ', e)
        errors.push({file, e})
    }
}
if (errors.length) {
    console.warn(`Finished with ${errors.length} errors`, errors.map(x => x.file));
    process.exit(1);
}

console.log('OK!');
process.exit(0);

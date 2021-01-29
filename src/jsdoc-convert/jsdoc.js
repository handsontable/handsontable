/// requires
const jsdoc2md = require('jsdoc-to-markdown')
const path = require('path')
const fs = require('fs')

/// parameters
const pathToSource = '../../../handsontable/src'; // after including in monorepo `../../../src`
const pathToDist = '../../next/api';
const prefix = 'api/';
const whitelist = ['core.js', 'pluginHooks.js', 'dataMap/metaManager/metaSchema.js'];

const seo = {
    'dataMap/metaManager/metaSchema.js': {
        title: 'Options',
        sidebarLabel: 'Options',
        slug: '/api/options'
    },
    'pluginHooks.js': {
        title: 'Hooks',
        sidebarLabel: 'Hooks',
        slug: '/api/hooks'
    },
    'core.js': {
        title: 'Core',
        sidebarLabel: 'Core',
        slug: '/api/core'
    }
}
/// paths construction
const source = (file) => path.join(__dirname, pathToSource, file);
const dist = (file) => path.join(__dirname, pathToDist, file.replace(/(.*)\.js/, "$1.md"));

/// jsdoc2md integration
const parse = (file) => jsdoc2md.renderSync({
    files: source(file),
    'no-cache': true,
    'partial': path.join(__dirname, 'dmd/partials/**/*.hbs'),
    'template': '{{>hot-main~}}'

});

/// seo
const genSeoId = (file) => file
    .replace(/(^.*\/)?(.*)\.[a-zA-Z]*$/, "$2") // Get filename without full path and extension
    .replace(/([A-Z]+)/g, "-$1") // Separate words
    .replace(/^true$/, "true-") // `true` makes error in Docusaurus :(
    .toLowerCase();
const genFullId = (file) => `${prefix}${file}`
    .replace(/(.*\/).*$/, "$1" + genSeoId(file)); // Because full id (used in sidebar) includes all path in a doc and filename without extension.
const seoId = (file) => genSeoId(file); // I won't have customization for it.

const genSeoTitle = (file) => file
    .replace(/(^.*\/)?(.*?)\.[.a-zA-Z]*$/, "$2") // Get first filename segment (to the first dot) without full path
    // .replace(/([A-Z]+)/g, " $1") // Add spaces before each word
    .replace(/(^[a-z])/, (m) => m.toUpperCase()); // To upper first letter
const seoTitle = (file) => seo[file] && seo[file].title || genSeoTitle(file);

const genSeoSidebarLabel = (file) => genSeoTitle(file);
const seoSidebarLabel = (file) => seo[file] && seo[file].sidebarLabel || genSeoSidebarLabel(file);

const genSeoSlug = (file) => '/'+prefix+file
    .replace(/(^.*\/)?(.*)\.[a-zA-Z]*$/, "$2") // Get filename without full path and extension
    .replace(/([A-Z]+)/g, "-$1") // Separate words
    .toLowerCase();
const seoSlug = (file) => seo[file] && seo[file].slug || genSeoSlug(file);

const admonitions = (file) =>
    `---
id: ${seoId(file)}
title: ${seoTitle(file)}
sidebar_label: ${seoSidebarLabel(file)}
slug: ${seoSlug(file)}
---
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

const render = (file) => write(dist(file), admonitions(file) + parse(file));

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

/// sidebar:
const sidebar = [{type: 'category', label: 'Plugins', items: []}];

const addToSidebar = (file) => {
    file.startsWith('plugins/')
        ? sidebar[sidebar.length - 1].items.push(genFullId(file))
        : sidebar.splice(sidebar.length - 1, 0, genFullId(file))
};
/// program:
const errors = [];
let i = 0;
for (const file of traverse()) {
    console.log(++i, 'Generating: ', file);
    // if(i>6) break;
    try {
        render(file);
        addToSidebar(file);
    } catch (e) {
        console.error('ERROR: ', e)
        errors.push({file, e})
    }
}
sidebar.unshift('api-introduction');
fs.writeFileSync(path.join(__dirname, 'sidebar.js'), 'module.exports=' + JSON.stringify(sidebar) + ';');
if (errors.length) {
    console.warn(`Finished with ${errors.length} errors`, errors.map(x => x.file));
    process.exit(1);
}

console.log('OK!');
process.exit(0);

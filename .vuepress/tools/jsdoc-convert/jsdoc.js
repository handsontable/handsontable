/// requires
const jsdoc2md = require('jsdoc-to-markdown')
const path = require('path')
const fs = require('fs')

/// parameters
const pathToSource = '../../../../handsontable/src'; // after including in monorepo `../../../src`
const pathToDist = '../../../next/api';
const prefix = 'next/api/';
const whitelist = ['core.js', 'pluginHooks.js', 'dataMap/metaManager/metaSchema.js'];

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
        permalink: '/next/api/core'
    }
}
/// paths construction
const source = (file) => path.join(__dirname, pathToSource, file);

const flat = (path) => path.split('/').pop();

const dist = (file) => path.join(__dirname, pathToDist, flat(file.replace(/(.*)\.js/, "$1.md")));

/// fix links to works with vuepress
const fixLinks = (text) => text
    .replace(/\[([^\[]*?)]\(([^:]*?)(#[^#]*?)?\)/g, "[$1](./$2/$3)") // @see https://regexr.com/5nqqr
    .replace(/\.\/\//g, '');

/// jsdoc2md integration
const parse = (file) => fixLinks(jsdoc2md.renderSync({
    files: source(file),
    'no-cache': true,
    'partial': path.join(__dirname, 'dmd/partials/**/*.hbs'),
    'template': '{{>hot-main~}}'

}));

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

const seoCanonicalUrl = (file) => genSeoPermalink(file).replace('/next','');

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
    console.log(++i, 'Generating: ', file);
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

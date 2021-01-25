`node jsdoc.js` - generates API Referance

On the top o that file it might be configured:

```js
/// parameters
const pathToSource = '../../../../handsontable/src';
const pathToDist = '../../../next/api';
const prefix = 'api/';
const whitelist = ['core.js', 'pluginHooks.js', /* todo not working*/'dataMap/metaManager/metaSchema.js'];

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
```

For customizating a template goes into ./dmd/partials. Thera are all partials from `dmd` package (which render markdown files from parsed jsdoc). To replace a partial, please add prefix `hot-` and find and rename all usages (partials are used by code: `{{>partialname}}).
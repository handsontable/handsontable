`node jsdoc.js` - generates API Reference

On the top o that file it might be configured:

```js
/// parameters
const pathToSource = '../../../handsontable/src'; // after including in monorepo `../../../src`
const pathToDist = '../../next/api';
const prefix = 'api/';
const whitelist = ['core.js', 'pluginHooks.js', 'dataMap/metaManager/metaSchema.js'];

const seo = {
    'dataMap/metaManager/metaSchema.js': {
        title: 'Options',
        permalink: '/api/options'
    },
    'pluginHooks.js': {
        title: 'Hooks',
        permalink: '/api/hooks'
    },
    'core.js': {
        title: 'Core',
        permalink: '/api/core'
    }
}
```

For customizing a template goes into `./dmd/partials`. There are all partials from `dmd` package (which render markdown files from parsed jsdoc). To replace a partial, please add prefix `hot-` and find and rename all usages.
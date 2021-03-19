`node jsdoc.js` - generates API Reference

On the top o that file it might be configured by setting consts:

```js
/// parameters
const pathToSource = ...;
const pathToDist = ...;
const prefix = ...;
const whitelist = ...;
const seo = ...;
```

For customizing a template goes into `./dmd/partials`. There are all partials from `dmd` package (which render markdown files from parsed jsdoc). To replace a partial, please add prefix `hot-` and find and rename all usages.

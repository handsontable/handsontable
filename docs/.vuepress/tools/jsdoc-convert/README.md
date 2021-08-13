`node index.js` - generates API Reference

All configuration was moved into `configuration.js` file.

```js
module.exports = {
  pathToSource: '../../../../src',
  pathToDist: '../../../next/api',
  urlPrefix: '/next/api/',
  whitelist: [ /* ... */ ], // todo it will be removed.
  seo: {
    'dataMap/metaManager/metaSchema.js': {
      title: 'Options',
      metaTitle: 'Options - API Reference - Handsontable Documentation',
      permalink: '/next/api/options'
    },
    /* ... */
  },
  linkAliases: {
    options: 'metaSchema',
    hooks: 'pluginHooks'
  }
};

```

For customizing a template goes into `./integrations/jsdoc-to-markdown/dmd/partials`. There are all partials from `dmd` package (which render markdown files from parsed jsdoc). To replace a partial, please add prefix `hot-` and find and rename all usages.


## Dependency flow

<details>
<summary>PlantUML code</summary>

[Edit](https://www.planttext.com/?text=XP8zRyCW48PtViKfark9MEhOeShQeMrsomE2Y-KaWCMTsqfL_dkndI2tnWe22RZdlbxO4Ql0lJqBw9G-gGPXyxv_UuOZ6QybUsbLE1d_vJRm8o2ErZ66Wz8u8K_M2BW8aRmdH-tT9mQUd99jy6s2ujOxAbSpLCQQ4egFdhkUWT5sPyL83_LaRPt1xwqz4XIlrtW-ZCPBN75MNS1zy1g9V1Z0-lybbO_rZVN46NX-EwS3cbOF2IcnXFws7uwnyqFRz5ENsokJQgv5r6gj1P2oxwGieBf9Muj5tJ0mBvbIPc4JjAPL1bsATWSQPSanIqNlKMEebNn_cymmIV-SSVaQOeVEn0__2m00)

```plantuml
@startuml
 package "NPM: jsdoc-to-markdown" {
    interface jsdoc2md
 }

package "jsdoc-convert" {
  package "integrations/jsdoc-to-markdown" {
    [dmd/ (Output templates)]
    [index.mjs (Integrator)]
  }
  
  [preProcessor.mjs]
  [preProcessors/*]
  
  [postProcessor.mjs]
  [postProcessors/*]
  
  [predicators.mjs]
  [seo.mjs]
  
  [configuration.js]
  [index.mjs]
}

[index.mjs (Integrator)] --up--( [jsdoc2md]
[preProcessors/*] -up-> [predicators.mjs]

[index.mjs] -up-> [index.mjs (Integrator)]
[index.mjs] -up-> [preProcessor.mjs]
[index.mjs] -up-> [preProcessors/*]
[index.mjs] -up-> [postProcessor.mjs]
[index.mjs] -up-> [postProcessors/*]

[index.mjs] -up-> [predicators.mjs]
[index.mjs] -up-> [seo.mjs]

[index.mjs] -up-> [configuration.js]

@enduml
```
</details>

![Dependency flow](./dependency-flow.png)

---
id: l59xqo44
title: Changelog 17.0
metaTitle: Changelog 17.0 - JavaScript Data Grid | Handsontable
description: See the full history of changes made to Handsontable 17.0 in each minor and patch release.
permalink: /changelog-17
canonicalUrl: /changelog-17
react:
  id: tgfvndey
  metaTitle: Changelog 17.0 - React Data Grid | Handsontable
angular:
  id: wyn633o3
  metaTitle: Changelog 17.0 - Angular Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---
## 17.0.0

Released on March 9th, 2026

For more information about this release, see:

<div class="boxes-list gray">

- [Blog post (17.0.0)](https://handsontable.com/blog/handsontable-17.0.0-multiselect-cell-type-simpler-custom-cells-and-a-new-themes-api)
- [Documentation (17.0)](https://handsontable.com/docs/17.0)
- [Migration guide (16.2 → 17.0)](@/guides/upgrade-and-migration/migrating-from-16.2-to-17.0/migrating-from-16.2-to-17.0.md)

</div>

#### Added
- **Breaking change**: Added the Theme API. [#11950](https://github.com/handsontable/handsontable/pull/11950)
- Introduced a simple way to define custom editors using the new `BaseEditor.factory` method. [#11899](https://github.com/handsontable/handsontable/pull/11899)
- Implemented a new MultiSelect cell type with a dedicated editor, renderer, and validator. [#11981](https://github.com/handsontable/handsontable/pull/11981)
- Added support for `Intl.NumberFormat` options. [#11997](https://github.com/handsontable/handsontable/pull/11997)
- Added support for `Intl.DateTimeFormat` options. [#11999](https://github.com/handsontable/handsontable/pull/11999)
- Added a copy-as-Markdown button to the documentation pages. [#12009](https://github.com/handsontable/handsontable/pull/12009)
- Added a new `sanitizer` table option. [#12016](https://github.com/handsontable/handsontable/pull/12016)
- React: Introduced a simple way to define custom editors using the new `ComponentEditor`. [#11978](https://github.com/handsontable/handsontable/pull/11978)

#### Changed
- Improved differentiation between Handsontable errors and other errors. [#11780](https://github.com/handsontable/handsontable/pull/11780)
- Reverted the editors' `updateChoicesList` method type change. [#11943](https://github.com/handsontable/handsontable/pull/11943)
- Added a hit area to the fill handle. [#11952](https://github.com/handsontable/handsontable/pull/11952)
- Added a new `parsePastedValue` option to fix issues with pasting object-based values. [#12020](https://github.com/handsontable/handsontable/pull/12020)
- Introduced a new publishing flow for versions 17.0.0 and above. [#12028](https://github.com/handsontable/handsontable/pull/12028)

#### Deprecated
- Deprecated **numbro.js** for numeric formatting. Copy it to your project or replace it with the `Intl.NumberFormat` API. [Migration guide](https://handsontable.com/docs/javascript-data-grid/migration-from-16.2-to-17.0#_3-migrate-from-numbro-format-to-intl-numberformat)
- Deprecated **Pikaday** for date picking. Switch to native date input. [Migration guide](https://handsontable.com/docs/javascript-data-grid/recipes/cell-types/pikaday)
- Deprecated **moment.js** for date parsing and display. Replace it with the `Intl.DateTimeFormat` API. [Migration guide](https://handsontable.com/docs/javascript-data-grid/migration-from-16.2-to-17.0#_4-migrate-from-moment-js-format-to-intl-datetimeformat)
- Deprecated **DOMPurify** as a built-in XSS sanitizer. Use the new `sanitizer` option or convert content to plain text. [Migration guide](https://handsontable.com/docs/javascript-data-grid/migration-from-16.2-to-17.0#_5-migrate-from-built-in-dompurify-to-the-sanitizer-option)
- Deprecated **core-js** polyfills for ECMAScript features. [Migration guide](https://handsontable.com/docs/javascript-data-grid/migration-from-16.2-to-17.0#_6-core-js-dependency-removed)
- Deprecated bundling **HyperFormula** as a Handsontable dependency. Starting from version 18.0, install and import it separately, then pass it to the Formulas plugin with `licenseKey: 'internal-use-in-handsontable'`. [Formula calculation](https://handsontable.com/docs/javascript-data-grid/formula-calculation)

#### Removed
- **Breaking change**: Removed deprecated wrapper packages for Angular, React, and Vue, the `PersistentState` plugin, and the legacy undo/redo methods. [#12015](https://github.com/handsontable/handsontable/pull/12015)
- **Breaking change**: Removed `core-js` from dependencies. [#12017](https://github.com/handsontable/handsontable/pull/12017)
- **Breaking change**: Removed the legacy CSS stylesheets (e.g. `handsontable.full.min.css`), which were the default styling prior to version 16. [#11950](https://github.com/handsontable/handsontable/pull/11950)
- Removed the `languages` folder from git + updated the `17.0+` release workflow. [#12049](https://github.com/handsontable/handsontable/pull/12049)

#### Fixed
- Fixed errors triggered by certain keyboard shortcuts. [#11951](https://github.com/handsontable/handsontable/pull/11951)
- Fixed unwanted layout shifts caused by the editor. [#11955](https://github.com/handsontable/handsontable/pull/11955)
- Fixed an issue with scrolling in Firefox. [#11962](https://github.com/handsontable/handsontable/pull/11962)
- Fixed an issue with viewport scroll after calling `loadData()`/`updateData()`. [#11985](https://github.com/handsontable/handsontable/pull/11985)
- Fixed a bug where the pasted value could not be changed. [#11989](https://github.com/handsontable/handsontable/pull/11989)
- Fixed misalignment issues when using `CSS transform: scale()`. [#11990](https://github.com/handsontable/handsontable/pull/11990)
- Fixed a bug that made it impossible to delete values from key/value-based autocomplete and dropdown cells. [#12010](https://github.com/handsontable/handsontable/pull/12010)
- Fixed a Data Factory issue in filters that could return zero results even when matches exist. [#12031](https://github.com/handsontable/handsontable/pull/12031)
- Changed the element type for focus catchers. [#12032](https://github.com/handsontable/handsontable/pull/12032)
- Fixed incorrect scrollbar width calculation for scaled environments. [#12035](https://github.com/handsontable/handsontable/pull/12035)
- Fixed and issue with column headers styles [#12058](https://github.com/handsontable/handsontable/pull/12058)
- Angular: Fixed a problem with the Angular wrapper that broke builds done with a disabled `skipLibCheck`. [#12091](https://github.com/handsontable/handsontable/pull/12091)

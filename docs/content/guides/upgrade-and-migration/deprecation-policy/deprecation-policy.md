---
type: explanation
id: 4f25a767
title: Deprecation policy
metaTitle: Deprecation policy - JavaScript Data Grid | Handsontable
description: Handsontable ensures that if API is marked deprecated, we commit to a grace period (at least 3 months) during which the deprecated feature still works.
permalink: /deprecation-policy
canonicalUrl: /deprecation-policy
react:
  id: 16cb9e4b
  metaTitle: Deprecation policy - React Data Grid | Handsontable
angular:
  id: d5ac977b
  metaTitle: Deprecation policy - Angular Data Grid | Handsontable
vue:
  id: yqn3hlb4
  metaTitle: Deprecation policy - Vue Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---
This page explains how Handsontable handles deprecated APIs -- including the grace period before removal and how you will be notified.

Deprecation occurs when better alternatives emerge that offer improved performance, security, or usability compared to existing implementations. It also helps maintain API consistency by removing redundant or inconsistent functions, creating a cleaner overall design. As web standards and the JavaScript ecosystem evolve, certain approaches become obsolete or suboptimal, requiring updates to stay current. Additionally, deprecation reduces maintenance complexity by phasing out rarely-used or problematic features, while addressing potential security vulnerabilities in older implementations. Rather than introducing breaking changes, deprecation provides a gradual migration path that gives developers time to adapt while clearly signaling the library's future direction.

After a Handsontable feature, a framework wrapper or any other part of the API is marked deprecated, we commit to a **grace period** **(at least 3 months)** during which the deprecated feature still works. We will not remove the feature immediately in the next minor or patch release. Instead, removal is deferred until a future **major release**, in accordance with semantic versioning.


[[toc]]

## Support

During the deprecation period:
*   We will fix **critical bugs** and **security vulnerabilities** in the deprecated feature.
*   We will not add new enhancements for deprecated APIs.
*   Full stability and long-term support are guaranteed only within LTS releases.

## Relation to LTS

Handsontable follows a **Long-Term Support (LTS)** model, where every even-numbered major release becomes an LTS release with ~30 months of support.
For more details, please visit [Long Term Support](@/guides/upgrade-and-migration/long-term-support/long-term-support.md).


## Deprecation notifications

We will announce deprecations and removals through release notes accompanied by blog posts. Additionally, deprecated features may show console warnings in development builds. Deprecated APIs will be clearly marked in our documentation with a recommended alternative (if possible).

For significant deprecations (especially those affecting many users), we will provide dedicated **Migration Guides**.

For more details about our versioning policy please visit [Versioning policy](@/guides/upgrade-and-migration/versioning-policy/versioning-policy.md)

## List of deprecations

Below is a list of current deprecations that are planned to be removed in the next major version.

| Deprecation | Description | Migration guide |
| ----------- | ----------- | --------------- |
| **numbro.js** | Handles numeric data. Copy to the project, or replace with [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat). Needed for Excel compat. | [Migrate from 16.2 to 17.0 → Numbro](@/guides/upgrade-and-migration/migrating-from-16.2-to-17.0/migrating-from-16.2-to-17.0.md#_3-migrate-from-numbro-format-to-intl-numberformat) |
| **Pikaday** | Displays a date picker. Switch to native date input. Has its own task. | [Pikaday recipe](@/recipes/cell-types/pikaday/pikaday.md) |
| **moment.js** | Parses, validates and displays dates. Needed for Excel compat. | [Migrate from 16.2 to 17.0 → Date/Time](@/guides/upgrade-and-migration/migrating-from-16.2-to-17.0/migrating-from-16.2-to-17.0.md#_4-migrate-from-moment-js-format-to-intl-datetimeformat) |
| **DOMPurify** | An XSS sanitizer for HTML. Use the `sanitizer` option to keep a sanitizer, or convert content to plain text. | [Migrate from 16.2 to 17.0 → DOMPurify](@/guides/upgrade-and-migration/migrating-from-16.2-to-17.0/migrating-from-16.2-to-17.0.md#_5-migrate-from-built-in-dompurify-to-the-sanitizer-option) |
| **core-js** | Polyfills for ECMAScript 5, ECMAScript 6, promises, symbols, collections. | [Migrate from 16.2 to 17.0 → core-js](@/guides/upgrade-and-migration/migrating-from-16.2-to-17.0/migrating-from-16.2-to-17.0.md#_6-core-js-dependency-removed) |
| **Built-in HyperFormula** | The Formulas plugin engine. Will be removed from package.json in 18.0. Import HyperFormula yourself and pass it to the Formulas plugin with `licenseKey: 'internal-use-in-handsontable'`. | [Formula calculation](@/guides/formulas/formula-calculation/formula-calculation.md) |



## Related

- [Versioning policy](@/guides/upgrade-and-migration/versioning-policy/versioning-policy.md)
- [Long-term support](@/guides/upgrade-and-migration/long-term-support/long-term-support.md)

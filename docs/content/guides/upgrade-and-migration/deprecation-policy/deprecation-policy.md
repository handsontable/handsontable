---
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
searchCategory: Guides
category: Upgrade and migration
---

# Deprecation policy

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

Below is a list of current deprecations that are planned to be removed in next major version. 

|                              | Reference                                                                                                    | Migration guide |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------- |
| React class-based wrapper    | <span style="padding-right: 20px;">[npm package](https://www.npmjs.com/package/@handsontable/react)</span>   | [Migrate to New React Wrapper](@/guides/upgrade-and-migration/migrating-from-14.6-to-15.0/migrating-from-14.6-to-15.0.md#migration-steps) |
| Angular legacy wrapper       | <span style="padding-right: 20px;">[npm package](https://www.npmjs.com/package/@handsontable/angular)</span> | [Switch to new Angular wrapper](@/guides/upgrade-and-migration/migrating-from-15.3-to-16.0/migrating-from-15.3-to-16.0.md#_4-switched-to-the-new-angular-wrapper-for-angular-16) |
| Vue2 wrapper                 | <span style="padding-right: 20px;">[npm package](https://www.npmjs.com/package/@handsontable/vue)</span>     | [Move to Vue 3](@/guides/integrate-with-vue3/vue3-installation/vue3-installation.md) |
| Legacy style                 | [Documentation](@/guides/styling/legacy-style/legacy-style.md)                                               | [Migrate to Classic Theme](@/guides/upgrade-and-migration/migrating-from-16.0-to-16.1/migrating-from-16.0-to-16.1.md#_1-migrate-from-legacy-styles-to-classic-theme)  |
| `persistentState` plugin     | [API Reference](@/api/persistentState.md#persistentstate-2)                                                  | Please update your settings to ensure compatibility with future versions. |
| `hot.undo` method            | [API Reference](@/api/core.md#undo)                                                                          | Replace with UndoRedo plugin [undo](@/api/undoRedo.md#undo) method. |
| `hot.redo` method            | [API Reference](@/api/core.md#redo)                                                                          | Replace with UndoRedo plugin [redo](@/api/undoRedo.md#redo) method. |
| `hot.isUndoAvailable` method | [API Reference](@/api/core.md#isundoavailable)                                                               | Replace with UndoRedo plugin [isUndoAvailable](@/api/undoRedo.md#isundoavailable) method. |
| `hot.isRedoAvailable` method | [API Reference](@/api/core.md#isredoavailable)                                                               | Replace with UndoRedo plugin [isRedoAvailable](@/api/undoRedo.md#isredoavailable) method. |
| `hot.clearUndo` method       | [API Reference](@/api/core.md#clearundo)                                                                     | Replace with UndoRedo plugin [clear](@/api/undoRedo.md#clear) method. |


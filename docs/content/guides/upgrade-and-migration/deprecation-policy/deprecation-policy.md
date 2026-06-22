---
type: explanation
title: Deprecation policy
metaTitle: Deprecation policy - JavaScript Data Grid | Handsontable
description: Handsontable ensures that if API is marked deprecated, we commit to a grace period (at least 3 months) during which the deprecated feature still works.
permalink: /deprecation-policy
canonicalUrl: /deprecation-policy
react:
  metaTitle: Deprecation policy - React Data Grid | Handsontable
angular:
  metaTitle: Deprecation policy - Angular Data Grid | Handsontable
vue:
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

## Removed in version 18.0

The following dependencies were deprecated in version 17.0 and removed in version 18.0.

| Removed | Description | Migration guide |
| ------- | ----------- | --------------- |
| **numbro.js** | Handled numeric data formatting. Replace with [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat). | [Migrate from 17.1 to 18.0 → Numeric formatting](@/guides/upgrade-and-migration/migrating-from-17.1-to-18.0/migrating-from-17.1-to-18.0.md#2-migrate-numeric-format-from-numbro-js-pattern-and-culture-to-intlnumberformat) |
| **Pikaday** | Displayed a date picker. The `intl-date` cell type now uses the native browser date picker. | [Migrate from 17.1 to 18.0 → Date/Time](@/guides/upgrade-and-migration/migrating-from-17.1-to-18.0/migrating-from-17.1-to-18.0.md#3-migrate-date-and-time-cells-to-iso-8601-format) |
| **moment.js** | Parsed, validated, and displayed dates. The `intl-date` and `intl-time` cell types use the native `Intl.DateTimeFormat` API. | [Migrate from 17.1 to 18.0 → Date/Time](@/guides/upgrade-and-migration/migrating-from-17.1-to-18.0/migrating-from-17.1-to-18.0.md#3-migrate-date-and-time-cells-to-iso-8601-format) |
| **DOMPurify** | An XSS sanitizer for HTML. Use the `sanitizer` option to provide your own sanitizer function. | [Migrate from 17.1 to 18.0 → HTML sanitization](@/guides/upgrade-and-migration/migrating-from-17.1-to-18.0/migrating-from-17.1-to-18.0.md#4-replace-built-in-dompurify-with-a-custom-sanitizer) |

## List of current deprecations

The following methods were deprecated in version 18.0 and are scheduled for removal in a future major release. They are no-ops kept for backward compatibility, as the `PersistentState` plugin has been removed.

| Deprecated | Plugin | Migration guide |
| ---------- | ------ | --------------- |
| `saveManualColumnWidths()` | `ManualColumnResize` | [Migrate from 17.1 to 18.0 → Resize-state methods](@/guides/upgrade-and-migration/migrating-from-17.1-to-18.0/migrating-from-17.1-to-18.0.md#5-stop-calling-deprecated-resize-state-methods) |
| `loadManualColumnWidths()` | `ManualColumnResize` | [Migrate from 17.1 to 18.0 → Resize-state methods](@/guides/upgrade-and-migration/migrating-from-17.1-to-18.0/migrating-from-17.1-to-18.0.md#5-stop-calling-deprecated-resize-state-methods) |
| `saveManualRowHeights()` | `ManualRowResize` | [Migrate from 17.1 to 18.0 → Resize-state methods](@/guides/upgrade-and-migration/migrating-from-17.1-to-18.0/migrating-from-17.1-to-18.0.md#5-stop-calling-deprecated-resize-state-methods) |
| `loadManualRowHeights()` | `ManualRowResize` | [Migrate from 17.1 to 18.0 → Resize-state methods](@/guides/upgrade-and-migration/migrating-from-17.1-to-18.0/migrating-from-17.1-to-18.0.md#5-stop-calling-deprecated-resize-state-methods) |



## Related

- [Versioning policy](@/guides/upgrade-and-migration/versioning-policy/versioning-policy.md)
- [Long-term support](@/guides/upgrade-and-migration/long-term-support/long-term-support.md)

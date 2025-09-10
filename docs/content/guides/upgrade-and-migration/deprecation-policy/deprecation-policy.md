---
id: 4f25a767
title: Deprecation policy
metaTitle: Deprecation policy - JavaScript Data Grid | Handsontable
description: Handsontable ensures that if API is marked deprecated, we commit to a grace period (at least 4 months) during which the deprecated feature still works.
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

After a feature, wrapper or any other part of the API is marked deprecated, we commit to a **grace period** **(at least 4 months)** during which the deprecated feature still works. We will not remove the feature immediately in the next minor or patch release. Instead, removal is deferred until a future **major release**, in accordance with semantic versioning.


[[toc]]

## Support

During the deprecation period:
*   We will fix **critical bugs** and **security vulnerabilities** in the deprecated feature.
*   We will not add new enhancements or provide full support for deprecated APIs.
*   Full stability and long-term support are guaranteed only within LTS releases.

## Relation to LTS

Handsontable follows a **Long-Term Support (LTS)** model, where every even-numbered major release becomes an LTS release with ~30 months of support.
For more details, please visit [Long Time Support](@/guides/upgrade-and-migration/long-time-support/long-time-support.md).


## Deprecation notifications

We will announce deprecations and removals through release notes accompanied by blog posts. Additionally, deprecated features may show console warnings in development builds. Deprecated APIs will be clearly marked in our documentation with a recommended alternative (if possible).

For significant deprecations (especially those affecting many users), we will provide dedicated **Migration Guides**, particularly when the removal coincides with the release of a new LTS.

For more details about our versioning policy please visit [Versioning policy](@/guides/upgrade-and-migration/versioning-policy/versioning-policy.md)
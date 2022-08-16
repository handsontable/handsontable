---
title: Versioning policy
metaTitle: Versioning policy - Guide - Handsontable Documentation
permalink: /versioning-policy
canonicalUrl: /versioning-policy
---

# Versioning policy

[[toc]]

Handsontable follows the principles of [Semantic Versioning](https://semver.org/).

We use the version format of X.Y.Z (Major.Minor.Patch), incrementing them when a certain type of change occurs to the code.

The following table outlines which number would change when a Major, Minor, or Patch release occurs:

| Type  | Version number | Description                                                                                                                               |
| ----- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Major | X (X.y.z)      | Any backward-incompatible changes are introduced to the public API.                                                                       |
| Minor | Y (x.Y.z)      | New backward-compatible functionality is introduced to the public API, or if any public API functionality is marked as deprecated.        |
| Patch | Z (x.y.Z)      | Backward-compatible bug fixes are introduced. We define a bug fix as an internal change that fixes an incorrect behavior of Handsontable. |

::: only-for javascript
## Versioning of framework variants

Up to Handsontable 8.3.2, each framework variant of Handsontable was versioned separately:
- [Vanilla JavaScript](@/guides/getting-started/introduction.md)
- [React wrapper](../../react-data-grid)
- [Angular wrapper](@/guides/integrate-with-angular/angular-installation.md)
- [Vue 2 wrapper](@/guides/integrate-with-vue/vue-installation.md)
- [Vue 3 wrapper](@/guides/integrate-with-vue3/vue3-installation.md)

Starting with version 8.4.0 (released in May 2021), all framework variants of Handsontable have the same version number.
:::

::: only-for react
## Versioning of framework variants

Up to Handsontable 8.3.2, the JavaScript variant and the React variant of Handsontable were versioned separately:
- [Vanilla JavaScript](../../javascript-data-grid)
- [React wrapper](@/guides/getting-started/introduction.md)

Starting with version 8.4.0 (released in May 2021), both the JavaScript variant and the React variant of Handsontable have the same version number.
:::
---
title: Migrating from 10 to 11
metaTitle: Migrating from 10 to 11 - Guide - Handsontable Documentation
permalink: /next/migration-from-10-to-11
canonicalUrl: /migration-from-10-to-11
pageClass: migration-guide
---

# Migrating from 10 to 11

[[toc]]

To upgrade your Handsontable version from 10.x.x to 11.x.x, follow this guide.

## Step 1: Register your modules (React, Angular, Vue 2)

Starting with Handsontable 11.0.0, the [React wrapper](@/guides/integrate-with-react/react-installation.md), the [Angular wrapper](@/guides/integrate-with-angular/angular-installation.md), and the [Vue 2 wrapper](@/guides/integrate-with-vue/vue-installation.md) support [modularization](@/guides/building-and-testing/modules.md).

If you don't use any of the wrappers, you don't need to change anything.

### Using all modules

To continue using all Handsontable modules with your wrapper, register all modules with the new `registerAllModules()` method.

In the entry point file of your application, add the following code:
```js
// import the registerAllModules() method
import { registerAllModules } from 'handsontable/registry';

// register all Handsontable modules
registerAllModules();
```

### Using individual modules

To start using individual Handsontable modules with your wrapper, see the following guides:
- [Using modules with React](@/guides/integrate-with-react/react-modules.md)
- [Using modules with Angular](@/guides/integrate-with-angular/angular-modules.md)
- [Using modules with Vue 2](@/guides/integrate-with-vue/vue-modules.md)
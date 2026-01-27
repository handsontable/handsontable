---
id: 9w5zs3t2
title: Migrating from 16.2 to 17.0
metaTitle: Migrating from 16.2 to 17.0 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 16.2 to Handsontable 17.0, released on [TODO].
permalink: /migration-from-16.2-to-17.0
canonicalUrl: /migration-from-16.2-to-17.0
pageClass: migration-guide
react:
  id: xc52w3t2
  metaTitle: Migrate from 16.2 to 17.0 - React Data Grid | Handsontable
angular:
  id: 9r25a4sd
  metaTitle: Migrate from 16.2 to 17.0 - Angular Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

# Migrate from 16.2 to 17.0

Migrate from Handsontable 16.2 to Handsontable 17.0, released on [TODO].

More information about this release can be found in the [`17.0.0` release blog post](TODO).<br/>
For a detailed list of changes in this release, see the [Changelog](@/guides/upgrade-and-migration/changelog/changelog.md#_17-0-0).

[[toc]]

## 1. Migrate from Numbro Format to Intl.NumberFormat

Handsontable 17.0 introduces native support for the [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) API for numeric formatting. The numbro.js-based formatting (`pattern` and `culture` options) will be removed in next major release.

### What Changed

- **Native Intl Support**: The `numericFormat` option now accepts all properties of `Intl.NumberFormatOptions`
- **Locale Separation**: Locale is now controlled via the `locale` cell property instead of `numericFormat.culture`
- **Standard API**: Uses the browser's native internationalization API, which is more performant and widely supported
- **Removed Dependency**: In the next major release, the numbro.js library will be removed from Handsontable

### Why This Change

The numbro.js library added unnecessary bundle size and maintenance overhead. The native `Intl.NumberFormat` API provides the same functionality with better performance, broader browser support, and no external dependencies. This change aligns Handsontable with web standards and reduces the overall package size.

### How to Migrate

#### Step 1: Update numericFormat Configuration

Replace `pattern` and `culture` properties with `Intl.NumberFormat` options.

**Before:**

::: only-for javascript

```js
const hot = new Handsontable(container, {
  columns: [
    {
      type: 'numeric',
      numericFormat: {
        pattern: '0,0.00 $',
        culture: 'en-US'
      }
    }
  ]
});
```

:::

::: only-for react

```jsx
<HotTable
  columns={[{
    type: 'numeric',
    numericFormat: {
      pattern: '0,0.00 $',
      culture: 'en-US'
    }
  }]}
/>
```

:::

::: only-for angular

```html
<hot-table [settings]="{
  columns: [{
    type: 'numeric',
    numericFormat: {
      pattern: '0,0.00 $',
      culture: 'en-US'
    }
  }]
}"></hot-table>
```

:::

**After:**

::: only-for javascript

```js
const hot = new Handsontable(container, {
  columns: [
    {
      type: 'numeric',
      locale: 'en-US',
      numericFormat: {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }
    }
  ]
});
```

:::

::: only-for react

```jsx
<HotTable
  columns={[{
    type: 'numeric',
    locale: 'en-US',
    numericFormat: {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }
  }]}
/>
```

:::

::: only-for angular

```html
<hot-table [settings]="{
  columns: [{
    type: 'numeric',
    locale: 'en-US',
    numericFormat: {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }
  }]
}"></hot-table>
```

:::

#### Step 2: Common Migration Patterns

**Currency Formatting:**

```js
// Before
numericFormat: {
  pattern: '0,0.00 $',
  culture: 'en-US'
}

// After
locale: 'en-US',
numericFormat: {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
}
```

**Decimal Formatting:**

```js
// Before
numericFormat: {
  pattern: '0,0.00',
  culture: 'en-US'
}

// After
locale: 'en-US',
numericFormat: {
  style: 'decimal',
  useGrouping: true,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}
```

**Percent Formatting:**

```js
// Before
numericFormat: {
  pattern: '0.00%',
  culture: 'en-US'
}

// After
locale: 'en-US',
numericFormat: {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}
```

#### Step 3: Using Numbro After Migration

If you need numbro.js-specific formatting features that aren't available in `Intl.NumberFormat`, you can create a custom cell type using the numbro library. See the [Numbro cell type recipe](@/recipes/cell-types/numbro/numbro.md) for a complete implementation guide.

### What to Expect

- **Console Warning**: You'll see a deprecation warning if you're still using `pattern` or `culture` options
- **Same Functionality**: Most common formatting patterns can be replicated using `Intl.NumberFormat` options
- **Better Performance**: Native API is faster and doesn't require external dependencies

### Timeline

- **Version 17.0**: Numbro format deprecated with warnings
- **Version 18.0**: Numbro format will be removed

---
type: how-to
title: Migrating from 16.2 to 17.0
metaTitle: Migrating from 16.2 to 17.0 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 16.2 to Handsontable 17.0, released on released on March 09, 2025.
permalink: /migration-from-16.2-to-17.0
canonicalUrl: /migration-from-16.2-to-17.0
pageClass: migration-guide
react:
  metaTitle: Migrate from 16.2 to 17.0 - React Data Grid | Handsontable
angular:
  metaTitle: Migrate from 16.2 to 17.0 - Angular Data Grid | Handsontable
vue:
  metaTitle: Migrate from 16.2 to 17.0 - Vue Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---
Migrate from Handsontable 16.2 to Handsontable 17.0, released on March 09, 2025.

More information about this release can be found in the [`17.0.0` release blog post](https://handsontable.com/blog/handsontable-17.0.0-multiselect-cell-type-simpler-custom-cells-and-a-new-themes-api).<br/>
For a detailed list of changes in this release, see the [Changelog](@/guides/upgrade-and-migration/changelog/changelog.md#_17-0-0).

[[toc]]

## 1. Remove legacy styles

Starting from **version 17.0.0**, Handsontable 17.0 completely removes the legacy stylesheet (`dist/handsontable.full.min.css`). If you're upgrading from an earlier version and still using the legacy styles, you must migrate to a theme.

::: tip Using the main theme without modifications
If you want to use the `main` theme without any modifications, you don't need to configure anything. Handsontable will automatically use the `main` theme with default settings. However, if you want to retain the legacy look and feel, migrate to the **Classic** theme as described below.
:::

### What Changed

- The legacy CSS file (`dist/handsontable.full.min.css`) is no longer available
- You must now use the new theming system with either the Theme API or CSS-based themes
- The Classic theme (`ht-theme-classic`) provides the same visual appearance as the legacy styles

### How to Migrate

If you were using the legacy styles, migrate to the Classic theme using one of the two options below.

#### Option 1: Using the Theme API (recommended)

The Theme API allows you to register and configure themes programmatically with runtime features like density modes and color schemes.

<ol class="sl-steps">
<li>

**Update your CSS imports**

```diff
- import 'handsontable/dist/handsontable.full.min.css';
```

</li>
<li>

**Import and register the Classic theme**

::: only-for javascript

```js
import Handsontable from 'handsontable';
import { classicTheme } from 'handsontable/themes';

const hot = new Handsontable(container, {
  theme: classicTheme,
  // ... other options
});
```

:::

::: only-for react

```jsx
import { HotTable } from '@handsontable/react-wrapper';
import { classicTheme } from 'handsontable/themes';

function App() {
  return (
    <HotTable
      theme={classicTheme}
      // ... other options
    />
  );
}
```

:::

::: only-for angular

```ts
import { classicTheme } from 'handsontable/themes';

@Component({
  template: `<hot-table [settings]="hotSettings"></hot-table>`
})
export class AppComponent {
  hotSettings = {
    theme: classicTheme,
    // ... other options
  };
}
```

:::

</li>
</ol>

#### Option 2: Using CSS files with theme as string

Alternatively, you can use CSS files and pass the theme name as a string to the `theme` option.

<ol class="sl-steps">
<li>

**Update your CSS imports**

```diff
- @import 'handsontable/dist/handsontable.full.min.css';
+ @import 'handsontable/styles/ht-theme-classic.min.css';
```

Or if you're using JavaScript imports:

```diff
- import 'handsontable/dist/handsontable.full.min.css';
+ import 'handsontable/styles/ht-theme-classic.min.css';
```

::: only-for angular

Or in `angular.json`:

```json5
{
  // ...
  "styles": [
    "src/styles.css",
    "node_modules/handsontable/styles/ht-theme-classic.min.css"
  ],
  // ...
}
```

:::

</li>
<li>

**Set the theme in Handsontable configuration**

::: only-for javascript

```js
const hot = new Handsontable(container, {
  theme: 'ht-theme-classic',
  // ... other options
});
```

:::

::: only-for react

```jsx
<HotTable
  theme="ht-theme-classic"
  // ... other options
/>
```

:::

::: only-for angular

```html
<hot-table [settings]="{
  theme: 'ht-theme-classic'
}">
</hot-table>
```

:::

</li>
</ol>

### Why Migrate to Classic?

The Classic theme provides the same visual appearance as the legacy style, but with significant improvements:

- **CSS Variables**: Easily customize colors, spacing, and other visual properties
- **Dark Mode Support**: Built-in dark mode variants (`ht-theme-classic-dark` and `ht-theme-classic-dark-auto`)
- **Better Maintainability**: The theming system is designed for long-term support
- **Consistency**: Works seamlessly with the new Design System

## 2. Migrate from CSS-based themes to the Theme API

If you're currently using CSS-based themes (loading theme CSS files and passing theme name as a string), migrating to the Theme API provides better runtime control and customization options.

### What Changed

The Theme API provides a programmatic way to configure themes with runtime features that CSS-based themes don't support:

- **Runtime color scheme switching**: Change between light, dark, and auto modes programmatically
- **Density types**: Switch between compact, default, and comfortable density modes
- **Dynamic customization**: Modify theme parameters at runtime using the `params()` method

### How to Migrate

#### Before: CSS-based theme

::: only-for javascript

```js
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';

const hot = new Handsontable(container, {
  theme: 'ht-theme-main',
  // ... other options
});
```

:::

::: only-for react

```jsx
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';

function App() {
  return (
    <HotTable
      theme="ht-theme-main"
      // ... other options
    />
  );
}
```

:::

::: only-for angular

```ts
// In angular.json:
// "styles": [
//   "node_modules/handsontable/styles/handsontable.min.css",
//   "node_modules/handsontable/styles/ht-theme-main.min.css"
// ]

@Component({
  template: `<hot-table [settings]="hotSettings"></hot-table>`
})
export class AppComponent {
  hotSettings = {
    theme: 'ht-theme-main',
    // ... other options
  };
}
```

:::

#### After: Theme API

::: only-for javascript

```js
import Handsontable from 'handsontable';
import { mainTheme, registerTheme } from 'handsontable/themes';

const theme = registerTheme(mainTheme)
  .setColorScheme('auto')  // 'light', 'dark', or 'auto'
  .setDensityType('default');  // 'compact', 'default', or 'comfortable'

const hot = new Handsontable(container, {
  theme: theme,
  // ... other options
});

// You can now change the theme at runtime
theme.setColorScheme('dark');
theme.setDensityType('compact');
```

:::

::: only-for react

```jsx
import { HotTable } from '@handsontable/react-wrapper';
import { mainTheme, registerTheme } from 'handsontable/themes';

const theme = registerTheme(mainTheme)
  .setColorScheme('auto')
  .setDensityType('default');

function App() {
  return (
    <HotTable
      theme={theme}
      // ... other options
    />
  );
}
```

:::

::: only-for angular

```ts
import { mainTheme, registerTheme } from 'handsontable/themes';

const theme = registerTheme(mainTheme)
  .setColorScheme('auto')
  .setDensityType('default');

@Component({
  template: `<hot-table [settings]="hotSettings"></hot-table>`
})
export class AppComponent {
  hotSettings = {
    theme: theme,
    // ... other options
  };
}
```

:::

### Advanced: Customizing theme parameters

The Theme API allows you to customize theme parameters dynamically using the `params()` method:

```js
import { mainTheme, registerTheme } from 'handsontable/themes';

const theme = registerTheme(mainTheme);

// Customize theme parameters
theme.params({
  colors: {
    primary: {
      500: '#9333ea', // Custom primary color
    },
  },
  tokens: {
    fontSize: '14px',
    borderColor: ['colors.palette.200', 'colors.palette.700'], // [light, dark]
  },
});
```

### Available themes

The following themes are available through the Theme API:

| Theme | Import | Description |
|-------|--------|-------------|
| Main | `mainTheme` | Spreadsheet-like interface, perfect for batch-editing tasks |
| Horizon | `horizonTheme` | Cleaner look without vertical lines, ideal for data display |
| Classic | `classicTheme` | Retains the legacy style appearance with CSS variable support |

::: only-for angular

### Global Theme Management in Angular

In Angular, you can set a global default theme using the `HOT_GLOBAL_CONFIG` injection token:

```ts
import { ApplicationConfig } from '@angular/core';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig } from '@handsontable/angular-wrapper';
import { mainTheme, registerTheme } from 'handsontable/themes';

const theme = registerTheme(mainTheme).setColorScheme('auto');

export const appConfig: ApplicationConfig = {
  providers: [{
    provide: HOT_GLOBAL_CONFIG,
    useValue: { theme: theme } as HotGlobalConfig
  }],
};
```

Or use the `HotGlobalConfigService` to manage the theme at runtime:

```ts
import { HotGlobalConfigService } from '@handsontable/angular-wrapper';
import { horizonTheme, registerTheme } from 'handsontable/themes';

const theme = registerTheme(horizonTheme).setColorScheme('dark');

// In your component or service
HotGlobalConfigService.setConfig({ theme: theme });
```

:::

## 3. Migrate from Numbro Format to Intl.NumberFormat

Handsontable 17.0 introduces native support for the [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) API for numeric formatting. The numbro.js-based formatting (`pattern` and `culture` options) will be removed in next major release.

### What Changed

- **Native Intl Support**: The `numericFormat` option now accepts all properties of `Intl.NumberFormatOptions`
- **Locale Separation**: Locale is now controlled via the `locale` cell property instead of `numericFormat.culture`
- **Standard API**: Uses the browser's native internationalization API, which is more performant and widely supported
- **Removed Dependency**: In the next major release, the numbro.js library will be removed from Handsontable

### Why This Change

The numbro.js library added unnecessary bundle size and maintenance overhead. The native `Intl.NumberFormat` API provides the same functionality with better performance, broader browser support, and no external dependencies. This change aligns Handsontable with web standards and reduces the overall package size.

### How to Migrate

<ol class="sl-steps">
<li>

**Update numericFormat Configuration**

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

</li>
<li>

**Common Migration Patterns**

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

</li>
<li>

**Using Numbro After Migration**

If you need numbro.js-specific formatting features that aren't available in `Intl.NumberFormat`, you can create a custom cell type using the numbro library. See the [Numbro cell type recipe](@/recipes/cell-types/numbro/numbro.md) for a complete implementation guide.

</li>
</ol>

### What to Expect

- **Console Warning**: You'll see a deprecation warning if you're still using `pattern` or `culture` options
- **Same Functionality**: Most common formatting patterns can be replicated using `Intl.NumberFormat` options
- **Better Performance**: Native API is faster and doesn't require external dependencies

### Timeline

- **Version 17.0**: Numbro format deprecated with warnings
- **Version 18.0**: Numbro format options (including dependencies) will be removed


## Related resources

- [Numeric cell type](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md)

## 4. Migrate from Moment.js Format to Intl.DateTimeFormat

Handsontable 17.0 introduces native support for the [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) API for date and time formatting. The Moment.js-style string formats (`dateFormat` and `timeFormat` as strings) used by the legacy `date` and `time` cell types will be removed in the next major release.

### What Changed

- **Native Intl Support**: The `dateFormat` and `timeFormat` options now accept all properties of `Intl.DateTimeFormat` options when using `intl-date` and `intl-time` cell types
- **Locale Separation**: Locale is controlled via the `locale` cell property instead of being implied by the format string
- **New Cell Types**: Use `intl-date` for dates and `intl-time` for times instead of `date` and `time` when migrating
- **Source Data**: For `intl-date`, store values in ISO 8601 date format (`YYYY-MM-DD`). For `intl-time`, store values in 24-hour format (`HH:mm`, `HH:mm:ss`, or `HH:mm:ss.SSS`)
- **Deprecated options**: The `correctFormat` option (auto-correction of entered date/time format for legacy `date`/`time` cells) and the `datePickerConfig` option (Pikaday-based date picker for the legacy `date` cell type) are deprecated and will be removed in the next major release

### Why This Change

Moment.js is in maintenance mode and the legacy `date`/`time` cell types depend on it for string-format parsing. The native `Intl.DateTimeFormat` API provides locale-aware formatting without external dependencies, with better performance and alignment with web standards. This change reduces bundle size and keeps date/time behavior consistent with the rest of the platform.

### How to Migrate

<ol class="sl-steps">
<li>

**Update Date Columns**

Replace the `date` cell type and string `dateFormat` with `intl-date` and an `Intl.DateTimeFormat` options object.

**Before:**

::: only-for javascript

```js
const hot = new Handsontable(container, {
  columns: [
    {
      type: 'date',
      dateFormat: 'YYYY-MM-DD'
    }
  ]
});
```

:::

::: only-for react

```jsx
<HotTable
  columns={[{
    type: 'date',
    dateFormat: 'YYYY-MM-DD'
  }]}
/>
```

:::

::: only-for angular

```html
<hot-table [settings]="{
  columns: [{
    type: 'date',
    dateFormat: 'YYYY-MM-DD'
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
      type: 'intl-date',
      locale: 'en-US',
      dateFormat: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
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
    type: 'intl-date',
    locale: 'en-US',
    dateFormat: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }
  }]}
/>
```

:::

::: only-for angular

```html
<hot-table [settings]="{
  columns: [{
    type: 'intl-date',
    locale: 'en-US',
    dateFormat: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }
  }]
}"></hot-table>
```

:::

</li>
<li>

**Update Time Columns**

Replace the `time` cell type and string `timeFormat` with `intl-time` and an `Intl.DateTimeFormat` options object.

**Before:**

::: only-for javascript

```js
const hot = new Handsontable(container, {
  columns: [
    {
      type: 'time',
      timeFormat: 'h:mm:ss a'
    }
  ]
});
```

:::

::: only-for react

```jsx
<HotTable
  columns={[{
    type: 'time',
    timeFormat: 'h:mm:ss a'
  }]}
/>
```

:::

::: only-for angular

```html
<hot-table [settings]="{
  columns: [{
    type: 'time',
    timeFormat: 'h:mm:ss a'
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
      type: 'intl-time',
      locale: 'en-US',
      timeFormat: {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
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
    type: 'intl-time',
    locale: 'en-US',
    timeFormat: {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }
  }]}
/>
```

:::

::: only-for angular

```html
<hot-table [settings]="{
  columns: [{
    type: 'intl-time',
    locale: 'en-US',
    timeFormat: {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }
  }]
}"></hot-table>
```

:::

</li>
<li>

**Common Migration Patterns**

**Short date (e.g. DD/MM/YYYY → locale short):**

```js
// Before
type: 'date',
dateFormat: 'DD/MM/YYYY'

// After
type: 'intl-date',
locale: 'en-GB',
dateFormat: { dateStyle: 'short' }
```

**ISO date (YYYY-MM-DD):**

```js
// Before
type: 'date',
dateFormat: 'YYYY-MM-DD'

// After
type: 'intl-date',
locale: 'en-US',
dateFormat: {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}
```

**12-hour time with seconds:**

```js
// Before
type: 'time',
timeFormat: 'h:mm:ss a'

// After
type: 'intl-time',
locale: 'en-US',
timeFormat: {
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  hour12: true
}
```

**Time style shortcut:**

```js
// After
type: 'intl-time',
locale: 'en-US',
timeFormat: { timeStyle: 'medium' }
```

</li>
<li>

**Custom Cell Types Using Moment.js**

If you use custom cell types that rely on Moment.js for formatting or parsing (e.g. recipes like the Moment.js date or time cell type), replace Moment formatting with `Intl.DateTimeFormat` in your renderer and editor logic. For a full custom implementation that still uses Moment, see the [Moment.js date](@/recipes/cell-types/moment-date/moment-date.md) and [Moment.js time](@/recipes/cell-types/moment-time/moment-time.md) recipes; consider migrating those implementations to Intl to avoid the deprecated path.

</li>
</ol>

### What to Expect

- **Console Warning**: You'll see a deprecation warning if you still use string `dateFormat` or `timeFormat` with the `date` or `time` cell types, or if you use the `correctFormat` or `datePickerConfig` options
- **Data Format**: Ensure date values are in `YYYY-MM-DD` and time values in 24-hour form; `intl-date`/`intl-time` only change display, not storage
- **Same Look**: Use `dateStyle`/`timeStyle` or component options to approximate previous Moment format output

### Timeline

- **Version 17.0**: String-based `dateFormat` and `timeFormat`, and the `correctFormat` and `datePickerConfig` options, are deprecated and emit console warnings; the `intl-date` and `intl-time` cell types are available.
- **Version 18.0**: The current `intl-date` and `intl-time` cell types will become the default `date` and `time` cell types; `intl-date` and `intl-time` will remain as aliases. The Moment.js library will be removed from dependencies. Options `correctFormat` and `datePickerConfig` will be removed.

### Related resources

- [Date cell type](@/guides/cell-types/date-cell-type/date-cell-type.md)
- [Time cell type](@/guides/cell-types/time-cell-type/time-cell-type.md)

## 5. Migrate from built-in DOMPurify to the sanitizer option

Handsontable 17.0 introduces a configurable [`sanitizer`](@/api/options.md#sanitizer) option for HTML content. The built-in use of the [DOMPurify](https://www.npmjs.com/package/dompurify) library is deprecated and will be removed in the next major release. After that, if you do not set a custom sanitizer, any string containing HTML will be stripped before rendering (no rich HTML). To keep sanitized HTML (e.g. with DOMPurify or another library), set the `sanitizer` option to your own sanitizer function.

### What Changed

- **New `sanitizer` option (v17.0)**: A table-level option that accepts a function `(content, source) => string`. It is used whenever HTML is written to the DOM (cell values, headers, context menu labels, dialog markup, clipboard paste).
- **Default behavior**: In 17.0 the grid still uses `DOMPurify` by default but shows a deprecation warning. In the next major release, DOMPurify is removed; with no custom `sanitizer`, HTML in content will be stripped.
- **Source parameter**: The second argument indicates where the content is used (`'innerHTML'` or `'CopyPaste.paste'`), so you can apply different rules per context.

### Why This Change

Making sanitization configurable gives you control over allowlists, library choice, and integration with Trusted Types and CSP. It also allows removing `DOMPurify` from the bundle for applications that use a different sanitization strategy or none.

### How to Migrate

#### Option 1: Keep using DOMPurify (recommended if you need rich HTML)

Install `DOMPurify` in your project and pass a function that calls it via the `sanitizer` option:

::: only-for javascript

```js
import DOMPurify from 'dompurify';
import Handsontable from 'handsontable';

const hot = new Handsontable(container, {
  sanitizer: (content, source) => {
    if (source === 'CopyPaste.paste') {
      return DOMPurify.sanitize(content, {
        ADD_TAGS: ['meta'],
        ADD_ATTR: ['content'],
        FORCE_BODY: true,
      });
    }

    return DOMPurify.sanitize(content);
  },
  // ... other options
});
```

:::

::: only-for react

```jsx
import DOMPurify from 'dompurify';
import { HotTable } from '@handsontable/react-wrapper';

function App() {
  return (
    <HotTable
      sanitizer={(content, source) => {
        if (source === 'CopyPaste.paste') {
          return DOMPurify.sanitize(content, {
            ADD_TAGS: ['meta'],
            ADD_ATTR: ['content'],
            FORCE_BODY: true,
          });
        }

        return DOMPurify.sanitize(content);
      }}
      // ... other options
    />
  );
}
```

:::

::: only-for angular

```ts
import DOMPurify from 'dompurify';

@Component({
  template: `<hot-table [settings]="hotSettings"></hot-table>`
})
export class AppComponent {
  hotSettings = {
    sanitizer: (content: string, source: string) {
      if (source === 'CopyPaste.paste') {
        return DOMPurify.sanitize(content, {
          ADD_TAGS: ['meta'],
          ADD_ATTR: ['content'],
          FORCE_BODY: true,
        });
      }

      return DOMPurify.sanitize(content);
    },
    // ... other options
  };
}
```

:::

#### Option 2: Strip all HTML (plain text only)

If you do not want rich HTML, use a sanitizer that escapes or strips tags:

```js
sanitizer: (content, source) => {
  const tpl = document.createElement('template');

  tpl.innerHTML = content;

  const text = tpl.content.textContent ?? '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

#### Option 3: Trusted Types (CSP)

If you enforce Trusted Types, wrap your sanitizer in a policy and return its `createHTML` result. Add the policy name to your CSP `trusted-types` directive (e.g. `trusted-types default handsontable`):

```js
const policy = window.trustedTypes?.createPolicy('handsontable', {
  createHTML: (input) => DOMPurify.sanitize(input),
});

sanitizer: (content, source) =>
  policy ? policy.createHTML(content) : DOMPurify.sanitize(content),
```

### What to Expect

- **Console warning in 17.0**: If you keep the default (`DOMPurify`) without setting `sanitizer`, a deprecation warning is shown pointing to the `sanitizer` option.
- **Next major release**: `DOMPurify` is removed from dependencies. Without a custom `sanitizer`, HTML in cell content, headers, menus, and paste will be stripped before rendering.
- **No per-column sanitizer**: The option is table-level only; it does not work when set per column or per cell.

### Timeline

- **Version 17.0**: `sanitizer` option is available; default remains `DOMPurify` with a deprecation warning.
- **Next major release**: `DOMPurify` is removed. If no `sanitizer` is set, HTML content is stripped.

### Related resources

- [Security](@/guides/security/security/security.md) - Content sanitizing and recommendations
- [Options reference](@/api/options.md#sanitizer) - `sanitizer` option

## 6. `core-js` dependency removed

Starting in **version 17.0**, Handsontable no longer depends on or bundles [core-js](https://github.com/zloirock/core-js). The library relied on it in the past for polyfills (e.g. ECMAScript 5/6 features, Promises, Symbols, collections). Handsontable removes that dependency to reduce bundle size and to avoid forcing a specific polyfill set on applications that target modern environments only.

### What Changed

- **No core-js in the package**: The `core-js` package is no longer a dependency of Handsontable
- **No bundled polyfills**: The built bundles no longer include core-js modules
- **Modern runtimes**: Handsontable 17.0 targets environments that already provide the required APIs (see [browser support](@/guides/technical-specification/supported-browsers/supported-browsers.md))

### Why This Change

`core-js` added significant size to the bundle and was unnecessary for applications that only support modern browsers and Node versions. Dropping it lets the library stay smaller and lets each application choose its own polyfill strategy (or none) based on its own target environment.

### How to Migrate

If your application or build previously relied on Handsontable (or its build tooling) to pull in `core-js`, and you still need to support older environments that lack certain APIs:

1. **Add polyfills in your app**: Install and import `core-js` (or another polyfill library) in your own project and load it before Handsontable, e.g. in your entry file or polyfills bundle.
2. **Use your bundler's polyfill options**: If you use a bundler (e.g. Webpack, Vite) that can inject polyfills based on browserslist, configure it for your target browsers so that only the required polyfills are included.

If you only target modern browsers and runtimes, no action is needed.

### What to Expect

- **Smaller Handsontable bundle**: The library no longer ships polyfill code
- **No automatic polyfills**: You must add and maintain polyfills yourself if you support older environments
- **Same API**: Handontable's public API is unchanged; only the dependency set has changed

### Timeline

- **Version 17.0**: `core-js` is removed from Handsontable dependencies and build output

### Related resources

- [Browser support](@/guides/technical-specification/supported-browsers/supported-browsers.md) - Supported browsers and runtimes
- [Third-party licenses](@/guides/technical-specification/third-party-licenses/third-party-licenses.md) - Dependencies and licenses

## 7. Built-in HyperFormula (deprecation notice)

The **Formulas** plugin uses [HyperFormula](https://hyperformula.handsontable.com/) as its calculation engine. Currently, HyperFormula is bundled with Handsontable. In **version 18.0**, it will be removed from `package.json`.

### What to Expect

- **Version 17.x**: Built-in HyperFormula remains available, no change required yet.
- **Version 18.0**: HyperFormula is removed from Handsontable dependencies. You must add it as your own dependency and configure the Formulas plugin to use your instance.

### How to Prepare

1. Install HyperFormula in your project (e.g. `npm install hyperformula`).
2. Import HyperFormula and pass it to the Formulas plugin with `licenseKey: 'internal-use-in-handsontable'`.

See the [Formula calculation](@/guides/formulas/formula-calculation/formula-calculation.md) guide for configuration details.

## Summary of breaking changes

| Change                                            | Action Required                                                            |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| Legacy stylesheet removed                         | Migrate to Classic theme or another built-in theme                         |
| `handsontable.full.min.css` no longer available   | Use Theme API or import a theme CSS file (e.g. `ht-theme-classic.min.css`) |
| CSS-based themes (optional migration)             | Consider migrating to Theme API for runtime features                       |
| `core-js` dependency removed                      | Add `core-js` or other polyfills in your app if you support older environments |
| Built-in HyperFormula (deprecation)               | In 18.0, import HyperFormula yourself and pass it to the Formulas plugin with `licenseKey: 'internal-use-in-handsontable'` |

## Result

Your application now runs on Handsontable 17.0.

## Related resources

- [Themes](@/guides/styling/themes/themes.md) - Learn about the theming system
- [Theme Customization](@/guides/styling/theme-customization/theme-customization.md) - Customize themes with CSS variables
- [Legacy Style](@/guides/styling/legacy-style/legacy-style.md) - Information about the legacy style deprecation

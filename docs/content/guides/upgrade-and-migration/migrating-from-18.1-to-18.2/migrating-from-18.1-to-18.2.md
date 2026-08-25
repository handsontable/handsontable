---
type: how-to
title: Migrating from 18.1 to 18.2
metaTitle: Migrating from 18.1 to 18.2 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 18.1 to Handsontable 18.2.
permalink: /migration-from-18.1-to-18.2
canonicalUrl: /migration-from-18.1-to-18.2
pageClass: migration-guide
react:
  metaTitle: Migrate from 18.1 to 18.2 - React Data Grid | Handsontable
angular:
  metaTitle: Migrate from 18.1 to 18.2 - Angular Data Grid | Handsontable
vue:
  metaTitle: Migrate from 18.1 to 18.2 - Vue Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---
Migrate from Handsontable 18.1 to Handsontable 18.2.

For a detailed list of changes in this release, see the [Changelog](@/guides/upgrade-and-migration/changelog/changelog.md).

[[toc]]

Everything on this page concerns the [`sanitizer`](@/api/options.md#sanitizer) option. If you do not set one, nothing here affects you.

## 1. Replace an `'innerHTML'` branch with `'header'`

The offscreen pass that measures nested header widths called your sanitizer with `'innerHTML'`, while the rendered header called it with `'header'`. One label reached your sanitizer under two different names, so a context-aware sanitizer applied two different rule sets to it, and the measured width could not match what the user saw. Both now use `'header'`.

`'innerHTML'` is no longer passed by any part of the grid.

### Who is affected

You are affected only if your sanitizer tests its second argument for `'innerHTML'`. A sanitizer that ignores the argument, or that handles unknown sources in a catch-all branch, needs no change.

### How to migrate

Delete the `'innerHTML'` branch. The `'header'` branch you already have now covers both passes.

**Before:**

```js
sanitizer: (content, source) => {
  if (source === 'header' || source === 'innerHTML') {
    return strict(content);
  }

  return loose(content);
},
```

**After:**

```js
sanitizer: (content, source) => {
  if (source === 'header') {
    return strict(content);
  }

  return loose(content);
},
```

## 2. Two surfaces now reach your sanitizer that did not before

Two places wrote HTML without consulting the sanitizer at all. Both now go through it, each with its own source.

### `password` cells, under `'password'`

Cells rendered by the [`password`](@/guides/cell-types/password-cell-type/password-cell-type.md) cell type never passed through the sanitizer. They do now.

The rendered value is normally a run of `hashSymbol` characters with no markup in it, so most sanitizers will return it unchanged. Check this only if your sanitizer rewrites plain text, or if you produce the displayed value yourself with a custom `valueFormatter` or a `hashSymbol` that contains markup.

### Handsontable's own clipboard payload, under `'CopyPaste.paste.sourceData'`

When you copy between two Handsontable instances, the grid writes a second clipboard entry alongside `text/html`. It carries the source data behind the cells, which is what lets an object-valued cell arrive as an object rather than as its displayed text. That entry was previously parsed without passing through your sanitizer, which meant a crafted clipboard could reach the parser unchecked. It is now sanitized.

You are affected if you set a `sanitizer` **and** use [`parsePastedValue`](@/api/options.md#parsepastedvalue).

A sanitizer that strips unsafe markup, such as DOMPurify, leaves the payload's table intact and nothing changes. A sanitizer that escapes HTML instead turns that table into text, and the pasted cell then receives the displayed value rather than the original object.

If you escape rather than strip, and you want object-valued paste to keep working, pass that one source through:

```js
sanitizer: (content, source) => {
  if (source === 'CopyPaste.paste.sourceData') {
    return content;
  }

  return escapeHtml(content);
},
```

This is safe. The payload is parsed into an inert document that cannot load resources or run scripts, so passing it through does not expose you to injection from a crafted clipboard. It has its own source precisely so you can make this choice without weakening how you treat real pasted HTML.

Leaving it sanitized is also fine if you do not use `parsePastedValue`, and it means your sanitizer sees every clipboard payload, which matters if it does more than filter markup.

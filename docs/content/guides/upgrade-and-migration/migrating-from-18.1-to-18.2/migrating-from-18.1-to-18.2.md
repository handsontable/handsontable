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

## 1. Two `source` values your sanitizer receives have changed

### Nested header measurement: `'innerHTML'` becomes `'header'`

The offscreen pass that measures nested header widths called your sanitizer with `'innerHTML'`, while the rendered header called it with `'header'`. One label reached your sanitizer under two different names, so a context-aware sanitizer applied two different rule sets to it, and the measured width could not match what the user saw. Both now use `'header'`.

`'innerHTML'` is no longer passed by any part of the grid.

### Dialog content: `undefined` becomes `'dialog'`

[Dialog](@/api/dialog.md) content was passed to your sanitizer with **no second argument at all**, so `source` arrived as `undefined`. It is now `'dialog'`.

If your sanitizer routes on `source` with a `switch` or an `if/else` chain, dialog content moves out of whatever branch handled `undefined`, usually the default one, and into a `'dialog'` branch you may not have written. Add one if dialog content needs different treatment from your default.

### Who is affected

You are affected only if your sanitizer tests its second argument. A sanitizer that ignores it needs no change, and one that already routes unknown sources to a catch-all branch keeps working for dialogs.

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

## 2. Two surfaces that were skipping your sanitizer are fixed

These were bugs, not a change of contract. The `sanitizer` option is documented to cover the HTML that Handsontable writes on your behalf, and these two surfaces were writing HTML without consulting it. A grid that configured a sanitizer was not covered where it had every reason to expect it was. This release closes both.

Nothing here needs action to stay correct, and no code of yours stops working. The section exists because a sanitizer that does more than strip markup now sees content it never saw before, and in one case that has a consequence worth knowing about.

### `password` cells, under `'password'`

Cells rendered by the [`password`](@/guides/cell-types/password-cell-type/password-cell-type.md) cell type were written to the DOM without the sanitizer being consulted. They now go through it.

The rendered value is normally a run of `hashSymbol` characters with no markup in it, so most sanitizers will return it unchanged. Check this only if your sanitizer rewrites plain text, or if you produce the displayed value yourself with a custom `valueFormatter` or a `hashSymbol` that contains markup.

### Handsontable's own clipboard payload, under `'CopyPaste.paste.sourceData'`

When you copy between two Handsontable instances, the grid writes a second clipboard entry alongside `text/html`. It carries the source data behind the cells, which is what lets an object-valued cell arrive as an object rather than as its displayed text. That entry was parsed without passing through your sanitizer. Since any page can write the same clipboard type from its own copy handler, a crafted clipboard reached the parser unchecked even on a grid that had configured a sanitizer. It is now sanitized, which is the security fix in this release.

You are affected if you set a `sanitizer` **and** either set [`parsePastedValue`](@/api/options.md#parsepastedvalue) yourself, or use an `autocomplete`, `dropdown`, or `multiSelect` column. Those three cell types turn `parsePastedValue` on for you, so you can be affected without ever having written the option.

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

Leaving it sanitized is also fine if none of your columns parse pasted values, and it means your sanitizer sees every clipboard payload, which matters if it does more than filter markup.

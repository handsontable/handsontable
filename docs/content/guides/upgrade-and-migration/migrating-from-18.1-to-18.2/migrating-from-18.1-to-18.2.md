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

Sections 1 to 4 concern the [`sanitizer`](@/api/options.md#sanitizer) option, and do not affect you if you do not set one. Section 5 applies whether you set a sanitizer or not.

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

## 3. A sanitizer that returns a `TrustedHTML` skips paste normalization

If your sanitizer returns a string, nothing on the paste path has changed. Handsontable still hands
it the clipboard payload as the clipboard carried it, and still flattens the contents of each `<td>`
to text afterwards, so cell values stay free of markup apart from `<br>`.

The new case is a sanitizer that returns a [`TrustedHTML`](@/guides/security/security/security.md#trusted-types-and-csp),
which a page enforcing `require-trusted-types-for 'script'` has to do. That value reaches the parser
unchanged: it is never concatenated, re-tested, or turned back into a string, because any of those
strip the trust that makes the parser accept it. Flattening is a string rewrite, so it cannot run on
a `TrustedHTML` either, and Handsontable skips it.

The consequence is that a `TrustedHTML` sanitizer owns what lands in cells. Markup it permits inside
a `<td>` arrives in the cell value rather than being flattened away, where the
[`html`](@/guides/cell-types/cell-type/cell-type.md) cell type or a custom renderer will interpret
it. If your policy wraps a sanitizer that adds markup, restrict it to the pasted-HTML sources:

```js
sanitizer: (content, source) => {
  if (source.startsWith('CopyPaste.paste')) {
    return policy.createHTML(DOMPurify.sanitize(content));
  }

  return policy.createHTML(linkify(DOMPurify.sanitize(content)));
},
```

## 4. `toHTML()` puts headers through your sanitizer

[`toHTML()`](@/api/core.md#tohtml) interpolated column and row headers into its output without
sanitizing them, while [`toTableElement()`](@/api/core.md#totableelement) sanitized them. With
`colHeaders: ['<b>ID</b>']` and a sanitizer that removes markup, the two methods described the same
grid differently. Both now sanitize.

If you read `toHTML()` output expecting header markup to survive a stripping sanitizer, it no longer
does. Neither method emits the missing-sanitizer console warning any more: both are read-only, so
the warning named a write that never happened.

## 5. Character references in grid copy and cell text

This section applies whether or not you set a `sanitizer`.

Handsontable used to build several parts of its interface as HTML strings and assign them to
`innerHTML`, which made the browser's HTML parser decode any character references as a side effect.
Those surfaces now build DOM nodes and write text directly, so Handsontable resolves the references
itself against a fixed set of names.

It affects dialog titles and descriptions, empty-state copy, button labels, and the cell text
returned by [`toTableElement()`](@/api/core.md#totableelement). Numeric references such as `&#8212;`
and `&#x2014;` are unaffected, and so are the named references that appear in ordinary copy:
`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&apos;`, `&nbsp;`, and the punctuation and currency names.

Two kinds of reference now render as written:

- A name outside the supported set. A title reading `a &hearts; b` displays `a &hearts; b` rather
  than `a ♥ b`.
- A name spelled in upper case. `&AMP;`, `&COPY;` and `&REG;` are valid HTML, and they are left as
  written. Use the lower-case spelling.

If either appears in your copy, write the character itself, or use a numeric reference.

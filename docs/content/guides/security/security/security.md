---
type: explanation
title: Security
metaTitle: Security - JavaScript Data Grid | Handsontable
description: Learn about the security measures we take to make sure you can safely implement Handsontable in your client-side application.
permalink: /security
canonicalUrl: /security
react:
  metaTitle: Security - React Data Grid | Handsontable
angular:
  metaTitle: Security - Angular Data Grid | Handsontable
vue:
  metaTitle: Security - Vue Data Grid | Handsontable
searchCategory: Guides
category: Security
---
Learn about the security measures we take to make sure you can safely implement Handsontable in your client-side application.

[[toc]]

## Overview

At Handsontable, we take security very seriously. We integrate with Security Tools and Policies to provide a secure data grid. This document provides information on our Security Certification, Audits, and Policies.

## Secure data transportation

Handsontable's software is browser-based, and does not communicate with a server. We do not offer or provide recommendations for application-specific back-end solutions.

You need to ensure that the data transportation method that you use, both at the back-end and the front-end, is secure.

## Content Security Policy (CSP)

Content Security Policy (CSP) is an added layer of security, used by app vendors to detect and diminish certain types of attacks, such as cross-site scripting (XSS) or data theft.

Handsontable doesn't use external fonts, images or scripts.

If you use CSP in your app, the only rules that you might need to add for Handsontable to run are `script-src` and `style-src`:

- `script-src` loads Handsontable's script file. Point it at the origin (domain) where you placed your Handsontable assets.
- `style-src ... 'unsafe-inline'` loads Handsontable's stylesheet file. Point it at the origin (domain) where you placed your Handsontable assets. The `'unsafe-inline'` source expression is required for certain features (for example, copy and paste).

An example CSP rule for Handsontable hosted on the same app's origin:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'">
```
An example CSP rule for Handsontable hosted on a CDN (cdn.jsdelivr.net):

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' cdn.jsdelivr.net">
```

## Third-party software

We use dependencies in the form of third-party software, and we take a responsibility to keep them up to date and secure. We also use [Fossa](https://fossa.com), third-party software, to stay compliant with third-party license terms.

## Content sanitizing

Starting with **v18.0**, Handsontable does not include a built-in HTML sanitizer. HTML content written to the DOM passes through unchanged by default.

::: warning XSS risk
If you render untrusted user HTML, you must supply your own sanitizer. Without one, malicious HTML in cell content can execute scripts in your users' browsers.
:::

Use the [`sanitizer`](@/api/options.md#sanitizer) option to provide a sanitizer function. It receives the raw HTML string and returns a string (or, with Trusted Types, a `TrustedHTML`) safe to assign to the DOM. You can apply context-aware rules (for example, stricter for paste, more permissive for trusted renderers) or use any sanitization library.

### What the sanitizer covers

A configured sanitizer runs on the HTML that Handsontable writes on your behalf. The second argument names the write surface, so you can apply different rules to each one.

| Surface | `source` argument |
| --- | --- |
| Column and row headers, including [`nestedHeaders`](@/api/options.md#nestedheaders) labels | `'header'` |
| Cells rendered by the [`password`](@/guides/cell-types/password-cell-type/password-cell-type.md) cell type | `'password'` |
| [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md) and dropdown menu item labels | `'contextMenu'` |
| [`select`](@/guides/cell-types/select-cell-type/select-cell-type.md) editor options | `'selectEditor'` |
| [Dialog](@/api/dialog.md) content passed as an HTML string | `'dialog'` |
| [Notification](@/api/notification.md) messages | `'notification'` |
| HTML pasted from the clipboard | `'CopyPaste.paste'` |
| Handsontable's own clipboard payload, pasted between grids | `'CopyPaste.paste.sourceData'` |

In TypeScript, annotate the second parameter with [`SanitizerContext`](@/guides/tools-and-building/typescript-types/typescript-types.md) to get completion on the values above:

```ts
import type { SanitizerContext } from 'handsontable';

const settings = {
  sanitizer: (content: string, source: SanitizerContext) =>
    source === 'CopyPaste.paste' ? strict(content) : loose(content),
};
```

The type accepts any other string too, so a sanitizer shared with another library still compiles. The trade is that it cannot reject a wrong one: `source === 'contextmenu'` compiles into a branch that never runs. Check spelling against the table above when a rule depends on it.

### What the sanitizer does not cover

Two surfaces exist to render markup you supply, so the sanitizer is deliberately not applied to them:

- the [`html`](@/guides/cell-types/cell-type/cell-type.md) cell type
- [`allowHtml`](@/api/options.md#allowhtml) sources in `autocomplete` and `dropdown` cells

Sanitize that content yourself before passing it to the grid. If it comes from users or an external system, treat it exactly as you would any other untrusted HTML.

One more place takes a narrower path than the sanitizer: a `confirm` dialog's `title`, `description`, and button labels always have their tags stripped, so a permissive sanitizer cannot let markup through there.

The `'CopyPaste.paste.sourceData'` source is worth a note of its own. It carries Handsontable's own clipboard payload, the one that lets an object-valued cell survive a copy between grids. A sanitizer that escapes HTML rather than stripping it turns that payload into text, and the paste then writes the displayed value instead of the original object. This reaches you through [`parsePastedValue`](@/api/options.md#parsepastedvalue), which you may not have set yourself: the `autocomplete`, `dropdown`, and `multiSelect` cell types turn it on for you. You can return that one source unchanged to keep object-based paste working: it is parsed into an inert document that cannot load resources or run scripts, so passing it through does not expose you to a crafted clipboard.

::: tip
Header labels are the surface most often overlooked, because they usually come from configuration rather than from data. When a label is built from an API response or from user input, it needs the same treatment as cell content.
:::

**Example using DOMPurify:**

```js
import DOMPurify from 'dompurify';

new Handsontable(container, {
  sanitizer: (html) => DOMPurify.sanitize(html),
  // ... other options
});
```

### Trusted Types and CSP

The [Trusted Types API](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API) enforces that values reaching a DOM sink came from a policy you wrote. It is not a sanitizer, and it does not replace one. It can require that a sanitizer exists; it cannot be one. A policy such as `createHTML: (input) => input` satisfies the browser and provides no protection at all. What sanitizes is the function you call inside the policy.

Handsontable builds its own interface as DOM nodes rather than as HTML strings, so it needs no Trusted Types policy of its own and no entry in your `trusted-types` directive. One surface has not been converted yet: the context menu writes its own markup when it marks an item as selected, which happens for the "Read only" item on a selection that is already read-only. Opening the menu in that state needs a `sanitizer` that returns a `TrustedHTML`, as below.

That covers the grid's own markup. It does not cover **column and row headers**, which is the one case to know before you enable enforcement. Handsontable writes a header as HTML whenever its text contains a `<`, or an `&` followed later by a `;`, so a header reading `Smith & Sons, Ltd.; est. 1920` takes that path even though it carries no markup at all. Under `require-trusted-types-for 'script'` the browser rejects a plain string there, and the write is not recoverable: the error propagates out of the constructor, so the grid does not render at all. A `sanitizer` that returns a `TrustedHTML`, as below, renders both that header and one carrying real markup correctly.

Cell values are unaffected. They are written as text, so no cell content reaches a sink however it is spelled. The exception is content you opt into rendering as markup through the [`html` cell type](@/guides/cell-types/cell-type/cell-type.md) or `allowHtml`, which needs the same policy-backed sanitizer.

Pasting needs the same sanitizer and degrades rather than failing: the clipboard parser is a sink, so without one Handsontable pastes the plain-text flavor of the clipboard instead of the HTML flavor, and logs one warning.

Your own data is the part that still needs a policy, because Handsontable writes it on your behalf. Wrap your sanitizer in one and return its `createHTML` result:

```js
const policy = window.trustedTypes?.createPolicy('my-app-sanitizer', {
  createHTML: (input) => DOMPurify.sanitize(input),
});

new Handsontable(container, {
  sanitizer: (content, source) =>
    policy ? policy.createHTML(content) : DOMPurify.sanitize(content),
  // ... other options
});
```

Add that policy's name to your Content-Security-Policy `trusted-types` directive, or policy creation is blocked. Name it after your application rather than after Handsontable: `createPolicy` throws if the same name is created twice, and a shared name collides with any other code that picks it.

Handsontable passes the value your sanitizer returns to the DOM unchanged. It is never concatenated with other markup or converted back to a string, either of which would strip the trust and cause the browser to reject it.

Trusted Types is not available everywhere Handsontable runs. It reached [Baseline](https://developer.mozilla.org/en-US/docs/Glossary/Baseline/Compatibility) in February 2026, later than the oldest browsers Handsontable supports, so a policy is inert on Firefox before 148 and Safari before 26. Returning a string from your sanitizer there works exactly as it always has.

Regardless of the client-side strategy, complement it with server-side validation for end-to-end data integrity.

## High-quality code pledge

We pledge to deliver high-quality code. You can see our high-quality code score [here](https://lgtm.com/projects/g/handsontable/handsontable/context:javascript).

Our policy is to fix issues when they arise, as quickly as possible, and keep the library up to date. This requires from you, a user of this software, to keep your copy of Handsontable's software up to date.

## Security certificates

We regularly order security audits of the entire Handsontable codebase, carried out by independent cybersecurity experts.

The latest security audits:

| Audit firm | Concluded on | Certificate                                              |
|------------|--------------|----------------------------------------------------------|
| Seqred     | Feb 21, 2022 | [Download](/docs/seqred-certificate.pdf)         |
| TestArmy   | Apr 28, 2023 | [Download](/docs/testarmy-certificate.pdf)       |
| TestArmy   | Apr 19, 2024 | [Download](/docs/testarmy-certificate-2024.pdf)  |
| TestArmy   | May 13, 2025 | [Download](/docs/testarmy-certificate-2025.pdf)  |
| TestArmy   | Jul 09, 2026 | [Download](/docs/testarmy-certificate-2026.pdf)  |


The security audits were carried out in accordance with industry-standard methodologies, including:
- OWASP Top 10
- OWASP Application Security Verification Standard (ASVS)

For detailed security reports, contact our [Technical Support Team](https://handsontable.com/contact?category=technical_support).

## Code auditing

We use [Snyk](https://snyk.io/test/github/handsontable/handsontable?targetFile=package.json) to audit our code. Snyk integrates seamlessly into our development workflows, checking for vulnerabilities in our source code and in any dependencies, including open-source dependencies.

Snyk provides security status notifications via email or Slack, to:
 -  Monitor handsontable/handsontable:package.json in less than a minute
 -  Find vulnerabilities using Snyk’s market-leading database

## Insurance

We are insured by Lloyds of London. Our policy protects Handsontable and our customers:

| Our Customers                           | Handsoncode (Us)                                   |
| --------------------------------------- | -------------------------------------------------- |
| Cyber media liability                   | Loss or damage to the insured's data or networks   |
| Privacy liability and loss of documents | Business interruption                               |
| Breach of confidentiality liability     | Cyber theft                                        |
| Cyber security liability                | Cyber extortion                                    |
| Mitigation costs                        | Telephone hacking of the insured's telephone lines |
| Regulatory actions and fines            | Notification expenses                              |
| Damage to insured's reputation          | Damage of the insured's reputation                 |

## Code escrow

**This service is available for an additional fee. [Ask our Sales Team](https://handsontable.com/contact?category=request_for_quotation) about the pricing.**

Code Escrow ensures that software is maintained, protected, and not abandoned.

We host our code on GitHub, a trusted, safe platform hosted by Microsoft. In the unlikely event that something happened to our code on GitHub, a copy of our code is still protected and managed by [Codekeeper](https://codekeeper.co/), a source-code escrow company.

We deposit all of our code releases automatically into CodeKeeper. In the case of a release event, Codekeeper provides quick recovery 24/7/365.

## Report a security breach

Security of our software and its application in our customers' system is our top priority. Please report any suspicious activity or evidence to [security@handsontable.com](mailto:security@handsontable.com), and we will respond promptly.

## Bug bounty

We don't offer a bug bounty program, but we sincerely appreciate the work done by security researchers and independent developers.

## Related blog articles

<div class="boxes-list gray">

- [Handsontable 15.3.0: CSV sanitization, accessibility updates, and 30+ fixes](https://handsontable.com/blog/handsontable-15.3.0-csv-sanitization-accessibility-updates-and-30-fixes)

</div>

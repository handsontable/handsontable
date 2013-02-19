# Toolkitchen:Toolkit

## Extremely Brief Overview

Source files for Web Components that implement the Toolkitchen Toolkit.

The Toolkitchen Toolkit is a new type of library for the web, designed to leverage the existing browser infrastructure to provide the encapsulation and extendability currently only available in JS libraries.

Toolkitchen Toolkit is based on a set of future technologies, including [Shadow DOM](https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html), [Custom Elements](https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/custom/index.html) and Model Driven Views. Currently these technologies are implemented as polyfills or shims, but as browsers adopt these features natively, the platform code that drives Toolkit evacipates, leaving only the value-adds.

## Requirements

Although we plan to support all major evergreen (auto-updating) browsers, **currently Toolkit requires a Webkit browser** (essentially Chrome and Safari). 

Note: Chrome 25 has native support for Shadow DOM but Toolkit only supports the shim at this time.

## Getting Started

To enable Custom Element functionality (et al), include the `platform/platform.js` file in your document. The platform code enables the `<link rel="components" href="component.html">` for loading components.

After loading `platform/platform.js`, one can load components with `<link>` and deploy them using simple HTML:

    <!DOCTYPE html>
    <html>
      <head>
        <script src="platform/platform.js"></script>
        <link rel="components" href="src/g-toolbar.html">
      </head>
      <body>
        <g-toolbar></g-toolbar>
      </body>
    </html>

A basic example as above is available in [`getting_started/index.html`](getting_started/index.html). Also, there are various samples in the `workbench` folder that are intended to exercise the basic components.

## Runtime Concepts

### Configuration switches

Toolkit supports runtime options which are settable via the `<script>` tag that loads `platform.js`, or as URL query parameters.

#### log

*Controls console output.*

Example:

    <script src="platform/platform.js" log="bind,ready"></script>

which is equivalent to:

    http://localhost/toolkitchen/toolkit/getting_started/?log=bind,ready

Loggable items include:

<table>
  <tr>
    <th>value</th><th>description</th>
  </tr>
  <tr>
    <td>bind</td><td>setup actions performed by the data-binding engine</td>
  </tr>
  <tr>
    <td>data</td><td>runtime data transforms that result from bindings</td>
  </tr>
  <tr>
    <td>watch</td><td>data change notifications</td>
  </tr>
  <tr>
    <td>events</td><td>custom event bindings and event propagations</td>
  </tr>
  <tr>
    <td>ready</td><td>a custom element reaching a ready state</td>
  </tr>
</table>

#### shadow

*Selects a specific Shadow DOM implementation.*

Example:

    <script src="platform/platform.js" shadow="shim"></script>

Possible values include:

<table>
  <tr>
    <th>value</th><th>description</th>
  </tr>
  <tr>
    <td>shim</td><td>required for Toolkit components (default)</td>
  </tr>
  <tr>
    <td>webkit</td><td>native webkit implementation</td>
  </tr>
  <tr>
    <td>polyfill</td><td>experimental polyfill for non-webkit browsers</td>
  </tr>
</table>

#### eval

*If true, execute component scripts using `eval` instead of script tag injection.*

Example:

    <script src="platform/platform.js" eval="true"></script>

	or

	http://localhost/toolkitchen/toolkit/getting_started/?eval

_eval_ is boolean.

### Shadow DOM Shim

Currently Toolkit platform is configured to utilize a shim for [Shadow DOM](https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html). Shadow DOM is designed to provide encapsulation by hiding subtrees under shadow roots. Unfortunately, as implemented in the shim, the visible DOM in inspector represents *rendered* DOM. In other words, there is a lot of complexity visible in DOM inspector that would be hidden under a native Shadow DOM implementation. (+Link to more information on this complicated topic).

### Component Scripts

Toolkit platform shims the Custom DOM Element Loader (`<link rel="components">`). In order for component code to be debuggable at run-time, scripts embedded in components are injected into `<head>` in the main document. Note: tools that support source maps (aka Chrome Canary) will identify these scripts as belonging to their source components; your mileage will vary with other tools.

### Toolkit and G-Component

All Toolkit components depend on `src/g-component.html` which provides the Toolkit sugaring layer (+see link to Toolkit syntax sugaring information). However, one can load `platform.js` and take advantage of the raw Custom Element and Shadow DOM support directly. See `toolkitchen/projects/CustomElementPlayground` for examples.

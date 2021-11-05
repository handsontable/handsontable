---
title: Anonymous-createDOMPurify-DOMPurify
metaTitle: Anonymous-createDOMPurify-DOMPurify - API Reference - Handsontable Documentation
permalink: /11.0/api/anonymous-create-dompurify-dompurify
canonicalUrl: /api/anonymous-create-dompurify-dompurify
hotPlugin: false
editLink: false
---

# Anonymous-createDOMPurify-DOMPurify

[[toc]]
## Members

### isSupported
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L33806

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~DOMPurify.isSupported_

Expose whether this browser supports running the full DOMPurify.



### removed
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L33739

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~DOMPurify.removed_

Array of elements that DOMPurify removed during sanitation.
Empty if nothing was removed.



### version
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L33733

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~DOMPurify.version_

Version label, exposed for easier checks
if DOMPurify is up to date or not


## Methods

### addHook
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L34828

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~DOMPurify.addHook(entryPoint, hookFunction)_

AddHook
Public method to add DOMPurify hooks


| Param | Type | Description |
| --- | --- | --- |
| entryPoint | `String` | entry point for the hook to add |
| hookFunction | `function` | function to execute |



### clearConfig
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L34795

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~DOMPurify.clearConfig()_

Public method to remove the configuration
clearConfig



### isValidAttribute
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L34810

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~DOMPurify.isValidAttribute(tag, attr, [value](@/api/value.md)) ⇒ Boolean_

Public method to check if an attribute value is valid.
Uses last set config, if any. Otherwise, uses config defaults.
isValidAttribute


| Param | Type | Description |
| --- | --- | --- |
| tag | `string` | Tag name of containing element. |
| attr | `string` | Attribute name. |
| value | `string` | Attribute value. |


**Returns**: `Boolean` - Returns true if `value` is valid. Otherwise, returns false.  

### removeAllHooks
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L34867

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~DOMPurify.removeAllHooks()_

RemoveAllHooks
Public method to remove all DOMPurify hooks



### removeHook
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L34844

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~DOMPurify.removeHook(entryPoint)_

RemoveHook
Public method to remove a DOMPurify hook at a given entryPoint
(pops it from the stack of hooks if more are present)


| Param | Type | Description |
| --- | --- | --- |
| entryPoint | `String` | entry point for the hook to remove |



### removeHooks
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L34856

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~DOMPurify.removeHooks(entryPoint)_

RemoveHooks
Public method to remove all DOMPurify hooks at a given entryPoint


| Param | Type | Description |
| --- | --- | --- |
| entryPoint | `String` | entry point for the hooks to remove |



### sanitize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L34617

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~DOMPurify.sanitize(dirty, configuration)_

Sanitize
Public method providing core sanitation functionality


| Param | Type | Description |
| --- | --- | --- |
| dirty | `String` <br/> `Node` | string or DOM node |
| configuration | `Object` | object |



### setConfig
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L34785

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~DOMPurify.setConfig(cfg)_

Public method to set the configuration once
setConfig


| Param | Type | Description |
| --- | --- | --- |
| cfg | `Object` | configuration object |



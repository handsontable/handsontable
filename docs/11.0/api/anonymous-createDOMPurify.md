---
title: Anonymous-createDOMPurify
metaTitle: Anonymous-createDOMPurify - API Reference - Handsontable Documentation
permalink: /11.0/api/anonymous-create-dompurify
canonicalUrl: /api/anonymous-create-dompurify
hotPlugin: false
editLink: false
---

# Anonymous-createDOMPurify

[[toc]]
## Methods

### _checkValidNamespace
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L34096

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~\_checkValidNamespace(element) ⇒ boolean_


| Param | Type | Description |
| --- | --- | --- |
| element | `Element` | a DOM element whose namespace is being checked |


**Returns**: `boolean` - Return false if the element has a
 namespace that a spec-compliant parser would never
 return. Return true otherwise.  

### _createIterator
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L34298

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~\_createIterator(root) ⇒ Iterator_

_createIterator


| Param | Type | Description |
| --- | --- | --- |
| root | `Document` | document/fragment to create iterator for |


**Returns**: `Iterator` - iterator instance  

### _executeHook
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L34338

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~\_executeHook(entryPoint, currentNode, data)_

_executeHook
Execute user configurable hooks


| Param | Type | Description |
| --- | --- | --- |
| entryPoint | `String` | Name of the hook's entry point |
| currentNode | `Node` | node to work on with the hook |
| data | `Object` | additional hook parameters |



### _forceRemove
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L34184

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~\_forceRemove(node)_

_forceRemove


| Param | Type | Description |
| --- | --- | --- |
| node | `Node` | a DOM node |



### _initDocument
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L34239

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~\_initDocument(dirty) ⇒ Document_

_initDocument


| Param | Type | Description |
| --- | --- | --- |
| dirty | `String` | a string of dirty markup |


**Returns**: `Document` - a DOM, filled with the dirty markup  

### _isClobbered
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L34308

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~\_isClobbered(elm) ⇒ Boolean_

_isClobbered


| Param | Type | Description |
| --- | --- | --- |
| elm | `Node` | element to check for clobbering attacks |


**Returns**: `Boolean` - true if clobbered, false if safe  

### _isNode
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L34326

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~\_isNode(obj) ⇒ Boolean_

_isNode


| Param | Type | Description |
| --- | --- | --- |
| obj | `Node` | object to check whether it's a DOM node |


**Returns**: `Boolean` - true is object is a DOM node  

### _isValidAttribute
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L34455

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~\_isValidAttribute(lcTag, lcName, [value](@/api/value.md)) ⇒ Boolean_

_isValidAttribute


| Param | Type | Description |
| --- | --- | --- |
| lcTag | `string` | Lowercase tag name of containing element. |
| lcName | `string` | Lowercase attribute name. |
| value | `string` | Attribute value. |


**Returns**: `Boolean` - Returns true if `value` is valid, otherwise false.  

### _parseConfig
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L33937

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~\_parseConfig(cfg)_

_parseConfig


| Param | Type | Description |
| --- | --- | --- |
| cfg | `Object` | optional config literal |



### _removeAttribute
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L34204

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~\_removeAttribute(name, node)_

_removeAttribute


| Param | Type | Description |
| --- | --- | --- |
| name | `String` | an Attribute name |
| node | `Node` | a DOM node |



### _sanitizeAttributes
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L34486

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~\_sanitizeAttributes(currentNode)_

_sanitizeAttributes

**Protect**: attributes  
**Protect**: nodeName  
**Protect**: removeAttribute  
**Protect**: setAttribute  

| Param | Type | Description |
| --- | --- | --- |
| currentNode | `Node` | to sanitize |



### _sanitizeElements
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L34358

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~\_sanitizeElements(currentNode) ⇒ Boolean_

_sanitizeElements

**Protect**: nodeName  
**Protect**: textContent  
**Protect**: removeChild  

| Param | Type | Description |
| --- | --- | --- |
| currentNode | `Node` | to check for permission to exist |


**Returns**: `Boolean` - true if node was killed, false if left alive  

### _sanitizeShadowDOM
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L34580

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~createDOMPurify~\_sanitizeShadowDOM(fragment)_

_sanitizeShadowDOM


| Param | Type | Description |
| --- | --- | --- |
| fragment | `DocumentFragment` | to iterate over recursively |



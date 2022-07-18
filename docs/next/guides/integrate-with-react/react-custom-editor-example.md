---
title: 'Custom editor in React'
metaTitle: 'Custom editor in React - Guide - Handsontable Documentation'
permalink: /next/react-custom-editor-example
canonicalUrl: /react-custom-editor-example
---

# Custom editor in React

[[toc]]

::: tip Using React components
This page shows how to integrate a plain JavaScript custom editor with the React component. Information how to [declare a custom editor using React components](@/guides/integrate-with-react/react-hot-column.md#declaring-a-custom-editor-as-a-component) is presented on another page.
:::

## Overview

You can declare a custom editor for the `HotTable` component by declaring it as a class and passing it to the Handsontable options or creating an editor component.

## Example - Declaring an editor as a class

The following example implements the `@handsontable/react` component with a custom editor added, utilizing the `placeholder` attribute in the editor's `input` element.

::: example #example1 :react  --no-edit
```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { TextEditor } from 'handsontable/editors/textEditor';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

class CustomEditor extends TextEditor {
  constructor(props) {
    super(props);
  }

  createElements() {
    super.createElements();

    this.TEXTAREA = document.createElement('input');
    this.TEXTAREA.setAttribute('placeholder', 'Custom placeholder');
    this.TEXTAREA.setAttribute('data-hot-input', true);
    this.textareaStyle = this.TEXTAREA.style;
    this.TEXTAREA_PARENT.innerText = '';
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  }
}

const hotSettings = {
  startRows: 5,
  columns: [
    {
      editor: CustomEditor
    }
  ],
  colHeaders: true,
  colWidths: 200,
  licenseKey: 'non-commercial-and-evaluation'
};

const App = () => {
  return (
    <div>
      <HotTable
        id="hot"
        settings={hotSettings}
      />
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('example1'));
```
:::

## Related articles

### Related guides

- [Cell editor](@/guides/cell-functions/cell-editor.md)

### Related API reference

- APIs:
  - [`BasePlugin`](@/api/basePlugin.md)
- Configuration options:
  - [`editor`](@/api/options.md#editor)
  - [`enterBeginsEditing`](@/api/options.md#enterbeginsediting)
- Core methods:
  - [`destroyEditor()`](@/api/core.md#destroyeditor)
  - [`getActiveEditor()`](@/api/core.md#getactiveeditor)
  - [`getCellEditor()`](@/api/core.md#getcelleditor)
  - [`getCellMeta()`](@/api/core.md#getcellmeta)
  - [`getCellMetaAtRow()`](@/api/core.md#getcellmetaatrow)
  - [`getCellsMeta()`](@/api/core.md#getcellsmeta)
  - [`setCellMeta()`](@/api/core.md#setcellmeta)
  - [`setCellMetaObject()`](@/api/core.md#setcellmetaobject)
  - [`removeCellMeta()`](@/api/core.md#removecellmeta)
- Hooks:
  - [`afterBeginEditing`](@/api/hooks.md#afterbeginediting)
  - [`afterGetCellMeta`](@/api/hooks.md#aftergetcellmeta)
  - [`beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta)

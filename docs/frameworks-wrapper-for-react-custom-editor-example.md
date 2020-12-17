---
id: frameworks-wrapper-for-react-custom-editor-example
title: Custom editor example
sidebar_label: Custom editor example
slug: /frameworks-wrapper-for-react-custom-editor-example
---

You can declare a custom editor for the `HotTable` component either by declaring it as a class and passing it to the Handsontable options, or create an editor component.

*   [Declaring a renderer as a function](#classEditor)
*   [Declaring an editor as a component](frameworks-wrapper-for-react-hot-column.html#custom-editor)

### Declaring an editor as a class

An implementation of the `@handsontable/react` component with a custom editor added. It utilizes the `placeholder` attribute in the editor's `input` element.

<div id="example1" class="hot"> </div>

Edit

```
import React from 'react'; import ReactDOM from 'react-dom'; import { HotTable } from '@handsontable/react'; import Handsontable from 'handsontable'; class CustomEditor extends Handsontable.editors.TextEditor { constructor(props) { super(props); } createElements() { super.createElements(); this.TEXTAREA = document.createElement('input'); this.TEXTAREA.setAttribute('placeholder', 'Custom placeholder'); this.TEXTAREA.setAttribute('data-hot-input', true); this.textareaStyle = this.TEXTAREA.style; Handsontable.dom.empty(this.TEXTAREA\_PARENT); this.TEXTAREA\_PARENT.appendChild(this.TEXTAREA); } } class App extends React.Component { constructor(props) { super(props); this.hotSettings = { startRows: 5, columns: \[ { editor: CustomEditor } \], colHeaders: true, colWidths: 200 }; } render() { return ( <div> <HotTable id="hot" settings={this.hotSettings} /> </div> ); } } ReactDOM.render(<App />, document.getElementById('example1'));
```

[Edit this page](https://github.com/handsontable/docs/edit/8.2.0/tutorials/wrapper-for-react-custom-editor-example.html)

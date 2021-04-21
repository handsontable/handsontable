---
title: Custom editor example
permalink: /next/react-custom-editor-example
canonicalUrl: /react-custom-editor-example
---

# Custom editor example

You can declare a custom editor for the `HotTable` component either by declaring it as a class and passing it to the Handsontable options, or create an editor component.

## Declaring an editor as a class

An implementation of the `@handsontable/react` component with a custom editor added. It utilizes the `placeholder` attribute in the editor's `input` element.

::: example #example1 :react
```js
import React from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';

class CustomEditor extends Handsontable.editors.TextEditor {
  constructor(props) {
    super(props);
  }

  createElements() {
    super.createElements();

    this.TEXTAREA = document.createElement('input');
    this.TEXTAREA.setAttribute('placeholder', 'Custom placeholder');
    this.TEXTAREA.setAttribute('data-hot-input', true);
    this.textareaStyle = this.TEXTAREA.style;
    Handsontable.dom.empty(this.TEXTAREA_PARENT);
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.hotSettings = {
      startRows: 5,
      columns: [
        {
          editor: CustomEditor
        }
      ],
      colHeaders: true,
      colWidths: 200
    };
  }

  render() {
    return (
      <div>
        <HotTable
          id="hot"
          settings={this.hotSettings}
        />
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('example1'));
```
:::

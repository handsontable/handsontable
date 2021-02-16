---
id: react-custom-renderer-example
title: Custom renderer example
sidebar_label: Custom renderer example
slug: /react-custom-renderer-example
---

An implementation of the `@handsontable/react` with a custom renderer added. It takes an image url as the input and renders the image in the edited cell.

```js
import React from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.hotSettings = {
      data:
        [['A1', 'https://handsontable.com/docs/images/examples/professional-javascript-developers-nicholas-zakas.jpg'],
          ['A2', 'https://handsontable.com/docs/images/examples/javascript-the-good-parts.jpg']],
      columns: [
        {},
        {
          renderer: function(instance, td, row, col, prop, value, cellProperties) {
            const escaped = Handsontable.helper.stringify(value);
            let img = null;

            if (escaped.indexOf('http') === 0) {
              img = document.createElement('IMG');
              img.src = value;

              Handsontable.dom.addEvent(img, 'mousedown', function(event) {
                event.preventDefault();
              });

              Handsontable.dom.empty(td);
              td.appendChild(img);
            }
            else {
              Handsontable.renderers.TextRenderer.apply(this, arguments);
            }

            return td;
          }
        }
      ],
      colHeaders: true,
      rowHeights: 55
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

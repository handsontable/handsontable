---
title: Custom Context Menu example
permalink: /8.5/react-custom-context-menu-example
canonicalUrl: /react-custom-context-menu-example
---

# {{ $frontmatter.title }}

An implementation of the `@handsontable/react` component with a custom Context Menu added.

```js
import React from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.hotSettings = {
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      colHeaders: true,
      contextMenu: {
        items: {
          'row_above': {
            name: 'Insert row above this one (custom name)'
          },
          'row_below': {},
          'separator': Handsontable.plugins.ContextMenu.SEPARATOR,
          'clear_custom': {
            name: 'Clear all cells (custom)',
            callback: function() {
              this.clear();
            }
          }
        }
      }
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

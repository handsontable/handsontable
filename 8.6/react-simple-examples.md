---
title: Basic examples
permalink: /8.6/react-simple-examples
canonicalUrl: /react-simple-examples
---

# {{ $frontmatter.title }}

[[toc]]

## An implementation of the `@handsontable/react` wrapper.

```html
<!-- a root div where the component is rendered -->
<div id="example1" class="hot"></div>
```

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';

class App extends React.Component {
  constructor(props) {
    super(props);
    
    this.handsontableData = Handsontable.helper.createSpreadsheetData(6, 10);
  }
  render() {
    return (<div>
      <HotTable
        id="hot"
        data={this.handsontableData}
        colHeaders={true}
        rowHeaders={true} />
    </div>);
  }
}

ReactDOM.render(<App />, document.getElementById('example1'));
```

## An implementation of the component using a single-property (`settings`) configuration.

```html
<!-- a root div where the component is rendered -->
<div id="example2" class="hot"></div>
```

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.handsontableData = Handsontable.helper.createSpreadsheetData(6, 10);
  }
  render() {
    return (<div>
      <HotTable
        settings={{
          data: this.handsontableData,
          colHeaders: true,
          rowHeaders: true
        }}/>
    </div>);
  }
}

ReactDOM.render(<App />, document.getElementById('example2'));
```

## An interactive implementation using external checkboxes which control the table behavior.

```css
.controllers {
  width: 200px;
  float: left;
}
.controllers input[type=checkbox] {
  margin-left: 5px;
  margin-right: 5px;
}
```

```html
<!-- a root div where the component is rendered -->
<div id="example3" class="hot"></div>
```

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';

class MyComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      settings: {
        data: Handsontable.helper.createSpreadsheetData(15, 20),
        width: 570,
        height: 220,
      }
    }
  }

  handleChange = (setting, states) => {
    return (event) => {
      this.setState({
        settings: {
          [setting]: states[event.target.checked ? 1 : 0],
        }
      });
    }
  };

  render() {
    return (
      <div>
        <div className="controllers">
          <label><input onChange={this.handleChange('fixedRowsTop', [0, 2])} type="checkbox" />Add fixed rows</label><br/>
          <label><input onChange={this.handleChange('fixedColumnsLeft', [0, 2])} type="checkbox" />Add fixed columns</label><br/>
          <label><input onChange={this.handleChange('rowHeaders', [false, true])} type="checkbox" />Enable row headers</label><br/>
          <label><input onChange={this.handleChange('colHeaders', [false, true])} type="checkbox" />Enable column headers</label><br/>
        </div>
        <HotTable root="hot" settings={this.state.settings}/>
      </div>
    );
  }
}

ReactDOM.render(<MyComponent />, document.getElementById('example3'));
```

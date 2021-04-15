---
title: Hello world
permalink: /next/hello-world
canonicalUrl: /hello-world
---

# {{ $frontmatter.title }}

[[toc]]

## Get started with basic example

Let's start with a simple example of Handsontable instance initialized in a container with the defined size. Use a `createSpreadsheetData` to generate a data set of 5000 records containing dummy data. 

::: example #example
```javascript
var example = document.getElementById('example');
var hot1 = new Handsontable(example, {
 data: Handsontable.helper.createSpreadsheetData(100, 50),
 colWidths: 100,
 width: '100%',
 height: 320,
 rowHeights: 23,
 rowHeaders: true,
 colHeaders: true,
 licenseKey: 'non-commercial-and-evaluation'
});
```
:::

<code-group>

<code-block title="JavaScript">

```js
var example = document.getElementById('example');
var hot1 = new Handsontable(example, {
 data: Handsontable.helper.createSpreadsheetData(100, 50),
 colWidths: 100,
 width: '100%',
 height: 320,
 rowHeights: 23,
 rowHeaders: true,
 colHeaders: true,
 licenseKey: 'non-commercial-and-evaluation'
});
```

</code-block>
<code-block title="React">

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';

class App extends React.Component {
  constructor(props) {
    super(props);
    
    this.handsontableData = Handsontable.helper.createSpreadsheetData(100, 50);
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

</code-block>
<code-block title="Angular">

```js
// app.component.ts
import { Component } from '@angular/core';
import * as Handsontable from 'handsontable';

@Component({
  selector: 'app-root',
  template: `
  <div>
    <hot-table
      class="hot"
      [data]="dataset"
      [colHeaders]="true"
      [rowHeaders]="true">
        <hot-column data="id" [readOnly]="true" title="ID"></hot-column>
        <hot-column data="name" title="Full name"></hot-column>
        <hot-column data="address" title="Street name"></hot-column>
    </hot-table>
  </div>
  `,
})
class AppComponent {
  dataset: any[] = [
    {id: 1, name: 'Ted Right', address: 'Wall Street'},
    {id: 2, name: 'Frank Honest', address: 'Pennsylvania Avenue'},
    {id: 3, name: 'Joan Well', address: 'Broadway'},
    {id: 4, name: 'Gail Polite', address: 'Bourbon Street'},
    {id: 5, name: 'Michael Fair', address: 'Lombard Street'},
    {id: 6, name: 'Mia Fair', address: 'Rodeo Drive'},
    {id: 7, name: 'Cora Fair', address: 'Sunset Boulevard'},
    {id: 8, name: 'Jack Right', address: 'Michigan Avenue'},
  ];
}

// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HotTableModule } from '@handsontable/angular';

@NgModule({
  imports:      [ BrowserModule, HotTableModule ],
  declarations: [ AppComponent ],
  bootstrap:    [ AppComponent ]
})
class AppModule { }

// bootstrap
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

platformBrowserDynamic().bootstrapModule(AppModule).catch(err => { console.error(err) });
Suggest edits 
```

</code-block>
<code-block title="Vue">

```js
import Vue from 'vue';
import { HotTable } from '@handsontable/vue';
import Handsontable from 'handsontable';

new Vue({
  el: '#example1',
  data: function() {
    return {
      hotSettings: {
        data: Handsontable.helper.createSpreadsheetData(100, 50),
        colWidths: 100,
        width: '100%',
        height: 320,
        rowHeights: 23,
        rowHeaders: true,
        colHeaders: true,
        licenseKey: 'non-commercial-and-evaluation'
      }
    }
  },
  components: {
    HotTable
  }
});
```

</code-block>
</code-group>

## Edit in the online editor

Play with the code in one of the online editors we use across this documentation - JSFiddle and CodeSandbox.

- [Open JavaScript demo](https://jsfiddle.com)
- [Open TypeScript demo](https://jsfiddle.com))
- [Open React Functional demo](https://codesandbox.com)
- [Open React Class demo](https://codesandbox.com)
- [Open Angular demo](https://codesandbox.com)
- [Open Vue demo](https://codesandbox.com)


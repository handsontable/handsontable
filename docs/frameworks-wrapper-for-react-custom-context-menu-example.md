---
id: frameworks-wrapper-for-react-custom-context-menu-example
title: Custom Context Menu example
sidebar_label: Custom Context Menu example
slug: /frameworks-wrapper-for-react-custom-context-menu-example
---

An implementation of the `@handsontable/react` component with a custom Context Menu added.

<div id="example1" class="hot"> </div>

Edit

```
import React from 'react'; import ReactDOM from 'react-dom'; import { HotTable } from '@handsontable/react'; import Handsontable from 'handsontable'; class App extends React.Component { constructor(props) { super(props); this.hotSettings = { data: Handsontable.helper.createSpreadsheetData(5, 5), colHeaders: true, contextMenu: { items: { 'row\_above': { name: 'Insert row above this one (custom name)' }, 'row\_below': {}, 'separator': Handsontable.plugins.ContextMenu.SEPARATOR, 'clear\_custom': { name: 'Clear all cells (custom)', callback: function() { this.clear(); } } } } }; } render() { return ( <div> <HotTable id="hot" settings={this.hotSettings} /> </div> ); } } ReactDOM.render(<App />, document.getElementById('example1'));
```

[Edit this page](https://github.com/handsontable/docs/edit/8.2.0/tutorials/wrapper-for-react-custom-context-menu-example.html)

---
id: frameworks-wrapper-for-react-language-change-example
title: Language change example
sidebar_label: Language change example
slug: /frameworks-wrapper-for-react-language-change-example
---

An implementation of the `@handsontable/react` component with an option to change the Context Menu language.  
Select a language from the selector above the table and open the Context Menu to see the result.  
  
Note, that the `language` property is bound to the component separately (by using `language={this.language}"`), but it could be included in the `settings` prop just as well.

<div id="example1" class="hot"> </div>

Edit

```
import React from 'react'; import ReactDOM from 'react-dom'; import {HotTable} from '@handsontable/react'; import Handsontable from 'handsontable'; class App extends React.Component { constructor(props) { super(props); this.id = 'hot'; this.state = { hotSettings: { data: Handsontable.helper.createSpreadsheetData(5, 10), colHeaders: true, rowHeaders: true, contextMenu: true }, language: 'en-US' }; this.updateHotLanguage = this.updateHotLanguage.bind(this); } componentDidMount() { this.getAllLanguageOptions(); } getAllLanguageOptions() { const allDictionaries = Handsontable.languages.getLanguagesDictionaries(); const langSelect = document.querySelector('#languages'); langSelect.innerHTML = ''; for (let language of allDictionaries) { langSelect.innerHTML += \`<option value="${language.languageCode}">${language.languageCode}</option>\` } } updateHotLanguage(event) { this.setState({language: event.target.value}); } render() { return ( <div> <label>Select language: <select onChange={this.updateHotLanguage} id="languages" style={{width: 100 + 'px'}}></select></label><br/><br/> <HotTable id={this.id} language={this.state.language} settings={this.state.hotSettings}/> </div> ); } } ReactDOM.render(<App/>, document.getElementById('example1'));
```

[Edit this page](https://github.com/handsontable/docs/edit/8.2.0/tutorials/wrapper-for-react-language-change-example.html)

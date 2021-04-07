// temp.. testing babel build at runtime.
// todo remove this file
const input = 
`
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
`;

const {transformSync} = require('@babel/core');

console.log(transformSync(input, {
  "presets": ["@babel/preset-react"],
  "plugins": ["@babel/plugin-transform-modules-commonjs"],
  "targets": {
    "ie":9
  }
}).code);

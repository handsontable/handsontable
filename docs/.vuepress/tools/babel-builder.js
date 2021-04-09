// temp.. testing babel build at runtime.
// todo remove this file
const input =
`
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
`;

const { transformSync } = require('@babel/core');

console.log(transformSync(input, {
  presets: [
    "@babel/preset-env",
    '@babel/preset-react',
  ],
  plugins: [
    '@babel/plugin-transform-modules-commonjs',
    '@babel/plugin-syntax-class-properties',
    [`@babel/plugin-proposal-class-properties`, {loose: true}]
  ],
  targets: {
    ie: 9
  }
}).code);

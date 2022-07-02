---
title: Snippet Transformer tool scope and example.
permalink: /next/_internal/snippet-transformer-example
canonicalUrl: /_internal/snippet-transformer-example
---

::: example #main-example --html 1 --js 2

```html
<div class="controls"> 
  <input id="input1"/>
  <input id="input2"/><br/>
  <button id="button1">Button 1</button>
  <button id="button2">Button 2</button>
  <div id="output"></div>
</div>
<div id="container1"></div>
<div id="container2"></div>
<div id="container3"></div>
```

```js
// Variable declaration
const simpleValue = 2;
const hotAlternativeConfig = {
  data: [[1, 2, 3], [4, 5, 6]],
  rowHeaders: true,
  colHeaders: false,
  afterUpdateSettings: () => {
    outputLog.innerText += `settings updated for hot2\n`;
  },
  licenseKey: 'non-commercial-and-evaluation'
};
const fnValue = (value) => {
  const returnValue = `fnValue return value: ${value}`;

  return returnValue;
}

function logFnValue() {
  outputLog.innerText += fnValue('input 2 key down\n');
}

const fnResult = fnValue(simpleValue);
const container1 = document.getElementById('container1');
const container2 = document.getElementById('container2');
const container3 = document.getElementById('container3');
const button1 = document.querySelector('#button1');
const button2 = document.querySelector('#button2');
const input1 = document.querySelector('#input1');
const input2 = document.querySelector('#input2');
const outputLog = document.querySelector('#output');

// Handsontable initialization
const hot1 = new Handsontable(container1, {
  data: [['a', 'b', 'c'], ['d', 'e', 'f']],
  rowHeaders: true,
  colHeaders: true,
  contextMenu: true,
  licenseKey: 'non-commercial-and-evaluation'
});

const hot2 = new Handsontable(container2, hotAlternativeConfig);

new Handsontable(container3, {
  // Handsontable.helper reference
  data: Handsontable.helper.createSpreadsheetData(3, 3),
  formulas: {
    // HyperFormula class reference
    engine: HyperFormula,
    namedExpressions: [
      {
        name: 'ADDITIONAL_COST',
        expression: 100
      }
    ]
  },
  licenseKey: 'non-commercial-and-evaluation'
});

// Handsontable reference operations
window.hot1 = hot1;

hot1.render();

const contextMenuPlugin = hot1.getPlugin('contextMenu');
contextMenuPlugin.disablePlugin();

// Other operations
const test = fnValue(1) + '_';
const hotCallback = () => {
  hot2.updateSettings({
    rowHeaders: false,
    colHeaders: false
  });
};

outputLog.innerText += `${test}\n`;
outputLog.innerText += `${fnResult}\n`;

// Additional UI:
// Buttons
button1.addEventListener('click', () => {
  outputLog.innerText += 'button 1 clicked.\n';
});
button2.addEventListener('click', hotCallback);

// Inputs
input1.addEventListener('keydown', function() {
  outputLog.innerText += 'input 1 key down\n';
});
input2.addEventListener('keydown', logFnValue);
```

:::

<script>
window._exampleTests = [
  () => {
    const exampleContainer = document.querySelector('#preview-tab-main-example');

    exampleContainer.querySelector('#input1').dispatchEvent(new KeyboardEvent('keydown'));
    exampleContainer.querySelector('#input2').dispatchEvent(new KeyboardEvent('keydown'));
    exampleContainer.querySelector('#button1').dispatchEvent(new MouseEvent('click'));
    exampleContainer.querySelector('#button2').dispatchEvent(new MouseEvent('click'));

    const requirements = [
      [hot1.getPlugin('contextMenu').enabled, false],
      [
        exampleContainer.querySelector('#output').innerText, `\
fnValue return value: 1_
fnValue return value: 2
input 1 key down
fnValue return value: input 2 key down
button 1 clicked.
settings updated for hot2\n`]
    ];

    let result = true;

    requirements.some(req => {
      if (req[0] !== req[1]) {
        result = false;

        return true;
      }
    });

    return {
      result
    };
  }
];
</script>

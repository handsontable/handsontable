This zip package includes a development build of Handsontable with the new formulas plugin.

# Installation

## npm install

1. Put the `handsontable*.tgz` file at the root of your project
2. `npm install handsontable*.tgz hyperformula@0.6.0`


## `<script>` tag

Simply use the existing instructions from our [quick start guide](https://handsontable.com/docs/8.3.2/tutorial-quick-start.html), just replace `handsontable.full.js` with the one from the tar archive (run `tar xvf handsontable*.tgz` to unpack it).

The formulas plugin will be included in `handsontable.full(.min).js`.


# Usage

It is possible to use the plugin in single sheet mode or with multiple Handsontable instances with cross-sheet references.

In all cases it is required to either pass in the `HyperFormula` object or a HyperFormula instance:

```
import { HyperFormula } from 'hyperformula';
```

## Passing the HyperFormula class/instance to Handsontable (applicable to all examples below)

```js
formulas: {
    engine: HyperFormula, // or `engine: hyperformulaInstance`
    // [plugin configuration]
}
```

or

```js
formulas: {
    engine: {
        hyperformula: HyperFormula, // or `engine: hyperformulaInstance`
        // [HyperFormula configuration]
    },
    // [plugin configuration]
}
```

## Single Handsontable instance

```js
formulas: {
    engine: HyperFormula,
    // [plugin configuration]
}
```

## Single Handsontable instance with an external HyperFormula instance

```js
const externalHF = HyperFormula.buildEmpty({});
```

```js
formulas: {
    engine: externalHF,
    // [plugin configuration]
}
```

## Multiple independent Handsontable instances

```js
// Instance 1:
formulas: {
    engine: HyperFormula,
    // [plugin configuration]
}

// Instance 2:
formulas: {
    engine: HyperFormula,
    // [plugin configuration]
}
```

## Multiple Handsontable instances with shared HyperFormula instance

```js
// Instance 1:

formulas: {
    engine: HyperFormula,
    sheetName: 'Sheet 1'
    // [plugin configuration]
}

// Instance 2:

formulas: {
    engine: hot1.getPlugin('formulas').engine,
    sheetName: 'Sheet 2'
    // [plugin configuration]
}
```

## Multiple Handsontable instances with shared external HyperFormula instance

```js
const externalHF = HyperFormula.buildEmpty({});
```

```js
// Instance 1:

formulas: {
    engine: externalHF,
    sheetName: 'Sheet 1'
    // [plugin configuration]
}

// Instance 2:

formulas: {
    engine: externalHF,
    sheetName: 'Sheet 2'
    // [plugin configuration]
}
```

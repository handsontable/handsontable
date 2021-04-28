This zip package includes a development build of Handsontable with the new formulas plugin.

# Installation

## npm install

1. Put the `handsontable*.tgz` file at the root of your project
2. `npm install handsontable*.tgz`


## `<script>` tag

Simply use the existing instructions from our [quick start guide](https://handsontable.com/docs/8.3.2/tutorial-quick-start.html), just replace `handsontable.full.js` with the one from the tar archive (run `tar xvf handsontable*.tgz` to unpack it).

The formulas plugin will be included in `handsontable.full(.min).js`.


# Usage

To use the plugin, just set the `formulas` property to `true` in your Handsontable config.

For example:

```javascript
new Handsontable(element, {
  data: [['hello', ' world', '=A1 & " " & A2']],
  formulas: true
})
```

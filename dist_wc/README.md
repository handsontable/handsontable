# Handsontable Web Components distribution

As a future alternative to jQuery, we are experimenting with Web Components version of Handsontable (see <a href="http://handsontable.com/demo/web_component.html">demo page</a> for more details).

To use the current experimental version, just load the Polymer library and import `handsontable-table.html` component.

```html
<!-- 1. Load Polymer library -->
<script src="web_component/polymer/polymer.min.js"></script>
<!-- 2. Load the component -->
<link rel="import" href="../dist_wc/handsontable-table.html">
<!-- 3. Load a Numeral.js locale if you use numeric cell type -->
<script src="../lib/numeral.de-de.js"></script>
```
/**
 * This plugin adds support for legacy features, deprecated APIs, etc.
 */

/**
 * Support for old autocomplete syntax
 * For old syntax, see: https://github.com/warpech/jquery-handsontable/blob/8c9e701d090ea4620fe08b6a1a048672fadf6c7e/README.md#defining-autocomplete
 */
Handsontable.PluginHooks.add('beforeGetCellMeta', function (row, col, cellProperties) {
  //isWritable - deprecated since 0.8.0
  cellProperties.isWritable = !cellProperties.readOnly;

  //autocomplete - deprecated since 0.7.1 (see CHANGELOG.md)
  if (cellProperties.autoComplete) {
    throw new Error("Support for legacy autocomplete syntax was removed in Handsontable 0.10.0. Please remove the property named 'autoComplete' from your config. For replacement instructions, see wiki page https://github.com/warpech/jquery-handsontable/wiki/Migration-guide-to-0.10.x");
  }
});
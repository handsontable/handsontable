document.write('<link rel="stylesheet" href="../template_element.css">');
[
  '../../platform/compat.js',
  '../../side_table.js',
  '../../path.js',
  '../../model.js',
  '../../transform.js',
  '../../dependency_parser.js',
  '../../expression_parser.js',
  '../../place_holder_parser.js',
  '../../bind_attribute_parser.js',
  '../../element_model.js',
  '../../html5_attributes.js',
  '../../element_bindings.js',
  '../../template_element.js'
].forEach(function(src) {
  document.write('<script src="' + src + '"></script>');
});

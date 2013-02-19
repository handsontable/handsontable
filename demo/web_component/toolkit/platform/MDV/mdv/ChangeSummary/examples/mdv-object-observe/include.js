// Copyright 2012 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

document.write('<link rel="stylesheet" href="mdv-object-observe/template_element.css">');
[
  'mdv-object-observe/compat.js',
  'mdv-object-observe/path.js',
  '../change_summary.js',
  'mdv-object-observe/model.js',
  'mdv-object-observe/transform.js',
  'mdv-object-observe/dependency_parser.js',
  'mdv-object-observe/expression_parser.js',
  'mdv-object-observe/place_holder_parser.js',
  'mdv-object-observe/bind_attribute_parser.js',
  'mdv-object-observe/element_model.js',
  'mdv-object-observe/html5_attributes.js',
  'mdv-object-observe/element_bindings.js',
  'mdv-object-observe/template_element.js',
  'mdv-object-observe/view_controller.js'
].forEach(function(src) {
  document.write('<script src="' + src + '"></script>');
});

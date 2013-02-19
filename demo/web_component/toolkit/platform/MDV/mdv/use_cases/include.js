// Copyright 2011 Google Inc.
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

document.write('<link rel="stylesheet" href="../template_element.css">');
[
  '../platform/compat.js',
  '../side_table.js',
  '../ChangeSummary/change_summary.js',
  '../model.js',
  '../transform.js',
  '../dependency_parser.js',
  '../expression_parser.js',
  '../place_holder_parser.js',
  '../bind_attribute_parser.js',
  '../element_model.js',
  '../html5_attributes.js',
  '../element_bindings.js',
  '../template_element.js',
  '../util/view_controller.js'
].forEach(function(src) {
  document.write('<script src="' + src + '"></script>');
});

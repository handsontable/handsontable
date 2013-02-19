/* 
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    concat: {
      events: {
        src: [
          'PointerGestures/src/PointerEvents/third_party/mutation_summary/mutation_summary.js',
          'PointerGestures/src/PointerEvents/src/PointerEvent.js',
          'PointerGestures/src/PointerEvents/src/sidetable.js',
          'PointerGestures/src/PointerEvents/src/initialize.js',
          'PointerGestures/src/PointerEvents/src/pointermap.js',
          'PointerGestures/src/PointerEvents/src/dispatcher.js',
          'PointerGestures/src/PointerEvents/src/installer.js',
          'PointerGestures/src/PointerEvents/src/platform-events.js',
          'PointerGestures/src/PointerEvents/src/capture.js'
        ],
        dest: 'min/PointerEvents.js'
      },
      gestures: {
        src: [
          'PointerGestures/src/PointerGestureEvent.js',
          'PointerGestures/src/initialize.js',
          'PointerGestures/src/dispatcher.js',
          'PointerGestures/src/hold.js',
          'PointerGestures/src/tap.js'
        ],
        dest: 'min/PointerGestures.js'
      },
      mdv: {
        src: [
          'MDV/mdv/platform/compat.js',
          'MDV/mdv/side_table.js',
          'MDV/mdv/path.js',
          'MDV/mdv/model.js',
          //
          'MDV/mdv/script_value_binding.js',
          'MDV/mdv/text_replacements_binding.js',
          'MDV/mdv/element_attribute_bindings.js',
          'MDV/mdv/element_bindings.js',
          'MDV/mdv/input_bindings.js',
          'MDV/mdv/template_element.js',
          'MDV/mdv/delegates.js',
          //
          'MDV/dirty-check.js',
          'MDV/template_decorate.js'
        ],
        dest: 'min/MDV.js'
      },
      ShadowDOM: {
        src: [
          'ShadowDOM/shim/LightDOM.js',
          'ShadowDOM/shim/Changeling.js',
          'ShadowDOM/shim/Projection.js',
          'ShadowDOM/shim/ShimShadowDOM.js',
          'ShadowDOM/ShadowDOMImpl.js'
        ],
        dest: 'min/ShadowDOM.js'
      },
      ComponentDocuments: {
        src: [
          'ComponentDocuments/path.js',
          'ComponentDocuments/loader.js',
          'ComponentDocuments/parser.js'
        ],
        dest: 'min/ComponentDocuments.js'
      },
      CustomDOMElement: {
        src: [
          'CustomDOMElement/CustomDOMElements.js',
          'CustomDOMElement/HTMLElementElement.js'
        ],
        dest: 'min/CustomDOMElement.js'
      },
      dist: {
        src: [
          'lib/preload.js',
          'lib/lang.js',
          'lib/dom_token_list.js',
          'min/PointerEvents.js',
          'min/PointerGestures.js',
          'min/MDV.js',
          'min/ShadowDOM.js',
          'min/ComponentDocuments.js',
          'min/CustomDOMElement.js',
          'lib/boot.js'
        ],
        dest: 'min/platform.js'
      }
    },
    min: {
      dist: {
        src: ['min/platform.js'],
        dest: 'min/platform.min.js'
      }/*,
      platform: {
        src: ['min/platform.js'],
        dest: 'platform.min.js'
      }
      */
    }
  });
  // Default task.
  grunt.registerTask('default', 'concat min');
};


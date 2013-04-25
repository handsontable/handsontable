/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
module.exports = function(grunt) {
  ShadowDOMNative = [
    'lib/patches-shadowdom-native.js'
  ];

  ShadowDOMPolyfill = [
    'sidetable.js',
    'wrappers.js',
    'wrappers/EventTarget.js',
    'wrappers/NodeList.js',
    'wrappers/Node.js',
    'wrappers/node-interfaces.js',
    'wrappers/CharacterData.js',
    'wrappers/Element.js',
    'wrappers/HTMLElement.js',
    'wrappers/HTMLContentElement.js',
    'wrappers/HTMLShadowElement.js',
    'wrappers/HTMLTemplateElement.js',
    'wrappers/HTMLUnknownElement.js',
    'wrappers/generic.js',
    'wrappers/ShadowRoot.js',
    'ShadowRenderer.js',
    'wrappers/Document.js',
    'wrappers/Window.js',
    'wrappers/MutationObserver.js',
    'wrappers/override-constructors.js'
  ];
  ShadowDOMPolyfill = ShadowDOMPolyfill.map(function(p) {
    return 'ShadowDOM/src/' + p;
  });
  ShadowDOMPolyfill.push(
    'lib/patches-shadowdom-polyfill.js',
    'lib/querySelector.js'
  );

  Lib = [
    'lib/lang.js',
    'lib/dom.js',
    'lib/template.js',
    'lib/inspector.js'
  ];

  var MDV = [
    '../third_party/ChangeSummary/planner.js',
    '../third_party/ChangeSummary/change_summary.js',
    'compat.js',
    'side_table.js',
    'model.js',
    'node_bindings.js',
    'template_element.js'
  ];
  MDV = MDV.map(function(p) {
    return 'MDV/src/' + p;
  });
  MDV.push(
    'lib/patches-mdv.js'
  );

  PointerEvents = [
    'touch-action.js',
    'PointerEvent.js',
    'pointermap.js',
    'sidetable.js',
    'dispatcher.js',
    'installer.js',
    'findTarget.js',
    'platform-events.js',
    'capture.js',
  ];
  PointerEvents = PointerEvents.map(function(p) {
    return 'PointerGestures/src/PointerEvents/src/' + p;
  });

  PointerGestures = [
    'PointerGestureEvent.js',
    'initialize.js',
    'sidetable.js',
    'pointermap.js',
    'dispatcher.js',
    'hold.js',
    'track.js',
    'flick.js',
    'tap.js'
  ];
  PointerGestures = PointerGestures.map(function(p) {
    return 'PointerGestures/src/' + p;
  });

  HTMLImports = [
    'HTMLImports/src/HTMLImports.js'
  ];

  CustomElements = [
    'CustomElements/MutationObservers/MutationObserver.js',
    'CustomElements/src/CustomElements.js',
    'CustomElements/src/HTMLElementElement.js',
    'CustomElements/src/Parser.js'
  ];

  Main = [].concat(
    Lib,
    MDV,
    HTMLImports,
    CustomElements,
    PointerEvents,
    PointerGestures
  );
    
  PlatformNativeShadow = [].concat(
    ShadowDOMNative,
    Main
  );

  ConditionalShadowdom = [].concat(
    'build/if-poly.js', 
    ShadowDOMPolyfill, 
    'build/else.js',
    ShadowDOMNative,
    'build/end-if.js'
  );

  ConditionalPlatform = [].concat(
    'build/shadowdom.conditional.js',
    Main
  );
    
  // karma setup
  var browsers;
  (function() {
    var os = require('os');
    browsers = ['Chrome', 'Firefox'];
    if (os.type() === 'Darwin') {
      browsers.push('ChromeCanary');
    }
    if (os.type() === 'Windows_NT') {
      browsers.push('IE');
    }
  })();

  grunt.initConfig({
    karma: {
      toolkit: {
        configFile: 'conf/karma.conf.js',
        browsers: browsers,
        keepalive: true
      }
    },
    concat: {
      ShadowDom: {
        files: {
          'build/shadowdom.conditional.js': ConditionalShadowdom
        }
      }
    },
    uglify: {
      Platform: {
        options: {
          sourceMap: 'platform.min.js.map',
          //mangle: false,
          //beautify: true,
          //report: 'gzip',
          compress: {
            // TODO(sjmiles): should be false by default (?)
            // https://github.com/mishoo/UglifyJS2/issues/165
            unsafe: false
          }
        },
        files: {
          'platform.min.js': ConditionalPlatform
        }
      },
      PlatformNative: {
        options: {
          sourceMap: 'platform.native.min.js.map',
          //mangle: false,
          //beautify: true,
          //report: 'gzip',
          compress: {
            // TODO(sjmiles): should be false by default (?)
            // https://github.com/mishoo/UglifyJS2/issues/165
            unsafe: false
          }
        },
        files: {
          'platform.native.min.js': PlatformNativeShadow
        }
      }
    },

    yuidoc: {
      compile: {
        name: '<%= pkg.name %>',
        description: '<%= pkg.description %>',
        version: '<%= pkg.version %>',
        url: '<%= pkg.homepage %>',
        options: {
          exclude: 'third_party',
          paths: '.',
          outdir: 'docs',
          linkNatives: 'true',
          tabtospace: 2,
          themedir: '../docs/doc_themes/simple'
        }
      }
    },
    pkg: grunt.file.readJSON('package.json')
  });

  // plugins
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-yuidoc');
  grunt.loadNpmTasks('grunt-karma');
  
  // tasks
  grunt.registerTask('default', ['concat', 'uglify']);
  grunt.registerTask('minify', ['concat', 'uglify']);
  grunt.registerTask('docs', ['yuidoc']);
  grunt.registerTask('test', ['karma']);
};


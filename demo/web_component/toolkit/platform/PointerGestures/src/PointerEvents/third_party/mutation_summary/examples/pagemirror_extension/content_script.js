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

var observer;

if (typeof WebKitMutationObserver != 'function') {
  console.error('This example extension requires MutationObservers. ' +
                'Try the Chrome Canary build.');
  return;
}

chrome.extension.onConnect.addListener(function(port) {
  port.postMessage({ base: location.href.match(/^(.*\/)[^\/]*$/)[1] });

  var mirrorClient = new TreeMirrorClient(document, {
    initialize: function(rootId, children) {
      port.postMessage({
        f: 'initialize',
        args: [rootId, children]
      });
    },

    applyChanged: function(removed, addedOrMoved, attributes, text) {
      port.postMessage({
        f: 'applyChanged',
        args: [removed, addedOrMoved, attributes, text]
      });
    }
  });

  port.onDisconnect.addListener(function() {
    mirrorClient.disconnect();
  });
});
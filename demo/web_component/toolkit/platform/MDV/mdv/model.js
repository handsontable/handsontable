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

var Model = (function() {
  var router = new ChangeSummary.CallbackRouter();
  var queue = [];
  var notificationQueueIsRunning = false;

  return {
    enqueue: function(func) {
      queue.push(func);
    },

    notifyChanges: function() {
      if (notificationQueueIsRunning)
        return;

      notificationQueueIsRunning = true;
      router.deliver();

      while (queue.length > 0) {
        var f = queue.shift();
        f();
      }

      notificationQueueIsRunning = false;
    },

    getValueAtPath: ChangeSummary.getValueAtPath,
    setValueAtPath: ChangeSummary.setValueAtPath,
    observeObject: router.observeObject.bind(router),
    unobserveObject: router.unobserveObject.bind(router),
    observeArray: router.observeArray.bind(router),
    unobserveArray: router.unobserveArray.bind(router),
    observePath: router.observePath.bind(router),
    unobservePath: router.unobservePath.bind(router)
  };
})();

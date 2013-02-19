/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

function async(inFn) {
  setTimeout(inFn, 1);
}

function shadowQuery(inNode, inQuery) {
  return ShadowDOM.localQuery(inNode.shadow, inQuery);
}

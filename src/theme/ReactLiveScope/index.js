/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
// import Handsontable from "handsontable"; //todo not versioned // todo2 disable because causes build errors (window not found)


// Add react-live imports you need here
const ReactLiveScope = {
  React,
  ...React,
  // Handsontable
};

export default ReactLiveScope;

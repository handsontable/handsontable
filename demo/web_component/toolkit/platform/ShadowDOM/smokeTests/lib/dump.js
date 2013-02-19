var iterator = function(inTree, inFn) {
  if (inTree) {
    for (var i=0, n; (n=inTree.childNodes[i]); i++) {
      if (inFn(n) === false) {
        return false;
      }
    }
  }
};

labelizer = function(n) {
  // deref changeling
  n = n.baby || n;
  // filter
  if ({SCRIPT:1,TEMPLATE:1}[n.tagName]) {
    return null;
  }
  // labe is tagName, to start
  var label = n.tagName;
  if (n.nodeType == 11) {
     label = 'DOCUMENT FRAGMENT';
  }
  if (!label) {
    // text node
    if (n.textContent.search(/[\S]/) == -1) {
      return label;
    }
    label = n.textContent.replace(/[\n\r\t]*/g, '').trim();
  }
  if (n.id) {
    label += ' #' + n.id;
  }
  if (n.className) {
    label += ' .' + n.className;
  }
  if (n.tagName == 'CONTENT' && n.hasAttribute('select')) {
    label += ' select="' + n.getAttribute('select') + '"';
  }
  if (n.changeling || n.insertions) {
    label += ' (';
    if (n.changeling) {
      label += '@';
    }
    if (n.insertions) {
      label += '*';
    }
    label += ')';
  }
  return label;
};

dumper = function(n) {
  // make a label
  var label = labelizer(n);
  if (!label) {
    return;
  }
  // deref changeling
  n = n.baby || n;
  if (n.childNodes.length) {
    console.group(label);
    if (n.shadow) {
      xdump(n);
    } else {
      dump(n);
    }
    console.groupEnd();
  } else {
    console.log(label);
  }
};

dump = function(inTree) {
  if (inTree && inTree.childNodes.length) {
    iterator(inTree, dumper);
  }
};

groupDump = function(inLabel, inTree) {
  if (inTree && inTree.childNodes.length) {
    console.group(inLabel);
    dump(inTree);
    console.groupEnd();
  }
};

xdump = function(inTree) {
  // only make groups if we have two subtrees
  if (inTree.shadow) {
    groupDump('LIGHT', inTree);
    groupDump('LOCAL', inTree.shadow);
  } else {
    dump(inTree);
  }
};

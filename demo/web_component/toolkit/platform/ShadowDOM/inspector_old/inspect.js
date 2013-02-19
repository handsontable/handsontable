var xinspect;

(function() {

  var groups = [], openAll, openedGroups = {}, composedGroups = [];
  var treeGroups = {LIGHT:1, LOCAL:1};
  
  function parent() {
    return groups[groups.length-1];
  }
  
  function createNode(inLabel) {
    var n = document.createElement('div');
    n.classList.add('node');
    var p = parent();
    p.appendChild(n);
    n.path = (p.path || '') + '/' + inLabel + [].indexOf.call(p.children, n);
    var xlabel = document.createElement('xlabel');
    n.appendChild(xlabel);
    var tools = document.createElement('tools');
    xlabel.appendChild(tools);
    xlabel.appendChild(document.createTextNode(inLabel));
    n.tools = tools;
    return n;
  }
  
  function context(g) {
    return treeGroups[g.kind] && g.kind;
  }
  
  function groupContext() {
    var ctx = '';
    for (var i=groups.length-2, g; !ctx && (g=groups[i]); i--) {
      ctx = context(g);
    }
    return ctx;
  }
  
  function collapse(inGroup, inCollapsed) {
    inGroup.classList[inCollapsed === undefined ? 'toggle' : 
      (inCollapsed ? 'add' : 'remove')]('collapsed');
    if (inGroup.classList.contains('collapsed')) {
      delete openedGroups[inGroup.path];
    } else {
      openedGroups[inGroup.path] = true;
    }
  }
  
  function log(inLabel) {
    createNode(inLabel);
  }
  
  function groupEnd() {
    groups.pop();
  }
  
  function group(inLabel) {
    var n = createNode(inLabel);
    n.kind = inLabel;
    n.classList.add('group');
    groups.push(n);
    //
    var c = context(n);
    if (c) {
      n.classList.add('flatten');
      c = c.toLowerCase();
      n.classList.add(c);
      n.parentNode[c] = n;
      createToggle(n);
    }
    //
    if (!shouldOpen(n)) {
      collapse(n, true);
    }
    //
    n.querySelector('xlabel').addEventListener('click', function(e) {
      collapse(e.currentTarget.parentNode);
      e.stopPropagation();
    });
  }
  
  function createToggle(n) {
    var p = n.parentNode, t = p.tools;
    var light = p.light;
    var composed = p.local;
    if (light && composed) {
      composedGroups.push(composed);
      var input = document.createElement('input');
      input.type = 'checkbox';
      t.appendChild(input);
      var isRoot = n.parentNode == groups[1];
      input.checked = isRoot;
      showHideGroup(light, !isRoot);
      showHideGroup(composed, isRoot);
      t.addEventListener('click', function(e) {
        e.stopPropagation();
      });
      input.addEventListener('change', function(e) {
        showHideGroup(light, !input.checked);
        showHideGroup(composed, input.checked);
      });
    }
  }
  
  function showHideGroup(inGroup, inShow) {
    inGroup.hidden = !inShow;
    var p = inGroup.parentNode;
    var gs = findVisibleGroups(p);
    if (gs.length) {
      var k = composedGroups.indexOf(p.local);
      if (k > 0) {
        // apply different color to composed tree
        var b = gs[0] == p.local;
        p.classList[b ? 'add' : 'remove']('composed-' + k%6);
        // only show the composed tree
        if (p.oldp) {
          p.oldp.insertBefore(p, p.olds);
          p.oldp = null;
          p.olds = null;
          groups[0].lastElementChild.hidden = false;
        }
        if (b) {
          oldp = p.parentNode;
          olds = p.nextElementSibling;
          p.oldp = oldp;
          p.olds = olds;
          groups[0].appendChild(p);
          Array.prototype.forEach.call(groups[0].children, function(n) {
            n.hidden = true;
          });
          p.hidden = false;
        }
      }
    }
  }
  
  function findVisibleGroups(inGroup) {
    return [].filter.call(inGroup.children, function(node) {
      return node.nodeType == 1 && !node.hidden && node.tagName !== 'XLABEL';
    });
  }
  
  function shouldOpen(inGroup) {
    // open the tree if it was opened before or openAll is true
    if (openAll || openedGroups[inGroup.path]) {
      return true;
    }
    var ctx = context(parent());
    // non-group nodes should be expanded
    if (!ctx) {
      return true;
    }
    // otherwise, get our ancestor context
    var container = groupContext();
    // don't expand anything inside of SHADOW
    if (container == 'SHADOW') {
      return false;
    }
  }
  
  xinspect = function(inNode, inTarget, inExplode) {
    openAll = inExplode;
    groups = [inTarget];
    console.group = group;
    console.log = log;
    console.groupEnd = groupEnd;
    dumper(inNode);
  };

})();
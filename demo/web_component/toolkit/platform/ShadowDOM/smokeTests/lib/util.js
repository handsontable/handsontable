var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);

var $ = document.querySelector.bind(document);

var ShadowRoot = function(inNode, inContent, inFlags) {
  // make ShadowRoot
  var root = new ShadowDOM.ShadowRoot(inNode);
  // stamp our template
  root.appendChild(inContent.cloneNode(true));
  // distribute new nodes
  ShadowDOM.distribute(inNode);
  // apply flags
  root.applyAuthorStyles = true;
  if (inFlags) {
    for (var n in inFlags) {
      root[n] = inFlags[n];
    };
  }
  return root;
}
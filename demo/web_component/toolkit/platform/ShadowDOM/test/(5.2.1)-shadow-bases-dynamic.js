(function(){

var test = function() {
  render(function(){/*
    <g-A>
      <span>Where am I?</span>
    </g-A>
    <template id="Ab"><span>A's base template, content: [<content></content>]</span></template>
    <template id="A"><span>A's template</span></template>
  */});
  // make ShadowRoot
  new ShadowRoot('g-A', 'Ab');
  var root = new ShadowRoot('g-A', 'A');
  //
  var addShadow = function() {
    var textNode = document.createTextNode(', shadow: ');
    var shadow = document.createElement('shadow');
    root.appendChild(textNode);
    root.appendChild(shadow);
    ShadowDOM.distribute(root.host);
  }
  //
  addShadow();
  //
  return root.host;
};

describe('(5.2)-shadow-bases', function() {
  var expected = '<g-a><span>A\'s template</span>, shadow: <span>A\'s base template, content: [      <span>Where am I?</span>    ]</span></g-a>';
  testImpls(test, expected);
});

})();
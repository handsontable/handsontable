(function(){

var test = function() {
  render(function(){/*
    <g-A>
      <span id="a2">Where am I?</span>
      <span id="a1">I go first</span>
    </g-A>
    <template id="Ab"><span>A's base template, #a2: [<content select="#a2"></content>]</span></template>
    <template id="A">#a1:[<content select="#a1"></content>]<span> A's template, shadow: {<shadow></shadow>}</span></template>
  */});
  // make ShadowRoot
  new ShadowRoot('g-A', 'Ab');
  var root = new ShadowRoot('g-A', 'A');
  return root.host;
};

describe('(5.2)-shadow-bases', function() {
  var expected = '<g-a>#a1:[<span id="a1">I go first</span>]<span> A\'s template, shadow: {<span>A\'s base template, #a2: [<span id="a2">Where am I?</span>]</span>}</span></g-a>';
  testImpls(test, expected);
});

})();
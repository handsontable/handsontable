(function(){

var test = function() {
  render(function(){/*
    <g-A>
      <span>Where am I?</span>
    </g-A>
    <template id="Ab"><span>A's base template, content: [<content></content>]</span></template>
    <template id="A"><span>A's template, shadow: {<shadow></shadow>}</span></template>
  */});
  // make ShadowRoot
  new ShadowRoot('g-A', 'Ab');
  var root = new ShadowRoot('g-A', 'A');
  return root.host;
};

describe('(5.2)-shadow-bases', function() {
  var expected = '<g-a><span>A\'s template, shadow: {<span>A\'s base template, content: [      <span>Where am I?</span>    ]</span>}</span></g-a>';
  testImpls(test, expected);
});

})();
(function(){

var test = function() {
  render(function(){/*
    <g-A><span>Where am I?</span></g-A>
    <template id="A"><span>A's template, content goes here: [<content></content>]</span></template>
  */});
  // make ShadowRoot
  var root = new ShadowRoot('g-A', 'A');
  return root.host;
};

describe('(5)-lightAndShadow', function() {
  var expected = '<g-a><span>A\'s template, content goes here: [<span>Where am I?</span>]</span></g-a>';
  testImpls(test, expected);
});

})();
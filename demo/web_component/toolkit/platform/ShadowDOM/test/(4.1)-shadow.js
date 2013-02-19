(function(){

var test = function() {
  render(function(){/*
      <A>
        <span>Where am I?</span>
      </A>

      <template id="Abb"><span>A's Base Base Template</span></template>
      <template id="Ab"><span>A's Base Template:<shadow></shadow></span></template>
      <template id="A"><span>A's Template:<shadow></shadow></span></template>
  */});
  new ShadowRoot('A', 'Abb');
  new ShadowRoot('A', 'Ab');
  var root = new ShadowRoot('A', 'A');
  return root.host;

};

describe('(4.1)-shadow', function() {
  var expected = '<a><span>A\'s Template:<span>A\'s Base Template:<span>A\'s Base Base Template</span></span></span></a>';
  testImpls(test, expected);
});

})();
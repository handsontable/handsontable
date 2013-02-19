(function(){

var test = function() {
  render(function(){/*
    <g-A><span id="a1">Where am I?</span><span id="a2">Where do I go?</span></g-A>

    <template id="A">[A->]<g-B><content></content></g-B><g-B><shadow></shadow></g-B>[<-A]</template>
    <template id="B">[B->][<content select="#a2"></content>]<shadow></shadow>[<-B]</template>
    <template id="Base">[Base->]<content></content>[<-Base]</template>
  */});
  //
  Component.reset();
  Component.register('g-A', ['Base', 'A']);
  Component.register('g-B', ['Base', 'B']);
  Component.upgradeAll($('#work'));
  //
  var A = c$[0];
  return A;
};

describe('(7.2.0.1)-complexity', function() {
  var expected = '<g-a is="g-A">[A-&gt;]<g-b is="g-B">[B-&gt;][<span id="a2">Where do I go?</span>][Base-&gt;]<span id="a1">Where am I?</span>[&lt;-Base][&lt;-B]</g-b><g-b is="g-B">[B-&gt;][][Base-&gt;][Base-&gt;][&lt;-Base][&lt;-Base][&lt;-B]</g-b>[&lt;-A]</g-a>';
  testImpls(test, expected, true);
});

})();
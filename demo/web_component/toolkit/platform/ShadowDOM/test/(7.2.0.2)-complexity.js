(function(){

var test = function() {
  render(function(){/*
    <g-A><span id="a1">Where am I?</span><span id="a2">Where do I go?</span></g-A>

    <template id="A">[A->]<g-B><content select="#a2"></content></g-B><g-C><shadow></shadow></g-C>[<-A]</template>
    <template id="B">[B->][<content select="#a2"></content>]<shadow></shadow>[<-B]</template>
    <template id="C">[C->]<content select="#a1"></content>[<-C]</template>
    <template id="Base">[Base->]<content select="#a1"></content>[<-Base]</template>
  */});
  //
  Component.reset();
  Component.register('g-A', ['Base', 'A']);
  Component.register('g-B', ['Base', 'B']);
  Component.register('g-C', ['B', 'C']);
  Component.upgradeAll($('#work'));
  //
  var A = c$[0];
  return A;
};

describe('(7.2.0.2)-complexity', function() {
  var expected = '<g-a is="g-A">[A-&gt;]<g-b is="g-B">[B-&gt;][<span id="a2">Where do I go?</span>][Base-&gt;][&lt;-Base][&lt;-B]</g-b><g-c is="g-C">[C-&gt;]<span id="a1">Where am I?</span>[&lt;-C]</g-c>[&lt;-A]</g-a>';
  testImpls(test, expected, true);
});

})();
(function(){

var test = function() {
  render(function(){/*
    <g-A><span id="a1">Where am I?</span><span id="a2">Where do I go?</span></g-A>

    <!-- A collects #a2 into first CONTENT, leaving #a1 in POOL -->
    <!-- A.shadow (Base) collects #a1 into it's CONTENT -->
    <!-- first B should capture the #a2, second B should capture the #a1 -->
    <template id="A">[A->]<g-B><content select="#a2"></content></g-B><g-B><shadow></shadow></g-B>[<-A]</template>
    <!-- B collects #a2's into first CONTENT, leaving #a1's in POOL -->
    <!-- B.shadow collects #a1's into the second CONTENT -->
    <template id="B">[B->][<content select="#a2"></content>]<shadow></shadow>[<-B]</template>
    <!-- Base collects #a1's -->
    <template id="Base">[Base->]<content select="#a1"></content>[<-Base]</template>
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

describe('(7.2)-complexity', function() {
  var expected = '<g-a is="g-A">[A-&gt;]<g-b is="g-B">[B-&gt;][<span id="a2">Where do I go?</span>][Base-&gt;][&lt;-Base][&lt;-B]</g-b><g-b is="g-B">[B-&gt;][][Base-&gt;]<span id="a1">Where am I?</span>[&lt;-Base][&lt;-B]</g-b>[&lt;-A]</g-a>';
  testImpls(test, expected, true);
});

})();
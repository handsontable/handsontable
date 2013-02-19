(function(){

var test = function(inImpl) {
  render(function(){/*
    <g-A><span id="a1">Where am I?</span><span id="a2">Where do I go?</span></g-A>

    <!-- A collects #a2 into first CONTENT, leaving #a1 in POOL -->
    <!-- A.shadow (Base) collects #a1 into it's CONTENT -->
    <!-- first B should capture the #a2, second B should capture the #a1 -->
    <template id="A">[A->]<g-C><g-B><content select="#a2"></content></g-B></g-C><g-C><g-B><shadow></shadow></g-B></g-C>[<-A]</template>
    <!-- B collects #a2's into first CONTENT, leaving #a1's in POOL -->
    <!-- B.shadow collects #a1's into the second CONTENT -->
    <template id="B">[B->][<content select="#a2"></content>]<shadow></shadow>[<-B]</template>
    <!-- Base collects #a1's -->
    <template id="Base">[Base->]<content select="#a1"></content>[<-Base]</template>
    <!-- C has basic but deep inheritance -->
    <template id="C">[C->]<shadow></shadow>[<-C]</template>
    <template id="Cb"><span>[Cb->]<shadow></shadow>[<-Cb]</span></template>
    <template id="Cbb">[Cbb->]</span><content></content></span>[<-Cbb]</template>
  */});
  //
  Component.reset();
  Component.register('g-A', ['Base', 'A']);
  Component.register('g-B', ['Base', 'B']);
  Component.register('g-C', ['Cbb', 'Cb', 'C']);
  Component.upgradeAll($('#work'));
  //
  var A = c$[0];
  //
  var n = document.createElement('div');
  n.id = 'a1';
  n.innerHTML = 'A1 dynamic';
  A.appendChild(n);
  //
  var n = document.createElement('div');
  n.id = 'a2';
  n.innerHTML = 'A2 too';
  A.appendChild(n);
  //
  ShadowDOM.distribute(A);
  return A;
};

describe('(7.2.2)-more-complexity-dynamic', function() {
  var expected = '<g-a is="g-A">[A-&gt;]<g-c is="g-C">[C-&gt;]<span>[Cb-&gt;][Cbb-&gt;]<g-b is="g-B">[B-&gt;][<span id="a2">Where do I go?</span><div id="a2">A2 too</div>][Base-&gt;][&lt;-Base][&lt;-B]</g-b>[&lt;-Cbb][&lt;-Cb]</span>[&lt;-C]</g-c><g-c is="g-C">[C-&gt;]<span>[Cb-&gt;][Cbb-&gt;]<g-b is="g-B">[B-&gt;][][Base-&gt;]<span id="a1">Where am I?</span><div id="a1">A1 dynamic</div>[&lt;-Base][&lt;-B]</g-b>[&lt;-Cbb][&lt;-Cb]</span>[&lt;-C]</g-c>[&lt;-A]</g-a>';
  testImpls(test, expected, true);
});

})();
(function(){

var test = function(inImpl) {
  render(function(){/*
    <g-A><span>Where am I?</span></g-A>

    <template id="A">[A->]<g-C><g-B><content></content><content></content></g-B></g-C>
      <g-B><content></content></g-B><g-C><g-B><shadow></shadow></g-B></g-C>[<-A]
    </template>

    <template id="B">[B->][<content></content>]<shadow></shadow>[<-B]</template>

    <template id="Base">[Base->]<content></content>[<-Base]</template>

    <template id="C">[C->]<shadow></shadow>[<-C]</template>
    <template id="Cb"><span>[Cb->]<shadow></shadow>[<-Cb]</span></template>
    <template id="Cbb">[Cbb->]<g-D><content></content></g-D>[<-Cbb]</template>


    <template id="D">[D->]<shadow></shadow>[<-D]</template>
    <template id="Db">[Db->]<g-E><shadow></shadow></g-E>[<-Db]</template>
    <template id="Dbb">[Dbb->]<g-E><shadow></shadow></g-E><shadow></shadow>[<-Dbb]</template>
    <template id="Dbbb">[Dbbb->]<g-E><content></content></g-E>[<-Dbbb]</template>

    <template id="E">[E->]<g-F><shadow></shadow></g-F>[<-E]</template>
    <template id="Eb">[Eb->]<g-F><content></content></g-F>[<-Eb]</template>

    <template id="F">[F->]<content></content>[<-F]</template>
  */});
  //
  Component.reset();
  Component.register('g-A', ['Base', 'A']);
  Component.register('g-B', ['Base', 'B']);
  Component.register('g-C', ['Cbb', 'Cb', 'C']);
  Component.register('g-D', ['Dbbb', 'Dbb', 'Db', 'D']);
  Component.register('g-E', ['Eb', 'E']);
  Component.register('g-F', ['F']);
  //
  Component.upgradeAll();
  //
  var B = c$[1];
  B.appendChild(document.createTextNode(' Appended to B '));
  //
  //var base = B.shadow.previousSibling;
  var base = B.shadow.olderSubtree;
  base.appendChild(document.createTextNode(' Appended to B\'s Base '));
  //
  var A = c$[0];
  ShadowDOM.distribute(A);
  //
  return A;
};

describe('(7.2.3)-uber-complexity', function() {
  var expected = '<g-a is="g-A">[A-&gt;]<g-c is="g-C">[C-&gt;]<span>[Cb-&gt;][Cbb-&gt;]<g-d is="g-D">[D-&gt;][Db-&gt;]<g-e is="g-E">[E-&gt;]<g-f is="g-F">[F-&gt;][Eb-&gt;]<g-f is="g-F">[F-&gt;][Dbb-&gt;]<g-e is="g-E">[E-&gt;]<g-f is="g-F">[F-&gt;][Eb-&gt;]<g-f is="g-F">[F-&gt;][Dbbb-&gt;]<g-e is="g-E">[E-&gt;]<g-f is="g-F">[F-&gt;][Eb-&gt;]<g-f is="g-F">[F-&gt;]<g-b is="g-B">[B-&gt;][<span>Where am I?</span>][Base-&gt;][&lt;-Base][&lt;-B]</g-b>[&lt;-F]</g-f>[&lt;-Eb][&lt;-F]</g-f>[&lt;-E]</g-e>[&lt;-Dbbb][&lt;-F]</g-f>[&lt;-Eb][&lt;-F]</g-f>[&lt;-E]</g-e>[&lt;-Dbb][&lt;-F]</g-f>[&lt;-Eb][&lt;-F]</g-f>[&lt;-E]</g-e>[&lt;-Db][&lt;-D]</g-d>[&lt;-Cbb][&lt;-Cb]</span>[&lt;-C]</g-c>      <g-b is="g-B">[B-&gt;][ Appended to B ][Base-&gt;][&lt;-Base] Appended to B\'s Base [&lt;-B]</g-b><g-c is="g-C">[C-&gt;]<span>[Cb-&gt;][Cbb-&gt;]<g-d is="g-D">[D-&gt;][Db-&gt;]<g-e is="g-E">[E-&gt;]<g-f is="g-F">[F-&gt;][Eb-&gt;]<g-f is="g-F">[F-&gt;][Dbb-&gt;]<g-e is="g-E">[E-&gt;]<g-f is="g-F">[F-&gt;][Eb-&gt;]<g-f is="g-F">[F-&gt;][Dbbb-&gt;]<g-e is="g-E">[E-&gt;]<g-f is="g-F">[F-&gt;][Eb-&gt;]<g-f is="g-F">[F-&gt;]<g-b is="g-B">[B-&gt;][[Base-&gt;][&lt;-Base]][Base-&gt;][&lt;-Base][&lt;-B]</g-b>[&lt;-F]</g-f>[&lt;-Eb][&lt;-F]</g-f>[&lt;-E]</g-e>[&lt;-Dbbb][&lt;-F]</g-f>[&lt;-Eb][&lt;-F]</g-f>[&lt;-E]</g-e>[&lt;-Dbb][&lt;-F]</g-f>[&lt;-Eb][&lt;-F]</g-f>[&lt;-E]</g-e>[&lt;-Db][&lt;-D]</g-d>[&lt;-Cbb][&lt;-Cb]</span>[&lt;-C]</g-c>[&lt;-A]    </g-a>';
  testImpls(test, expected, true);
});

})();
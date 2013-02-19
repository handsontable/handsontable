(function(){

var test = function() {
  render(function(){/*
    <g-A><span id="a1">Where am I?</span></g-A>

    <!-- content inserts into this shadow -->
    <template id="Ab">[Ab->]<content></content>[<-Ab]</template>
    <!-- content must project through shadow-content to become B content -->
    <template id="A">[A->]<g-B><shadow></shadow></g-B>[<-A]</template>
    <!-- simply echo content -->
    <template id="Bb">[Bb->]<content></content>[<-Bb]</template>
    <!-- content must project through shadow-content to become B content -->
    <template id="B">[B->]<shadow></shadow>[<-B]</template>
  */});
  new ShadowRoot('g-A', 'Ab');
  var root = new ShadowRoot('g-A', 'A');
  new ShadowRoot(ShadowDOM.localQuery(root, 'g-B'), 'Bb');
  new ShadowRoot(ShadowDOM.localQuery(root, 'g-B'), 'B');
  return root.host;
};

describe('(6.3.1)-reproject-shadow-shadow', function() {
  var expected = '<g-a>[A-&gt;]<g-b>[B-&gt;][Bb-&gt;][Ab-&gt;]<span id="a1">Where am I?</span>[&lt;-Ab][&lt;-Bb][&lt;-B]</g-b>[&lt;-A]</g-a>';
  testImpls(test, expected, true);
});

})();
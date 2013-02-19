(function(){

var test = function() {
  render(function(){/*
    <g-A><span id="a1">Where am I?</span><span id="a2">I like to be first</span></g-A>

    <!-- content must project through shadow-content to become B content -->
    <template id="A">[A->]<content select="#a2"></content><g-B><shadow></shadow></g-B>[<-A]</template>
    <!-- A's <shadow> is here, non #a2 content inserts here -->
    <template id="Ab">[Ab->]<content></content>[<-Ab]</template>
    <!-- echo content matching #a1 (filters out "[Ab->][<-Ab]" nodes) -->
    <template id="B">[B->]<content select="#a1"></content>[<-B]</template>
  */});
  new ShadowRoot('g-A', 'Ab');
  var root = new ShadowRoot('g-A', 'A');
  new ShadowRoot(ShadowDOM.localQuery(root, 'g-B'), 'B');
  return root.host;
};

describe('(6.4)-reproject-shadow-select', function() {
  var expected = '<g-a>[A-&gt;]<span id="a2">I like to be first</span><g-b>[B-&gt;]<span id="a1">Where am I?</span>[&lt;-B]</g-b>[&lt;-A]</g-a>';
  testImpls(test, expected, true);
});

})();
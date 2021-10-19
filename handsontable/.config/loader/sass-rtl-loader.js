function scssRtl(source) {
  return `
@mixin load($direction: ltr) {
  $inline-start: left;
  $inline-end: right;
  
  @if $direction == rtl {
    $inline-start: right;
    $inline-end: left;
  }

${source}

}

@include load();

[dir=rtl] {
  @include load(rtl);
}
`;
}

module.exports =  function(source) {
  
  if(this.resource.endsWith('.scss')){
    return scssRtl(source);
  }
  if(this.resource.endsWith('.sass')){
    this.getLogger('sass-rtl-loader').warn('RTL features for SASS are not supported. Please convert to SCSS.');
  }
  return source;
}

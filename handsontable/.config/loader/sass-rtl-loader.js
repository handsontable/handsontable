const trim = (properties) => {
  return properties.match(
    /[^;]*(inline-start|inline-end)[^;]*;/gm // remove all redundant properties
  )?.join('');
};

const splitSources = (source) => {
  let rtl = '';
  const ltr = source.replace(
    /([^}]*){([^{]*(inline-end|inline-start)[^}]*)}/gm, // detect ltr/rtl dependent properties
    (all, selector, properties) => {
      rtl += `${selector}{${trim(properties)}}`;

      return `${selector}{${properties}}`;
    });

  return [ltr, rtl];
};

const polyfillDirection = (direction, source) => {
  switch (direction) {
    case 'ltr':
      return source.replace(/inline-start/g, 'left').replace(/inline-end/g, 'right');
    case 'rtl':
      return source.replace(/inline-start/g, 'right').replace(/inline-end/g, 'left');
    default:
      return source;
  }
};

const applyRtlStyles = (source) => {
  const [ltrSource, rtlSource] = splitSources(source);

  return `
${polyfillDirection('ltr', ltrSource)}
    
[dir=rtl] {
${polyfillDirection('rtl', rtlSource)}
}
`;
};

module.exports = function(source) {
  if (this.resource.endsWith('.scss')) {
    return applyRtlStyles(source);
  }
  if (this.resource.endsWith('.sass')) {
    this.getLogger('sass-rtl-loader').warn('RTL features for SASS are not supported. Please convert to SCSS.');
  }

  return source;
};

const trim = (properties) => {
  return properties.match(
    /[^;]*(inline-start|inline-end)[^;]*;/gm // remove all redundant properties
  )?.join('');
};


const toPhysicalDirection = (direction, source) => {
  switch (direction) {
    case 'ltr':
      return source
        .replace(/inset-inline-start/g, 'left').replace(/inset-inline-end/g, 'right')
        .replace(/inline-start/g, 'left').replace(/inline-end/g, 'right');
    case 'rtl':
      return source
        .replace(/inset-inline-start/g, 'right').replace(/inset-inline-end/g, 'left')
        .replace(/inline-start/g, 'right').replace(/inline-end/g, 'left');
    default:
      return source;
  }
};

const appendRtl = (all, selector, properties) => {
  const rtlSelector = selector.split(',').map(sel => `[dir=rtl]${sel.trimStart()}`).join(', ');

  return `
    ${selector} {${toPhysicalDirection('ltr', properties)}}
    ${rtlSelector} {${toPhysicalDirection('rtl', trim(properties))}}
  `;
}

const applyRtlStyles = (source) => {
  return source.replace(
    /([^}/]*){([^{]*(inset-inline-end|inset-inline-start|inline-end|inline-start)[^}]*)}/gm, // detect ltr/rtl dependent properties
    appendRtl
  );
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

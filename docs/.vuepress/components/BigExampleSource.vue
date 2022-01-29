<template>
  <li>
    <a :href="sourceUrl" target="_blank"><svg>
      <use :xlink:href="iconId"></use>
    </svg>{{ label }}</a>
  </li>
</template>

<script>
const iconLookup = {
  ts: 'typescript',
  angular: 'angular',
  react: 'react-js',
  vue: 'vue-l',
  js: 'javascript',
};

export default {
  name: 'BigExampleSource',
  props: ['label', 'icon', 'target'],
  computed: {
    sourceUrl() {
      if (!this.target.startsWith('/')) {
        throw new Error('The target property of BigExampleSource should begin with /');
      }

      return `https://github.com/handsontable/handsontable/tree/develop${this.target}`;
    },
    iconId() {
      const iconId = iconLookup[this.icon] || iconLookup.js;

      return `#${iconId}`;
    }
  }
};
</script>

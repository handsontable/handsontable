<template>
  <li>
    <a :href="url" target="_blank"><svg>
      <use :xlink:href="iconId"></use>
    </svg>{{ label }}</a>
  </li>
</template>

<script>
const iconLookup = {
  ts: "typescript",
  angular: "angular",
  react: "react-js",
  vue: "vue-l",
  js: "javascript",
}


export default {
  name: 'BigExampleSource',
  props: ['label', 'icon', 'url'],
  computed: {
    iconId() {
      const iconId = iconLookup[this.icon] || iconLookup['js'];
      return `#${iconId}`;
    }
  }
};
</script>

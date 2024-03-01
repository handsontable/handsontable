<template>
  
  <nav class="nav-frameworks nav-links">
    <i class="ico" :class="icon" :alt="alt"></i>
    <nav class="nav-item">
      <DropdownLink @item-click="onFrameworkClick" :item="item"></DropdownLink>
    </nav>
  </nav>
  
</template>

<script>
import DropdownLink from '@theme/components/DropdownLink.vue';

/**
 * Sets cookie bound to the docs URL domain and path.
 *
 * @param {string} name Cookie name.
 * @param {string} value Cookie value.
 */
function setCookie(name, value) {
  const hostname = window.location.hostname;
  const urlParts = hostname.split('.');
  let domainWithoutSubdomain = hostname;

  if (urlParts.length > 2) {
    domainWithoutSubdomain = urlParts.slice(1).join('.');
  }
  let str = `${name}=${value}`;

  str += `; Domain=${domainWithoutSubdomain}`;
  str += '; Path=/docs';
  str += `; Expires=${new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)).toUTCString()}`; // 1 year

  document.cookie = str;
}

const frameworkIdToFullName = new Map([
  ['javascript', { name: 'JavaScript' }],
  ['react', { name: 'React' }]
]);

export default {
  name: 'FrameworksDropdown',
  components: {
    DropdownLink,
  },
  watch: {
    $route(to) {
      this.detectLegacyFramework(to.fullPath);
    },
  },
  data() {
    return {
      legacyFramework: null,
    };
  },
  methods: {
    onFrameworkClick(item) {
      setCookie('docs_fw', item.id === 'react' ? 'react' : 'javascript');
    },
    detectLegacyFramework(path) {
      const frameworkMatch = path.match(
        /javascript-data-grid\/(vue3|vue|angular)?/
      );

      this.legacyFramework = frameworkMatch ? frameworkMatch[1] : null;
    },
    getAlt(framework) {
      return frameworkIdToFullName.get(framework).alt;
    },
    getLink(framework) {
      const { homepage = `/${framework}${this.$page.frameworkSuffix}/` } =
        frameworkIdToFullName.get(framework);

      if (this.$page.currentVersion === this.$page.latestVersion) {
        return `/docs${homepage}`;
      }

      return `/docs/${this.$page.currentVersion}${homepage}`;
    },
    getFrameworkName(id) {
      return frameworkIdToFullName.get(id).name;
    },
    getFrameworkItems() {
      return Array.from(frameworkIdToFullName.entries()).map(
        ([id, { name }]) => {
          return {
            id,
            text: name,
            link: this.getLink(id),
            target: '_self',
            isHtmlLink: true,
          };
        }
      );
    },
  },
  computed: {
    icon() {
      const frameworkWithoutNumber = (this.legacyFramework ?? this.$page.currentFramework).replace(/\d+$/, '');

      return 'i-' + frameworkWithoutNumber ;
    },
    item() {
      return {
        text: this.getFrameworkName(
          this.legacyFramework ?? this.$page.currentFramework
        ),
        items: this.getFrameworkItems(),
      };
    },
  },
  created() {
    this.detectLegacyFramework(this.$route.fullPath);
  },
};

/*
,
  [
    'angular',
    {
      name: 'Angular',
      homepage: '/javascript-data-grid/angular-installation/',
    },
  ],
  [
    'vue',
    { name: 'Vue 2', homepage: '/javascript-data-grid/vue-installation/' },
  ],
  [
    'vue3',
    { name: 'Vue 3', homepage: '/javascript-data-grid/vue3-installation/' },
  ],
*/
</script>

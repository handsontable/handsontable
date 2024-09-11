<template>

  <nav class="nav-frameworks nav-links">
    <i class="ico" :class="icon" ></i>
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

  let str = `${name}=${value}`;

  str += `; Domain=${hostname}`;
  str += '; Path=/docs';
  str += `; Expires=${new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)).toUTCString()}`; // 1 year

  document.cookie = str;
}

const frameworkIdToFullName = new Map([
  ['javascript', { name: 'JavaScript' }],
  ['react', { name: 'React' }],
]);

export default {
  name: 'FrameworksDropdown',
  components: {
    DropdownLink,
  },
  methods: {
    onFrameworkClick(item) {
      setCookie('docs_fw', item.id === 'react' ? 'react' : 'javascript');
    },
    getAlt(framework) {
      return frameworkIdToFullName.get(framework).alt;
    },
    getLink(framework) {
      const currentPageSlug =
        (framework === 'react' && !this.$page.frontmatter.react)
        || (framework === 'javascript' && this.$page.frontmatter?.onlyFor?.includes('react'))
          ? ''
          : this.$page.frontmatter.permalink.split('/')[2];
      const {
        homepage = `/${framework}${
          this.$page.frameworkSuffix ? `${this.$page.frameworkSuffix}/` : ''
        }`,
      } = frameworkIdToFullName.get(framework);

      if (this.$page.currentVersion === this.$page.latestVersion) {
        if (currentPageSlug) {
          return `/docs${homepage}${currentPageSlug}/`;
        } else {
          return `/docs${homepage}`;
        }
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
    alt() {
      return `${this.$page.frameworkName} data grid`;
    },
    icon() {
      const frameworkWithoutNumber = (this.legacyFramework ?? this.$page.currentFramework).replace(/\d+$/, '');

      return `i-${frameworkWithoutNumber}`;
    },
    item() {
      return {
        text: this.getFrameworkName(this.$page.currentFramework),
        items: this.getFrameworkItems(),
      };
    },
  },
};

/*

*/
</script>

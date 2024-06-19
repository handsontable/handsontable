<template>
    <nav class="nav-versions nav-links" >
      <nav class="nav-item" >
        <DropdownLink :item="item"></DropdownLink>
      </nav>
  </nav>
</template>

<script>
import DropdownLink from '@theme/components/DropdownLink.vue';

export default {
  name: 'VersionsDropdown',
  components: {
    DropdownLink
  },
  computed: {
    item() {
      return {
        text: this.addLatest(this.$page.currentVersion),
        items:
          [
            ...(this.$page.versionsWithPatches ? Array.from(this.$page.versionsWithPatches.keys()).map(v => ({
              text: v,
              subTexts: this.$page.versionsWithPatches.get(v),
              link: this.getLink(v),
              target: '_self',
              rel: this.$page.latestVersion === v ? undefined : 'nofollow',
              isHtmlLink: true,
            })) : []),
          ]
      };
    }
  },
  methods: {
    addLatest(version) {
      const latestMinor = this.$page.latestVersion;

      if (version === latestMinor) {
        if (version !== 'next') {
          version = this.$page.versionsWithPatches.get(latestMinor)[0]; // Latest version in a format major.minor.patch
        }

        // return `${version} (latest)`;
        return `${version} latest`;

      }

      return version;
    },
    getLink(version) {
      if (version === this.$page.currentVersion) {
        const isLatest = version === this.$page.latestVersion;

        return `/docs${isLatest ? '' : `/${version}`}${this.$route.path}`;
      }

      // Using `location.origin` disables injecting `.html` postfix at the end of the URL
      return `${location.origin}/docs/${version}/redirect?pageId=${this.$page.frontmatter.id}`;
    }
  },
  mounted() {

    const version = document.querySelector('.nav-versions .title');

    if (version && version.textContent && version.textContent.includes('latest')) {
      const span = document.createElement('span');

      span.textContent = 'latest';
      version.innerHTML = version.textContent.replace('latest', `<span class="tag">${span.textContent}</span>`);
    }
  }
};
</script>

<template>
  <div class="layout-container">
    <ParentLayout>
      <template #page-top>
        <div v-show="show" class="page-top">
          <div class="custom-block tip version-alert">
            <p>There is a newer version of Handsontable available.
              <a href="/docs/">Switch to the latest version ⟶</a></p>
          </div>
        </div>
      </template>
    </ParentLayout>
  </div>
</template>

<script>
import * as dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import ParentLayout from '@parent-theme/layouts/Layout.vue';
import NavLinks from '@theme/components/NavLinks.vue';
import NavLink from '@theme/components/NavLink.vue';
import Sidebar from '@theme/components/Sidebar.vue';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Poland');

export default {
  name: 'Layout',
  components: {
    ParentLayout,
    NavLinks,
    NavLink,
    Sidebar,
  },
  computed: {
    show() {
      return this.$page.latestVersion && this.$page.currentVersion !== this.$page.latestVersion &&
        this.$page.currentVersion !== 'next';
    }
  },
  methods: {
    metaStructuredData() {
      const page = this.$page;
      const organization = this.$site.themeConfig.organization;

      const metaData = () => {
        if (!page) {
          return;
        }

        return {
          title: page.frontmatter.metaTitle
            ? page.frontmatter.metaTitle.toString().replace(/["|'|\\]/g, '')
            : null,
          description: page.frontmatter.description
            ? page.frontmatter.description.toString().replace(/["|'|\\]/g, '')
            : null,
          image: organization.image,
          published:
            dayjs(page.frontmatter.date).toISOString() ||
            dayjs(page.lastUpdated).toISOString(),
          modified: dayjs(page.lastUpdated).toISOString(),
        };
      };

      const metaCanonicalUrl = () => {
        if (!page.frontmatter.canonicalUrl || !page.path || !page.hostname) {
          return null;
        }

        return page.frontmatter.canonicalUrl
          ? page.frontmatter.canonicalUrl
          : `${page.hostname}/docs${page.path}`;
      };

      const structuredData = {
        '@context': 'https://schema.org/',
        '@type': 'WebPage',
        name: metaData().title || null,
        headline: metaData().title || null,
        description: metaData().description || null,
        url: metaCanonicalUrl(),
        mainEntityOfPage: {
          '@type': 'TechArticle',
          '@id': metaCanonicalUrl(),
        },
        keywords: page.frontmatter.tags || [],
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: metaData().image,
        },
        image: {
          '@type': 'ImageObject',
          url: metaData().image,
        },
        author: {
          '@context': 'https://schema.org/',
          '@type': 'Organization',
          name: organization.author,
          url: organization.url,
          sameAs: organization.socialMedia,
        },
        publisher: {
          '@type': 'Organization',
          name: organization.name,
          url: organization.url,
          alternateName: organization.name,
          sameAs: organization.socialMedia,
        },
        // datePublished: dayjs(metaData().published).toISOString() || null, TODO: enable in the future
        dateModified: dayjs(metaData().modified).toISOString() || null,
        lastReviewed: dayjs(metaData().modified).toISOString() || null,
        copyrightHolder: {
          '@context': 'https://schema.org/',
          '@type': 'Organization',
          name: organization.name,
          url: organization.url,
          logo: {
            '@type': 'ImageObject',
            url: metaData().image,
          },
        },
        copyrightYear:
          dayjs(metaData().published).format('YYYY') ||
          dayjs(metaData().modified).format('YYYY'),
      };

      if (document && document.querySelector('#ld-json')) {
        document.querySelector('#ld-json').innerHTML = JSON.stringify(
          structuredData,
          null,
          4
        );
      }
    },
  },
  created() {
    if (this.$ssrContext) {
      this.$ssrContext.docsGenStamp = this.$page.docsGenStamp ?? '';
    }
  },
  mounted() {
    this.metaStructuredData();
  },
  watch: {
    $route(to, from) {
      // Do not run the `metaStructuredData` when the anchor is changed.
      if (to.path !== from.path) {
        this.metaStructuredData();
      }
    },
  },
};
</script>

<style lang="stylus">
.layout-container
  min-height 100%

.custom-block.tip.version-alert
  position relative
  top -34px
  border-width 1px
  border-style dashed
</style>

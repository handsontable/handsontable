<template>
  <!--eslint-disable vue/no-v-text-v-html-on-component-->
  <component
    :is="'script'"
    v-if="meta_structuredData"
    type="application/ld+json"
    v-html="meta_structuredData"
  ></component>
</template>

<script>
import * as dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Poland');

export default {
  name: 'SchemaStructuredData',
  computed: {
    meta_data() {
      if (!this.$page) {
        return;
      }

      const organization = this.$site.themeConfig.organization;

      return {
        title: this.$page.frontmatter.metaTitle
          ? this.$page.frontmatter.metaTitle.toString().replace(/["|'|\\]/g, '')
          : null,
        description: this.$page.frontmatter.description
          ? this.$page.frontmatter.description
            .toString()
            .replace(/["|'|\\]/g, '')
          : null,
        image: organization.image,
        published:
          dayjs(this.$page.frontmatter.date).toISOString() ||
          dayjs(this.$page.lastUpdated).toISOString(),
        modified: dayjs(this.$page.lastUpdated).toISOString(),
      };
    },
    meta_canonicalUrl() {
      if (
        !this.$page.frontmatter.canonicalUrl ||
        !this.$page.path ||
        !this.$page.hostname
      ) {
        return null;
      }

      return this.$page.frontmatter.canonicalUrl
        ? this.$page.frontmatter.canonicalUrl
        : `${this.$page.hostname}/docs${this.$page.path}`;
    },

    // Inject Schema.org structured data
    meta_structuredData() {
      const organization = this.$site.themeConfig.organization;
      const structuredData = {
        '@context': 'https://schema.org/',
        '@type': 'WebPage',
        name: this.meta_data.title || null,
        headline: this.meta_data.title || null,
        description: this.meta_data.description || null,
        url: this.meta_canonicalUrl,
        mainEntityOfPage: {
          '@type': 'TechArticle',
          '@id': this.meta_canonicalUrl,
        },
        keywords: this.$page.frontmatter.tags || [],
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: this.meta_data.image,
        },
        image: {
          '@type': 'ImageObject',
          url: this.meta_data.image,
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
        // datePublished: dayjs(this.meta_data.published).toISOString() || null, TODO: enable in the future
        dateModified: dayjs(this.meta_data.modified).toISOString() || null,
        lastReviewed: dayjs(this.meta_data.modified).toISOString() || null,
        copyrightHolder: {
          '@context': 'https://schema.org/',
          '@type': 'Organization',
          name: organization.name,
          url: organization.url,
          logo: {
            '@type': 'ImageObject',
            url: this.meta_data.image,
          },
        },
        copyrightYear:
          dayjs(this.meta_data.published).format('YYYY') ||
          dayjs(this.meta_data.modified).format('YYYY'),
      };

      return JSON.stringify(structuredData, null, 4);
    },
  },
};
</script>

<template>
  <main class="page" v-bind:class="{ api: isApi }">
    <Breadcrumbs />

    <Content class="theme-default-content" />
    <slot name="top" />
    <PageEdit />

    <slot name="bottom" />
  </main>
</template>

<script>
/* global instanceRegister */
import PageEdit from '@theme/components/PageEdit.vue';
import Breadcrumbs from '@theme/components/Breadcrumbs.vue';

export default {
  components: {
    PageEdit,
    Breadcrumbs,
  },
  props: ['sidebarItems'],
  data() {
    return {
      inActiveElementId: '',
      isButtonInactive: false,
      selectedLang: 'JavaScript',
    };
  },
  computed: {
    docsVersion() {
      if (this.$page.versions[0] === 'next') {
        return this.$page.versions[1];
      }

      return this.$page.versions[0];
    },
    isApi() {
      return this.$route.fullPath.match(/([^/]*\/)?api\//);
    },
  },
  methods: {
    isScriptLoaderActivated(exampleId) {
      return exampleId !== this.inActiveElementId;
    },
    resetDemo(exampleId) {
      // demo can only be reset once per second
      const exampleDiv = document.querySelector(
        `[data-example-id="${exampleId}"]`
      );
      const exampleContainer = exampleDiv?.closest('.example-container');

      exampleContainer.setAttribute(
        'style',
        `height: ${exampleContainer?.offsetHeight - 16}px`
      );

      this.inActiveElementId = exampleId;
      this.isButtonInactive = true;

      setTimeout(() => {
        this.inActiveElementId = '';
        instanceRegister.destroyExample(exampleId);
      }, 100);

      setTimeout(() => {
        exampleContainer.removeAttribute('style');
        this.isButtonInactive = false;
      }, 1000);
    },
    copyCode(e) {
      const button = e.target;
      const preTag = button.parentElement.parentElement;
      const codeTag = preTag.querySelector('code');

      navigator.clipboard.writeText(codeTag.innerText);
      button.classList.add('check');
      setTimeout(() => {
        button.classList.remove('check');
      }, 2000);
    },
    toggleDropdown(e) {
      const buttonDropdown = e.target;

      buttonDropdown.classList.toggle('active');
    },
    setLanguage(lang) {
      this.selectedLang = lang;
      localStorage.setItem('selected_lang', lang);
      document.querySelectorAll('.select-type-button').forEach((element) => {
        element.classList.remove('active');
      });
      document
        .querySelectorAll('.example-container-code pre')
        .forEach((element) => {
          element.scrollTo({ top: 0, left: 0 });
        });
    },
    showCodeButton(e) {
      e.target.parentElement?.classList.toggle('active');
    },
    setActiveElement(id) {
      const wrapper = document.querySelector('.table-of-contents > ul');
      const items = document.querySelectorAll('.table-of-contents > ul li');

      items.forEach((item) => {
        item.classList.remove('active');
      });

      const activeItem = document.querySelector(
        `.table-of-contents > ul li a[href="${id}"]`
      );

      if (activeItem) {
        const parentElement = activeItem.parentElement;

        parentElement.classList.add('active');
        const top = parentElement.offsetTop - wrapper.offsetHeight;

        wrapper.scrollTo({ top, behavior: 'smooth' });
      }
    },
    checkSectionInView() {
      const sections = document.querySelectorAll(
        '.theme-default-content h2, .theme-default-content h3'
      );
      const visibleElements = [];

      sections.forEach((section) => {
        const topDistance = section.getBoundingClientRect().top;

        if (topDistance > 0 && topDistance < window.innerHeight) {
          visibleElements.push(section);
        }
      });

      if (visibleElements[0]) {
        this.setActiveElement(`#${visibleElements[0].id}`);
      }
    },
    openExample(path, preset, id) {
      const filename = (() => {
        if (preset.includes('vue')) {
          return `vue/${id}.js`;
        }

        if (preset.includes('angular')) {
          return `angular/${id}.js`;
        }

        if (preset.includes('react') && this.selectedLang === 'TypeScript') {
          return `react/${id}.tsx`;
        }

        if (preset.includes('react') && this.selectedLang === 'JavaScript') {
          return `react/${id}.jsx`;
        }

        if (preset.includes('hot') && this.selectedLang === 'TypeScript') {
          return `javascript/${id}.ts`;
        }

        if (preset.includes('hot') && this.selectedLang === 'JavaScript') {
          return `javascript/${id}.js`;
        }

        return undefined;
      })();

      if (!path || !filename) {
        // eslint-disable-next-line
        console.error('Sorry, unable to get file path.');

        return;
      }

      const pathArray = path
        .split('/')
        .reduce(
          (a, c, i, array) =>
            (i === 0 || i === 1 || array.length - 1 === i ? a : [...a, c]),
          []
        );

      window.open(
        // eslint-disable-next-line max-len
        `https://github.com/handsontable/handsontable/blob/prod-docs/${this.docsVersion}/docs/content/${pathArray.join('/')}/${filename}`,
        '_blank'
      );
    },
    detectClickOutsideButton(e) {
      const buttons = document.querySelectorAll('.select-type-button');

      buttons.forEach((button) => {
        if (!button.contains(e.target)) {
          button.classList.remove('active');
        }
      });
    }
  },
  mounted() {
    this.selectedLang = localStorage?.getItem('selected_lang') ?? 'JavaScript';
    this.checkSectionInView();
    window.addEventListener('click', this.detectClickOutsideButton);
    window.addEventListener('scroll', this.checkSectionInView);
  },
  unmounted() {
    window.removeEventListener('scroll', this.checkSectionInView);
    window.removeEventListener('click', this.detectClickOutsideButton);
  },
};
</script>

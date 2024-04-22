<template>
  <main class="page" v-bind:class="{ 'api': isApi }">
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
    Breadcrumbs
    // ,PageNav
  },
  props: ['sidebarItems'],
  watch: {
    $route(to, from) {
      // Do not reset the `activatedExamples` array when the anchor is changed.
      if (to.path !== from.path) {
        this.activatedExamples = [];
      }
    },
  },
  data() {
    return {
      activatedExamples: [],
    };
  },
  computed: {
    isApi() {
      return this.$route.fullPath.match(/([^/]*\/)?api\//);
    }
  },
  methods: {
    codePreviewTabChanged(selectedTab, exampleId) {
      if (selectedTab.tab.computedId.startsWith('preview-tab')) {
        this.activatedExamples.push(exampleId);
      } else {
        instanceRegister.destroyExample(exampleId);
        this.activatedExamples = this.activatedExamples.filter(
          activatedExample => activatedExample !== exampleId
        );
      }
    },
    addClassIfPreviewTabIsSelected(exampleId, className) {
      return this.activatedExamples.includes(exampleId) ? className : '';
    },
    isScriptLoaderActivated(exampleId) {
      return this.activatedExamples.includes(exampleId);
    },
    toc() {
      // ToC
      const listItems = document.querySelectorAll('.table-of-contents ul li');
      const sections = document.querySelectorAll('.theme-default-content h2, .theme-default-content h3');

      // Function to add active class to list item
      /**
       * @param id
       */
      function setActiveNavItem(id) {
        // Remove active class from all list items
        listItems.forEach((item) => {
          item.classList.remove('active');
        });
        // Add active class to the corresponding list item
        const activeItem = document.querySelector(`.table-of-contents > ul li a[href="#${id}"]`);

        if (activeItem) {
          activeItem.parentElement?.classList.add('active');
        }
      }

      // Function to check which section is in view
      /**
       *
       */
      function checkSectionInView() {
        const scrollPosition = window.scrollY;

        sections.forEach((section) => {
          const sectionTop = section.offsetTop - 0;
          const sectionHeight = section.clientHeight;

          if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            // console.log(section);
            setActiveNavItem(section.id);
          }
        });
      }

      // Function for smooth scrolling
      /**
       * @param target
       */
      function smoothScroll(target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }

      // Listen for scroll event
      window.addEventListener('scroll', checkSectionInView);

      // Call checkSectionInView on page load with timeout
      window.addEventListener('load', () => {
        setTimeout(() => {
          checkSectionInView();
        }, 400); // Adjust the delay time (e.g., 1000 milliseconds)
      });
    },
    setupCodeButtons() {
      // Create report button element
      const reportlink = document.createElement('a');

      reportlink.classList.add('report');
      reportlink.setAttribute('href', 'https://github.com/handsontable/handsontable/issues/new/choose');
      reportlink.setAttribute('aria-label', 'Report an issue');
      reportlink.setAttribute('target', '_blank');
      const icon3 = document.createElement('i');

      icon3.classList.add('ico', 'i-report');
      reportlink.appendChild(icon3);

      // Create copy button element
      const copybutton = document.createElement('button');

      copybutton.classList.add('copycode');
      copybutton.setAttribute('aria-label', 'Copy to clipboard');
      const icon = document.createElement('i');

      icon.classList.add('ico', 'i-copy');
      const icon2 = document.createElement('i');

      icon2.classList.add('ico', 'i-checks');
      copybutton.appendChild(icon);
      copybutton.appendChild(icon2);

      // Create githublink button element
      const githublink = document.createElement('button');

      githublink.classList.add('github');
      githublink.setAttribute('aria-label', 'View the code on GitHub');
      const icon4 = document.createElement('i');

      icon4.classList.add('ico', 'i-github');
      githublink.appendChild(icon4);

      // Function to handle button click
      /**
       *
       */
      function handleClick() {
        const preTag = this.parentElement;
        const codeTag = preTag.querySelector('code');

        navigator.clipboard.writeText(codeTag.innerText);
        this.classList.add('check');
        setTimeout(() => {
          this.classList.remove('check');
        }, 2000);
      }

      // Iterate through each pre tag
      const preTags = document.querySelectorAll('pre');

      preTags.forEach((preTag) => {
        const codeTag = preTag.querySelector('code');

        if (codeTag) {
          const clonedcopyButton = copybutton.cloneNode(true);
          const clonedReportLink = reportlink.cloneNode(true);

          clonedcopyButton.addEventListener('click', handleClick);
          preTag.parentElement.insertBefore(clonedcopyButton, codeTag.nextSibling);
          preTag.parentElement.insertBefore(clonedReportLink, codeTag.nextSibling);
        }
      });

      // Iterate through each pre tag
      /*
      const preTagsTabs = document.querySelectorAll('.tabs-component pre');
      preTagsTabs.forEach(preTag => {
          const codeTag = preTag.querySelector('code');
          if (codeTag) {
              const clonedGithubLink = githublink.cloneNode(true);
              preTag.parentElement.insertBefore(clonedGithubLink, codeTag.nextSibling);
          }
      }); */

      // Select all elements with the class ".show-code"
      const showCodeElements = document.querySelectorAll('.show-code');

      // Loop through each element and add a click event listener
      showCodeElements.forEach((element) => {
        element.addEventListener('click', () => {
          // Toggle the class "active" on the parent element
          element.parentElement?.classList.toggle('active');
        });
      });
    }
  },
  mounted() {
    this.setupCodeButtons();
    this.toc();
  },
  updated() {
    this.setupCodeButtons();
    this.toc();
  }
};
</script>

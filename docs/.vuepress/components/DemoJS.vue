<template>
  <div class="example-container" style="height: 450px"></div>
</template>

<script>
import { convertRelativeToAbsoluteAttributeUrl } from './demo-common';

export default {
  name: 'DemoJS',
  props: {
    fullVersionNumber: {
      required: true,
    },
  },
  mounted() {
    const url = `https://examples.handsontable.com/examples/${this.fullVersionNumber}/docs/js/demo/index.html`;

    fetch(url)
      .then((response) => {
        return response.text();
      })
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const headNodes = Array.from(doc.head.childNodes).filter((node) => {
          if (node.nodeName === 'LINK' && node.rel === 'stylesheet') {
            convertRelativeToAbsoluteAttributeUrl(node, node, 'href', url);

            return true;
          }

          return false;
        });

        const bodyNodes = Array.from(doc.body.childNodes).map((node) => {
          if (node.nodeName === 'SCRIPT') {
            // scripts need to be cloned, otherwise Chrome refuses to run them
            const newNode = document.createElement('script');

            if (node.hasAttribute('src')) {
              convertRelativeToAbsoluteAttributeUrl(node, newNode, 'src', url);
            }
            newNode.innerText = node.innerText;

            return newNode;
          }

          return node;
        });

        this.$el.append(...headNodes, ...bodyNodes);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('Fetching the example failed.', err);
      });
  },
};
</script>

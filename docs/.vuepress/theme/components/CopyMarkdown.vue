<template>
    <button class="copy-md-btn" @click="copyMarkdown">
      {{ copied ? 'Copied!' : 'Copy MD' }}
    </button>
  </template>
  
  <script>
  export default {
    name: 'CopyMarkdown',
    data() {
      return {
        copied: false
      }
    },
    methods: {
      async copyMarkdown() {
        const rawMd = this.$page.rawMarkdown
        if (!rawMd) return
        
        try {
          await navigator.clipboard.writeText(rawMd)
          this.copied = true
          setTimeout(() => { this.copied = false }, 2000)
        } catch (err) {
          // Fallback for older browsers
          const textarea = document.createElement('textarea')
          textarea.value = rawMd
          document.body.appendChild(textarea)
          textarea.select()
          document.execCommand('copy')
          document.body.removeChild(textarea)
          this.copied = true
          setTimeout(() => { this.copied = false }, 2000)
        }
      }
    }
  }
  </script>
  
  <style scoped>
  .copy-md-btn {
    padding: 6px 12px;
    border-radius: 4px;
    border: 1px solid #ddd;
    cursor: pointer;
  }
  </style>
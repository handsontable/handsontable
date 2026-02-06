<template>
    <button class="copy-md-btn" @click="copyMarkdown">


<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_2719_28409)">
<path d="M5.33337 6.66666C5.33337 6.31304 5.47385 5.9739 5.7239 5.72385C5.97395 5.4738 6.31309 5.33333 6.66671 5.33333L12 5.33333C12.3537 5.33333 12.6928 5.4738 12.9428 5.72385C13.1929 5.9739 13.3334 6.31304 13.3334 6.66666L13.3334 12C13.3334 12.3536 13.1929 12.6928 12.9428 12.9428C12.6928 13.1929 12.3537 13.3333 12 13.3333L6.66671 13.3333C6.31309 13.3333 5.97395 13.1929 5.7239 12.9428C5.47385 12.6928 5.33337 12.3536 5.33337 12L5.33337 6.66666Z" stroke="#E0E0E3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10.6666 5.33334V4.00001C10.6666 3.64638 10.5262 3.30724 10.2761 3.0572C10.0261 2.80715 9.68691 2.66667 9.33329 2.66667L3.99996 2.66667C3.64634 2.66667 3.3072 2.80715 3.05715 3.0572C2.8071 3.30724 2.66663 3.64638 2.66663 4.00001L2.66663 9.33334C2.66663 9.68696 2.8071 10.0261 3.05715 10.2761C3.3072 10.5262 3.64634 10.6667 3.99996 10.6667H5.33329" stroke="#E0E0E3" stroke-linecap="round" stroke-linejoin="round"/>
</g>
<defs>
<clipPath id="clip0_2719_28409">
<rect width="16" height="16" fill="white"/>
</clipPath>
</defs>
</svg>


      {{ copied ? 'Copied!' : 'Copy as Markdown' }}
    </button>
</template>

<style scoped>
 .copy-md-btn {
  display: inline-flex;
	flex-direction: row;
	flex-wrap: nowrap;
	justify-content: center;
	align-items: center;
	align-content: center;

 }
 .copy-md-btn svg {
  margin-right: 8px;
 }
</style>
  
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
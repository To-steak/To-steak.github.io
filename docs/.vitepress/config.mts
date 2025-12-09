import { defineConfig } from 'vitepress'
import mathjax3 from 'markdown-it-mathjax3';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "To-steak",
  description: "Hello, World!",
  markdown: {
    config: (md) => {
      md.use(mathjax3)
    }
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/To-steak' }
    ]
  }
})

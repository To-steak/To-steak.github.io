import { defineConfig } from 'vitepress'
import mathjax3 from 'markdown-it-mathjax3';

const hostname = 'https://to-steak.github.io'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "To-steak",
  description: "Hello, World!",
  transformHead({ pageData }){
    const head: any[] = []
    head.push(['meta', { property: 'og:title', content: pageData.title || 'My DevLog' }])
    head.push(['meta', { property: 'og:description', content: pageData.description || 'Unity 개발 로그' }])

    const image = pageData.frontmatter.thumbnail || '/images/Logos/Unity_Logo_Black.png'
    const imageUrl = `${hostname}${image}` // 절대 경로로 변환
    head.push(['meta', { property: 'og:image', content: imageUrl }])
    head.push(['meta', { name: 'twitter:card', content: 'summary_large_image' }])

    return head
  },

  markdown: {
    config: (md) => {
      md.use(mathjax3)
    }
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
    ],

    sidebar: [
      {
        text: 'Category',
        items: [
          { text: 'Unity', link: '/categories?category=Unity' },
          { text: 'Csharp', link: '/categories?category=Csharp' },
          { text: 'WebGL', link: '/categories?category=WebGL' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/To-steak' }
    ]
  }
})

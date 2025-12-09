import { defineConfig } from 'vitepress'
import mathjax3 from 'markdown-it-mathjax3';

const hostname = 'https://to-steak.github.io'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "To-steak",
  description: "Hello, World!",
  transformHead({ pageData }){
    const head: any[] = []

    // 1. 페이지별 제목 설정
    head.push(['meta', { property: 'og:title', content: pageData.title || 'My DevLog' }])

    // 2. 페이지별 설명 설정 (frontmatter의 description이나 excerpt 사용)
    head.push(['meta', { property: 'og:description', content: pageData.description || 'Unity 개발 로그' }])

    // 3. 썸네일 이미지 설정 (중요!)
    // 마크다운에 thumbnail이 있으면 그걸 쓰고, 없으면 기본 로고 사용
    const image = pageData.frontmatter.thumbnail || '/images/Logos/U_Logo_Small_Black_RGB_1C 1.png'
    const imageUrl = `${hostname}${image}` // 절대 경로로 변환

    head.push(['meta', { property: 'og:image', content: imageUrl }])
    
    // 4. 트위터/디스코드용 카드 스타일 (큰 이미지)
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

import { defineConfig } from 'vitepress'

// VitePress 기본 slugify와 같은 규칙이지만, 마지막에 NFC로 다시 합친다.
// 기본 규칙은 NFKD로 정규화해서 한글 제목의 id가 자모 단위(ㄱ+ㅕ+ㄹ...)로 쪼개지고,
// 본문에 [링크](#한글-제목)처럼 쓴 앵커와 일치하지 않아 이동하지 않는다.
const slugify = (str) =>
  str
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase()
    .normalize('NFC')

export default defineConfig({
  title: "To_steak's Devlog",
  description: "To_steak's Unity",
  markdown: {
    anchor: { slugify }
  },
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' }
    ],

    sidebar: {
      '/client/': [
        {
          text: 'Project 01',
          items: [
            { text: '확장 가능한 무기 아키텍처', link: '/client/client_01' },
            { text: '어셈블리 정의', link: '/client/client_02' },
            { text: '풀과 애니메이터 변수 초기화', link: '/client/client_03' }
          ]
        },
        {
          text: 'Project 02',
          items: [
            { text: 'NGO 멀티플레이 구조 세우기', link: '/client/client_04.md' },
          ]
        }
      ],
      '/portfolio/': [
        {
          text: 'Portfolio',
          items: [
            { text: 'TopView Game', link: '/portfolio/TopView-Game' }
          ]
        }
      ],
      '/misc/': [
        {
          text: 'NDC',
          items: [
            { text: 'NDC26', link: '/misc/misc_01' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/To-steak' }
    ]
  }
})
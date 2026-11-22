import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "To_steak's Devlog",
  description: "To_steak's Unity",
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
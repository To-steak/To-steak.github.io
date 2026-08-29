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
      '/dots/': [
        {
          text: 'DOTS',
          items: [
            { text: '총알 10만 개 충돌시켜보기', link: '/dots/dots_01' }
          ]
        }
      ],
      '/misc/': [
        {
          text: 'NDC',
          items: [
            { text: 'NDC26', link: '/misc/NDC26_기술_면접은_무엇을_평가하는가' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/To-steak' }
    ]
  }
})
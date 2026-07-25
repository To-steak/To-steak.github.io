import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "To_steak's Devlog",
  description: "Unity Client",
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
        }
      ],
      // '/dots/': [
      //   {
      //     text: 'ECS',
      //     items: [
      //       { text: 'DOTS 01', link: '/dots/dots_01' },
      //       { text: 'DOTS 02', link: '/dots/dots_02' }
      //     ]
      //   }
      // ],
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
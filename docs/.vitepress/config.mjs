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
          text: 'Unity Client',
          items: [
            { text: 'Client 01', link: '/client/client_01' },
            { text: 'Client 02', link: '/client/client_02' }
          ]
        }
      ],
      '/dots/': [
        {
          text: 'ECS',
          items: [
            { text: 'DOTS 01', link: '/dots/dots_01' },
            { text: 'DOTS 02', link: '/dots/dots_02' }
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
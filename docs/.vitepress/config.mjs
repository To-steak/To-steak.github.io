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
          text: 'Unity DOTS',
          items: [
            { text: 'DOTS 01', link: '/dots/dots_01' },
            { text: 'DOTS 02', link: '/dots/dots_02' }
          ]
        }
      ],
      '/netcode/': [
        {
          text: 'Netcode for GameObjects',
          items: [
            { text: 'Netcode 01', link: '/netcode/netcode_01' },
            { text: 'Netcode 02', link: '/netcode/netcode_02' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/To-steak' }
    ]
  }
})
import { defineConfig } from 'vitepress'

const commandGroups = [
  {
    text: 'Commands',
    items: [
      { text: '.help', link: '/commands/help' },
      { text: '.ping', link: '/commands/ping' },
      { text: '.off', link: '/commands/off' },
      { text: '.on', link: '/commands/on' },
      { text: '.paste', link: '/commands/paste' },
      { text: '.smartpaste', link: '/commands/smartpaste' },
      { text: '.edit', link: '/commands/edit' },
      { text: '.flip', link: '/commands/flip' },
      { text: '.move', link: '/commands/move' },
      { text: '.mask', link: '/commands/mask' },
      { text: '.skipair', link: '/commands/skipair' },
      { text: '.snake', link: '/commands/snake' },
      { text: '.undo', link: '/commands/undo' },
      { text: '.redo', link: '/commands/redo' },
      { text: '.import', link: '/commands/import' },
    ],
  },
]

export default defineConfig({
  lang: 'en-US',
  title: 'PixelWalker Copy Bot',
  description: 'Learn to copy, repeat, transform, and import PixelWalker builds with Copy Bot.',
  base: '/PixelWalker-Copy-Bot/docs/',
  outDir: '../dist/docs',
  vite: { configFile: false },
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: 'Getting started', link: '/guide/getting-started' },
      { text: 'Commands', link: '/commands/' },
      { text: 'Open Copy Bot', link: 'https://piratux.github.io/PixelWalker-Copy-Bot/' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting started', link: '/guide/getting-started' },
          { text: 'Command reference', link: '/commands/' },
        ],
      },
      ...commandGroups,
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/Piratux/PixelWalker-Copy-Bot' }],
    search: { provider: 'local' },
    outline: [2, 3],
    editLink: {
      pattern: 'https://github.com/Piratux/PixelWalker-Copy-Bot/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    footer: {
      message: 'Documentation for PixelWalker Copy Bot.',
    },
  },
})

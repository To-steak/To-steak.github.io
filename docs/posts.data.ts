// posts.data.ts
import { createContentLoader } from 'vitepress'

const DEFAULT_THUMBNAIL = '/images/Logos/U_Logo_Small_Black_RGB_1C 1.png'

export default createContentLoader('posts/*.md', {
  excerpt: true,
  transform(raw) {
    return raw
      .map(({ url, frontmatter, excerpt }) => ({
        title: frontmatter.title,
        url,
        excerpt: frontmatter.excerpt || excerpt,
        thumbnail: frontmatter.thumbnail ?? DEFAULT_THUMBNAIL,
        date: formatDate(frontmatter.date)
      }))
      .sort((a, b) => b.date.time - a.date.time) // 최신순 정렬
  }
})

function formatDate(raw: string | number) {
  const date = new Date(raw || Date.now())
  date.setUTCHours(12)
  return {
    time: +date,
    string: date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}
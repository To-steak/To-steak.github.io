---
# https://vitepress.dev/reference/default-theme-home-page
layout: false

hero:
  name: "To-steak"
  text: "Hello, World!"
  tagline: My great project tagline
  actions:
    - theme: brand
      text: Markdown Examples
      link: /markdown-examples
    - theme: alt
      text: API Examples
      link: /api-examples
    - theme: alt
      text: first
      link: /BezierCurve
---

<script setup>
import { data as posts } from './posts.data.ts'
</script>

<div class="blog-container">
  <div class="blog-header">
    <h1>My DevLog</h1>
    <p>Unity 개발자의 삽질 기록장</p>
  </div>

  <div class="post-list">
    <div v-for="post in posts" :key="post.url" class="post-item">
      <a :href="post.url" class="post-link">
        <div class="post-thumb">
          <img :src="post.thumbnail" alt="thumbnail"/>
        </div>
        <div class="post-text">
          <h2 class="post-title">{{ post.title }}</h2>
          <div class="post-date">{{ post.date.string }}</div>
          <div v-if="post.excerpt" class="post-excerpt" v-html="post.excerpt"></div>
        </div>
      </a>
    </div>
  </div>
</div>

<style>
.blog-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 4rem 1.5rem;
}

.blog-header {
  margin-bottom: 4rem;
  text-align: center;
}

.blog-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  background: -webkit-linear-gradient(315deg, #42d392 25%, #647eff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  /* 그라데이션 텍스트 설정 */
  background: -webkit-linear-gradient(315deg, #42d392 25%, #647eff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  /* 💡 잘림 방지 핵심 코드 */
  line-height: 1.5;      /* 줄 간격을 넉넉하게 */
  padding-bottom: 10px;  /* 아래쪽 여백 확보 */
}

.post-item {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--vp-c-divider);
  transition: transform 0.2s ease;
}

/* ✅ 새로 추가된 핵심 스타일 */
.post-link {
  display: flex; /* 가로 배치 */
  gap: 20px;     /* 이미지와 텍스트 사이 간격 */
  text-decoration: none;
  color: inherit;
  padding-bottom: 2rem; /* 여기서 패딩 처리 */
}

/* ✅ 썸네일 이미지 스타일 */
.post-thumb {
  flex-shrink: 0; /* 이미지 영역이 찌그러지지 않게 고정 */
  width: 120px;   /* 이미지 너비 */
  height: 120px;  /* 이미지 높이 */
  border-radius: 12px; /* 모서리 둥글게 */
  overflow: hidden;
  background-color: var(--vp-c-bg-alt); /* 이미지 로딩 전 배경색 */
}

.post-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain; 
  transition: transform 0.3s ease;
}

.post-item:hover .post-thumb img {
  transform: scale(1.1); /* 마우스 올리면 이미지 살짝 확대 효과 */
}

/* 텍스트 영역이 남은 공간을 모두 차지하도록 */
.post-text {
  flex-grow: 1; 
}

.post-item:hover {
  transform: translateX(5px);
}

.post-item a {
  text-decoration: none;
  color: inherit;
}

.post-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--vp-c-text-1);
  transition: color 0.2s;
}

.post-item:hover .post-title {
  color: var(--vp-c-brand);
}

.post-date {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin-bottom: 1rem;
}

.post-excerpt {
  color: var(--vp-c-text-2);
  line-height: 1.6;
}
</style>
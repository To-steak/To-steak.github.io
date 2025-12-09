---
layout: page
title: Categories
sidebar: false
---

<script setup>
import { ref, computed, onMounted } from 'vue'
import { data as posts } from './posts.data.ts'
import { useData } from 'vitepress'
const { isDark } = useData()

const selectedCategory = ref('')

// 페이지가 열리면 주소창(URL)을 확인해서 카테고리 설정
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  selectedCategory.value = urlParams.get('category') || ''
})

// 선택된 카테고리가 있으면 필터링, 없으면 전체 표시
const filteredPosts = computed(() => {
  if (!selectedCategory.value) return posts
  return posts.filter(post => post.category === selectedCategory.value)
})
</script>

<ClientOnly>

<div class="content-wrapper">

# {{ selectedCategory ? selectedCategory + ' 글 모음' : '전체 글 목록' }}

<div v-if="filteredPosts.length === 0" class="empty-msg">
  이 카테고리에 아직 글이 없습니다. 😅
</div>

<div class="post-list">
  <div v-for="post in filteredPosts" :key="post.url" class="post-item">
    <a :href="post.url" class="post-link">
      <div class="post-thumb">
        <img :src="isDark ? post.thumbnailDark : post.thumbnail" alt="thumbnail" />
      </div>
      <div class="post-text">
        <h2 class="post-title">{{ post.title }}</h2>
        <div class="post-meta">
          <span class="category-badge">{{ post.category }}</span>
          <span class="post-date">{{ post.date.string }}</span>
        </div>
      </div>
    </a>
  </div>
</div>

</div>

</ClientOnly>

<style>
.content-wrapper { max-width: 800px; margin: 0 auto; padding-top: 2rem; }
.post-list { margin-top: 2rem; }
.post-item { margin-bottom: 2rem; border-bottom: 1px solid var(--vp-c-divider); }
.post-link { display: flex; gap: 20px; text-decoration: none; color: inherit; padding-bottom: 1.5rem; }
.post-thumb { flex-shrink: 0; width: 100px; height: 100px; border-radius: 8px; overflow: hidden; background: var(--vp-c-bg-alt); }
.post-thumb img { width: 100%; height: 100%; object-fit: contain; } /* 로고 안 잘리게 contain */
.post-text { flex-grow: 1; }
.post-title { font-size: 1.2rem; font-weight: bold; margin: 0 0 0.5rem; }
.post-meta { font-size: 0.9rem; color: var(--vp-c-text-2); display: flex; gap: 10px; align-items: center; }

.category-badge {
  background-color: var(--vp-c-brand);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}
.empty-msg { padding: 4rem; text-align: center; color: var(--vp-c-text-2); }
</style>
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
const currentPage = ref(1) // 현재 페이지 상태 추가 ⭐
const postsPerPage = 5 // 한 페이지에 보여줄 글 개수

// 페이지가 열리면 주소창(URL)을 확인해서 카테고리 설정
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  selectedCategory.value = urlParams.get('category') || ''
  
  // URL 변경 시 currentPage를 1로 리셋합니다.
  currentPage.value = 1 
})

// 1. 선택된 카테고리만 필터링
const categoryFiltered = computed(() => {
  if (!selectedCategory.value) return posts
  return posts.filter(post => post.category === selectedCategory.value)
})

// 2. 전체 페이지 수 계산 ⭐
const totalPages = computed(() => {
  return Math.ceil(categoryFiltered.value.length / postsPerPage)
})

// 3. 현재 페이지에 보여줄 글 목록 계산 ⭐
const paginatedPosts = computed(() => {
    const start = (currentPage.value - 1) * postsPerPage
    const end = start + postsPerPage
    return categoryFiltered.value.slice(start, end)
})

// 4. 페이지 번호 배열 생성 ⭐
const pageNumbers = computed(() => {
  return Array.from({ length: totalPages.value }, (_, i) => i + 1)
})

// 5. 페이지 이동 함수 ⭐
const setPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
</script>

<ClientOnly>

<div class="content-wrapper">

# {{ selectedCategory ? selectedCategory + ' 글 모음' : '전체 글 목록' }}

<div v-if="paginatedPosts.length === 0" class="empty-msg">
  이 카테고리에 아직 글이 없습니다. 😅
</div>

<div class="post-list">
  <div v-for="post in paginatedPosts" :key="post.url" class="post-item">
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

<div class="pagination" v-if="totalPages > 1">
  <button @click="setPage(currentPage - 1)" :disabled="currentPage === 1" class="page-btn">Prev</button>
  <div class="page-numbers">
    <button v-for="page in pageNumbers" :key="page" @click="setPage(page)" :class="['page-number-btn', { active: currentPage === page }]">{{ page }}</button>
  </div>
  <button @click="setPage(currentPage + 1)" :disabled="currentPage === totalPages" class="page-btn">Next</button>
</div>


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

.page-numbers { display: flex; gap: 5px; margin: 0 10px; }
.page-number-btn {
  padding: 8px 12px; border-radius: 8px; background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-divider); cursor: pointer; transition: all 0.2s;
  font-size: 0.9rem; font-weight: 500;
}
.page-number-btn.active {
  background-color: var(--vp-c-brand); color: white; border-color: var(--vp-c-brand); font-weight: 700;
}
.page-number-btn:hover:not(.active) {
  border-color: var(--vp-c-brand);
}
.pagination { display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 4rem; }
</style>
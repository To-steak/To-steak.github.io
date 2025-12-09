---
# https://vitepress.dev/reference/default-theme-home-page
layout: false
sidebar: false
comment: false
---

<script setup>
import { data as posts } from './posts.data.ts'
import { ref, computed } from 'vue' // 💡 ref, computed 가져오기
import { useData } from 'vitepress'

const { isDark } = useData()
const selectedCategory = ref('All')
const currentPage = ref(1)
const postsPerPage = 5 // 한 페이지에 보여줄 글 개수

const categories = computed(() => {
  const allCats = posts.map(p => p.category).filter(Boolean)
  return ['All', ...new Set(allCats)] // 'All' 버튼을 목록에 추가
})

const filteredPosts = computed(() => {
  if (selectedCategory.value === 'All') return posts
  return posts.filter(post => post.category === selectedCategory.value)
})

const totalPages = computed(() => {
  return Math.ceil(filteredPosts.value.length / postsPerPage)
})

const pageNumbers = computed(() => {
  return Array.from({ length: totalPages.value }, (_, i) => i + 1)
})

const paginatedPosts = computed(() => {
    const start = (currentPage.value - 1) * postsPerPage
    const end = start + postsPerPage
    return filteredPosts.value.slice(start, end)
})

const setPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const selectCategory = (cat) => {
  selectedCategory.value = cat
  currentPage.value = 1
}
</script>

<div class="blog-container">
  <div class="blog-header">
    <h1>My DevLog</h1>
    <p>Unity 개발자의 삽질 기록장</p>
  </div>

  <div class='category-nav' v-if="categories.length > 0">
    <button v-for="cat in categories" :key="cat" @click="selectCategory(cat)" :class="['cat-chip', { active: selectedCategory === cat }]">{{ cat }}</button>
  </div>

  <div class="post-list">
    <div v-for="post in paginatedPosts" :key="post.url" class="post-item">
      <a :href="post.url" class="post-link">
        <div class="post-thumb">
          <img :src="isDark ? post.thumbnailDark : post.thumbnail" alt="thumbnail" />
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

<div class="pagination" v-if="totalPages > 1">
  <button @click="setPage(currentPage - 1)" :disabled="currentPage === 1" class="page-btn">Prev</button>
  <div class="page-numbers">
    <button v-for="page in pageNumbers" :key="page" @click="setPage(page)" :class="['page-number-btn', { active: currentPage === page }]">{{ page }}</button>
  </div>
  <button @click="setPage(currentPage + 1)" :disabled="currentPage === totalPages" class="page-btn">Next</button>
</div>

<style>
.blog-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1.5rem; 
    padding-top: 2rem;
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
    line-height: 1.5;
    padding-bottom: 10px;
}

.post-item {
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--vp-c-divider);
    transition: transform 0.2s ease;
}

.post-link {
    display: flex;
    gap: 20px;
    color: inherit !important;
    padding-bottom: 2rem;
}

.post-thumb {
    flex-shrink: 0;
    width: 120px;
    height: 120px;
    border-radius: 12px;
    overflow: hidden;
    background-color: var(--vp-c-bg-alt);
}

.post-thumb img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform 0.3s ease;
}

.post-item:hover .post-thumb img {
    transform: scale(1.1);
}

.post-text {
    flex-grow: 1;
}

.post-item:hover {
    transform: translateX(5px);
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

/* --- 카테고리 버튼 스타일 --- */
.category-nav {
    display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-bottom: 3rem; 
}

.cat-chip {
    padding: 6px 16px; background-color: var(--vp-c-bg-alt); border: 1px solid var(--vp-c-divider); 
    border-radius: 20px; font-size: 0.95rem; cursor: pointer; color: var(--vp-c-text-1); transition: all 0.2s ease;
}
.cat-chip:hover { background-color: var(--vp-c-brand); color: white; border-color: var(--vp-c-brand); transform: translateY(-2px); }

/* 페이지네이션 CSS */
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
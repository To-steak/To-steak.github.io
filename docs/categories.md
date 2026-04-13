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
const currentPage = ref(1)
const postsPerPage = 5

// --- [index.md에서 가져온 카테고리 로직] ---
const categories = computed(() => {
    const allCats = posts.map(p => p.category).filter(Boolean)
    return ['All', ...new Set(allCats)] // 'All' 버튼을 목록에 추가
})

const selectCategory = (cat) => {
    // 1. 상태 변경 (이것이 필터링을 즉시 트리거)
    selectedCategory.value = (cat === 'All' ? '' : cat) // 'All'이면 URL의 빈 문자열과 동일하게 처리
    
    // 2. 페이지네이션 초기화
    currentPage.value = 1 
    
    // 3. URL 업데이트 (SPA 상태 변경)
    const newQuery = (cat === 'All' ? '' : `?category=${cat}`)
    // URL을 변경하여 공유 링크가 필터링된 카테고리를 가리키도록 함
    window.history.pushState({}, '', `/categories.html${newQuery}`)
}
// ---------------------------------------------

// 페이지가 열리면 주소창(URL)을 확인해서 초기 카테고리 설정
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  // URL에서 category 값을 읽어오거나, 없으면 빈 문자열('')로 초기화
  selectedCategory.value = urlParams.get('category') || ''
  currentPage.value = 1 
})

// 1. 필터링 로직 (selectedCategory 상태를 따름)
const categoryFiltered = computed(() => {
  if (!selectedCategory.value) return posts
  return posts.filter(post => post.category === selectedCategory.value)
})

// 2. 전체 페이지 수 계산
const totalPages = computed(() => {
  return Math.ceil(categoryFiltered.value.length / postsPerPage)
})

// 3. 현재 페이지에 보여줄 글 목록 계산
const paginatedPosts = computed(() => {
    const start = (currentPage.value - 1) * postsPerPage
    const end = start + postsPerPage
    return categoryFiltered.value.slice(start, end)
})

// 4. 페이지 번호 배열 생성
const pageNumbers = computed(() => {
  return Array.from({ length: totalPages.value }, (_, i) => i + 1)
})

// 5. 페이지 이동 함수 
const setPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
</script>

<ClientOnly>

<div class="content-wrapper">

<h1>{{ selectedCategory || '전체' }} 글 목록</h1>

<div class='category-nav' v-if="categories.length > 0">
  <button 
    v-for="cat in categories" 
    :key="cat" 
    @click="selectCategory(cat)" 
    :class="['cat-chip', { active: selectedCategory === cat || (selectedCategory === '' && cat === 'All') }]"
  >
    {{ cat }}
  </button>
</div>
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
        <div v-if="post.excerpt" class="post-excerpt" v-html="post.excerpt"></div>
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
/* 기존 스타일 유지 및 페이지네이션 스타일 추가 */
.content-wrapper { max-width: 800px; margin: 0 auto; padding-top: 2rem; }
/* 제목 가운데 정렬 및 간격 조정 */
.content-wrapper h1 {
  text-align: center;
  margin-bottom: 2rem; /* 아래 카테고리 칩과의 간격 */
  word-break: keep-all; /* 한글 단어가 잘리지 않게 설정 */
}
.post-list { margin-top: 2rem; }
.post-item { margin-bottom: 2rem; border-bottom: 1px solid var(--vp-c-divider); }
.post-link { display: flex; gap: 20px; text-decoration: none; color: inherit; padding-bottom: 1.5rem; }
.post-thumb { flex-shrink: 0; width: 100px; height: 100px; border-radius: 8px; overflow: hidden; background: var(--vp-c-bg-alt); }
.post-thumb img { width: 100%; height: 100%; object-fit: contain; } /* 로고 안 잘리게 contain */
.post-text { flex-grow: 1; }
.post-title { font-size: 1.2rem; font-weight: bold; margin: 0 0 0.5rem; }
.post-meta { font-size: 0.9rem; color: var(--vp-c-text-2); display: flex; gap: 10px; align-items: center; }

.post-excerpt {
  color: var(--vp-c-text-2);
  line-height: 1.6;
  font-size: 0.95rem; /* 살짝 작게 조절해도 좋습니다 */
  margin-top: 0.5rem;
  /* 요약문이 너무 길어질 경우 2줄까지만 보이게 하고 싶다면 아래 주석을 해제하세요 */
  /*
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  */
}

/* meta 정보 간격 조정 */
.post-meta {
  margin-bottom: 0.5rem; /* 요약문과의 간격을 위해 살짝 줄였습니다 */
}

.category-badge {
  background-color: var(--vp-c-brand);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}
.empty-msg { padding: 4rem; text-align: center; color: var(--vp-c-text-2); }

/* --- 카테고리 버튼 스타일 추가 --- */
.category-nav {
    display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-bottom: 3rem; 
}
.cat-chip {
    padding: 6px 16px; background-color: var(--vp-c-bg-alt); border: 1px solid var(--vp-c-divider); 
    border-radius: 20px; font-size: 0.95rem; cursor: pointer; color: var(--vp-c-text-1); transition: all 0.2s ease;
}
.cat-chip:hover { background-color: var(--vp-c-brand); color: white; border-color: var(--vp-c-brand); transform: translateY(-2px); }
.cat-chip.active { background-color: var(--vp-c-brand); color: white; border-color: var(--vp-c-brand); }


/* 페이지네이션 스타일 */
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
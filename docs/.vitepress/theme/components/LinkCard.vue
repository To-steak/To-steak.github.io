<script setup>
import { computed } from 'vue'

const props = defineProps({
  url: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' }
})

const host = computed(() => {
  try {
    return new URL(props.url).hostname.replace(/^www\./, '')
  } catch {
    return props.url
  }
})
</script>

<template>
  <a class="link-card" :href="url" target="_blank" rel="noreferrer">
    <span class="link-card-body">
      <span class="link-card-title">{{ title }}</span>
      <span v-if="description" class="link-card-desc">{{ description }}</span>
      <span class="link-card-host">{{ host }}</span>
    </span>
    <img v-if="image" class="link-card-image" :src="image" :alt="title" loading="lazy" />
  </a>
</template>

<style scoped>
.vp-doc a.link-card {
  display: flex;
  margin: 16px 0;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
  color: inherit;
  text-decoration: none;
  transition: border-color 0.25s, background-color 0.25s;
}

.vp-doc a.link-card:hover {
  border-color: var(--vp-c-brand-1);
  background-color: var(--vp-c-bg-elv);
}

.link-card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  padding: 12px 16px;
}

.link-card-title {
  overflow: hidden;
  color: var(--vp-c-text-1);
  font-weight: 600;
  line-height: 1.5;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.link-card-desc {
  display: -webkit-box;
  overflow: hidden;
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 1.5;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.link-card-host {
  color: var(--vp-c-text-3);
  font-size: 12px;
}

.vp-doc .link-card-image {
  flex-shrink: 0;
  width: 200px;
  margin: 0;
  object-fit: cover;
}

@media (max-width: 640px) {
  .vp-doc .link-card-image {
    width: 120px;
  }
}
</style>

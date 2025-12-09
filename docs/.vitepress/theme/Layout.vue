<script setup>
import DefaultTheme from 'vitepress/theme'
import Comments from './components/Comments.vue' // 경로 확인!

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #doc-after>
      <Comments />
    </template>
  </Layout>
</template>
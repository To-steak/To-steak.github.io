<script setup>
import DefaultTheme from 'vitepress/theme'
import Comments from './components/Comments.vue'
import { useData } from 'vitepress'

const { Layout } = DefaultTheme
const { frontmatter } = useData()
</script>

<template>
  <Layout>
    <template #doc-after>
      <Comments v-if="frontmatter.comment !== false"/>
    </template>
  </Layout>
</template>
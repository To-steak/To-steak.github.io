<script setup>
import Giscus from '@giscus/vue'
import { useData, useRoute } from 'vitepress'

const { isDark } = useData()
const route = useRoute()

</script>

<template>
  <div style="margin-top: 50px;">
    <Giscus
      :key="route.path"
      repo="To-steak/To-steak.github.io" 
      repo-id="R_kgDOMwbQZw"
      category="General"
      category-id="DIC_kwDOMwbQZ84CzjuX"
      mapping="pathname"
      strict="0"
      reactions-enabled="1"
      emit-metadata="0"
      input-position="top"
      :theme="isDark ? 'dark' : 'light'"
      lang="ko"
    />
  </div>
</template>

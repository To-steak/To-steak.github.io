<script setup>
import Giscus from '@giscus/vue' // npm install @giscus/vue 필요
import { useData } from 'vitepress'

const { isDark } = useData()
</script>

<template>
  <div style="margin-top: 50px;">
    <Giscus
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

import DefaultTheme from 'vitepress/theme'
import CompareImage from './components/CompareImage.vue'
import mediumZoom from 'medium-zoom'
import { onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'
import './custom.css'

export default {
  extends: DefaultTheme,

  enhanceApp({ app }) {
    app.component('CompareImage', CompareImage)
  },

  setup() {
    const route = useRoute()
    const initZoom = () => {
      // .main img: 본문 이미지 / .medium-zoom-image: 명시적 클래스
      mediumZoom('.main img', { 
        background: 'rgba(0, 0, 0, 0.8)' 
      })
    }

    onMounted(() => {
      initZoom()
    })

    // 페이지 이동 시 zoom 다시 적용
    watch(
      () => route.path,
      () => nextTick(() => initZoom())
    )
  }
}
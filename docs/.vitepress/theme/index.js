import DefaultTheme from 'vitepress/theme'
import { useRoute } from 'vitepress'
import { nextTick, onMounted, watch } from 'vue'
import mediumZoom from 'medium-zoom'
import LinkCard from './components/LinkCard.vue'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('LinkCard', LinkCard)
  },
  setup() {
    const route = useRoute()
    let zoom

    // 본문 사진을 클릭하면 확대한다. 링크 카드 썸네일처럼 링크 안에 있는 이미지는 제외한다.
    const initZoom = () => {
      zoom?.detach()
      zoom = mediumZoom('.vp-doc img:not(a img)', { background: 'var(--vp-c-bg)', margin: 24 })
    }

    onMounted(initZoom)
    watch(() => route.path, () => nextTick(initZoom))
  }
}

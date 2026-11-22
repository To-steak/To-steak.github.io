import DefaultTheme from 'vitepress/theme'
import LinkCard from './components/LinkCard.vue'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('LinkCard', LinkCard)
  }
}
